"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getMedicines } from "@/app/actions";
import { discountPct, medicineNeedsPrescription, type CatalogMedicine } from "@/lib/medicine";
import { estimateApproxExpiry } from "@/lib/medicine-expiry";
import { useMedicineCart } from "@/lib/medicine-cart";
import { MedicineDetailInfo } from "@/components/MedicineDetailInfo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pill, Zap, ArrowLeft, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

export default function MedicineDetailClient({ medicineId }: { medicineId: string }) {
  const router = useRouter();
  const { addItem } = useMedicineCart();
  const [med, setMed] = useState<CatalogMedicine | null>(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const list = await getMedicines({});
        const item = (list as unknown as CatalogMedicine[]).find((m) => m.slug === medicineId || m.id === medicineId);
        setMed(item ?? null);
      } catch (err) {
        console.error("Error fetching medicine detail:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [medicineId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p className="mt-4 text-muted-foreground text-sm">Loading product details...</p>
      </div>
    );
  }

  if (!med) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <p className="text-muted-foreground text-sm">Medicine not found in catalog.</p>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/medicine"><ArrowLeft className="mr-2 h-4 w-4" /> Back to store</Link>
        </Button>
      </div>
    );
  }

  const off = discountPct(med.price, med.mrp);
  const expiry = estimateApproxExpiry(med.id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link href="/medicine" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to store
      </Link>

      <div className="mt-6 grid gap-8 md:grid-cols-2">
        <div className="flex aspect-square items-center justify-center rounded-2xl border bg-primary/5 shadow-inner">
          <Pill className="h-24 w-24 text-primary/40" />
        </div>
        <div className="flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="secondary" className="glass bg-secondary/80">{med.category}</Badge>
              {med.express_delivery && <Badge className="gap-1 bg-primary/10 text-primary border-primary/20 hover:bg-primary/10"><Zap className="h-3 w-3" /> Express</Badge>}
              {off > 0 && <Badge className="bg-accent text-accent-foreground">{off}% OFF</Badge>}
            </div>
            <h1 className="mt-3 text-3xl font-bold font-sans text-foreground">{med.name}</h1>
            {med.pack_size && <p className="text-sm text-muted-foreground mt-0.5">{med.pack_size}</p>}

            <div className="mt-4">
              <MedicineDetailInfo med={med} />
            </div>

            {med.description && <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{med.description}</p>}

            <div className="mt-4 pt-4 border-t space-y-1">
              <p className="text-sm text-muted-foreground">
                Approx. expiry date: <span className="font-semibold text-foreground">{expiry.label}</span>
              </p>
              <p className="text-xs text-muted-foreground">+ 12% GST calculated on product checkout · delivery has no GST</p>
            </div>
          </div>

          <div className="mt-8">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-primary">₹{med.price}</span>
              <span className="text-lg text-muted-foreground line-through font-medium">₹{med.mrp}</span>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex items-center rounded-lg border glass bg-card/30">
                <Button variant="ghost" size="sm" onClick={() => setQty((n) => Math.max(1, n - 1))} className="h-10 w-10 text-lg">−</Button>
                <span className="w-8 text-center text-sm font-semibold">{qty}</span>
                <Button variant="ghost" size="sm" onClick={() => setQty((n) => n + 1)} className="h-10 w-10 text-lg">+</Button>
              </div>
              <Button
                className="flex-1 btn-gradient h-11"
                onClick={() => {
                  addItem({
                    medicineId: med.id,
                    name: med.name,
                    price: med.price,
                    mrp: med.mrp,
                    requiresPrescription: med.requires_prescription,
                    category: med.category,
                    pharmacyId: med.pharmacy_id,
                  }, qty);
                  const needsRx = medicineNeedsPrescription(med.requires_prescription, med.category);
                  toast.success(
                    needsRx ? `Added ${qty} item(s) — upload prescription before checkout` : `Added ${qty} item(s) to cart`
                  );
                }}
              >
                Add to Cart
              </Button>
            </div>
            <Button asChild variant="outline" className="mt-3 w-full h-11 glass">
              <Link href="/medicine-cart" className="gap-2"><ShoppingCart className="h-4 w-4" /> View Shopping Cart</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
