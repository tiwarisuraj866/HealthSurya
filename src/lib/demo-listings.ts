/**
 * Preview doctors & labs for Jaunpur and Thane (homepage rail + local testing).
 * Merged when DB has few rows; also used as fallback on public doctor pages for demo slugs.
 */
import type { DoctorProfile } from "@/lib/doctor";
import type { LabCardData } from "@/components/LabCard";
import { locationMatchScore } from "@/lib/location";

export type PreviewDoctor = DoctorProfile & {
  premium_tier?: string | null;
  promoted_priority?: number | null;
};

export type PreviewLab = LabCardData & {
  premium_tier?: string | null;
  promoted_priority?: number | null;
};

export const PREVIEW_OWNER_ID = "c0ffee00-0000-4000-8000-000000000001";

const now = "2026-05-31T00:00:00.000Z";

function doctorBase(
  partial: Pick<PreviewDoctor, "id" | "slug" | "full_name" | "clinic_city" | "specialization" | "premium_tier" | "promoted_priority" | "rating"> &
    Partial<PreviewDoctor>,
): PreviewDoctor {
  return {
    owner_id: PREVIEW_OWNER_ID,
    photo_url: null,
    qualification: "MBBS, MD",
    experience_years: 10,
    gender: null,
    about: "Preview listing for HealthSurya demo.",
    consultation_fee: 500,
    clinic_name: `${partial.full_name} Clinic`,
    clinic_address: "Main Road",
    clinic_pincode: "000000",
    clinic_phone: "9000000000",
    whatsapp: "9000000000",
    map_embed_url: null,
    map_lat: null,
    map_lng: null,
    services: ["Consultation", "Follow-up"],
    open_time: "09:00",
    close_time: "20:00",
    timings_note: "Mon–Sat",
    verified: true,
    published: true,
    profile_views: 120,
    whatsapp_clicks: 45,
    total_reviews: 28,
    created_at: now,
    updated_at: now,
    ...partial,
  };
}

function labBase(
  partial: Pick<PreviewLab, "id" | "name" | "city" | "pincode" | "address" | "rating" | "premium_tier" | "promoted_priority"> &
    Partial<PreviewLab>,
): PreviewLab {
  return {
    image_url: partial.image_url ?? null,
    total_reviews: partial.total_reviews ?? 42,
    verified: true,
    home_collection: true,
    minPrice: partial.minPrice ?? 299,
    ...partial,
  };
}

/** 4 promoted doctors per city */
export const PREVIEW_DOCTORS: PreviewDoctor[] = [
  doctorBase({
    id: "a1000001-0001-4000-8000-000000000001",
    slug: "dr-rajesh-sharma-jaunpur",
    full_name: "Dr. Rajesh Sharma",
    specialization: "Cardiologist",
    clinic_city: "Jaunpur",
    clinic_address: "Civil Lines, near District Hospital",
    clinic_pincode: "222002",
    premium_tier: "gold",
    promoted_priority: 100,
    rating: 4.9,
    experience_years: 18,
    photo_url: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop",
  }),
  doctorBase({
    id: "a1000002-0001-4000-8000-000000000002",
    slug: "dr-priya-mishra-jaunpur",
    full_name: "Dr. Priya Mishra",
    specialization: "Gynecologist",
    clinic_city: "Jaunpur",
    clinic_address: "Line Bazar, Shitala Chowk",
    clinic_pincode: "222001",
    premium_tier: "featured",
    promoted_priority: 90,
    rating: 4.8,
    experience_years: 12,
    photo_url: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&h=200&fit=crop",
  }),
  doctorBase({
    id: "a1000003-0001-4000-8000-000000000003",
    slug: "dr-amit-verma-jaunpur",
    full_name: "Dr. Amit Verma",
    specialization: "Orthopedic Surgeon",
    clinic_city: "Jaunpur",
    clinic_address: "Sadar Bazar",
    clinic_pincode: "222002",
    premium_tier: "silver",
    promoted_priority: 80,
    rating: 4.7,
    experience_years: 14,
    photo_url: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&h=200&fit=crop",
  }),
  doctorBase({
    id: "a1000004-0001-4000-8000-000000000004",
    slug: "dr-sneha-singh-jaunpur",
    full_name: "Dr. Sneha Singh",
    specialization: "Pediatrician",
    clinic_city: "Jaunpur",
    clinic_address: "Olandganj",
    clinic_pincode: "222001",
    premium_tier: "gold",
    promoted_priority: 85,
    rating: 4.9,
    experience_years: 9,
    photo_url: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=200&h=200&fit=crop",
  }),
  doctorBase({
    id: "a2000001-0001-4000-8000-000000000001",
    slug: "dr-karan-mehta-thane",
    full_name: "Dr. Karan Mehta",
    specialization: "Dermatologist",
    clinic_city: "Thane",
    clinic_address: "Ghodbunder Road, Hiranandani Estate",
    clinic_pincode: "400607",
    premium_tier: "gold",
    promoted_priority: 100,
    rating: 4.8,
    experience_years: 11,
    photo_url: "https://images.unsplash.com/photo-1537368910025-7002b00da64b?w=200&h=200&fit=crop",
  }),
  doctorBase({
    id: "a2000002-0001-4000-8000-000000000002",
    slug: "dr-ananya-patel-thane",
    full_name: "Dr. Ananya Patel",
    specialization: "ENT Specialist",
    clinic_city: "Thane",
    clinic_address: "Viviana Mall, Eastern Express Highway",
    clinic_pincode: "400601",
    premium_tier: "featured",
    promoted_priority: 95,
    rating: 4.9,
    experience_years: 13,
    photo_url: "https://images.unsplash.com/photo-1651008376811-b90baee41c1f?w=200&h=200&fit=crop",
  }),
  doctorBase({
    id: "a2000003-0001-4000-8000-000000000003",
    slug: "dr-rohit-desai-thane",
    full_name: "Dr. Rohit Desai",
    specialization: "General Physician",
    clinic_city: "Thane",
    clinic_address: "Kolshet Road, Manpada",
    clinic_pincode: "400607",
    premium_tier: "silver",
    promoted_priority: 75,
    rating: 4.6,
    experience_years: 16,
    photo_url: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=200&h=200&fit=crop",
  }),
  doctorBase({
    id: "a2000004-0001-4000-8000-000000000004",
    slug: "dr-meera-joshi-thane",
    full_name: "Dr. Meera Joshi",
    specialization: "Diabetologist",
    clinic_city: "Thane",
    clinic_address: "Pokhran Road No. 2",
    clinic_pincode: "400610",
    premium_tier: "gold",
    promoted_priority: 88,
    rating: 4.8,
    experience_years: 10,
    photo_url: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=200&h=200&fit=crop",
  }),
];

