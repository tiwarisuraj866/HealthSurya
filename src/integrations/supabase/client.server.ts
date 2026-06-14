// Server-side Supabase client with service role key - bypasses RLS.
// Use this for admin operations in server functions and server routes only.
// For user-authenticated queries (with RLS), use the auth middleware instead.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { PREVIEW_LABS, PREVIEW_DOCTORS } from '../../lib/demo-listings';

function createSupabaseAdminClient() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    const missing = [
      ...(!SUPABASE_URL ? ['SUPABASE_URL'] : []),
      ...(!SUPABASE_SERVICE_ROLE_KEY ? ['SUPABASE_SERVICE_ROLE_KEY'] : []),
    ];
    const message = `Missing Supabase environment variable(s): ${missing.join(", ")}. Set server-only SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.`;
    console.error(`[Supabase] ${message}`);
    throw new Error(message);
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    }
  });
}

// --- MOCK DATABASE STATE ---
const g = global as any;
if (!g.mockDbState) {
  g.mockDbState = {
    profiles: [
      {
        id: "f1000001-0001-4000-8000-000000000001",
        clerk_user_id: "f1000001-0001-4000-8000-000000000001",
        phone: "9876500501",
        email: "admin@healthsurya.com",
        full_name: "Suraj Tiwari",
        role: "admin",
        wallet_balance: 10000,
        verification_status: "approved",
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "c1000001-0001-4000-8000-000000000001",
        clerk_user_id: "c1000001-0001-4000-8000-000000000001",
        phone: "9876500502",
        email: "doctor@healthsurya.com",
        full_name: "Dr. Rajesh Gupta",
        role: "doctor",
        wallet_balance: 10000,
        verification_status: "approved",
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "d1000001-0001-4000-8000-000000000001",
        clerk_user_id: "d1000001-0001-4000-8000-000000000001",
        phone: "9876500503",
        email: "lab@healthsurya.com",
        full_name: "PathCare Diagnostics",
        role: "lab",
        wallet_balance: 10000,
        verification_status: "approved",
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "d1000002-0001-4000-8000-000000000002",
        clerk_user_id: "d1000002-0001-4000-8000-000000000002",
        phone: "9876500504",
        email: "pharmacy@healthsurya.com",
        full_name: "MedLife Labs",
        role: "pharmacy",
        wallet_balance: 10000,
        verification_status: "approved",
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "b1000001-0001-4000-8000-000000000001",
        clerk_user_id: "b1000001-0001-4000-8000-000000000001",
        phone: "9876500505",
        email: "patient@healthsurya.com",
        full_name: "Rahul Sharma",
        role: "patient",
        wallet_balance: 10000,
        verification_status: "approved",
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ],
    bookings: [
      {
        id: "bk-mock-001",
        patient_id: "b1000001-0001-4000-8000-000000000001",
        lab_id: "b1000001-0001-4000-8000-000000000001",
        test_id: "e1000001-0001-4000-8000-000000000001",
        scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        status: "pending",
        home_collection: true,
        address: "123, Civil Lines, Jaunpur",
        notes: "Patient requires morning test.",
        price: 499,
        payment_status: "pending",
        referred_doctor_id: null,
        referred_doctor_name: null,
        prescription_verified: false,
        commission_amount: 0,
        report_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ],
    doctor_appointments: [] as any[],
    labs: PREVIEW_LABS.map(l => ({
      ...l,
      owner_id: "d1000001-0001-4000-8000-000000000001",
      phone: "9876500000",
      email: "preview.lab@healthsurya.com",
      open_time: "07:00",
      close_time: "21:00",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })),
    doctors: PREVIEW_DOCTORS.map(d => ({
      ...d,
      owner_id: "c1000001-0001-4000-8000-000000000001",
      qualification: "MBBS, MD",
      experience_years: d.experience_years ?? 10,
      consultation_fee: d.consultation_fee ?? 500,
      clinic_name: d.clinic_name ?? `${d.full_name} Clinic`,
      clinic_address: d.clinic_address ?? "Civil Lines",
      clinic_phone: "9000000000",
      whatsapp: d.whatsapp ?? "9000000000",
      services: d.services ?? ["Consultation", "Follow-up"],
      open_time: d.open_time ?? "09:00",
      close_time: d.close_time ?? "20:00",
      published: true,
      verified: true,
      profile_views: d.profile_views ?? 120,
      whatsapp_clicks: d.whatsapp_clicks ?? 45,
      total_reviews: d.total_reviews ?? 28,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })),
    lab_tests: PREVIEW_LABS.flatMap(l => ([
      {
        id: `t1-${l.id.slice(3)}`,
        lab_id: l.id,
        test_id: "e1000001-0001-4000-8000-000000000001",
        price: l.minPrice || 299,
        home_collection: true,
        available: true,
        turnaround_hours: 24,
        tests: { name: "Complete Blood Count (CBC)", category: "Pathology" }
      },
      {
        id: `t2-${l.id.slice(3)}`,
        lab_id: l.id,
        test_id: "e1000002-0001-4000-8000-000000000002",
        price: (l.minPrice || 299) + 100,
        home_collection: true,
        available: true,
        turnaround_hours: 24,
        tests: { name: "Thyroid Profile (T3, T4, TSH)", category: "Hormone" }
      }
    ])),
    tests: [
      { id: "e1000001-0001-4000-8000-000000000001", name: "Complete Blood Count (CBC)", category: "Pathology" },
      { id: "e1000002-0001-4000-8000-000000000002", name: "Thyroid Profile (T3, T4, TSH)", category: "Hormone" }
    ],
    reviews: [] as any[],
    doctor_gallery: [] as any[],
    doctor_reviews: [] as any[],
    doctor_verifications: [] as any[],
    partner_verifications: [] as any[],
    wallet_transactions: [] as any[],
    user_consents: [] as any[],
    user_roles: [
      { id: "r1", user_id: "f1000001-0001-4000-8000-000000000001", role: "admin" },
      { id: "r2", user_id: "c1000001-0001-4000-8000-000000000001", role: "doctor" },
      { id: "r3", user_id: "d1000001-0001-4000-8000-000000000001", role: "lab" },
      { id: "r4", user_id: "d1000002-0001-4000-8000-000000000002", role: "pharmacy" },
      { id: "r5", user_id: "b1000001-0001-4000-8000-000000000001", role: "patient" }
    ],
    medicine_orders: [] as any[],
    medicine_order_items: [] as any[],
    order_tracking_events: [] as any[],
    audit_logs: [] as any[],
    auth_methods: [] as any[],
    doctor_profiles: [] as any[],
    lab_profiles: [] as any[],
    pharmacy_profiles: [] as any[],
    kyc_documents: [] as any[],
    verification_requests: [] as any[],
    verification_logs: [] as any[],
    profile_completion: [] as any[],
    trust_scores: [] as any[],
    tickets: [] as any[],
    ticket_messages: [] as any[],
    notifications: [] as any[],
    ai_conversations: [] as any[],
    lab_branding: [] as any[],
    _ticketCounter: 1000
  };
}

// Helper: Query Filter Executor
async function executeMockQuery(state: any) {
  let list = g.mockDbState[state.tableName] || [];

  if (state.tableName === "profiles" && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === "pk_test_Y2xlcmsubW9jay5kZXYk") {
    let mockVerStatus = "approved";
    try {
      const { cookies } = await import("next/headers");
      const cookieStore = await cookies();
      mockVerStatus = cookieStore.get("mock_verification_status")?.value || "approved";
    } catch (e) {
      // ignore
    }
    list = list.map((p: any) => ({
      ...p,
      verification_status: mockVerStatus
    }));
  }

  // Filter eq
  for (const [col, val] of Object.entries(state.eqFilters)) {
    list = list.filter((item: any) => item[col] === val);
  }

  // Filter in
  if (state.inFilters) {
    for (const [col, vals] of Object.entries(state.inFilters)) {
      if (Array.isArray(vals)) {
        list = list.filter((item: any) => vals.includes(item[col]));
      }
    }
  }

  // Filter neq
  if (state.neqFilters) {
    for (const [col, val] of Object.entries(state.neqFilters)) {
      list = list.filter((item: any) => item[col] !== val);
    }
  }

  // Resolve simple foreign joins used by V2 queries (profiles:profile_id (...))
  if (typeof state.selectFields === "string" && state.selectFields.includes("profiles:profile_id")) {
    list = list.map((row: any) => ({
      ...row,
      profiles: g.mockDbState.profiles.find((p: any) => p.id === row.profile_id) ?? null,
    }));
  }
  // Filter ilike
  if (state.ilikeFilters) {
    for (const [col, val] of Object.entries(state.ilikeFilters)) {
      const searchVal = String(val).replace(/%/g, "").toLowerCase();
      list = list.filter((item: any) => item[col] && String(item[col]).toLowerCase().includes(searchVal));
    }
  }

  // Filter or
  if (state.orFilterStr) {
    const filters = state.orFilterStr.split(",");
    list = list.filter((item: any) => {
      return filters.some((f: string) => {
        const match = f.match(/(\w+)\.ilike\.%([^%]+)%/);
        if (match) {
          const col = match[1];
          const query = match[2].toLowerCase();
          return item[col] && String(item[col]).toLowerCase().includes(query);
        }
        return false;
      });
    });
  }

  // Order
  if (state.orderCol) {
    list = [...list].sort((a: any, b: any) => {
      const aVal = a[state.orderCol];
      const bVal = b[state.orderCol];
      if (aVal === bVal) return 0;
      const factor = state.orderAsc ? 1 : -1;
      return aVal > bVal ? factor : -factor;
    });
  }

  // Limit
  if (state.limitVal > 0) {
    list = list.slice(0, state.limitVal);
  }

  // Join logic
  if (state.tableName === "bookings") {
    let mockRole = "patient";
    try {
      const { cookies } = await import("next/headers");
      const cookieStore = await cookies();
      mockRole = cookieStore.get("mock_role")?.value || "patient";
    } catch (e) {
      // fallback if cookies cannot be accessed outside request scope
    }
    const isInternalRole = ["doctor", "lab", "admin", "super_admin"].includes(mockRole);

    list = list.map((b: any) => {
      const lab = g.mockDbState.labs.find((l: any) => l.id === b.lab_id);
      const test = g.mockDbState.tests.find((t: any) => t.id === b.test_id);
      const bookingData = {
        ...b,
        labs: lab ? { name: lab.name, city: lab.city, address: lab.address, image_url: lab.image_url } : null,
        tests: test ? { name: test.name } : null
      };

      if (!isInternalRole) {
        delete bookingData.commission_amount;
        delete bookingData.referred_doctor_id;
        delete bookingData.referred_doctor_name;
        delete bookingData.prescription_verified;
      }
      return bookingData;
    });
  } else if (state.tableName === "lab_tests") {
    list = list.map((lt: any) => {
      const test = g.mockDbState.tests.find((t: any) => t.id === lt.test_id);
      return {
        ...lt,
        tests: test ? { name: test.name, category: test.category } : null
      };
    });
  }

  if (state.isSingle) {
    return { data: list[0] || null, error: list[0] ? null : { message: "Row not found" }, count: list.length };
  }
  if (state.isMaybeSingle) {
    return { data: list[0] || null, error: null, count: list.length };
  }

  return { data: list, error: null, count: list.length };
}

function createMockQueryBuilder(tableName: string) {
  const state = {
    tableName,
    eqFilters: {} as Record<string, any>,
    inFilters: {} as Record<string, any[]>,
    neqFilters: {} as Record<string, any>,
    ilikeFilters: {} as Record<string, string>,
    orFilterStr: "",
    selectFields: "*",
    isSingle: false,
    isMaybeSingle: false,
    orderCol: "",
    orderAsc: false,
    limitVal: 0,
    insertPayload: null as any,
    updatePayload: null as any,
  };

  const builder = {
    select(fields = "*", options?: any) {
      state.selectFields = fields;
      return builder;
    },
    eq(col: string, val: any) {
      state.eqFilters[col] = val;
      return builder;
    },
    in(col: string, values: any[]) {
      state.inFilters[col] = values ?? [];
      return builder;
    },
    neq(col: string, val: any) {
      state.neqFilters[col] = val;
      return builder;
    },
    ilike(col: string, val: string) {
      state.ilikeFilters[col] = val;
      return builder;
    },
    or(filterStr: string) {
      state.orFilterStr = filterStr;
      return builder;
    },
    order(col: string, opts?: { ascending?: boolean }) {
      state.orderCol = col;
      state.orderAsc = opts?.ascending ?? false;
      return builder;
    },
    limit(val: number) {
      state.limitVal = val;
      return builder;
    },
    single() {
      state.isSingle = true;
      return Promise.resolve(executeMockQuery(state));
    },
    maybeSingle() {
      state.isMaybeSingle = true;
      return Promise.resolve(executeMockQuery(state));
    },
    insert(payload: any) {
      state.insertPayload = payload;
      const items = Array.isArray(payload) ? payload : [payload];
      const inserted: any[] = [];
      if (!g.mockDbState[tableName]) g.mockDbState[tableName] = [];
      for (const item of items) {
        const row = {
          id: item.id || `mock-id-${Math.random().toString(36).substring(2, 11)}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...item
        };
        if (tableName === "tickets" && row.ticket_no == null) {
          row.ticket_no = ++g.mockDbState._ticketCounter;
        }
        g.mockDbState[tableName].push(row);
        inserted.push(row);
      }
      const resVal = Array.isArray(payload) ? inserted : inserted[0];
      return {
        select() {
          return {
            single() {
              return Promise.resolve({ data: resVal, error: null });
            },
            then(onfulfilled: any) {
              return Promise.resolve({ data: inserted, error: null }).then(onfulfilled);
            }
          };
        },
        then(onfulfilled?: (value: any) => any) {
          return Promise.resolve({ data: resVal, error: null }).then(onfulfilled);
        }
      } as any;
    },
    update(payload: any) {
      state.updatePayload = payload;
      const inFilters: Record<string, any[]> = {};
      const neqFilters: Record<string, any> = {};
      const applyUpdate = () => {
        const list = g.mockDbState[tableName] || [];
        for (const item of list) {
          let match = true;
          for (const [fCol, fVal] of Object.entries(state.eqFilters)) {
            if (item[fCol] !== fVal) match = false;
          }
          for (const [fCol, fVals] of Object.entries(inFilters)) {
            if (!fVals.includes(item[fCol])) match = false;
          }
          for (const [fCol, fVal] of Object.entries(neqFilters)) {
            if (item[fCol] === fVal) match = false;
          }
          if (match) {
            Object.assign(item, payload, { updated_at: new Date().toISOString() });
          }
        }
        return { data: {}, error: null };
      };
      const chain: any = {
        eq(col: string, val: any) {
          state.eqFilters[col] = val;
          return chain;
        },
        in(col: string, vals: any[]) {
          inFilters[col] = vals;
          return chain;
        },
        neq(col: string, val: any) {
          neqFilters[col] = val;
          return chain;
        },
        select() { return chain; },
        single() { return Promise.resolve(applyUpdate()); },
        maybeSingle() { return Promise.resolve(applyUpdate()); },
        then(onfulfilled?: (v: any) => any, onrejected?: (r: any) => any) {
          return Promise.resolve(applyUpdate()).then(onfulfilled, onrejected);
        }
      };
      return chain;
    },
    upsert(payload: any, options?: any) {
      const items = Array.isArray(payload) ? payload : [payload];
      if (!g.mockDbState[tableName]) g.mockDbState[tableName] = [];
      for (const item of items) {
        const list = g.mockDbState[tableName];
        // Supports composite conflict targets like "profile_id,doc_key".
        // Falls back to id, then profile_id (natural key of completion/trust tables).
        let conflictCols: string[];
        if (options?.onConflict) {
          conflictCols = String(options.onConflict).split(",").map((c: string) => c.trim());
        } else if (item.id != null) {
          conflictCols = ["id"];
        } else if (item.profile_id != null) {
          conflictCols = ["profile_id"];
        } else {
          conflictCols = ["id"];
        }
        const idx = list.findIndex((x: any) =>
          conflictCols.every((c) => item[c] != null && x[c] === item[c])
        );
        if (idx >= 0) {
          Object.assign(list[idx], item, { updated_at: new Date().toISOString() });
        } else {
          list.push({
            id: item.id || `mock-id-${Math.random().toString(36).substring(2, 11)}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            ...item
          });
        }
      }
      return Promise.resolve({ data: payload, error: null });
    },
    delete() {
      return {
        eq(col: string, val: any) {
          state.eqFilters[col] = val;
          const list = g.mockDbState[tableName] || [];
          const remaining = list.filter((item: any) => item[col] !== val);
          g.mockDbState[tableName] = remaining;
          return Promise.resolve({ data: {}, error: null });
        }
      };
    },
    then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
      return Promise.resolve(executeMockQuery(state)).then(onfulfilled, onrejected);
    }
  };

  return builder;
}

