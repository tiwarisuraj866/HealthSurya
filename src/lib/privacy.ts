import type { PublicDoctorSeo } from "@/lib/seo";

/** Strip fields that must never appear in SEO meta / JSON-LD */
export function toPublicDoctorSeo(row: Record<string, unknown>): PublicDoctorSeo {
  return {
    slug: String(row.slug ?? ""),
    full_name: String(row.full_name ?? ""),
    photo_url: (row.photo_url as string | null) ?? null,
    qualification: (row.qualification as string | null) ?? null,
    specialization: (row.specialization as string | null) ?? null,
    experience_years: row.experience_years != null ? Number(row.experience_years) : null,
    about: (row.about as string | null) ?? null,
    consultation_fee: row.consultation_fee != null ? Number(row.consultation_fee) : null,
    clinic_name: (row.clinic_name as string | null) ?? null,
    clinic_address: (row.clinic_address as string | null) ?? null,
    clinic_city: String(row.clinic_city ?? ""),
    clinic_pincode: (row.clinic_pincode as string | null) ?? null,
    services: Array.isArray(row.services) ? (row.services as string[]) : [],
    verified: Boolean(row.verified),
    published: Boolean(row.published),
    rating: Number(row.rating ?? 0),
    total_reviews: Number(row.total_reviews ?? 0),
    updated_at: String(row.updated_at ?? new Date().toISOString()),
  };
}

/** Full public page profile (contact shown on page only, not in SEO bundle) */
export function toPublicDoctorProfile(row: Record<string, unknown>) {
  const seo = toPublicDoctorSeo(row);
  return {
    ...seo,
    id: String(row.id ?? ""),
    clinic_phone: (row.clinic_phone as string | null) ?? null,
    whatsapp: (row.whatsapp as string | null) ?? null,
    map_embed_url: (row.map_embed_url as string | null) ?? null,
    map_lat: row.map_lat != null ? Number(row.map_lat) : null,
    map_lng: row.map_lng != null ? Number(row.map_lng) : null,
    open_time: (row.open_time as string | null) ?? null,
    close_time: (row.close_time as string | null) ?? null,
    timings_note: (row.timings_note as string | null) ?? null,
    profile_views: Number(row.profile_views ?? 0),
  };
}

/** Redact server config from health-check responses shown in the browser */
export function sanitizeHealthCheckDetail(id: string, detail: string): string {
  if (id === "env") return detail.includes("ok") ? "Public Supabase config present" : "Missing public Supabase config";
  return detail.length > 120 ? `${detail.slice(0, 117)}…` : detail;
}
