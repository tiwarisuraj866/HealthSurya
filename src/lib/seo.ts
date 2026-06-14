import type { DoctorProfile } from "@/lib/doctor";
import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/site-config";

export type SeoMeta = {
  title: string;
  description: string;
  keywords?: string;
  canonical?: string;
  robots?: string;
  ogImage?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
};

/** Fields safe for search engines — no owner_id, WhatsApp, or private patient data */
export type PublicDoctorSeo = Pick<
  DoctorProfile,
  | "slug"
  | "full_name"
  | "photo_url"
  | "qualification"
  | "specialization"
  | "experience_years"
  | "about"
  | "consultation_fee"
  | "clinic_name"
  | "clinic_address"
  | "clinic_city"
  | "clinic_pincode"
  | "services"
  | "verified"
  | "rating"
  | "total_reviews"
  | "published"
  | "updated_at"
>;

export function doctorCanonicalUrl(slug: string): string {
  return `${SITE_URL}/doctors/${slug}`;
}

export function buildDoctorSeo(doctor: PublicDoctorSeo): SeoMeta {
  const city = doctor.clinic_city || "Jaunpur";
  const spec = doctor.specialization || "General Physician";
  const clinic = doctor.clinic_name ? ` at ${doctor.clinic_name}` : "";
  const fee =
    doctor.consultation_fee != null
      ? ` Consultation from ₹${Number(doctor.consultation_fee).toFixed(0)}.`
      : "";

  const title = `Dr. ${doctor.full_name} — ${spec} in ${city} | ${SITE_NAME}`;
  const description = [
    `Book appointment with Dr. ${doctor.full_name}, ${spec} in ${city}${clinic}.`,
    doctor.qualification ? `${doctor.qualification}.` : "",
    doctor.experience_years ? `${doctor.experience_years}+ years experience.` : "",
    fee,
    "Verified listing on HealthSurya — pathology, pharmacy & doctor directory.",
  ]
    .filter(Boolean)
    .join(" ")
    .slice(0, 320);

  const keywords = [
    doctor.full_name,
    `doctor in ${city}`,
    `${spec} ${city}`,
    `${spec} doctor Jaunpur`,
    "book doctor appointment",
    "HealthSurya doctor",
    "healthcare Jaunpur",
    "clinic near me",
    doctor.clinic_name,
    ...(doctor.services ?? []).slice(0, 5),
  ]
    .filter(Boolean)
    .join(", ");

  const canonical = doctorCanonicalUrl(doctor.slug);
  const robots = doctor.published ? "index, follow, max-image-preview:large" : "noindex, nofollow";

  const jsonLd: Record<string, unknown>[] = [
    {
      "@context": "https://schema.org",
      "@type": "Physician",
      name: doctor.full_name,
      medicalSpecialty: spec,
      description: doctor.about || description,
      image: doctor.photo_url || DEFAULT_OG_IMAGE,
      url: canonical,
      ...(doctor.qualification ? { credential: doctor.qualification } : {}),
      address: {
        "@type": "PostalAddress",
        streetAddress: doctor.clinic_address || undefined,
        addressLocality: city,
        postalCode: doctor.clinic_pincode || undefined,
        addressCountry: "IN",
      },
      ...(doctor.rating > 0
        ? {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: Number(doctor.rating).toFixed(1),
              reviewCount: doctor.total_reviews,
            },
          }
        : {}),
      ...(doctor.consultation_fee != null
        ? { priceRange: `₹${Number(doctor.consultation_fee).toFixed(0)}` }
        : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "MedicalBusiness",
      name: doctor.clinic_name || `Dr. ${doctor.full_name} Clinic`,
      url: canonical,
      address: {
        "@type": "PostalAddress",
        addressLocality: city,
        addressCountry: "IN",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Doctors", item: `${SITE_URL}/doctors` },
        { "@type": "ListItem", position: 3, name: doctor.full_name, item: canonical },
      ],
    },
  ];

  return {
    title,
    description,
    keywords,
    canonical,
    robots,
    ogImage: doctor.photo_url || DEFAULT_OG_IMAGE,
    jsonLd,
  };
}

