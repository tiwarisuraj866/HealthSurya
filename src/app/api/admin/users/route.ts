import { clerkClient } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { NextResponse } from "next/server";
import { getProfileFromServerRequest } from "@/lib/auth-server";

export async function POST(req: Request) {
  try {
    // 1. Authenticate the admin calling the API
    const adminProfile = await getProfileFromServerRequest();
    if (!adminProfile || !["admin", "super_admin"].includes(adminProfile.role)) {
      return new NextResponse("Forbidden - Admin permissions required", { status: 403 });
    }

    const { action, targetUserId, targetClerkId, newRole } = await req.json();

    if (!action || !targetUserId || !targetClerkId) {
      return new NextResponse("Bad Request - Missing parameters", { status: 400 });
    }

    let client;
    try {
      client = await clerkClient();
    } catch (err) {
      console.warn("[Admin API] Failed to initialize Clerk client:", err);
    }

    if (action === "approve") {
      // Update PostgreSQL
      await supabaseAdmin
        .from("profiles" as any)
        .update({ verification_status: "approved", is_active: true } as any)
        .eq("id", targetUserId);

      // Update Clerk publicMetadata
      if (client) {
        try {
          await client.users.updateUser(targetClerkId, {
            publicMetadata: {
              role: newRole || "patient",
              verification_status: "approved",
              is_active: true,
            },
          });
        } catch (clerkErr) {
          console.warn("[Admin API] Clerk update failed for approve:", clerkErr);
        }
      }

      // Write Audit Log
      await (supabaseAdmin.from("audit_logs" as any) as any).insert({
        user_id: adminProfile.id,
        action: "APPROVE_PARTNER",
        entity_type: "PROFILE",
        entity_id: targetUserId,
      } as any);

      console.log(`[Admin API] Approved partner: ${targetClerkId}`);
    } else if (action === "reject") {
      await supabaseAdmin
        .from("profiles" as any)
        .update({ verification_status: "rejected" } as any)
        .eq("id", targetUserId);

      if (client) {
        try {
          await client.users.updateUser(targetClerkId, {
            publicMetadata: {
              verification_status: "rejected",
            },
          });
        } catch (clerkErr) {
          console.warn("[Admin API] Clerk update failed for reject:", clerkErr);
        }
      }

      await (supabaseAdmin.from("audit_logs" as any) as any).insert({
        user_id: adminProfile.id,
        action: "REJECT_PARTNER",
        entity_type: "PROFILE",
        entity_id: targetUserId,
      } as any);

      console.log(`[Admin API] Rejected partner: ${targetClerkId}`);
    } else if (action === "suspend") {
      await supabaseAdmin
        .from("profiles" as any)
        .update({ is_active: false, verification_status: "suspended" } as any)
        .eq("id", targetUserId);

      if (client) {
        try {
          await client.users.updateUser(targetClerkId, {
            publicMetadata: {
              is_active: false,
              verification_status: "suspended",
            },
          });
        } catch (clerkErr) {
          console.warn("[Admin API] Clerk update failed for suspend:", clerkErr);
        }
      }

      await (supabaseAdmin.from("audit_logs" as any) as any).insert({
        user_id: adminProfile.id,
        action: "SUSPEND_USER",
        entity_type: "PROFILE",
        entity_id: targetUserId,
      } as any);

      console.log(`[Admin API] Suspended user: ${targetClerkId}`);
    } else if (action === "activate") {
      await supabaseAdmin
        .from("profiles" as any)
        .update({ is_active: true, verification_status: "approved" } as any)
        .eq("id", targetUserId);

      if (client) {
        try {
          await client.users.updateUser(targetClerkId, {
            publicMetadata: {
              is_active: true,
              verification_status: "approved",
            },
          });
        } catch (clerkErr) {
          console.warn("[Admin API] Clerk update failed for activate:", clerkErr);
        }
      }

      await (supabaseAdmin.from("audit_logs" as any) as any).insert({
        user_id: adminProfile.id,
        action: "ACTIVATE_USER",
        entity_type: "PROFILE",
        entity_id: targetUserId,
      } as any);

      console.log(`[Admin API] Activated user: ${targetClerkId}`);
    } else if (action === "change_role") {
      if (!newRole) {
        return new NextResponse("Bad Request - Missing newRole", { status: 400 });
      }

      await supabaseAdmin
        .from("profiles" as any)
        .update({ role: newRole } as any)
        .eq("id", targetUserId);

      if (client) {
        try {
          await client.users.updateUser(targetClerkId, {
            publicMetadata: {
              role: newRole,
            },
          });
        } catch (clerkErr) {
          console.warn("[Admin API] Clerk update failed for change_role:", clerkErr);
        }
      }

      await (supabaseAdmin.from("audit_logs" as any) as any).insert({
        user_id: adminProfile.id,
        action: `ROLE_CHANGE_TO_${newRole.toUpperCase()}`,
        entity_type: "PROFILE",
        entity_id: targetUserId,
      } as any);

      console.log(`[Admin API] Changed role of: ${targetClerkId} to ${newRole}`);
    } else {
      return new NextResponse("Bad Request - Unknown action", { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[Admin API] Error in user action route:", err);
    return new NextResponse(err.message || "Internal Server Error", { status: 500 });
  }
}
