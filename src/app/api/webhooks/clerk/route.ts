import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function POST(req: Request) {
  const SIGNING_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!SIGNING_SECRET) {
    throw new Error("Error: Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env");
  }

  // Get headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error: Missing Svix headers", {
      status: 400,
    });
  }

  // Get body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(SIGNING_SECRET);

  let evt: WebhookEvent;

  // Verify payload with headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error: Could not verify webhook:", err);
    return new Response("Error: Verification failed", {
      status: 400,
    });
  }

  // Handle the webhook event
  const { id: clerk_user_id } = evt.data;
  const eventType = evt.type;

  if (!clerk_user_id) {
    return new Response("Error: Missing user ID", { status: 400 });
  }

  console.log(`[Clerk Webhook] Received event: ${eventType} for user: ${clerk_user_id}`);

  try {
    if (eventType === "user.created") {
      const {
        email_addresses,
        phone_numbers,
        first_name,
        last_name,
        public_metadata,
        unsafe_metadata,
      } = evt.data;

      const email = email_addresses?.[0]?.email_address || null;
      const phone = phone_numbers?.[0]?.phone_number || null;
      const full_name = [first_name, last_name].filter(Boolean).join(" ") || null;

      // Roles a user is allowed to self-select during public registration.
      // Everything else (admin, super_admin, support, finance, marketing,
      // operations, courier, *_staff) must be granted server-side via
      // public_metadata or a staff invite — NEVER from client-controlled
      // unsafe_metadata, otherwise anyone could register as an admin.
      const SELF_SERVICE_ROLES = ["patient", "doctor", "lab", "pharmacy", "franchise"];

      const requestedUnsafeRole = unsafe_metadata?.role as string | undefined;
      const safeUnsafeRole =
        requestedUnsafeRole && SELF_SERVICE_ROLES.includes(requestedUnsafeRole)
          ? requestedUnsafeRole
          : "patient";

      // public_metadata is set only by trusted server code, so it is allowed to
      // carry any role; unsafe_metadata is clamped to the allowlist above.
      let role = (public_metadata?.role as string) || safeUnsafeRole;

      // Check if phone matches any invited staff member
      if (phone) {
        const cleanPhone = phone.replace("+91", "").trim();
        const { data: staffMatch } = (await supabaseAdmin
          .from("staff_members" as any)
          .select("id, role")
          .or(`phone.eq.${phone},phone.eq.${cleanPhone}`)
          .maybeSingle()) as any;

        if (staffMatch) {
          role = staffMatch.role;
          // Update staff record with clerk user ID
          await (supabaseAdmin
            .from("staff_members" as any) as any)
            .update({ clerk_user_id })
            .eq("id", staffMatch.id);
        }
      }

      // Verification status mapping:
      // Patients and staff are approved immediately. Partners are pending.
      const verification_status =
        role === "patient" || role.endsWith("_staff") ? "approved" : "pending";

      const { data: newProfile, error } = (await supabaseAdmin
        .from("profiles" as any)
        .insert({
          clerk_user_id,
          phone,
          email,
          full_name,
          role,
          verification_status,
          is_active: true,
        } as any)
        .select()
        .single()) as any;

      if (error) {
        console.error("[Clerk Webhook] Error creating profile:", error.message);
        return new Response(`Error writing to database: ${error.message}`, { status: 500 });
      }

      // Log action to audit logs
      await (supabaseAdmin.from("audit_logs" as any) as any).insert({
        user_id: newProfile.id,
        action: "SIGNUP",
        entity_type: "PROFILE",
        entity_id: newProfile.id,
      } as any);

      console.log(`[Clerk Webhook] Profile created successfully for: ${clerk_user_id}`);
    } else if (eventType === "user.updated") {
      const { email_addresses, phone_numbers, first_name, last_name } = evt.data;

      const email = email_addresses?.[0]?.email_address || null;
      const phone = phone_numbers?.[0]?.phone_number || null;
      const full_name = [first_name, last_name].filter(Boolean).join(" ") || null;

      const { data: updatedProfile, error } = (await supabaseAdmin
        .from("profiles" as any)
        .update({
          phone,
          email,
          full_name,
        } as any)
        .eq("clerk_user_id", clerk_user_id)
        .select()
        .maybeSingle()) as any;

      if (error) {
        console.error("[Clerk Webhook] Error updating profile:", error.message);
        return new Response(`Error updating database: ${error.message}`, { status: 500 });
      }

      if (updatedProfile) {
        await (supabaseAdmin.from("audit_logs" as any) as any).insert({
          user_id: updatedProfile.id,
          action: "PROFILE_UPDATE",
          entity_type: "PROFILE",
          entity_id: updatedProfile.id,
        } as any);
      }

      console.log(`[Clerk Webhook] Profile updated successfully for: ${clerk_user_id}`);
    } else if (eventType === "user.deleted") {
      // Soft delete user profile
      const { data: deletedProfile, error } = (await supabaseAdmin
        .from("profiles" as any)
        .update({
          is_active: false,
        } as any)
        .eq("clerk_user_id", clerk_user_id)
        .select()
        .maybeSingle()) as any;

      if (error) {
        console.error("[Clerk Webhook] Error soft-deleting profile:", error.message);
        return new Response(`Error deleting from database: ${error.message}`, { status: 500 });
      }

      if (deletedProfile) {
        await (supabaseAdmin.from("audit_logs" as any) as any).insert({
          user_id: deletedProfile.id,
          action: "SOFT_DELETE",
          entity_type: "PROFILE",
          entity_id: deletedProfile.id,
        } as any);
      }

      console.log(`[Clerk Webhook] Profile soft-deleted successfully for: ${clerk_user_id}`);
    }
  } catch (err) {
    console.error("[Clerk Webhook] Uncaught handler error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }

  return new Response("Webhook handled successfully", { status: 200 });
}
