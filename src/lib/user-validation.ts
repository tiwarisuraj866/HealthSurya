/**
 * Advanced user-validation helpers.
 * Used across register, profile-update, and doctor/lab setup forms.
 */
import { z } from "zod";

// ─── Primitives ──────────────────────────────────────────────────────────────

export const fullNameSchema = z
  .string()
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name too long (max 100 characters)")
  .regex(/^[a-zA-Z\s'.,-]+$/, "Name can only contain letters, spaces, and '. , -")
  .transform((v) => v.trim());

export const emailSchema = z
  .string()
  .email("Enter a valid email address")
  .max(255, "Email too long")
  .toLowerCase()
  .transform((v) => v.trim());

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password too long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const indianPhoneSchema = z
  .string()
  .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number");

export const pincodeSchema = z
  .string()
  .regex(/^\d{6}$/, "Pincode must be exactly 6 digits");

export const otpTokenSchema = z
  .string()
  .regex(/^\d{6}$/, "OTP must be 6 digits");

// ─── Composite schemas ────────────────────────────────────────────────────────

export const registerSchema = z
  .object({
    full_name: fullNameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirm_password: z.string(),
    phone: indianPhoneSchema.optional().or(z.literal("")),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const profileUpdateSchema = z.object({
  full_name: fullNameSchema,
  phone: indianPhoneSchema.optional().or(z.literal("")),
  city: z.string().max(60, "City name too long").optional(),
  pincode: pincodeSchema.optional().or(z.literal("")),
});

// ─── Password strength ────────────────────────────────────────────────────────

export type PasswordStrength = "weak" | "fair" | "good" | "strong";

export function getPasswordStrength(password: string): {
  strength: PasswordStrength;
  score: number; // 0-4
  label: string;
  color: string;
} {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  score = Math.min(score, 4);

  const map: Record<number, { strength: PasswordStrength; label: string; color: string }> = {
    0: { strength: "weak", label: "Too weak", color: "bg-destructive" },
    1: { strength: "weak", label: "Weak", color: "bg-destructive" },
    2: { strength: "fair", label: "Fair", color: "bg-warning" },
    3: { strength: "good", label: "Good", color: "bg-success" },
    4: { strength: "strong", label: "Strong", color: "bg-success" },
  };

  return { score, ...map[score] };
}

// ─── Field-level helpers ──────────────────────────────────────────────────────

/** Run a Zod schema on a single field and return first error message or null */
export function validateField<T>(schema: z.ZodType<T>, value: unknown): string | null {
  const result = schema.safeParse(value);
  if (result.success) return null;
  return result.error.issues[0]?.message ?? "Invalid value";
}

/** Debounce-friendly: returns error string or null */
export function validateEmail(email: string): string | null {
  return validateField(emailSchema, email);
}

export function validatePhone(phone: string): string | null {
  if (!phone) return null; // optional field
  return validateField(indianPhoneSchema, phone);
}

export function validatePassword(password: string): string | null {
  return validateField(passwordSchema, password);
}

export function validateFullName(name: string): string | null {
  return validateField(fullNameSchema, name);
}

export function validateIdentifier(identifier: string): string | null {
  if (!identifier || identifier.trim().length === 0) {
    return "Email or User ID is required";
  }
  return null;
}