let _supabaseAdmin: ReturnType<typeof createSupabaseAdminClient> | undefined;

// Server-side Supabase client with service role - bypasses RLS
// SECURITY: Only use this for trusted server-side operations, never expose to client code
export const supabaseAdmin = new Proxy({} as ReturnType<typeof createSupabaseAdminClient>, {
  get(_, prop, receiver) {
    if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === "pk_test_Y2xlcmsubW9jay5kZXYk") {
      if (prop === "from") {
        return (tableName: string) => createMockQueryBuilder(tableName);
      }
      if (prop === "auth") {
        return {
          async getUser(token?: string) {
            const { cookies } = await import("next/headers");
            const cookieStore = await cookies();
            const mockRole = cookieStore.get("mock_role")?.value || cookieStore.get("sb_session")?.value;
            if (!mockRole) return { data: { user: null }, error: null };
            
            const userId = mockRole === "admin" ? "f1000001-0001-4000-8000-000000000001" :
                           mockRole === "doctor" ? "c1000001-0001-4000-8000-000000000001" :
                           mockRole === "lab" ? "d1000001-0001-4000-8000-000000000001" :
                           mockRole === "pharmacy" ? "d1000002-0001-4000-8000-000000000002" :
                           "b1000001-0001-4000-8000-000000000001";
            
            return {
              data: {
                user: {
                  id: userId,
                  email: `${mockRole}@healthsurya.com`,
                  user_metadata: { full_name: `Test ${mockRole.charAt(0).toUpperCase() + mockRole.slice(1)}` },
                }
              },
              error: null
            };
          }
        };
      }
      if (prop === "rpc") {
        return async (fnName: string, params: any) => {
          if (fnName === "increment_doctor_views") {
            const doc = g.mockDbState.doctors.find((d: any) => d.id === params.doctor_id);
            if (doc) doc.profile_views = (doc.profile_views || 0) + 1;
          }
          return { data: null, error: null };
        };
      }
      if (prop === "storage") {
        return {
          from(bucketName: string) {
            return {
              async upload(filePath: string, fileBuffer: any, options: any) {
                return { data: { path: filePath }, error: null };
              },
              async createSignedUrl(path: string, expiresIn: number) {
                return { data: { signedUrl: `/mock-upload/${path}` }, error: null };
              }
            };
          }
        };
      }
    }

    if (!_supabaseAdmin) _supabaseAdmin = createSupabaseAdminClient();
    return Reflect.get(_supabaseAdmin, prop, receiver);
  },
});
