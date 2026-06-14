import { z } from "zod";

/** Parse ?book=true from URL search (string or boolean). */
export const bookParam = z.preprocess(
  (val) => val === true || val === "true",
  z.boolean(),
);

export const redirectSearchSchema = z.object({
  redirect: z.string().optional().default(""),
});

export function safeRedirectPath(path?: string | null): string {
  if (!path || typeof path !== "string") return "/dashboard";
  if (!path.startsWith("/") || path.startsWith("//")) return "/dashboard";
  return path;
}

export function buildBookDoctorUrl(slug: string): string {
  return `/doctors/${encodeURIComponent(slug)}?book=true`;
}

export function buildBookLabUrl(labId: string): string {
  return `/labs/${encodeURIComponent(labId)}?book=true`;
}

export function loginSearch(redirectTo: string) {
  return { redirect: safeRedirectPath(redirectTo) };
}

export function registerSearch(redirectTo: string) {
  return { redirect: safeRedirectPath(redirectTo), role: "patient" as const };
}

export function goAfterAuth(redirect: string | undefined, fallback = "/dashboard") {
  const target = safeRedirectPath(redirect || fallback);
  window.location.assign(target);
}
