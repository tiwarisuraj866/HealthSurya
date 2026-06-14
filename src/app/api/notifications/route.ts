// HealthSurya V2 — In-app notifications
// GET  /api/notifications        → latest 30 (in_app channel) + unread count
// POST /api/notifications        → { ids?: string[], all?: boolean } mark read
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const runtime = "nodejs";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = supabaseAdmin as any;

  const { data, error } = await db
    .from("notifications")
    .select("id,event,title,body,link,is_read,created_at")
    .eq("clerk_user_id", userId)
    .eq("channel", "in_app")
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) return NextResponse.json({ notifications: [], unread: 0 });

  const unread = (data ?? []).filter((n: any) => !n.is_read).length;
  return NextResponse.json({ notifications: data ?? [], unread });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const db = supabaseAdmin as any;

  let query = db.from("notifications").update({ is_read: true }).eq("clerk_user_id", userId);
  if (body.all) {
    await query.eq("is_read", false);
  } else if (Array.isArray(body.ids) && body.ids.length) {
    await query.in("id", body.ids.slice(0, 100));
  } else {
    return NextResponse.json({ error: "ids or all required" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
