import { supabase } from "@/integrations/supabase/client";
import { DEMO_CATALOG, type CatalogMedicine } from "@/lib/medicine";
import { estimatePharmacySellerCount } from "@/lib/medicine-expiry";
import type { DeliveryAddress } from "@/lib/address";
import type { MedicineBill } from "@/lib/billing";

const DEMO_ORDERS_KEY = "healthsurya_demo_orders";

function withSellerCount(m: CatalogMedicine): CatalogMedicine {
  return { ...m, seller_count: m.seller_count ?? estimatePharmacySellerCount(m.id) };
}

export async function fetchCatalog(search = "", category = "", pincode = ""): Promise<CatalogMedicine[]> {
  const { data, error } = await supabase
    .from("pharmacy_medicines")
    .select(
      "price, mrp, express_delivery, pharmacy_id, medicines(id, name, slug, category, description, manufacturer, pack_size, requires_prescription)",
    );

  if (error || !data?.length) {
    let list = DEMO_CATALOG.map(withSellerCount);
    if (search) list = list.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()));
    if (category) list = list.filter((m) => m.category === category);
    return list;
  }

  type MedJoin = {
    id: string;
    name: string;
    slug: string;
    category: string;
    description: string | null;
    manufacturer: string | null;
    pack_size: string | null;
    requires_prescription: boolean;
  };
  type Row = {
    price: number;
    mrp: number;
    express_delivery: boolean;
    pharmacy_id: string;
    medicines: MedJoin | null;
  };

  const byMedicine = new Map<string, { listing: CatalogMedicine; sellers: Set<string> }>();

  for (const row of (data as Row[]).filter((r): r is Row & { medicines: MedJoin } => Boolean(r.medicines))) {
    const med = row.medicines;
    const medId = med.id;
    const entry = byMedicine.get(medId) ?? {
      listing: {
        id: med.id,
        name: med.name,
        slug: med.slug,
        category: med.category,
        description: med.description,
        manufacturer: med.manufacturer,
        pack_size: med.pack_size,
        requires_prescription: med.requires_prescription,
        price: Number(row.price),
        mrp: Number(row.mrp),
        express_delivery: row.express_delivery,
        pharmacy_id: row.pharmacy_id,
      },
      sellers: new Set<string>(),
    };
    entry.sellers.add(row.pharmacy_id);
    const price = Number(row.price);
    if (price < entry.listing.price) {
      entry.listing = { ...entry.listing, price, mrp: Number(row.mrp), pharmacy_id: row.pharmacy_id, express_delivery: row.express_delivery };
    }
    byMedicine.set(medId, entry);
  }

  let catalog = [...byMedicine.values()].map(({ listing, sellers }) =>
    withSellerCount({ ...listing, seller_count: sellers.size }),
  );

  if (search) catalog = catalog.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()));
  if (category) catalog = catalog.filter((m) => m.category === category);
  void pincode;
  return catalog;
}

export async function fetchMedicineBySlug(slug: string): Promise<CatalogMedicine | null> {
  const list = await fetchCatalog();
  return list.find((m) => m.slug === slug) ?? null;
}

function saveDemoOrder(order: Record<string, unknown>) {
  const existing = JSON.parse(localStorage.getItem(DEMO_ORDERS_KEY) ?? "[]");
  existing.unshift(order);
  localStorage.setItem(DEMO_ORDERS_KEY, JSON.stringify(existing.slice(0, 20)));
}

export async function placeMedicineOrder(params: {
  patientId: string;
  items: { medicineId: string; name: string; quantity: number; unitPrice: number }[];
  pharmacyId: string;
  address: DeliveryAddress;
  formattedAddress: string;
  phone: string;
  notes?: string;
  paymentMode: "cod" | "prepaid";
  deliveryFee: number;
  distanceKm: number;
  bill: MedicineBill;
  prescriptionFileName?: string;
}) {
  const { bill } = params;
  const now = new Date().toISOString();
  const addressMeta = JSON.stringify({
    ...params.address,
    distance_km: params.distanceKm,
    refund_policy: "medicine_2_day",
    gst_total: bill.gstTotal,
    medicine_gst: bill.medicineGst,
    cgst: bill.cgst,
    sgst: bill.sgst,
    prescription_file: params.prescriptionFileName ?? null,
  });

  const { data: order, error } = await supabase
    .from("medicine_orders")
    .insert({
      patient_id: params.patientId,
      pharmacy_id: params.pharmacyId,
      delivery_address: params.formattedAddress,
      pincode: params.address.pincode,
      city: params.address.city,
      phone: params.phone,
      notes: [params.notes, addressMeta].filter(Boolean).join("\n---\n"),
      payment_mode: params.paymentMode,
      subtotal: bill.subtotal,
      delivery_fee: bill.deliveryFee,
      discount: 0,
      total: bill.grandTotal,
      eta_minutes: Math.max(25, Math.round(20 + params.distanceKm * 2)),
      status: "confirmed",
      rider_name: "Rajesh K.",
      rider_phone: "9876543210",
    })
    .select("id, order_number")
    .single();

  if (error) {
    const id = crypto.randomUUID();
    const orderNumber = `HS${Date.now().toString().slice(-8)}`;
    saveDemoOrder({
      id,
      order_number: orderNumber,
      patient_id: params.patientId,
      status: "confirmed",
      total: bill.grandTotal,
      subtotal: bill.subtotal,
      gst_total: bill.gstTotal,
      delivery_fee: bill.deliveryFee,
      prescription_file: params.prescriptionFileName ?? null,
      eta_minutes: 35,
      delivery_address: params.formattedAddress,
      city: params.address.city,
      pincode: params.address.pincode,
      rider_name: "Rajesh K.",
      rider_phone: "9876543210",
      created_at: now,
      items: params.items.map((i) => ({ medicine_name: i.name, quantity: i.quantity, unit_price: i.unitPrice })),
      events: [{ id: "1", status: "confirmed", title: "Pharmacy confirmed", description: "HealthSurya pharmacy accepted your order.", created_at: now }],
    });
    return { id, order_number: orderNumber };
  }

  for (const i of params.items) {
    if (!i.medicineId.startsWith("d")) {
      await supabase.from("medicine_order_items").insert({
        order_id: order.id,
        medicine_id: i.medicineId,
        medicine_name: i.name,
        quantity: i.quantity,
        unit_price: i.unitPrice,
      });
    } else {
      await supabase.from("medicine_order_items").insert({
        order_id: order.id,
        medicine_name: i.name,
        quantity: i.quantity,
        unit_price: i.unitPrice,
      });
    }
  }

  return order;
}

export function getDemoOrders(patientId: string) {
  try {
    const all = JSON.parse(localStorage.getItem(DEMO_ORDERS_KEY) ?? "[]");
    return all.filter((o: { patient_id: string }) => o.patient_id === patientId);
  } catch {
    return [];
  }
}

export function getDemoOrder(orderId: string) {
  try {
    const all = JSON.parse(localStorage.getItem(DEMO_ORDERS_KEY) ?? "[]");
    return all.find((o: { id: string }) => o.id === orderId) ?? null;
  } catch {
    return null;
  }
}
