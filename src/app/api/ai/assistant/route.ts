// HealthSurya V2 — AI Support Agent
// POST /api/ai/assistant  { messages:[{role,content}], escalate?:boolean, category?:string }
// Role-aware help for patient / doctor / lab / pharmacy / admin.
// Escalation flow: AI Agent → Support Ticket → Admin.
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { notify, audit } from "@/lib/notify.server";

export const runtime = "nodejs";
export const maxDuration = 60;

const ROLE_GUIDES: Record<string, string> = {
  patient: `Help patients: book doctors (/doctors), book lab tests (/labs), order medicines (/medicine), view bookings (/bookings), track orders (/orders), complete KYC (/kyc), raise support tickets (/support).`,
  doctor: `Help doctors: manage profile & mini-website (/doctor-manage), set up practice (/doctor-setup), manage appointments (/dashboard), complete KYC verification (/kyc — 80% completion makes you visible, 100% gets priority review).`,
  lab: `Help labs: manage bookings & upload reports (/lab-manage), set up the lab (/lab-setup), complete KYC (/kyc). NABL certificate is optional but boosts trust.`,
  pharmacy: `Help pharmacies: manage the store (/pharmacy), set up (/pharmacy-setup), complete KYC (/kyc). Drug license unlocks medicine fulfilment.`,
  admin: `Help admins: verification queue (/admin/kyc), legacy verifications (/admin/verifications), user management (/admin/users). Explain KYC %, AI risk score and approve/reject flows.`,
};

const FAQ: [RegExp, string][] = [
  [/book.*(doctor|appointment)/i, "To book a doctor: open **Doctors** (/doctors), choose a specialist, pick a slot and confirm. You'll get an email confirmation and can track it under **Bookings**."],
  [/book.*(lab|test)/i, "To book a lab test: open **Labs** (/labs), compare prices, select tests and a time slot. Reports appear in your bookings once uploaded by the lab."],
  [/(medicine|pharmacy|order)/i, "Order medicines from **Medicine** (/medicine). Upload a prescription where required, add to cart, and checkout with Razorpay. Track delivery in **Orders**."],
  [/(kyc|verification|verify|document)/i, "Your KYC Centre is at **/kyc**. You only need 80% completion to become visible on the platform — optional documents are never mandatory. 100% completion gets priority review."],
  [/(payment|refund)/i, "Payments are processed securely via Razorpay. For refund issues, raise a ticket under the **Payment** category and our team will respond within 24–48 hours."],
  [/(ticket|support|help|complaint)/i, "You can raise and track support tickets at **/support**. I can also escalate this conversation to a ticket — just say 'create a ticket'."],
];

async function getProfile(clerkId: string) {
  const { data } = await (supabaseAdmin as any)
    .from("profiles").select("*").eq("clerk_user_id", clerkId).maybeSingle();
  return data as any;
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const profile = await getProfile(userId);

  const body = await req.json().catch(() => ({}));
  const messages: { role: string; content: string }[] = Array.isArray(body.messages) ? body.messages.slice(-12) : [];
  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const roleCtx = (profile?.role && ROLE_GUIDES[profile.role] ? profile.role : "patient") as string;

  // ── Escalation: AI Agent → Support Ticket → Admin ──
  const wantsTicket = body.escalate === true || /create a ticket|raise a ticket|talk to (a )?human|escalate/i.test(lastUser);
  if (wantsTicket) {
    const db = supabaseAdmin as any;
    const subject = (body.subject || lastUser || "Support request via AI assistant").slice(0, 140);
    const { data: ticket, error } = await db
      .from("tickets")
      .insert({
        profile_id: profile?.id ?? null,
        created_by_clerk_id: userId,
        subject,
        category: body.category && ["appointment","lab_test","payment","verification","technical","general"].includes(body.category) ? body.category : "general",
        source: "ai_escalation",
      })
      .select()
      .single();
    if (!error && ticket) {
      const transcript = messages.map((m) => `${m.role === "user" ? "User" : "AI"}: ${m.content}`).join("\n").slice(0, 4000);
      await db.from("ticket_messages").insert({
        ticket_id: ticket.id, sender_role: "ai",
        body: `Conversation escalated from HealthSurya AI Assistant.\n\n--- Transcript ---\n${transcript}`,
      });
      await audit({ actorProfileId: profile?.id, actorClerkId: userId, actorRole: profile?.role, action: "ai.escalate_ticket", entity: "tickets", entityId: ticket.id });
      await notify({
        profileId: profile?.id, clerkUserId: userId, email: profile?.email,
        event: "ticket_created", title: `Ticket #${ticket.ticket_no} created`,
        body: subject, link: "/support",
        emailEvent: "ticket_created",
        emailVars: { name: profile?.full_name, ticketNo: ticket.ticket_no, subject },
      });
      return NextResponse.json({
        reply: `I've created support ticket **#${ticket.ticket_no}** for you and shared our conversation with the team. You can track it and chat with support at /support. Anything else I can help with?`,
        ticketId: ticket.id,
        ticketNo: ticket.ticket_no,
      });
    }
    return NextResponse.json({ reply: "I couldn't create the ticket just now. Please try again from the Support page (/support)." });
  }

  // ── LLM-powered answer when configured ──
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.AI_MODEL || "claude-sonnet-4-20250514",
          max_tokens: 600,
          system: `You are HealthSurya AI Assistant for an Indian healthcare platform (doctors, labs, pharmacy, medicine delivery).
Current user role: ${roleCtx}. ${ROLE_GUIDES[roleCtx]}
Be concise, warm and practical. Use site paths (like /kyc) when navigating users.
Never give medical diagnoses; for medical emergencies advise calling 108.
If you cannot resolve an issue, offer to escalate to a support ticket.`,
          messages: messages.map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content })),
        }),
      });
      const data = await res.json();
      const reply = (data.content ?? []).filter((c: any) => c.type === "text").map((c: any) => c.text).join("") ||
        "I'm here to help — could you rephrase that?";

      // Persist conversation (best-effort)
      try {
        await (supabaseAdmin as any).from("ai_conversations").insert({
          profile_id: profile?.id ?? null, clerk_user_id: userId, role_context: roleCtx,
          messages: [...messages, { role: "assistant", content: reply }],
        });
      } catch { /* non-fatal */ }

      return NextResponse.json({ reply });
    } catch (err) {
      console.error("[ai/assistant] LLM failed, using FAQ fallback:", err);
    }
  }

  // ── Rule-based FAQ fallback (works with zero AI configuration) ──
  for (const [re, answer] of FAQ) {
    if (re.test(lastUser)) return NextResponse.json({ reply: answer });
  }
  return NextResponse.json({
    reply:
      "I can help you with booking doctors, lab tests, medicine orders, payments, KYC verification and support tickets. " +
      "Try asking e.g. *'How do I complete my KYC?'* — or say **'create a ticket'** and I'll connect you with our team.",
  });
}
