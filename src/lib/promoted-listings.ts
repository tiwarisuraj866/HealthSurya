import { supabase } from "@/integrations/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase-config";
import type { DoctorProfile } from "@/lib/doctor";
import type { LabCardData } from "@/components/LabCard";
import {
  getPreviewDoctorsList,
  getPreviewLabsList,
  previewListingsEnabled,
} from "@/lib/demo-listings";
import { locationMatchScore, premiumTierRank } from "@/lib/location";

export type DoctorListing = DoctorProfile & {
  premium_tier?: string | null;
  promoted_priority?: number | null;
};

export type LabListing = LabCardData & {
  premium_tier?: string | null;
  promoted_priority?: number | null;
};

const FETCH_TIMEOUT_MS = 3500;

const DOCTOR_LISTING_COLUMNS =
  "id, slug, full_name, photo_url, specialization, clinic_city, clinic_pincode, qualification, experience_years, consultation_fee, verified, published, rating, total_reviews, premium_tier, promoted_priority";

const LAB_LISTING_COLUMNS =
  "id, name, city, pincode, address, image_url, rating, total_reviews, verified, home_collection, premium_tier, promoted_priority";

function sortByLocalPremium<T extends { premium_tier?: string | null; promoted_priority?: number | null }>(
  items: T[],
  city: string,
  getCity: (item: T) => string,
  getRating: (item: T) => number,
): T[] {
  return [...items].sort((a, b) => {
    // 1. Sort by location match score first (exact match to current city takes highest priority)
    const locDiff = locationMatchScore(getCity(a), city) - locationMatchScore(getCity(b), city);
    if (locDiff !== 0) return locDiff;

    // 2. Sort by premium tier (gold/featured first, then silver, then normal)
    const tierDiff = premiumTierRank(b.premium_tier) - premiumTierRank(a.premium_tier);
    if (tierDiff !== 0) return tierDiff;

    // 3. Sort by priority
    const priDiff = (b.promoted_priority ?? 0) - (a.promoted_priority ?? 0);
    if (priDiff !== 0) return priDiff;

    // 4. Sort by rating
    return getRating(b) - getRating(a);
  });
}

function mergeWithPreview<T extends { id: string }>(dbRows: T[], previewRows: T[], limit: number): T[] {
  const seen = new Set(dbRows.map((r) => r.id));
  const merged = [...dbRows];
  for (const row of previewRows) {
    if (merged.length >= limit) break;
    if (!seen.has(row.id)) {
      merged.push(row);
      seen.add(row.id);
    }
  }
  return merged;
}

function finalizeDoctors(db: DoctorListing[], city: string, limit: number): DoctorListing[] {
  const withPreview = mergeWithPreview(db, getPreviewDoctorsList(city), limit);
  return sortByLocalPremium(withPreview, city, (d) => d.clinic_city, (d) => Number(d.rating)).slice(0, limit);
}

function finalizeLabs(db: LabListing[], city: string, limit: number): LabListing[] {
  const withPreview = mergeWithPreview(db, getPreviewLabsList(city), limit);
  return sortByLocalPremium(withPreview, city, (l) => l.city, (l) => Number(l.rating)).slice(0, limit);
}

/** Synchronous sample data — shows immediately while Supabase loads */
export function getInstantPromotedDoctors(city: string, limit = 8): DoctorListing[] {
  if (!previewListingsEnabled()) return [];
  return finalizeDoctors([], city, limit);
}

export function getInstantPromotedLabs(city: string, limit = 8): LabListing[] {
  if (!previewListingsEnabled()) return [];
  return finalizeLabs([], city, limit);
}

async function withTimeout<T>(fn: () => Promise<T>, fallback: T, ms = FETCH_TIMEOUT_MS): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

export async function fetchPromotedDoctors(city: string, limit = 12): Promise<DoctorListing[]> {
  const instant = getInstantPromotedDoctors(city, limit);
  if (!isSupabaseConfigured()) return instant.length ? instant : finalizeDoctors([], city, limit);

  let query = supabase
    .from("doctors")
    .select(DOCTOR_LISTING_COLUMNS)
    .eq("published", true);

  const cityTrim = city.trim();
  if (cityTrim) {
    query = query.ilike("clinic_city", `%${cityTrim}%`);
  }

  const finalQuery = query
    .order("rating", { ascending: false })
    .limit(limit);

  const dbRows = await withTimeout(async () => {
    const { data, error } = await finalQuery;
    if (error || !data?.length) return [] as DoctorListing[];
    return data as DoctorListing[];
  }, [] as DoctorListing[]);

  if (!dbRows.length) return instant.length ? instant : finalizeDoctors([], city, limit);
  return finalizeDoctors(dbRows, city, limit);
}

export async function fetchPromotedLabs(city: string, limit = 12): Promise<LabListing[]> {
  const instant = getInstantPromotedLabs(city, limit);
  if (!isSupabaseConfigured()) return instant.length ? instant : finalizeLabs([], city, limit);

  let query = supabase
    .from("labs")
    .select(LAB_LISTING_COLUMNS);

  const cityTrim = city.trim();
  if (cityTrim) {
    query = query.or(`city.ilike.%${cityTrim}%,pincode.ilike.%${cityTrim}%`);
  }

  const finalQuery = query
    .order("rating", { ascending: false })
    .limit(limit);

  const dbRows = await withTimeout(async () => {
    const { data: labsData, error } = await finalQuery;
    if (error || !labsData?.length) return [] as LabListing[];
    return (labsData as LabListing[]).map((l) => ({
      ...l,
      minPrice: l.minPrice ?? null,
    }));
  }, [] as LabListing[]);

  if (!dbRows.length) return instant.length ? instant : finalizeLabs([], city, limit);
  return finalizeLabs(dbRows, city, limit);
}

export const HOME_SERVICES = [
  {
    title: "Book Lab Tests",
    desc: "CBC, Thyroid, Vitamin D & full body checkups at verified pathology centers.",
    icon: "beaker" as const,
    to: "/labs",
  },
  {
    title: "Find Doctors",
    desc: "Top specialists near you with mini websites, appointments & WhatsApp.",
    icon: "stethoscope" as const,
    to: "/doctors",
  },
  {
    title: "Medicine Delivery",
    desc: "Order medicines online with live tracking — like food delivery.",
    icon: "pill" as const,
    to: "/medicine",
  },
  {
    title: "Home Sample Collection",
    desc: "Certified phlebotomists pick up samples from your doorstep.",
    icon: "truck" as const,
    to: "/labs",
  },
  {
    title: "Digital Health Records",
    desc: "Store prescriptions and reports securely in one place.",
    icon: "file" as const,
    to: "/register",
  },
  {
    title: "Partner Verification",
    desc: "Doctors, labs & pharmacies verified for your safety.",
    icon: "shield" as const,
    to: "/verify",
  },
];
