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
  const isOwner = ticket && profile && ticket.creator_id === profile.id;
  return { db, profile, ticket, isAdmin, isOwner, allowed: !!ticket && (isAdmin || isOwner) };
}

export async function GET(_req: Request, ctx: { params: Promise<{ ticketId: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { ticketId } = await ctx.params;
  const { db, ticket, allowed, isAdmin } = await loadContext(userId, ticketId);
  if (!allowed || !ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: messages } = await db
    .from("ticket_messages").select("*").eq("ticket_id", ticketId).order("created_at", { ascending: true });
  
  const mappedTicket = {
    ...ticket,
    subject: ticket.title,
    ticket_no: ticket.id.slice(0, 8),
  };

  const mappedMessages = (messages ?? []).map((m: any) => {
    let sender_role = "user";
    if (m.sender_id === null) {
      sender_role = "ai";
    } else if (m.sender_id !== ticket.creator_id) {
      sender_role = "admin";
    }
    return {
      id: m.id,
      sender_role,
      body: m.message,
      created_at: m.created_at,
    };
  });

  return NextResponse.json({ ticket: mappedTicket, messages: mappedMessages, isAdmin: !!isAdmin });
}

export async function POST(req: Request, ctx: { params: Promise<{ ticketId: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { ticketId } = await ctx.params;
  const { db, profile, ticket, allowed, isAdmin } = await loadContext(userId, ticketId);
  if (!allowed || !ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const message = String(body.message ?? "").trim().slice(0, 4000);
  if (!message) return NextResponse.json({ error: "Message required" }, { status: 400 });

  await db.from("ticket_messages").insert({
    ticket_id: ticketId,
    sender_id: profile?.id ?? null,
    message: message,
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
  if (!allowed || !ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });

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
      .from("profiles").select("*").eq("id", ticket.creator_id).maybeSingle();
    const ticketNo = ticket.id.slice(0, 8);
    const subject = ticket.title;
    if (ownerProfile) {
      await notify({
        profileId: ownerProfile.id, clerkUserId: ownerProfile.clerk_user_id, email: ownerProfile.email,
        event: "ticket_resolved", title: `Ticket #${ticketNo} resolved`, body: subject, link: "/support",
        emailEvent: "ticket_resolved",
        emailVars: { name: ownerProfile.full_name, ticketNo, subject },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
