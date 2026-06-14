import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import crypto from "crypto";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/webhooks/whatsapp
// Meta sends inbound messages and status updates here.
// Set this URL in Meta Developer Console → WhatsApp → Webhooks
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    // 1. Verify webhook signature from Meta
    const APP_SECRET = process.env.META_APP_SECRET;
    if (APP_SECRET) {
      const signature = req.headers.get("x-hub-signature-256");
      const body = await req.text();

      if (signature) {
        const expectedSig =
          "sha256=" +
          crypto.createHmac("sha256", APP_SECRET).update(body).digest("hex");

        if (expectedSig !== signature) {
          console.error("[WhatsApp Webhook] Signature mismatch");
          return new NextResponse("Invalid signature", { status: 403 });
        }
      }

      // 2. Parse the (already-read) body
      const data = JSON.parse(body);

      for (const entry of data.entry || []) {
        for (const change of entry.changes || []) {
          const value = change.value;

          // Handle inbound messages
          for (const message of value.messages || []) {
            const from = message.from;
            const msgType = message.type;
            const text = message.text?.body || "";

            console.log(`[WhatsApp Webhook] Inbound from ${from}: ${msgType} – ${text}`);

            // Auto-reply for common keywords (extend as needed)
            if (text.toLowerCase().includes("help") || text.toLowerCase().includes("support")) {
              // Fire-and-forget reply (don't await to avoid blocking webhook response)
              sendAutoReply(from, text).catch(console.error);
            }
          }

          // Handle delivery status updates
          for (const status of value.statuses || []) {
            console.log(
              `[WhatsApp Webhook] Status update for ${status.id}: ${status.status}`
            );
          }
        }
      }
    } else {
      // If no app secret, just log the event
      const data = await req.json();
      console.log("[WhatsApp Webhook] Received (unverified):", JSON.stringify(data).slice(0, 200));
    }

    // Meta requires 200 response immediately
    return new NextResponse("OK", { status: 200 });
  } catch (err: any) {
    console.error("[WhatsApp Webhook] Error:", err);
    // Still return 200 to avoid Meta retrying endlessly
    return new NextResponse("OK", { status: 200 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET — Meta webhook verification challenge
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const VERIFY_TOKEN = process.env.META_WHATSAPP_VERIFY_TOKEN;

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("[WhatsApp Webhook] Verification successful");
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

async function sendAutoReply(to: string, _originalMessage: string) {
  const PHONE_NUMBER_ID = process.env.META_WHATSAPP_PHONE_NUMBER_ID;
  const ACCESS_TOKEN = process.env.META_WHATSAPP_ACCESS_TOKEN;

  if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) return;

  await fetch(`https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: {
        body: "Thank you for reaching out to HealthSurya! 🏥\nFor support, visit https://healthsurya.com or email support@healthsurya.com\nWe'll get back to you shortly.",
      },
    }),
  });
}
