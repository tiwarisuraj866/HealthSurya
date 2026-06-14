import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const testerKey = cookieStore.get("tester_key")?.value;
    const secret = process.env.INTERNAL_API_SECRET;

    // This endpoint runs arbitrary queries with the service-role key (full RLS
    // bypass). It is a tester-only tool and stays disabled in production unless
    // ENABLE_TESTER_BYPASS is explicitly set to "true".
    if (process.env.ENABLE_TESTER_BYPASS !== "true") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (!secret || testerKey !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      tableName,
      selectFields = "*",
      eqFilters = {},
      inFilters = {},
      ilikeFilters = {},
      orFilterStr = "",
      orderCol = "",
      orderAsc = false,
      limitVal = 0,
      isSingle = false,
      isMaybeSingle = false,
      action = "select",
      payload = null,
    } = body;

    // Start building query on server with service role
    let queryBuilder = supabaseAdmin.from(tableName as any);

    if (action === "select") {
      let q = queryBuilder.select(selectFields);

      // Apply filters
      for (const [col, val] of Object.entries(eqFilters)) {
        q = q.eq(col, val);
      }
      for (const [col, vals] of Object.entries(inFilters)) {
        q = q.in(col, vals as any[]);
      }
      for (const [col, val] of Object.entries(ilikeFilters)) {
        q = q.ilike(col, val as string);
      }
      if (orFilterStr) {
        q = q.or(orFilterStr);
      }
      if (orderCol) {
        q = q.order(orderCol, { ascending: orderAsc });
      }
      if (limitVal > 0) {
        q = q.limit(limitVal);
      }

      if (isSingle) {
        const { data, error } = await q.single();
        return NextResponse.json({ data, error });
      } else if (isMaybeSingle) {
        const { data, error } = await q.maybeSingle();
        return NextResponse.json({ data, error });
      } else {
        const { data, error } = await q;
        return NextResponse.json({ data, error });
      }
    } else if (action === "insert") {
      const { data, error } = await queryBuilder.insert(payload).select();
      return NextResponse.json({ data, error });
    } else if (action === "update") {
      let q = queryBuilder.update(payload);
      for (const [col, val] of Object.entries(eqFilters)) {
        q = q.eq(col, val);
      }
      const { data, error } = await q.select();
      return NextResponse.json({ data, error });
    } else if (action === "delete") {
      let q = queryBuilder.delete();
      for (const [col, val] of Object.entries(eqFilters)) {
        q = q.eq(col, val);
      }
      const { data, error } = await q;
      return NextResponse.json({ data, error });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("[db-query error]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
