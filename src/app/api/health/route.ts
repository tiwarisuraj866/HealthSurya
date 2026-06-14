import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/health
// Used by Vercel, Sentry, and UptimeRobot to verify the app is running.
// ─────────────────────────────────────────────────────────────────────────────
export async function GET() {
  const checks: Record<string, "ok" | "error"> = {};

  // Check Supabase connectivity
  try {
    const { error } = await supabaseAdmin
      .from("profiles" as any)
      .select("id")
      .limit(1);
    checks.database = error ? "error" : "ok";
  } catch {
    checks.database = "error";
  }

  const allOk = Object.values(checks).every((v) => v === "ok");

  return NextResponse.json(
    {
      status: allOk ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      checks,
      version: process.env.npm_package_version || "1.4.0",
    },
    { status: allOk ? 200 : 503 }
  );
}