export function seoToHeadMeta(seo: SeoMeta) {
  const meta: Array<Record<string, string>> = [
    { title: seo.title },
    { name: "description", content: seo.description },
    { name: "robots", content: seo.robots ?? "index, follow" },
    { property: "og:title", content: seo.title },
    { property: "og:description", content: seo.description },
    { property: "og:type", content: "profile" },
    { property: "og:url", content: seo.canonical ?? SITE_URL },
    { property: "og:image", content: seo.ogImage ?? DEFAULT_OG_IMAGE },
    { property: "og:site_name", content: SITE_NAME },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: seo.title },
    { name: "twitter:description", content: seo.description },
    { name: "twitter:image", content: seo.ogImage ?? DEFAULT_OG_IMAGE },
  ];
  if (seo.keywords) meta.push({ name: "keywords", content: seo.keywords });
  const links: Array<{ rel: string; href: string }> = [];
  if (seo.canonical) links.push({ rel: "canonical", href: seo.canonical });
  const scripts: Array<{ type: string; children: string }> = [];
  if (seo.jsonLd) {
    const blocks = Array.isArray(seo.jsonLd) ? seo.jsonLd : [seo.jsonLd];
    for (const block of blocks) {
      scripts.push({ type: "application/ld+json", children: JSON.stringify(block) });
    }
  }
  return { meta, links, scripts };
}

// ─── Lab SEO ──────────────────────────────────────────────────────────────────

export type PublicLabSeo = {
  id: string;
  name: string;
  city: string;
  pincode?: string | null;
  address?: string | null;
  rating: number;
  total_reviews?: number | null;
  verified: boolean;
  home_collection: boolean;
};

export function labCanonicalUrl(id: string): string {
  return `${SITE_URL}/labs/${id}`;
}

export function buildLabSeo(lab: PublicLabSeo): SeoMeta {
  const title = `${lab.name} — Pathology Lab in ${lab.city} | ${SITE_NAME}`;
  const description = [
    `Book lab tests at ${lab.name} in ${lab.city}.`,
    lab.home_collection ? "Home sample collection available." : "",
    lab.verified ? "NABL-accredited & verified lab on HealthSurya." : "",
    "Compare prices, check reports online.",
  ]
    .filter(Boolean)
    .join(" ")
    .slice(0, 320);

  const keywords = [
    lab.name,
    `pathology lab ${lab.city}`,
    `blood test ${lab.city}`,
    "book lab test online",
    "NABL lab India",
    "HealthSurya lab",
    "health check up",
  ].join(", ");

  const canonical = labCanonicalUrl(lab.id);

  const jsonLd: Record<string, unknown>[] = [
    {
      "@context": "https://schema.org",
      "@type": "MedicalLaboratory",
      name: lab.name,
      url: canonical,
      address: {
        "@type": "PostalAddress",
        streetAddress: lab.address || undefined,
        addressLocality: lab.city,
        postalCode: lab.pincode || undefined,
        addressCountry: "IN",
      },
      ...(lab.rating > 0
        ? {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: Number(lab.rating).toFixed(1),
              reviewCount: lab.total_reviews ?? 1,
            },
          }
        : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Labs", item: `${SITE_URL}/labs` },
        { "@type": "ListItem", position: 3, name: lab.name, item: canonical },
      ],
    },
  ];

  return { title, description, keywords, canonical, robots: "index, follow, max-image-preview:large", jsonLd };
}

// ─── Homepage / sitewide JSON-LD ──────────────────────────────────────────────

export function buildHomeSeoJsonLd(): Record<string, unknown>[] {
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/labs?q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/logo.png`,
      sameAs: [],
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "support@healthsurya.com",
        availableLanguage: ["English", "Hindi"],
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "MedicalWebPage",
      name: "HealthSurya — Healthcare Platform",
      description:
        "Find verified pathology labs, book doctor appointments, and order medicine in Jaunpur and across India.",
      url: SITE_URL,
      specialty: "Pathology, General Medicine, Pharmacy",
    },
  ];
}
