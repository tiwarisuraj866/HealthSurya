import { useState } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MedicineDetailInfo } from "@/components/MedicineDetailInfo";
import { discountPct, medicineNeedsPrescription, type CatalogMedicine } from "@/lib/medicine";
import { estimateApproxExpiry } from "@/lib/medicine-expiry";
import { useMedicineCart } from "@/lib/medicine-cart";
import { Pill, Zap, ExternalLink } from "lucide-react";
import { toast } from "sonner";

type Props = {
  med: CatalogMedicine | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function MedicinePreviewDialog({ med, open, onOpenChange }: Props) {
  const { addItem } = useMedicineCart();
  const [qty, setQty] = useState(1);

  if (!med) return null;

  const off = discountPct(med.price, med.mrp);
  const needsRx = medicineNeedsPrescription(med.requires_prescription, med.category);
  const gstPrice = Math.round(med.price * 1.12 * 100) / 100;
  const expiry = estimateApproxExpiry(med.id);

  const handleAddToCart = () => {
    addItem(
      {
        medicineId: med.id,
        name: med.name,
        price: med.price,
        mrp: med.mrp,
        requiresPrescription: med.requires_prescription,
        category: med.category,
        pharmacyId: med.pharmacy_id,
      },
      qty,
    );
    toast.success(
      needsRx
        ? `${med.name} × ${qty} added — upload prescription before checkout`
        : `${med.name} × ${qty} added to cart`,
    );
    onOpenChange(false);
    setQty(1);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setQty(1); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="pr-6 text-left text-xl leading-snug">{med.name}</DialogTitle>
          <DialogDescription className="text-left">
            {med.pack_size ?? med.category} · Medicine details
          </DialogDescription>
        </DialogHeader>

        <div className="flex h-36 items-center justify-center rounded-xl bg-primary/5">
          <Pill className="h-16 w-16 text-primary/50" />
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{med.category}</Badge>
          {med.express_delivery && (
            <Badge className="gap-1">
              <Zap className="h-3 w-3" /> Express delivery
            </Badge>
          )}
          {off > 0 && <Badge className="bg-accent text-accent-foreground">{off}% OFF</Badge>}
        </div>

        <MedicineDetailInfo med={med} />

        <dl className="grid gap-2 text-sm">
          {med.pack_size && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Pack size</dt>
              <dd className="font-medium">{med.pack_size}</dd>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Approx. expiry</dt>
            <dd className="font-medium">{expiry.label}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">MRP</dt>
            <dd className="text-muted-foreground line-through">₹{med.mrp}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Price</dt>
            <dd className="text-lg font-bold text-primary">₹{med.price}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">With GST (12%)</dt>
            <dd className="font-medium">₹{gstPrice.toFixed(2)}</dd>
          </div>
        </dl>

        {med.description && (
          <p className="text-sm leading-relaxed text-muted-foreground">{med.description}</p>
        )}

        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Quantity</span>
          <div className="flex items-center rounded-lg border">
            <Button variant="ghost" size="sm" onClick={() => setQty((n) => Math.max(1, n - 1))}>−</Button>
            <span className="w-8 text-center text-sm font-medium">{qty}</span>
            <Button variant="ghost" size="sm" onClick={() => setQty((n) => n + 1)}>+</Button>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" className="flex-1 gap-2" asChild>
            <Link href={`/medicine/${med.slug}`} onClick={() => onOpenChange(false)}>
              <ExternalLink className="h-4 w-4" /> Full details
            </Link>
          </Button>
          <Button className="flex-1" onClick={handleAddToCart}>
            Add {qty} to cart · ₹{(med.price * qty).toFixed(0)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
