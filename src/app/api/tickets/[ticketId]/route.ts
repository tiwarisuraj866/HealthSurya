// HealthSurya V2 — Ticket thread API
// GET   /api/tickets/[ticketId]  → ticket + messages
// POST  /api/tickets/[ticketId]  → { message } add reply (reopens resolved tickets)
// PATCH /api/tickets/[ticketId]  → { status } (owner can close; admin any status)
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { notify, audit } from "@/lib/notify.server";

export const runtime = "nodejs";

const STATUSES = ["open", "pending", "resolved", "closed"];

async function loadContext(clerkId: string, ticketId: string) {
  const db = supabaseAdmin as any;
  const [{ data: profile }, { data: ticket }] = await Promise.all([
    db.from("profiles").select("*").eq("clerk_user_id", clerkId).maybeSingle(),
    db.from("tickets").select("*").eq("id", ticketId).maybeSingle(),
  ]);
  const isAdmin = profile && ["admin", "super_admin", "support"].includes(profile.role);
  const isOwner = ticket && ticket.created_by_clerk_id === clerkId;
  return { db, profile, ticket, isAdmin, isOwner, allowed: !!ticket && (isAdmin || isOwner) };
}

export async function GET(_req: Request, ctx: { params: Promise<{ ticketId: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { ticketId } = await ctx.params;
  const { db, ticket, allowed, isAdmin } = await loadContext(userId, ticketId);
  if (!allowed) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: messages } = await db
    .from("ticket_messages").select("*").eq("ticket_id", ticketId).order("created_at", { ascending: true });
  return NextResponse.json({ ticket, messages: messages ?? [], isAdmin: !!isAdmin });
}

export async function POST(req: Request, ctx: { params: Promise<{ ticketId: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { ticketId } = await ctx.params;
  const { db, profile, ticket, allowed, isAdmin } = await loadContext(userId, ticketId);
  if (!allowed) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const message = String(body.message ?? "").trim().slice(0, 4000);
  if (!message) return NextResponse.json({ error: "Message required" }, { status: 400 });

  await db.from("ticket_messages").insert({
    ticket_id: ticketId,
    sender_role: isAdmin && !(ticket.created_by_clerk_id === userId) ? "admin" : "user",
    sender_profile_id: profile?.id ?? null,
    body: message,
  });

  // A user reply reopens resolved/closed tickets; any reply bumps updated_at.
  const reopen = !isAdmin && ["resolved", "closed"].includes(ticket.status);
  await db.from("tickets").update({
    status: reopen ? "open" : ticket.status === "pending" && isAdmin ? "open" : ticket.status,
    updated_at: new Date().toISOString(),
  }).eq("id", ticketId);

  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ ticketId: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { ticketId } = await ctx.params;
  const { db, profile, ticket, allowed, isAdmin, isOwner } = await loadContext(userId, ticketId);
  if (!allowed) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const status = String(body.status ?? "");
  if (!STATUSES.includes(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  if (!isAdmin && !(isOwner && status === "closed")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.from("tickets").update({ status, updated_at: new Date().toISOString() }).eq("id", ticketId);
  await audit({ actorProfileId: profile?.id, actorClerkId: userId, actorRole: profile?.role, action: `ticket.status.${status}`, entity: "tickets", entityId: ticketId });

  if (status === "resolved") {
    const { data: ownerProfile } = await db
      .from("profiles").select("*").eq("clerk_user_id", ticket.created_by_clerk_id).maybeSingle();
    await notify({
      profileId: ownerProfile?.id, clerkUserId: ticket.created_by_clerk_id, email: ownerProfile?.email,
      event: "ticket_resolved", title: `Ticket #${ticket.ticket_no} resolved`, body: ticket.subject, link: "/support",
      emailEvent: "ticket_resolved",
      emailVars: { name: ownerProfile?.full_name, ticketNo: ticket.ticket_no, subject: ticket.subject },
    });
  }

  return NextResponse.json({ ok: true });
}
