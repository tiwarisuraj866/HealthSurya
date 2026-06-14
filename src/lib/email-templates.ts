// HealthSurya V2 — Branded transactional email templates.
// All templates share one responsive shell. Render with renderEmail(event, vars).

export type EmailEvent =
  | "welcome"
  | "account_created"
  | "verification_submitted"
  | "verification_approved"
  | "verification_rejected"
  | "appointment_confirmation"
  | "lab_booking_confirmation"
  | "ticket_created"
  | "ticket_resolved";

export interface EmailVars {
  name?: string;
  email?: string;
  role?: string;
  percentage?: number;
  reason?: string;
  doctorName?: string;
  labName?: string;
  dateTime?: string;
  bookingId?: string;
  ticketNo?: string | number;
  subject?: string;
  link?: string;
}

const BRAND = {
  name: "HealthSurya",
  primary: "#0e9f8a",
  dark: "#0b3b36",
  light: "#f0fdfa",
  site: process.env.NEXT_PUBLIC_SITE_URL || "https://healthsurya.com",
  support: "support@healthsurya.com",
};

function shell(title: string, bodyHtml: string, cta?: { label: string; href: string }) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"/>
<title>${title}</title></head>
<body style="margin:0;background:#f4f6f8;font-family:'Segoe UI',Arial,sans-serif;color:#1f2937;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:24px 0;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,.06);">
  <tr><td style="background:linear-gradient(135deg,${BRAND.primary},${BRAND.dark});padding:28px 32px;">
    <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:.3px;">☀ ${BRAND.name}</span>
    <div style="color:#ccfbf1;font-size:12px;margin-top:4px;">Your Trusted Health Partner</div>
  </td></tr>
  <tr><td style="padding:32px;">
    <h1 style="margin:0 0 16px;font-size:20px;color:${BRAND.dark};">${title}</h1>
    <div style="font-size:14px;line-height:1.7;color:#374151;">${bodyHtml}</div>
    ${cta ? `<div style="margin-top:28px;"><a href="${cta.href}" style="background:${BRAND.primary};color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:10px;font-size:14px;font-weight:600;display:inline-block;">${cta.label}</a></div>` : ""}
  </td></tr>
  <tr><td style="padding:20px 32px;background:${BRAND.light};font-size:12px;color:#6b7280;">
    Need help? Reply to this email or write to <a href="mailto:${BRAND.support}" style="color:${BRAND.primary};">${BRAND.support}</a>.<br/>
    © ${new Date().getFullYear()} ${BRAND.name}. All rights reserved.
  </td></tr>
</table>
</td></tr></table></body></html>`;
}

export function renderEmail(event: EmailEvent, v: EmailVars): { subject: string; html: string } {
  const name = v.name || "there";
  switch (event) {
    case "welcome":
      return {
        subject: `Welcome to ${BRAND.name}, ${name}! 🎉`,
        html: shell(`Welcome aboard, ${name}!`,
          `Thank you for joining ${BRAND.name} — India's trusted platform for doctors, lab tests and medicines.<br/><br/>
           Here's how to get started:<br/>
           • Complete your profile to unlock all features<br/>
           • Reach <b>80% KYC completion</b> to become visible on the platform<br/>
           • Our AI assistant can guide you at every step`,
          { label: "Complete My Profile", href: `${BRAND.site}/kyc` }),
      };
    case "account_created":
      return {
        subject: `Your ${BRAND.name} account is ready`,
        html: shell("Account created successfully",
          `Hi ${name}, your ${v.role || "user"} account (<b>${v.email || ""}</b>) has been created.<br/><br/>
           You can sign in anytime using <b>Email OTP</b> or a <b>Magic Link</b> — no password needed.`,
          { label: "Go to Dashboard", href: `${BRAND.site}/dashboard` }),
      };
    case "verification_submitted":
      return {
        subject: `Verification submitted — we're reviewing your profile`,
        html: shell("Verification request received",
          `Hi ${name}, your profile (<b>${v.percentage ?? 80}% complete</b>) has been submitted for verification.<br/><br/>
           Our team typically reviews submissions within <b>24–48 hours</b>. Profiles at 100% completion get <b>priority review</b>.`,
          { label: "Track Verification", href: `${BRAND.site}/kyc` }),
      };
    case "verification_approved":
      return {
        subject: `✅ You're verified on ${BRAND.name}!`,
        html: shell("Verification approved",
          `Congratulations ${name}! Your profile has been <b style="color:#059669;">approved</b> and is now visible on ${BRAND.name}.<br/><br/>
           A verified badge now appears on your profile, increasing patient trust.`,
          { label: "View My Profile", href: `${BRAND.site}/dashboard` }),
      };
    case "verification_rejected":
      return {
        subject: `Action needed on your ${BRAND.name} verification`,
        html: shell("Verification needs attention",
          `Hi ${name}, we couldn't approve your verification yet.<br/><br/>
           <b>Reason:</b> ${v.reason || "Some documents need to be re-uploaded with better clarity."}<br/><br/>
           Don't worry — fix the items above and resubmit. Your other details are saved.`,
          { label: "Fix & Resubmit", href: `${BRAND.site}/kyc` }),
      };
    case "appointment_confirmation":
      return {
        subject: `Appointment confirmed with ${v.doctorName || "your doctor"}`,
        html: shell("Appointment confirmed",
          `Hi ${name}, your appointment is confirmed.<br/><br/>
           <b>Doctor:</b> ${v.doctorName || "-"}<br/>
           <b>When:</b> ${v.dateTime || "-"}<br/>
           <b>Booking ID:</b> ${v.bookingId || "-"}`,
          { label: "View Booking", href: v.link || `${BRAND.site}/bookings` }),
      };
    case "lab_booking_confirmation":
      return {
        subject: `Lab booking confirmed — ${v.labName || "your lab"}`,
        html: shell("Lab test booked",
          `Hi ${name}, your lab booking is confirmed.<br/><br/>
           <b>Lab:</b> ${v.labName || "-"}<br/>
           <b>When:</b> ${v.dateTime || "-"}<br/>
           <b>Booking ID:</b> ${v.bookingId || "-"}<br/><br/>
           Tip: carry your previous reports for better diagnosis.`,
          { label: "View Booking", href: v.link || `${BRAND.site}/bookings` }),
      };
    case "ticket_created":
      return {
        subject: `Ticket #${v.ticketNo} created — ${v.subject || "Support request"}`,
        html: shell(`Ticket #${v.ticketNo} received`,
          `Hi ${name}, we've received your support request:<br/><br/>
           <b>Subject:</b> ${v.subject || "-"}<br/>
           <b>Status:</b> Open<br/><br/>
           Our team will respond shortly. You can chat with us inside the ticket anytime.`,
          { label: "View Ticket", href: `${BRAND.site}/support` }),
      };
    case "ticket_resolved":
      return {
        subject: `Ticket #${v.ticketNo} resolved ✔`,
        html: shell(`Ticket #${v.ticketNo} resolved`,
          `Hi ${name}, your ticket "<b>${v.subject || ""}</b>" has been marked <b style="color:#059669;">resolved</b>.<br/><br/>
           If the issue persists, simply reply inside the ticket to reopen it.`,
          { label: "View Ticket", href: `${BRAND.site}/support` }),
      };
  }
}
