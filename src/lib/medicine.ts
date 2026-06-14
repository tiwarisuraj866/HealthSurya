export const MEDICINE_CATEGORIES = [
  "Pain Relief",
  "Diabetes",
  "Vitamins",
  "Allergy",
  "Heart Care",
  "Personal Care",
  "Digestive Care",
  "Antibiotics",
] as const;

export type MedicineOrderStatus =
  | "pending"
  | "confirmed"
  | "packing"
  | "picked_up"
  | "out_for_delivery"
  | "nearby"
  | "delivered"
  | "cancelled";

export const TRACKING_STEPS: { status: MedicineOrderStatus; label: string }[] = [
  { status: "pending", label: "Order placed" },
  { status: "confirmed", label: "Confirmed" },
  { status: "packing", label: "Packing" },
  { status: "picked_up", label: "Picked up" },
  { status: "out_for_delivery", label: "On the way" },
  { status: "nearby", label: "Nearby" },
  { status: "delivered", label: "Delivered" },
];

export const DEFAULT_PHARMACY_ID = "a0000000-0000-4000-8000-000000000001";

export interface CatalogMedicine {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string | null;
  manufacturer: string | null;
  pack_size: string | null;
  requires_prescription: boolean;
  price: number;
  mrp: number;
  express_delivery: boolean;
  pharmacy_id: string;
  /** How many verified pharmacies stock this medicine */
  seller_count?: number;
}

/** Categories where doctor prescription is mandatory (Schedule H / Rx) */
export const PRESCRIPTION_CATEGORIES = [
  "Antibiotics",
  "Diabetes",
  "Heart Care",
] as const;

export function medicineNeedsPrescription(requiresPrescription: boolean, category: string): boolean {
  return requiresPrescription || (PRESCRIPTION_CATEGORIES as readonly string[]).includes(category);
}

export interface CartItem {
  medicineId: string;
  name: string;
  price: number;
  mrp: number;
  quantity: number;
  requiresPrescription: boolean;
  category: string;
  pharmacyId: string;
}

export function cartItemNeedsRx(item: CartItem): boolean {
  return medicineNeedsPrescription(item.requiresPrescription, item.category);
}

/** Fallback catalog when Supabase tables are not migrated yet */
export const DEMO_CATALOG: CatalogMedicine[] = [
  { id: "d1", name: "Paracetamol 650mg", slug: "paracetamol-650", category: "Pain Relief", description: "Fast fever & pain relief", manufacturer: "HealthSurya Generics", pack_size: "15 tablets", requires_prescription: false, price: 28, mrp: 40, express_delivery: true, pharmacy_id: DEFAULT_PHARMACY_ID },
  { id: "d2", name: "Cetirizine 10mg", slug: "cetirizine-10", category: "Allergy", description: "Anti-allergy tablet", manufacturer: "Cipla", pack_size: "10 tablets", requires_prescription: false, price: 35, mrp: 55, express_delivery: true, pharmacy_id: DEFAULT_PHARMACY_ID },
  { id: "d3", name: "Dolo 650", slug: "dolo-650", category: "Pain Relief", description: "Trusted paracetamol brand", manufacturer: "Micro Labs", pack_size: "15 tablets", requires_prescription: false, price: 32, mrp: 45, express_delivery: true, pharmacy_id: DEFAULT_PHARMACY_ID },
  { id: "d4", name: "Vitamin D3 60K", slug: "vitamin-d3-60k", category: "Vitamins", description: "Weekly vitamin D supplement", manufacturer: "HealthSurya Wellness", pack_size: "4 capsules", requires_prescription: false, price: 120, mrp: 180, express_delivery: true, pharmacy_id: DEFAULT_PHARMACY_ID },
  { id: "d5", name: "Metformin 500mg", slug: "metformin-500", category: "Diabetes", description: "Blood sugar management", manufacturer: "USV", pack_size: "20 tablets", requires_prescription: true, price: 42, mrp: 58, express_delivery: true, pharmacy_id: DEFAULT_PHARMACY_ID },
  { id: "d6", name: "Zincovit Tablet", slug: "zincovit", category: "Vitamins", description: "Multivitamin with minerals", manufacturer: "Apex", pack_size: "15 tablets", requires_prescription: false, price: 165, mrp: 220, express_delivery: true, pharmacy_id: DEFAULT_PHARMACY_ID },
  { id: "d7", name: "ORS Powder", slug: "ors-powder", category: "Digestive Care", description: "Oral rehydration salts", manufacturer: "FDC", pack_size: "1 sachet", requires_prescription: false, price: 22, mrp: 30, express_delivery: true, pharmacy_id: DEFAULT_PHARMACY_ID },
  { id: "d8", name: "Vicks Vaporub", slug: "vicks-vaporub", category: "Personal Care", description: "Cold relief balm", manufacturer: "P&G", pack_size: "50ml", requires_prescription: false, price: 95, mrp: 130, express_delivery: true, pharmacy_id: DEFAULT_PHARMACY_ID },
];

export function discountPct(price: number, mrp: number) {
  if (mrp <= 0) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
}
