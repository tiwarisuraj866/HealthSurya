// HealthSurya V2 — KYC Engine API
// GET  /api/kyc            → current KYC state (% / status / docs / suggestions)
// POST /api/kyc            → { action: 'save_field' | 'save_document' | 'submit' }
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { computeKyc, computeTrustScore, KYC_CONFIG, type KycRole, type KycStatus } from "@/lib/kyc";
import { notify, audit } from "@/lib/notify.server";

export const runtime = "nodejs";

async function getProfile(clerkId: string) {
  const { data } = await (supabaseAdmin as any)
    .from("profiles")
    .select("*")
    .eq("clerk_user_id", clerkId)
    .maybeSingle();
  return data as any;
}

async function buildState(profile: any) {
  const db = supabaseAdmin as any;
  const role = (["patient", "doctor", "lab", "pharmacy"].includes(profile.role)
    ? profile.role
    : "patient") as KycRole;

  const [{ data: docs }, { data: request }] = await Promise.all([
    db.from("kyc_documents").select("*").eq("profile_id", profile.id),
    db.from("verification_requests").select("*").eq("profile_id", profile.id).maybeSingle(),
  ]);

  const completed = new Set<string>();
  for (const d of docs ?? []) {
    if (d.file_url && d.status !== "rejected") completed.add(d.doc_key);
  }
  // Field-type items
  if (profile.profile_photo_url) completed.add("profile_photo");
  if (profile.email) completed.add("email_verified");
  for (const item of KYC_CONFIG[role]) {
    if (item.kind === "field" && profile[item.key]) completed.add(item.key);
  }
  // Role-extension field values stored in kyc_documents as 'field' rows
  for (const d of docs ?? []) {
    if (d.status !== "rejected" && !d.file_url && d.ai_extracted?.value) completed.add(d.doc_key);
  }

  const calc = computeKyc(role, completed, request?.status as KycStatus | undefined);
  const avgAuth =
    (docs ?? []).reduce((s: number, d: any) => s + (Number(d.ai_authenticity_score) || 0), 0) /
      Math.max(1, (docs ?? []).filter((d: any) => d.ai_authenticity_score != null).length) || null;
  const trust = computeTrustScore({ kycPercentage: calc.percentage, avgAuthenticity: avgAuth, status: calc.status });

  return { role, docs: docs ?? [], request, calc, trust };
}

