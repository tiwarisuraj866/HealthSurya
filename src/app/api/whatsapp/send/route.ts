import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/whatsapp/send
// Sends a WhatsApp template message via Meta Cloud API.
// ALL WhatsApp calls go through this backend route — never from the frontend.
// ─────────────────────────────────────────────────────────────────────────────

const META_API_VERSION = "v19.0";

interface TemplateComponent {
  type: "body" | "header" | "button";
  parameters: Array<{ type: "text"; text: string }>;
}

async function sendWhatsAppTemplate(
  to: string,
  templateName: string,
  languageCode: string,
  components: TemplateComponent[]
) {
  const PHONE_NUMBER_ID = process.env.META_WHATSAPP_PHONE_NUMBER_ID;
  const ACCESS_TOKEN = process.env.META_WHATSAPP_ACCESS_TOKEN;

  if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
    throw new Error("META_WHATSAPP_PHONE_NUMBER_ID or META_WHATSAPP_ACCESS_TOKEN not configured");
  }

  // Normalize phone number to E.164 format
  let phone = to.replace(/\s/g, "");
  if (!phone.startsWith("+")) {
    phone = `+91${phone.replace(/^0+/, "")}`;
  }

  const response = await fetch(
    `https://graph.facebook.com/${META_API_VERSION}/${PHONE_NUMBER_ID}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phone,
        type: "template",
        template: {
          name: templateName,
          language: { code: languageCode },
          components,
        },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Meta WhatsApp API error: ${JSON.stringify(err)}`);
  }

  return response.json();
}

export async function POST(req: Request) {
  try {
    // 1. Authenticate — only server-to-server calls or admin users
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 2. Verify caller is admin (or internal system call with secret header)
    const internalSecret = req.headers.get("x-internal-secret");
    const isInternalCall = internalSecret === process.env.INTERNAL_API_SECRET;

    if (!isInternalCall) {
      const { data: profile } = (await supabaseAdmin
        .from("profiles" as any)
        .select("role")
        .eq("clerk_user_id", clerkUserId)
        .single()) as any;

      if (!profile || !["admin", "super_admin"].includes(profile.role)) {
        return new NextResponse("Forbidden", { status: 403 });
      }
    }

    // 3. Parse body
    const { to, template, language = "en_US", components = [], notification_type } = await req.json();

    if (!to || !template) {
      return new NextResponse("Bad Request – to and template are required", { status: 400 });
    }

    // 4. Send via Meta API
    const result = await sendWhatsAppTemplate(to, template, language, components);

    console.log(`[WhatsApp] Sent ${template} to ${to}: ${result?.messages?.[0]?.id}`);

    return NextResponse.json({
      success: true,
      message_id: result?.messages?.[0]?.id,
    });
  } catch (err: any) {
    console.error("[WhatsApp] Error sending message:", err);
    return new NextResponse(err.message || "Internal Server Error", { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/whatsapp/send — Meta webhook verification
// Meta sends a GET to verify your webhook endpoint
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const VERIFY_TOKEN = process.env.META_WHATSAPP_VERIFY_TOKEN;

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("[WhatsApp] Webhook verified successfully");
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}
