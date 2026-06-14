import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { generateSitemapXml } from "@/lib/sitemap.functions";
import { getPublicDoctorBySlug } from "@/lib/doctor.functions";
import { sanitizeHealthCheckDetail } from "@/lib/privacy";

export type HealthCheckItem = {
  id: string;
  name: string;
  ok: boolean;
  detail: string;
};

function healthCheckAllowed(): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  return process.env.ENABLE_HEALTH_CHECK === "true";
}

export async function runProjectHealthCheck() {
  if (!healthCheckAllowed()) {
    return {
      allOk: false,
      checks: [
        {
          id: "access",
          name: "Access",
          ok: false,
          detail: "Health check is disabled in production. Set ENABLE_HEALTH_CHECK=true to enable.",
        },
      ],
      at: new Date().toISOString(),
    };
  }

  const checks: HealthCheckItem[] = [];

  const hasUrl = Boolean(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasAnon = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY);
  const envOk = hasUrl && hasAnon;
  checks.push({
    id: "env",
    name: "Supabase environment",
    ok: envOk,
    detail: sanitizeHealthCheckDetail("env", envOk ? "ok" : "missing"),
  });

  try {
    const { count, error } = await supabaseAdmin.from("labs").select("*", { count: "exact", head: true });
    checks.push({
      id: "labs",
      name: "Labs table",
      ok: !error,
      detail: sanitizeHealthCheckDetail("labs", error?.message ?? `count=${count ?? 0}`),
    });
  } catch (e) {
    checks.push({ id: "labs", name: "Labs table", ok: false, detail: sanitizeHealthCheckDetail("labs", String(e)) });
  }

  try {
    const { count, error } = await supabaseAdmin.from("doctors").select("*", { count: "exact", head: true });
    checks.push({
      id: "doctors",
      name: "Doctors table",
      ok: !error,
      detail: sanitizeHealthCheckDetail("doctors", error?.message ?? `count=${count ?? 0}`),
    });
  } catch (e) {
    checks.push({ id: "doctors", name: "Doctors table", ok: false, detail: sanitizeHealthCheckDetail("doctors", String(e)) });
  }

  try {
    const { count, error } = await supabaseAdmin.from("pharmacy_medicines" as any).select("*", { count: "exact", head: true });
    checks.push({
      id: "medicine",
      name: "Medicine catalog",
      ok: !error,
      detail: sanitizeHealthCheckDetail("medicine", error?.message ?? `rows=${count ?? 0}`),
    });
  } catch (e) {
    checks.push({ id: "medicine", name: "Medicine catalog", ok: false, detail: sanitizeHealthCheckDetail("medicine", String(e)) });
  }

  try {
    const xml = await generateSitemapXml();
    const ok = xml.includes("<urlset") && xml.includes("/doctors");
    checks.push({
      id: "sitemap",
      name: "Sitemap generation",
      ok,
      detail: sanitizeHealthCheckDetail("sitemap", ok ? `length=${xml.length}` : "invalid xml"),
    });
  } catch (e) {
    checks.push({ id: "sitemap", name: "Sitemap generation", ok: false, detail: sanitizeHealthCheckDetail("sitemap", String(e)) });
  }

  try {
    const { data } = await supabaseAdmin.from("doctors").select("slug").eq("published", true).limit(1).maybeSingle();
    const slug = data?.slug ?? "__nonexistent_test_slug__";
    const doc = await getPublicDoctorBySlug({ slug });
    checks.push({
      id: "doctor-fn",
      name: "Doctor public loader",
      ok: true,
      detail: data?.slug ? (doc ? "loader ok" : "slug not found") : "no published doctors (skip)",
    });
  } catch (e) {
    checks.push({ id: "doctor-fn", name: "Doctor public loader", ok: false, detail: sanitizeHealthCheckDetail("doctor-fn", String(e)) });
  }

  const allOk = checks.every((c) => c.ok);
  return { allOk, checks, at: new Date().toISOString() };
}
