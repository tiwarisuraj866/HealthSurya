"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMedicineCart } from "@/lib/medicine-cart";
import { calculateMedicineDeliveryFee } from "@/lib/delivery-pricing";
import { calculateMedicineBill } from "@/lib/billing";
import { cartItemNeedsRx } from "@/lib/medicine";
import { PrescriptionUploadBlock, hasValidPrescription } from "@/components/PrescriptionUploadBlock";
import { MedicineBillSummary } from "@/components/MedicineBillSummary";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { ShoppingBag, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function MedicineCartPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { items, subtotal, updateQty, removeItem, count } = useMedicineCart();
  const [rxUploaded, setRxUploaded] = useState(false);

  useEffect(() => {
    setRxUploaded(hasValidPrescription(false));
  }, []);

  const normalizedItems = useMemo(
    () => items.map((i) => ({ ...i, category: i.category ?? "" })),
    [items],
  );

  const rxItems = useMemo(
    () => normalizedItems.filter(cartItemNeedsRx),
    [normalizedItems],
  );
  const needsRx = rxItems.length > 0;

  const fee = useMemo(() => calculateMedicineDeliveryFee(subtotal, "400001"), [subtotal]);
  const bill = useMemo(() => calculateMedicineBill(subtotal, fee.finalFee), [subtotal, fee.finalFee]);

  const proceed = () => {
    if (needsRx && !hasValidPrescription(true)) {
      return toast.error("Upload doctor prescription for Rx medicines before checkout");
    }
    if (!user) {
      router.push("/login?redirect=/medicine-checkout");
    } else {
      router.push("/medicine-checkout");
    }
  };

  if (count === 0) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
        <ShoppingBag className="h-16 w-16 text-muted-foreground/40" />
        <h1 className="mt-4 text-2xl font-bold font-sans">Your shopping cart is empty</h1>
        <p className="mt-2 text-muted-foreground text-sm">Browse medicines in the pharmacy section and add items to get started.</p>
        <Button asChild className="mt-6 btn-gradient"><Link href="/medicine">Shop medicines</Link></Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link href="/medicine" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Continue shopping
      </Link>

      <h1 className="text-3xl font-bold font-sans tracking-tight">Medicine Cart</h1>
      <p className="mt-1 text-sm text-muted-foreground">{count} item(s) · Tax calculated on product price</p>

      {needsRx && (
        <div className="mt-6">
          <PrescriptionUploadBlock
            required
            rxItemNames={rxItems.map((i) => `${i.name} × ${i.quantity}`)}
            onChange={() => setRxUploaded(hasValidPrescription(true))}
          />
        </div>
      )}

      <div className="mt-6 space-y-3">
        {normalizedItems.map((item) => (
          <div key={item.medicineId} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card/60 glass p-4 shadow-sm">
            <div>
              <p className="font-semibold text-foreground">{item.name}</p>
              <p className="text-xs text-primary font-medium mt-0.5">₹{item.price} each + 12% GST</p>
              {cartItemNeedsRx(item) && (
                <p className="text-[10px] uppercase font-bold tracking-wider text-amber-600 dark:text-amber-500 mt-1">Rx · Doctor prescription required</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-lg border glass bg-card/30">
                <Button variant="ghost" size="sm" onClick={() => updateQty(item.medicineId, item.quantity - 1)} className="h-8 w-8">−</Button>
                <span className="w-6 text-center text-xs font-semibold">{item.quantity}</span>
                <Button variant="ghost" size="sm" onClick={() => updateQty(item.medicineId, item.quantity + 1)} className="h-8 w-8">+</Button>
              </div>
              <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => removeItem(item.medicineId)}>Remove</Button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border bg-card p-5 shadow-sm space-y-4">
        <MedicineBillSummary bill={bill} distanceKm={fee.distanceKm} compact />
        {subtotal < 499 && (
          <p className="text-[10px] text-muted-foreground border-t pt-2 mt-2">
            Tip: Orders above ₹499 get 30% off delivery · ₹999+ gets 50% off · ₹1499+ gets FREE delivery!
          </p>
        )}
        <Button className="w-full btn-gradient h-11" onClick={proceed} disabled={needsRx && !rxUploaded}>
          {needsRx && !rxUploaded ? "Upload prescription to continue" : "Proceed to checkout"}
        </Button>
      </div>
    </div>
  );
}
