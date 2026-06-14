import { NextResponse } from "next/server";
import { getProfileFromServerRequest } from "@/lib/auth-server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import crypto from "crypto";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/verify
// Called by frontend AFTER Razorpay checkout success.
// Verifies the HMAC signature, then updates order status.
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    // 1. Authenticate user and get profile
    const profile = await getProfileFromServerRequest();
    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 2. Parse body
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      entity_type, // "medicine_order" | "lab_booking"
      entity_id,   // internal DB order/booking ID
    } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return new NextResponse("Bad Request – missing payment fields", { status: 400 });
    }

    // 3. Verify HMAC signature  ← CRITICAL SECURITY CHECK
    const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
    if (!RAZORPAY_KEY_SECRET) {
      return new NextResponse("Payment gateway not configured", { status: 503 });
    }

    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      console.error("[Payments] Signature mismatch – possible tampering attempt");
      return new NextResponse("Payment verification failed", { status: 400 });
    }

    // 4. User profile already retrieved in Step 1

    // 5. Update entity payment status
    if (entity_type === "medicine_order" && entity_id) {
      await (supabaseAdmin.from("medicine_orders" as any) as any)
        .update({
          payment_status: "paid",
          payment_id: razorpay_payment_id,
          razorpay_order_id,
          status: "confirmed",
        } as any)
        .eq("id", entity_id)
        .eq("patient_id", profile.id); // ownership check
    } else if (entity_type === "lab_booking" && entity_id) {
      await (supabaseAdmin.from("bookings" as any) as any)
        .update({
          payment_status: "paid",
          payment_id: razorpay_payment_id,
          razorpay_order_id,
          status: "confirmed",
        } as any)
        .eq("id", entity_id)
        .eq("patient_id", profile.id); // ownership check
    }

    // 6. Audit log
    await (supabaseAdmin.from("audit_logs" as any) as any).insert({
      user_id: profile.id,
      action: "PAYMENT_VERIFIED",
      entity_type: entity_type?.toUpperCase() || "PAYMENT",
      entity_id: entity_id || razorpay_order_id,
    } as any);

    console.log(`[Payments] Payment verified: ${razorpay_payment_id} for user: ${profile.id}`);

    return NextResponse.json({ success: true, payment_id: razorpay_payment_id });
  } catch (err: any) {
    console.error("[Payments] Error in verify:", err);
    return new NextResponse(err.message || "Internal Server Error", { status: 500 });
  }
}