/** 4 promoted labs per city */
export const PREVIEW_LABS: PreviewLab[] = [
  labBase({
    id: "b1000001-0001-4000-8000-000000000001",
    name: "Surya Diagnostic Centre",
    city: "Jaunpur",
    pincode: "222002",
    address: "Civil Lines, Jaunpur",
    rating: 4.8,
    premium_tier: "gold",
    promoted_priority: 100,
    minPrice: 199,
    image_url: "https://images.unsplash.com/photo-1579154204601-01588f351a67?w=400&h=200&fit=crop",
  }),
  labBase({
    id: "b1000002-0001-4000-8000-000000000002",
    name: "Jaunpur Path Labs",
    city: "Jaunpur",
    pincode: "222001",
    address: "Line Bazar, Jaunpur",
    rating: 4.7,
    premium_tier: "featured",
    promoted_priority: 90,
    minPrice: 249,
    image_url: "https://images.unsplash.com/photo-1582719471137-c3967ffb1c42?w=400&h=200&fit=crop",
  }),
  labBase({
    id: "b1000003-0001-4000-8000-000000000003",
    name: "MediScan Healthcare",
    city: "Jaunpur",
    pincode: "222002",
    address: "Sadar Bazar, Jaunpur",
    rating: 4.6,
    premium_tier: "silver",
    promoted_priority: 80,
    minPrice: 299,
    image_url: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&h=200&fit=crop",
  }),
  labBase({
    id: "b1000004-0001-4000-8000-000000000004",
    name: "Ayushman Lab & Diagnostics",
    city: "Jaunpur",
    pincode: "222001",
    address: "Olandganj, Jaunpur",
    rating: 4.9,
    premium_tier: "gold",
    promoted_priority: 85,
    minPrice: 179,
    image_url: "https://images.unsplash.com/photo-1532187863486-abf9db3751a5?w=400&h=200&fit=crop",
  }),
  labBase({
    id: "b2000001-0001-4000-8000-000000000001",
    name: "Thane Precision Diagnostics",
    city: "Thane",
    pincode: "400601",
    address: "Eastern Express Highway, Thane West",
    rating: 4.9,
    premium_tier: "gold",
    promoted_priority: 100,
    minPrice: 299,
    image_url: "https://images.unsplash.com/photo-1579154204601-01588f351a67?w=400&h=200&fit=crop",
  }),
  labBase({
    id: "b2000002-0001-4000-8000-000000000002",
    name: "CityCare Pathology",
    city: "Thane",
    pincode: "400607",
    address: "Ghodbunder Road, Thane",
    rating: 4.7,
    premium_tier: "featured",
    promoted_priority: 92,
    minPrice: 349,
    image_url: "https://images.unsplash.com/photo-1582719471137-c3967ffb1c42?w=400&h=200&fit=crop",
  }),
  labBase({
    id: "b2000003-0001-4000-8000-000000000003",
    name: "Om Sai Lab Collection",
    city: "Thane",
    pincode: "400610",
    address: "Pokhran Road, Thane",
    rating: 4.8,
    premium_tier: "silver",
    promoted_priority: 78,
    minPrice: 259,
    image_url: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&h=200&fit=crop",
  }),
  labBase({
    id: "b2000004-0001-4000-8000-000000000004",
    name: "HealthFirst Thane",
    city: "Thane",
    pincode: "400601",
    address: "Hiranandani Estate, Thane",
    rating: 4.6,
    premium_tier: "gold",
    promoted_priority: 86,
    minPrice: 199,
    image_url: "https://images.unsplash.com/photo-1532187863486-abf9db3751a5?w=400&h=200&fit=crop",
  }),
];

