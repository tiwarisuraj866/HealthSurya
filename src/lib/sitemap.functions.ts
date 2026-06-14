import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { POLICIES } from "@/lib/policies";
import { SITE_URL } from "@/lib/site-config";

function xmlEscape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function urlEntry(loc: string, lastmod?: string, changefreq?: string, priority?: string): string {
  return `  <url>
    <loc>${xmlEscape(loc)}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ""}${changefreq ? `\n    <changefreq>${changefreq}</changefreq>` : ""}${priority ? `\n    <priority>${priority}</priority>` : ""}
  </url>`;
}

export async function generateSitemapXml() {
  const today = new Date().toISOString().slice(0, 10);
  const staticPaths: Array<{ path: string; priority: string; changefreq: string }> = [
    { path: "/", priority: "1.0", changefreq: "daily" },
    { path: "/labs", priority: "0.9", changefreq: "daily" },
    { path: "/doctors", priority: "0.9", changefreq: "daily" },
    { path: "/medicine", priority: "0.8", changefreq: "weekly" },
    { path: "/services", priority: "0.7", changefreq: "monthly" },
    { path: "/about", priority: "0.6", changefreq: "monthly" },
    { path: "/contact", priority: "0.6", changefreq: "monthly" },
    { path: "/legal", priority: "0.5", changefreq: "monthly" },
    { path: "/register", priority: "0.5", changefreq: "monthly" },
    { path: "/login", priority: "0.4", changefreq: "monthly" },
  ];

  let doctorUrls = "";
  try {
    const { data: doctors } = await supabaseAdmin
      .from("doctors")
      .select("slug, updated_at")
      .eq("published", true)
      .order("updated_at", { ascending: false });

    for (const d of doctors ?? []) {
      const lastmod = d.updated_at ? d.updated_at.slice(0, 10) : today;
      doctorUrls += urlEntry(`${SITE_URL}/doctors/${d.slug}`, lastmod, "weekly", "0.8") + "\n";
    }
  } catch (e) {
    console.warn("[sitemap] Could not fetch doctors:", e);
  }

  const staticUrls = staticPaths
    .map((p) => urlEntry(`${SITE_URL}${p.path}`, today, p.changefreq, p.priority))
    .join("\n");

  const policyUrls = POLICIES.map((p) =>
    urlEntry(`${SITE_URL}/legal/${p.id}`, p.lastUpdated, "yearly", "0.4"),
  ).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls}
${policyUrls}
${doctorUrls}</urlset>`;
}
