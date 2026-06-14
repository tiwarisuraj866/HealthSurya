/**
 * OTP helpers — email OTP via Supabase Auth (signInWithOtp)
 * and phone OTP via Supabase Auth (signInWithOtp + phone).
 *
 * Rate-limits are enforced server-side by Supabase.
 * Client-side we track cooldown so the button stays disabled.
 */

export type OtpChannel = "email" | "phone";

export interface OtpState {
  sent: boolean;
  loading: boolean;
  cooldownSec: number; // remaining seconds before resend allowed
  error: string | null;
}

export const OTP_RESEND_COOLDOWN_SEC = 60;
export const OTP_CODE_LENGTH = 6;

/** Validate Indian mobile number (10 digits, starts with 6-9) */
export function validateIndianPhone(phone: string): string | null {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length !== 10) return "Phone number must be 10 digits";
  if (!/^[6-9]/.test(cleaned)) return "Phone number must start with 6, 7, 8, or 9";
  return null;
}

/** Format raw 10-digit phone to E.164 for Supabase (+91) */
export function toE164India(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  return `+91${cleaned}`;
}

/** Strip +91 for display */
export function fromE164India(e164: string): string {
  return e164.replace(/^\+91/, "");
}

/** Validate OTP token input */
export function validateOtpToken(token: string): string | null {
  const cleaned = token.replace(/\s/g, "");
  if (cleaned.length !== OTP_CODE_LENGTH) return `Enter the ${OTP_CODE_LENGTH}-digit code`;
  if (!/^\d+$/.test(cleaned)) return "Code must contain only digits";
  return null;
}

/** Mask email for display: ab***@gmail.com */
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}***@${domain}`;
}

/** Mask phone for display: +91 98765 ***10 */
export function maskPhone(e164: string): string {
  const digits = e164.replace(/\D/g, "");
  if (digits.length < 4) return e164;
  const last2 = digits.slice(-2);
  const first4 = digits.slice(0, 4);
  return `+${first4} *** **${last2}`;
}
