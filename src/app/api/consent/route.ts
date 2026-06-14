import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  try {
    // 1. Authenticate the user
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 2. Fetch the profile ID from PostgreSQL (with retry to wait for Clerk Webhook sync)
    let profile = null;
    for (let i = 0; i < 5; i++) {
      const { data, error: profileError } = (await supabaseAdmin
        .from("profiles" as any)
        .select("id")
        .eq("clerk_user_id", clerkUserId)
        .maybeSingle()) as any;
      if (data) {
        profile = data;
        break;
      }
      console.log(`[Consent API] Profile not found, retrying in 1s (attempt ${i + 1}/5)...`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    if (!profile) {
      return new NextResponse("User profile not found", { status: 404 });
    }

    // 3. Extract request parameters
    const { terms_version, privacy_version } = await req.json();
    if (!terms_version || !privacy_version) {
      return new NextResponse("Missing version parameters", { status: 400 });
    }

    // 4. Extract IP address and User Agent, detect country and browser
    const ipAddress =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "unknown";
    const country = req.headers.get("cf-ipcountry") || "IN";

    let browser = "unknown";
    if (userAgent.includes("Firefox/")) {
      browser = "Firefox";
    } else if (userAgent.includes("Edg/")) {
      browser = "Edge";
    } else if (userAgent.includes("Chrome/")) {
      browser = "Chrome";
    } else if (userAgent.includes("Safari/")) {
      browser = "Safari";
    } else if (userAgent.includes("OPR/") || userAgent.includes("Opera/")) {
      browser = "Opera";
    } else if (userAgent.includes("MSIE ") || userAgent.includes("Trident/")) {
      browser = "IE";
    }

    // 5. Insert into user_consents table
    const { error: consentError } = await supabaseAdmin
      .from("user_consents" as any)
      .insert({
        user_id: profile.id,
        terms_version,
        privacy_version,
        ip_address: ipAddress,
        device_info: userAgent,
        browser,
        country,
        accepted_at: new Date().toISOString(),
      } as any);

    if (consentError) {
      console.error("[Consent API] Error saving consent:", consentError.message);
      return new NextResponse("Database Error", { status: 500 });
    }

    // 6. Write to Audit Logs
    await (supabaseAdmin.from("audit_logs" as any) as any).insert({
      user_id: profile.id,
      action: "CONSENT_GRANT",
      entity_type: "USER_CONSENT",
      entity_id: profile.id, // Reference to self/profile
    } as any);

    console.log(`[Consent API] Logged consent for user: ${clerkUserId}`);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[Consent API] Error:", err);
    return new NextResponse(err.message || "Internal Server Error", { status: 500 });
  }
}
