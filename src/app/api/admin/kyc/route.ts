// HealthSurya V2 — Admin Verification Dashboard API
// GET   /api/admin/kyc                 → verification queue (priority first)
// GET   /api/admin/kyc?profileId=...   → full review payload (docs, AI, logs)
// POST  /api/admin/kyc                 → { profileId, action:'approve'|'reject'|'under_review', note? }
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { notify, audit } from "@/lib/notify.server";

export const runtime = "nodejs";

async function requireAdmin(clerkId: string) {
  const { data: profile } = await (supabaseAdmin as any)
    .from("profiles").select("*").eq("clerk_user_id", clerkId).maybeSingle();
  if (!profile || !["admin", "super_admin"].includes(profile.role)) return null;
  return profile as any;
}

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await requireAdmin(userId);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = supabaseAdmin as any;
  const url = new URL(req.url);
  const profileId = url.searchParams.get("profileId");

  if (profileId) {
    const [{ data: profile }, { data: request }, { data: docs }, { data: completion }, { data: trust }, { data: logs }] =
      await Promise.all([
        db.from("profiles").select("*").eq("id", profileId).maybeSingle(),
        db.from("verification_requests").select("*").eq("profile_id", profileId).maybeSingle(),
        db.from("kyc_documents").select("*").eq("profile_id", profileId).order("created_at"),
        db.from("profile_completion").select("*").eq("profile_id", profileId).maybeSingle(),
        db.from("trust_scores").select("*").eq("profile_id", profileId).maybeSingle(),
        db.from("audit_logs").select("*").or(`actor_profile_id.eq.${profileId},entity_id.eq.${profileId}`).order("created_at", { ascending: false }).limit(50),
      ]);

    // AI risk score: derived from doc authenticity + flags (lower is safer)
    const flagged = (docs ?? []).filter((d: any) => (d.ai_flags ?? []).length > 0).length;
    const avgAuth = (docs ?? []).reduce((s: number, d: any) => s + (Number(d.ai_authenticity_score) || 70), 0) / Math.max(1, (docs ?? []).length);
    const riskScore = Math.min(100, Math.max(0, Math.round(100 - avgAuth + flagged * 10)));
    const recommendations: string[] = [];
    if (flagged) recommendations.push(`${flagged} document(s) carry AI flags — open the document viewer before approving.`);
    if ((completion?.percentage ?? 0) >= 100) recommendations.push("Profile is 100% complete — priority approval candidate.");
    else if ((completion?.percentage ?? 0) >= 80) recommendations.push("Eligible for approval at current completion; remaining documents are optional.");
    else recommendations.push("Below 80% — approve only with manual override justification.");

    return NextResponse.json({ profile, request, docs: docs ?? [], completion, trust, logs: logs ?? [], ai: { riskScore, recommendations } });
  }

  const { data: queue } = await db
    .from("verification_requests")
    .select("*, profiles:profile_id (id, full_name, email, role, profile_photo_url)")
    .in("status", ["pending_verification", "under_review", "approved", "rejected"])
    .order("priority", { ascending: false })
    .order("submitted_at", { ascending: true })
    .limit(200);

  return NextResponse.json({ queue: queue ?? [] });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await requireAdmin(userId);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const { profileId, action, note } = body;
  if (!profileId || !["approve", "reject", "under_review"].includes(action)) {
    return NextResponse.json({ error: "profileId and valid action required" }, { status: 400 });
  }

  const db = supabaseAdmin as any;
  const status = action === "approve" ? "approved" : action === "reject" ? "rejected" : "under_review";

  await db.from("verification_requests")
    .update({
      status,
      admin_note: note ?? null,
      reviewed_by: admin.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("profile_id", profileId);

  // Keep the existing V1.5 profiles.verification_status in sync (preserves old flows).
  if (action !== "under_review") {
    await db.from("profiles").update({ verification_status: status }).eq("id", profileId);
  }

  const { data: target } = await db.from("profiles").select("*").eq("id", profileId).maybeSingle();

  await db.from("verification_logs").insert({
    verification_id: null,
    actor: `admin:${admin.email ?? admin.id}`,
    action: `kyc.${action}`,
    detail: { profileId, note: note ?? null },
  });
  await audit({ actorProfileId: admin.id, actorClerkId: userId, actorRole: admin.role, action: `admin.kyc.${action}`, entity: "profiles", entityId: profileId, detail: { note: note ?? null } });

  if (target) {
    if (action === "approve") {
      await notify({
        profileId, clerkUserId: target.clerk_user_id, email: target.email,
        event: "verification_approved", title: "You're verified! ✅",
        body: "Your profile is approved and now visible on HealthSurya.", link: "/dashboard",
        emailEvent: "verification_approved", emailVars: { name: target.full_name },
      });
    } else if (action === "reject") {
      await notify({
        profileId, clerkUserId: target.clerk_user_id, email: target.email,
        event: "verification_rejected", title: "Verification needs attention",
        body: note || "Some documents need to be re-uploaded.", link: "/kyc",
        emailEvent: "verification_rejected", emailVars: { name: target.full_name, reason: note },
      });
    }
  }

  return NextResponse.json({ ok: true, status });
}
