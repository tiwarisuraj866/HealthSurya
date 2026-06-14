import type { MedicineBill } from "@/lib/billing";

type Props = {
  bill: MedicineBill;
  distanceKm?: number;
  compact?: boolean;
};

export function MedicineBillSummary({ bill, distanceKm, compact = false }: Props) {
  return (
    <div className={`space-y-1 ${compact ? "text-sm" : ""}`}>
      <div className="flex justify-between">
        <span>Items subtotal</span>
        <span>₹{bill.subtotal.toFixed(2)}</span>
      </div>
      <div className="flex justify-between text-muted-foreground">
        <span>GST on medicines (12%)</span>
        <span>₹{bill.medicineGst.toFixed(2)}</span>
      </div>
      <div className="flex justify-between text-muted-foreground">
        <span>Delivery{distanceKm != null ? ` (~${distanceKm} km)` : ""} (no GST)</span>
        <span>{bill.deliveryFee === 0 ? "FREE" : `₹${bill.deliveryFee.toFixed(2)}`}</span>
      </div>
      <div className="flex justify-between border-t pt-2 text-xs text-muted-foreground">
        <span>CGST</span>
        <span>₹{bill.cgst.toFixed(2)}</span>
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>SGST</span>
        <span>₹{bill.sgst.toFixed(2)}</span>
      </div>
      <div className="flex justify-between border-t pt-2 text-base font-bold">
        <span>Grand total (incl. GST)</span>
        <span className="text-primary">₹{bill.grandTotal.toFixed(2)}</span>
      </div>
    </div>
  );
}
