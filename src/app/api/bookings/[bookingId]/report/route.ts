import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { NextResponse } from "next/server";
import { getProfileFromServerRequest } from "@/lib/auth-server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params;

    // 1. Authenticate user and get profile
    const profile = await getProfileFromServerRequest();
    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 3. Fetch booking with lab details to perform access control
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("bookings" as any)
      .select("*, labs(id, owner_id)")
      .eq("id", bookingId)
      .single() as any;

    if (bookingError || !booking) {
      return new NextResponse("Booking not found", { status: 404 });
    }

    if (!booking.report_url) {
      return new NextResponse("Report not available for download", { status: 404 });
    }

    // 4. Enforce Access Control:
    // A user can download this report ONLY if:
    // a. The user is an admin or super_admin
    // b. The user is the patient who owns the booking (booking.patient_id === profile.id)
    // c. The user is the lab owner who owns the lab assigned to the booking (booking.labs.owner_id === activeUserId)
    // d. The user is a lab staff member whose parent partner ID owns the lab assigned to the booking
    let hasAccess = false;
    const activeUserId = profile.clerk_user_id || profile.id;

    if (["admin", "super_admin"].includes(profile.role)) {
      hasAccess = true;
    } else if (booking.patient_id === profile.id) {
      hasAccess = true;
    } else if (booking.labs && (booking.labs.owner_id === profile.id || booking.labs.owner_id === profile.clerk_user_id)) {
      hasAccess = true;
    } else if (profile.role === "lab_staff") {
      // Check if this staff member's parent organization owns the lab
      const { data: staffMember } = await supabaseAdmin
        .from("staff_members" as any)
        .select("parent_partner_id")
        .eq("clerk_user_id", activeUserId)
        .eq("is_active", true)
        .maybeSingle() as any;

      if (staffMember) {
        const { data: parentProfile } = await supabaseAdmin
          .from("profiles" as any)
          .select("id, clerk_user_id")
          .eq("id", staffMember.parent_partner_id)
          .single() as any;

        if (parentProfile && booking.labs && (booking.labs.owner_id === parentProfile.id || booking.labs.owner_id === parentProfile.clerk_user_id)) {
          hasAccess = true;
        }
      }
    }

    if (!hasAccess) {
      return new NextResponse("Forbidden: You do not have permission to access this medical record.", { status: 403 });
    }

    // 5. Log the medical record access and report download to audit_logs
    await supabaseAdmin.from("audit_logs" as any).insert({
      user_id: profile.id,
      action: "REPORT_DOWNLOAD",
      entity_type: "BOOKING",
      entity_id: bookingId,
    } as any);

    await supabaseAdmin.from("audit_logs" as any).insert({
      user_id: profile.id,
      action: "MEDICAL_RECORD_ACCESS",
      entity_type: "BOOKING",
      entity_id: bookingId,
    } as any);

    // 6. Redirect to the actual report URL
    return NextResponse.redirect(booking.report_url);
  } catch (err: any) {
    console.error("[Report API] Error:", err);
    return new NextResponse(err.message || "Internal Server Error", { status: 500 });
  }
}