async function persistState(profile: any, state: Awaited<ReturnType<typeof buildState>>) {
  const db = supabaseAdmin as any;
  await db.from("profile_completion").upsert({
    profile_id: profile.id,
    role: state.role,
    percentage: state.calc.percentage,
    readiness: state.calc.readiness,
    missing_items: state.calc.missing,
    updated_at: new Date().toISOString(),
  });
  await db.from("trust_scores").upsert({
    profile_id: profile.id,
    score: state.trust.score,
    grade: state.trust.grade,
    factors: state.trust.factors,
    updated_at: new Date().toISOString(),
  });
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const profile = await getProfile(userId);
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const state = await buildState(profile);
  await persistState(profile, state);

  return NextResponse.json({
    role: state.role,
    percentage: state.calc.percentage,
    readiness: state.calc.readiness,
    status: state.request?.status ?? state.calc.status,
    missing: state.calc.missing,
    requiredMissing: state.calc.requiredMissing,
    trust: state.trust,
    documents: state.docs.map((d: any) => ({
      doc_key: d.doc_key, status: d.status, file_url: d.file_url, file_name: d.file_name,
      ai_extracted: d.ai_extracted, ai_quality_score: d.ai_quality_score, reviewer_note: d.reviewer_note,
    })),
    config: KYC_CONFIG[state.role],
  });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const profile = await getProfile(userId);
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const db = supabaseAdmin as any;
  const role = (["patient", "doctor", "lab", "pharmacy"].includes(profile.role) ? profile.role : "patient") as KycRole;
  const items = KYC_CONFIG[role];

  if (body.action === "save_field") {
    const item = items.find((i) => i.key === body.key && i.kind === "field");
    if (!item) return NextResponse.json({ error: "Unknown field" }, { status: 400 });
    const value = String(body.value ?? "").trim().slice(0, 500);
    if (!value) return NextResponse.json({ error: "Value required" }, { status: 400 });

    // Persist on profiles when the column exists; always mirror into kyc_documents.
    if (["full_name", "dob", "gender"].includes(item.key)) {
      await db.from("profiles").update({ [item.key]: value }).eq("id", profile.id);
    }
    await db.from("kyc_documents").upsert(
      {
        profile_id: profile.id, role, doc_key: item.key, doc_label: item.label,
        is_required: item.required, status: "uploaded",
        ai_extracted: { value }, updated_at: new Date().toISOString(),
      },
      { onConflict: "profile_id,doc_key" }
    );
  } else if (body.action === "save_document") {
    const item = items.find((i) => i.key === body.key);
    if (!item) return NextResponse.json({ error: "Unknown document" }, { status: 400 });
    if (!body.file_url) return NextResponse.json({ error: "file_url required" }, { status: 400 });

    // Duplicate detection by file hash (same user re-uploading is fine; flag cross-profile dupes)
    let aiFlags: string[] = [];
    if (body.file_hash) {
      const { data: dupes } = await db
        .from("kyc_documents").select("profile_id").eq("file_hash", body.file_hash).neq("profile_id", profile.id).limit(1);
      if (dupes?.length) aiFlags.push("duplicate_document_detected");
    }

    await db.from("kyc_documents").upsert(
      {
        profile_id: profile.id, role, doc_key: item.key, doc_label: item.label,
        is_required: item.required, file_url: body.file_url,
        file_name: body.file_name ?? null, mime_type: body.mime_type ?? null,
        file_hash: body.file_hash ?? null,
        status: body.ai ? "ai_checked" : "uploaded",
        ai_extracted: body.ai?.extracted ?? null,
        ai_quality_score: body.ai?.quality_score ?? null,
        ai_authenticity_score: body.ai?.authenticity_score ?? null,
        ai_flags: [...(body.ai?.flags ?? []), ...aiFlags],
        updated_at: new Date().toISOString(),
      },
      { onConflict: "profile_id,doc_key" }
    );

    if (item.key === "profile_photo") {
      await db.from("profiles").update({ profile_photo_url: body.file_url }).eq("id", profile.id);
    }

    // AI auto-fill: name / dob / gender from extracted ID documents
    const ex = body.ai?.extracted;
    if (ex && body.autofill !== false) {
      const updates: Record<string, unknown> = {};
      if (ex.full_name && !profile.full_name) updates.full_name = ex.full_name;
      if (ex.dob && !profile.dob) updates.dob = ex.dob;
      if (ex.gender && !profile.gender) updates.gender = ex.gender;
      if (Object.keys(updates).length) await db.from("profiles").update(updates).eq("id", profile.id);
    }
  } else if (body.action === "submit") {
    const state = await buildState(profile);
    if (state.calc.percentage < 80) {
      return NextResponse.json(
        { error: `Profile is ${state.calc.percentage}% complete. Reach 80% to submit for verification.` },
        { status: 400 }
      );
    }
    const status = "pending_verification";
    await db.from("verification_requests").upsert(
      {
        ...(state.request?.id ? { id: state.request.id } : {}),
        profile_id: profile.id, role: state.role,
        kyc_percentage: state.calc.percentage, status,
        priority: state.calc.percentage >= 100,
        missing_documents: state.calc.missing.map((m) => m.label),
        submitted_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );
    await audit({ actorProfileId: profile.id, actorClerkId: userId, actorRole: profile.role, action: "kyc.submit", entity: "verification_requests", detail: { percentage: state.calc.percentage } });
    await notify({
      profileId: profile.id, clerkUserId: userId, email: profile.email,
      event: "verification_submitted",
      title: "Verification submitted",
      body: `Your profile (${state.calc.percentage}% complete) is now pending verification.`,
      link: "/kyc",
      emailEvent: "verification_submitted",
      emailVars: { name: profile.full_name, percentage: state.calc.percentage },
    });
  } else {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const state = await buildState(profile);
  await persistState(profile, state);
  return NextResponse.json({
    ok: true,
    percentage: state.calc.percentage,
    readiness: state.calc.readiness,
    status: state.request?.status ?? state.calc.status,
    missing: state.calc.missing,
    trust: state.trust,
  });
}
