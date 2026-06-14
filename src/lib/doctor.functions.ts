import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getPreviewDoctorBySlug } from "@/lib/demo-listings";
import { toPublicDoctorProfile } from "@/lib/privacy";
import type { PublicDoctorSeo } from "@/lib/seo";

const DOCTOR_PAGE_COLUMNS =
  "slug, full_name, photo_url, qualification, specialization, experience_years, about, consultation_fee, clinic_name, clinic_address, clinic_city, clinic_pincode, clinic_phone, whatsapp, map_embed_url, map_lat, map_lng, services, open_time, close_time, timings_note, verified, published, profile_views, rating, total_reviews, updated_at, id";

export type PublicDoctorProfile = PublicDoctorSeo & {
  id: string;
  clinic_phone: string | null;
  whatsapp: string | null;
  map_embed_url: string | null;
  map_lat: number | null;
  map_lng: number | null;
  open_time: string | null;
  close_time: string | null;
  timings_note: string | null;
  profile_views: number;
};

export async function getPublicDoctorBySlug(data: { slug: string }) {
  if (!data.slug) return null;

  const { data: row, error } = await supabaseAdmin
    .from("doctors" as any)
    .select(DOCTOR_PAGE_COLUMNS)
    .eq("slug", data.slug)
    .eq("published", true)
    .maybeSingle();

  if (error) {
    console.error("[getPublicDoctorBySlug]", error.message);
    const previewOnError = getPreviewDoctorBySlug(data.slug);
    if (previewOnError) {
      return toPublicDoctorProfile(previewOnError as unknown as Record<string, unknown>);
    }
    return null;
  }

  if (row) return toPublicDoctorProfile(row as unknown as Record<string, unknown>);

  const preview = getPreviewDoctorBySlug(data.slug);
  if (!preview) return null;
  return toPublicDoctorProfile(preview as unknown as Record<string, unknown>);
}
