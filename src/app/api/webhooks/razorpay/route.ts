import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import crypto from "crypto";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/webhooks/razorpay
// Razorpay sends payment events here (payment.captured, payment.failed, etc.)
// Set this URL in Razorpay Dashboard → Webhooks
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!RAZORPAY_WEBHOOK_SECRET) {
      console.error("[Razorpay Webhook] Missing RAZORPAY_WEBHOOK_SECRET");
      return new NextResponse("Webhook secret not configured", { status: 503 });
    }

    // 1. Verify webhook signature
    const signature = req.headers.get("x-razorpay-signature");
    const body = await req.text();

    if (!signature) {
      return new NextResponse("Missing signature", { status: 400 });
    }

    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== signature) {
      console.error("[Razorpay Webhook] Signature verification failed");
      return new NextResponse("Invalid signature", { status: 400 });
    }

    // 2. Parse event
    const event = JSON.parse(body);
    const eventType = event.event;
    const paymentEntity = event.payload?.payment?.entity;

    console.log(`[Razorpay Webhook] Received: ${eventType}`);

    // 3. Handle events
    if (eventType === "payment.captured" && paymentEntity) {
      const { id: payment_id, order_id, amount, notes } = paymentEntity;
      console.log(`[Razorpay Webhook] Payment captured: ${payment_id}, order: ${order_id}`);

      // Update any pending orders linked to this payment
      // This handles edge cases where the frontend verify call was missed
      await (supabaseAdmin.from("medicine_orders" as any) as any)
        .update({
          payment_status: "paid",
          payment_id,
          status: "confirmed",
        } as any)
        .eq("razorpay_order_id", order_id)
        .eq("payment_status", "pending");

      await (supabaseAdmin.from("bookings" as any) as any)
        .update({
          payment_status: "paid",
          payment_id,
          status: "confirmed",
        } as any)
        .eq("razorpay_order_id", order_id)
        .eq("payment_status", "pending");

    } else if (eventType === "payment.failed" && paymentEntity) {
      const { id: payment_id, order_id } = paymentEntity;
      console.log(`[Razorpay Webhook] Payment failed: ${payment_id}, order: ${order_id}`);

      await (supabaseAdmin.from("medicine_orders" as any) as any)
        .update({ payment_status: "failed" } as any)
        .eq("razorpay_order_id", order_id);

      await (supabaseAdmin.from("bookings" as any) as any)
        .update({ payment_status: "failed" } as any)
        .eq("razorpay_order_id", order_id);

    } else if (eventType === "refund.processed" && event.payload?.refund?.entity) {
      const refundEntity = event.payload.refund.entity;
      console.log(`[Razorpay Webhook] Refund processed: ${refundEntity.id}`);
    }

    return new NextResponse("OK", { status: 200 });
  } catch (err: any) {
    console.error("[Razorpay Webhook] Error:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
