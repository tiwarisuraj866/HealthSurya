/** Public site URL for SEO, sitemap, and canonical links */
export const SITE_URL =
  (typeof process !== "undefined" && (process.env.NEXT_PUBLIC_SITE_URL || process.env.VITE_SITE_URL)) ||
  "https://healthsurya.com";

export const SITE_NAME = "HealthSurya";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/logo.png`;
export const SUPPORT_EMAIL = "support@healthsurya.com";
export const LEGAL_ENTITY = "HealthSurya Healthcare Platform";