const PREVIEW_CITY_KEYS = ["jaunpur", "thane"] as const;

export function previewListingsEnabled(): boolean {
  const envVal = typeof process !== "undefined" ? (process.env.NEXT_PUBLIC_PREVIEW_LISTINGS ?? process.env.VITE_PREVIEW_LISTINGS) : undefined;
  return envVal !== "false";
}

export function cityUsesPreviewListings(city: string): boolean {
  const c = city.trim().toLowerCase();
  if (!c) return true;
  return PREVIEW_CITY_KEYS.some((key) => c.includes(key) || key.includes(c));
}

export function getPreviewDoctorsForCity(city: string): PreviewDoctor[] {
  if (!previewListingsEnabled()) return [];
  const resolved = city.trim() || "Jaunpur";
  if (!cityUsesPreviewListings(resolved)) return [];
  return PREVIEW_DOCTORS.filter((d) => locationMatchScore(d.clinic_city, resolved) < 2);
}

export function getPreviewLabsForCity(city: string): PreviewLab[] {
  if (!previewListingsEnabled()) return [];
  const resolved = city.trim() || "Jaunpur";
  if (!cityUsesPreviewListings(resolved)) return [];
  return PREVIEW_LABS.filter((l) => locationMatchScore(l.city, resolved) < 2);
}

/** Demo list for browse pages — city filter or all preview entries */
export function getPreviewDoctorsList(city: string): PreviewDoctor[] {
  if (!previewListingsEnabled()) return [];
  const resolved = city.trim();
  if (!resolved) return PREVIEW_DOCTORS;
  const filtered = getPreviewDoctorsForCity(resolved);
  return filtered.length > 0 ? filtered : PREVIEW_DOCTORS;
}

export function getPreviewLabsList(city: string): PreviewLab[] {
  if (!previewListingsEnabled()) return [];
  const resolved = city.trim();
  if (!resolved) return PREVIEW_LABS;
  const filtered = getPreviewLabsForCity(resolved);
  return filtered.length > 0 ? filtered : PREVIEW_LABS;
}

export function mergePreviewDoctors(db: DoctorProfile[], city: string): DoctorProfile[] {
  const preview = getPreviewDoctorsList(city);
  if (!preview.length) return db;
  const seen = new Set(db.map((d) => d.id));
  return [...db, ...preview.filter((p) => !seen.has(p.id))];
}

export type PreviewLabRow = PreviewLab & { owner_id: string };

export function mergePreviewLabs<T extends LabCardData & { id: string; owner_id?: string }>(
  db: T[],
  city: string,
): T[] {
  const preview = getPreviewLabsList(city).map((l) => ({
    ...l,
    owner_id: PREVIEW_OWNER_ID,
  })) as T[];
  if (!preview.length) return db;
  const seen = new Set(db.map((l) => l.id));
  return [...db, ...preview.filter((p) => !seen.has(p.id))];
}

export function isShowingPreviewData(dbCount: number, mergedCount: number): boolean {
  return previewListingsEnabled() && mergedCount > dbCount;
}

export function getPreviewDoctorBySlug(slug: string): PreviewDoctor | null {
  const normalized = slug.trim().toLowerCase();
  return PREVIEW_DOCTORS.find((d) => d.slug.toLowerCase() === normalized) ?? null;
}

export function getPreviewLabById(labId: string): PreviewLab | null {
  return PREVIEW_LABS.find((l) => l.id === labId) ?? null;
}

export function isPreviewDoctorId(id: string): boolean {
  return PREVIEW_DOCTORS.some((d) => d.id === id);
}

export function isPreviewLabId(id: string): boolean {
  return PREVIEW_LABS.some((l) => l.id === id);
}
