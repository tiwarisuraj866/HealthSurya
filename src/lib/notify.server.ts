// HealthSurya V2 — Centralized notification dispatcher (server-only).
// Channels live now: in_app + email. Future-ready: sms, whatsapp (rows are
// written with channel tags; senders can be plugged in without schema change).

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { renderEmail, type EmailEvent, type EmailVars } from "@/lib/email-templates";

export interface NotifyInput {
  profileId?: string | null;
  clerkUserId?: string | null;
  email?: string | null;
  event: string;
  title: string;
  body?: string;
  link?: string;
  /** When set, also sends a branded email using this template. */
  emailEvent?: EmailEvent;
  emailVars?: EmailVars;
}

/** Sends a transactional email via Resend if RESEND_API_KEY is set; otherwise logs. */
export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "HealthSurya <noreply@healthsurya.com>";
  if (!apiKey) {
    console.log(`[email:disabled] Would send to ${to}: ${subject}`);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!res.ok) console.error("[email] Resend error:", res.status, await res.text());
    return res.ok;
  } catch (err) {
    console.error("[email] send failed:", err);
    return false;
  }
}

/** Writes an in-app notification and (optionally) sends a branded email. */
export async function notify(input: NotifyInput): Promise<void> {
  const db = supabaseAdmin as any;

  try {
    await db.from("notifications").insert({
      profile_id: input.profileId ?? null,
      clerk_user_id: input.clerkUserId ?? null,
      channel: "in_app",
      event: input.event,
      title: input.title,
      body: input.body ?? null,
      link: input.link ?? null,
    });
  } catch (err) {
    console.error("[notify] in-app insert failed:", err);
  }

  if (input.emailEvent && input.email) {
    const { subject, html } = renderEmail(input.emailEvent, input.emailVars ?? {});
    const sent = await sendEmail(input.email, subject, html);
    try {
      await db.from("notifications").insert({
        profile_id: input.profileId ?? null,
        clerk_user_id: input.clerkUserId ?? null,
        channel: "email",
        event: input.event,
        title: subject,
        body: sent ? "Email delivered" : "Email queued (provider not configured)",
        sent_at: sent ? new Date().toISOString() : null,
        is_read: true,
      });
    } catch { /* non-fatal */ }
  }
}

/** Enterprise audit trail helper. */
export async function audit(entry: {
  actorProfileId?: string | null;
  actorClerkId?: string | null;
  actorRole?: string | null;
  action: string;
  entity?: string;
  entityId?: string;
  detail?: Record<string, unknown>;
  ip?: string | null;
}): Promise<void> {
  try {
    await (supabaseAdmin as any).from("audit_logs").insert({
      actor_profile_id: entry.actorProfileId ?? null,
      actor_clerk_id: entry.actorClerkId ?? null,
      actor_role: entry.actorRole ?? null,
      action: entry.action,
      entity: entry.entity ?? null,
      entity_id: entry.entityId ?? null,
      detail: entry.detail ?? null,
      ip: entry.ip ?? null,
    });
  } catch (err) {
    console.error("[audit] insert failed:", err);
  }
}
