// HealthSurya V2 — Ticket Management
// GET  /api/tickets        → my tickets (admin: ?all=1 for queue)
// POST /api/tickets        → create ticket { subject, category, message }
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { notify, audit } from "@/lib/notify.server";

export const runtime = "nodejs";

const CATEGORIES = ["appointment", "lab_test", "payment", "verification", "technical", "general"];

async function getProfile(clerkId: string) {
  const { data } = await (supabaseAdmin as any)
    .from("profiles").select("*").eq("clerk_user_id", clerkId).maybeSingle();
  return data as any;
}

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const profile = await getProfile(userId);
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  const db = supabaseAdmin as any;
  const url = new URL(req.url);

  const isAdmin = profile && ["admin", "super_admin", "support"].includes(profile.role);
  let query = db.from("tickets").select("*").order("updated_at", { ascending: false }).limit(100);
  if (!(isAdmin && url.searchParams.get("all") === "1")) {
    query = query.eq("creator_id", profile.id);
  }
  const status = url.searchParams.get("status");
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  const mappedTickets = (data ?? []).map((t: any) => ({
    ...t,
    subject: t.title,
    ticket_no: t.id.slice(0, 8),
    source: "user",
  }));

  return NextResponse.json({ tickets: mappedTickets, isAdmin: !!isAdmin });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const profile = await getProfile(userId);
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const subject = String(body.subject ?? "").trim().slice(0, 140);
  const message = String(body.message ?? "").trim().slice(0, 4000);
  const category = CATEGORIES.includes(body.category) ? body.category : "general";
  if (!subject || !message) {
    return NextResponse.json({ error: "Subject and message are required" }, { status: 400 });
  }

  const db = supabaseAdmin as any;
  const { data: ticket, error } = await db
    .from("tickets")
    .insert({
      creator_id: profile.id,
      title: subject,
      description: message,
      category,
      status: "open",
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await db.from("ticket_messages").insert({
    ticket_id: ticket.id,
    sender_id: profile.id,
    message: message,
  });

  const ticketNo = ticket.id.slice(0, 8);
  const mappedTicket = { ...ticket, ticket_no: ticketNo, subject: ticket.title };

  await audit({ actorProfileId: profile.id, actorClerkId: userId, actorRole: profile.role, action: "ticket.create", entity: "tickets", entityId: ticket.id, detail: { category } });
  await notify({
    profileId: profile.id, clerkUserId: userId, email: profile.email,
    event: "ticket_created", title: `Ticket #${ticketNo} created`, body: subject, link: "/support",
    emailEvent: "ticket_created", emailVars: { name: profile.full_name, ticketNo, subject },
  });

  return NextResponse.json({ ok: true, ticket: mappedTicket });
}
