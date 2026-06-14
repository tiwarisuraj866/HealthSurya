/** Doctor mini-website types and helpers */

export type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled";

export interface DoctorProfile {
  id: string;
  owner_id: string;
  slug: string;
  full_name: string;
  photo_url: string | null;
  qualification: string | null;
  specialization: string | null;
  experience_years: number | null;
  gender: string | null;
  about: string | null;
  consultation_fee: number | null;
  clinic_name: string | null;
  clinic_address: string | null;
  clinic_city: string;
  clinic_pincode: string | null;
  clinic_phone: string | null;
  whatsapp: string | null;
  map_embed_url: string | null;
  map_lat: number | null;
  map_lng: number | null;
  services: string[];
  open_time: string | null;
  close_time: string | null;
  timings_note: string | null;
  verified: boolean;
  published: boolean;
  profile_views: number;
  whatsapp_clicks: number;
  rating: number;
  total_reviews: number;
  created_at: string;
  updated_at: string;
  is_available?: boolean;
  theme_color?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
}

export interface DoctorGalleryItem {
  id: string;
  doctor_id: string;
  image_url: string;
  caption: string | null;
  sort_order: number;
}

export interface DoctorReview {
  id: string;
  doctor_id: string;
  reviewer_name: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface DoctorAppointment {
  id: string;
  doctor_id: string;
  patient_id: string | null;
  patient_name: string;
  patient_phone: string;
  preferred_date: string;
  symptoms: string | null;
  status: AppointmentStatus;
  created_at: string;
}

export function doctorPublicUrl(slug: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/doctors/${slug}`;
  }
  return `/doctors/${slug}`;
}

export function whatsappLink(phone: string, message?: string): string {
  const digits = phone.replace(/\D/g, "");
  const num = digits.startsWith("91") ? digits : `91${digits}`;
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${num}${text}`;
}

export function formatDoctorTimings(d: Pick<DoctorProfile, "open_time" | "close_time" | "timings_note">): string {
  if (d.timings_note) return d.timings_note;
  if (d.open_time && d.close_time) return `${d.open_time} – ${d.close_time}`;
  return "Contact clinic for timings";
}

export async function trackDoctorEvent(doctorId: string, eventType: "profile_view" | "whatsapp_click" | "appointment_request") {
  const { supabase } = await import("@/integrations/supabase/client");
  await supabase.rpc("track_doctor_event", { _doctor_id: doctorId, _event_type: eventType });
}

export const DEFAULT_SERVICES = [
  "General Consultation",
  "Follow-up Visit",
  "Health Check-up",
  "Chronic Disease Management",
];
