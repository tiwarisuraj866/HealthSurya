import type { LucideIcon } from "lucide-react";
import { Beaker, Stethoscope, Truck, UserRound, Pill, Building2 } from "lucide-react";

export type AuthRoleId = "patient" | "doctor" | "lab" | "courier" | "pharmacy" | "franchise";

export type AuthRoleConfig = {
  id: AuthRoleId;
  label: string;
  tagline: string;
  description: string;
  perks: string[];
  icon: LucideIcon;
  accent: string;
  registerCta: string;
  afterSignup: string;
};

export const AUTH_ROLES: AuthRoleConfig[] = [
  {
    id: "patient",
    label: "Patient",
    tagline: "Book care in minutes",
    description: "Search labs & doctors, book tests, track reports, and order medicine.",
    perks: ["Lab test booking", "Doctor appointments", "Medicine cart"],
    icon: UserRound,
    accent: "from-sky-500 to-cyan-600",
    registerCta: "Create patient account",
    afterSignup: "Go to dashboard or continue your booking",
  },
  {
    id: "doctor",
    label: "Doctor",
    tagline: "Your free mini website",
    description: "Public profile with appointments, WhatsApp, gallery, and patient analytics.",
    perks: ["Auto-generated profile page", "Appointment requests", "WhatsApp & map"],
    icon: Stethoscope,
    accent: "from-violet-500 to-indigo-600",
    registerCta: "Register as doctor",
    afterSignup: "Complete doctor setup to publish your page",
  },
  {
    id: "lab",
    label: "Lab partner",
    tagline: "Reach patients locally",
    description: "List your pathology centre, manage tests, prices, bookings, and digital reports.",
    perks: ["Test catalog & pricing", "Home collection", "Verified lab badge"],
    icon: Beaker,
    accent: "from-teal-500 to-emerald-600",
    registerCta: "Register your lab",
    afterSignup: "Complete lab setup to go live on HealthSurya",
  },
  {
    id: "pharmacy",
    label: "Pharmacy partner",
    tagline: "Receive medicine orders",
    description: "List your local pharmacy, accept prescriptions, and manage medicine deliveries.",
    perks: ["Medicine order management", "Prescription review", "Active status toggle"],
    icon: Pill,
    accent: "from-pink-500 to-rose-600",
    registerCta: "Register pharmacy",
    afterSignup: "Complete pharmacy setup to start receiving orders",
  },
  {
    id: "franchise",
    label: "Franchise partner",
    tagline: "Grow your network",
    description: "Oversee operations, manage doctor/lab onboarding, and earn commission in your region.",
    perks: ["Regional partner management", "Earnings overview", "Onboarding links"],
    icon: Building2,
    accent: "from-blue-500 to-indigo-600",
    registerCta: "Apply for franchise",
    afterSignup: "Complete franchise setup to activate your region",
  },
  {
    id: "courier",
    label: "Courier",
    tagline: "Delivery partner",
    description: "Join sample pickup and medicine delivery runs in your city.",
    perks: ["Pickup assignments", "Route updates", "Partner dashboard"],
    icon: Truck,
    accent: "from-amber-500 to-orange-600",
    registerCta: "Join as courier",
    afterSignup: "Sign in to access courier tools when enabled",
  },
];

export function parseAuthRole(value: string | undefined): AuthRoleId {
  const found = AUTH_ROLES.find((r) => r.id === value);
  return found?.id ?? "patient";
}

export function getAuthRole(id: AuthRoleId): AuthRoleConfig {
  return AUTH_ROLES.find((r) => r.id === id) ?? AUTH_ROLES[0];
}
