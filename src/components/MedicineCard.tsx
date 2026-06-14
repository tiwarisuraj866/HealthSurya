import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MedicinePreviewDialog } from "@/components/MedicinePreviewDialog";
import { discountPct, medicineNeedsPrescription, type CatalogMedicine } from "@/lib/medicine";
import { useMedicineCart } from "@/lib/medicine-cart";
import { Pill, Zap, Eye } from "lucide-react";
import { toast } from "sonner";

export function MedicineCard({ med }: { med: CatalogMedicine }) {
  const { addItem } = useMedicineCart();
  const [previewOpen, setPreviewOpen] = useState(false);
  const off = discountPct(med.price, med.mrp);

  const addToCart = () => {
    const needsRx = medicineNeedsPrescription(med.requires_prescription, med.category);
    addItem({
      medicineId: med.id,
      name: med.name,
      price: med.price,
      mrp: med.mrp,
      requiresPrescription: med.requires_prescription,
      category: med.category,
      pharmacyId: med.pharmacy_id,
    });
    toast.success(
      needsRx
        ? `${med.name} added — upload doctor prescription before checkout`
        : `${med.name} added to cart`,
    );
  };

  return (
    <>
      <div className="group flex flex-col rounded-2xl border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
        <button
          type="button"
          className="flex flex-1 flex-col text-left"
          onClick={() => setPreviewOpen(true)}
        >
          <div className="relative flex h-28 items-center justify-center rounded-xl bg-primary/5">
            <Pill className="h-10 w-10 text-primary/60" />
            {off > 0 && (
              <Badge className="absolute left-2 top-2 bg-accent text-accent-foreground">{off}% OFF</Badge>
            )}
            {med.express_delivery && (
              <Badge variant="secondary" className="absolute right-2 top-2 gap-1 text-[10px]">
                <Zap className="h-3 w-3" /> Express
              </Badge>
            )}
          </div>
          <h3 className="mt-3 line-clamp-2 text-sm font-semibold leading-snug">{med.name}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{med.pack_size}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-lg font-bold text-primary">₹{med.price}</span>
            <span className="text-xs text-muted-foreground line-through">₹{med.mrp}</span>
          </div>
          {medicineNeedsPrescription(med.requires_prescription, med.category) && (
            <Badge variant="outline" className="mt-2 w-fit border-warning/50 text-[10px] text-warning-foreground">
              Rx · Prescription required
            </Badge>
          )}
        </button>

        <div className="mt-3 flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 gap-1"
            onClick={() => setPreviewOpen(true)}
          >
            <Eye className="h-3.5 w-3.5" /> Detail
          </Button>
          <Button size="sm" className="flex-1" onClick={addToCart}>
            Add to cart
          </Button>
        </div>
      </div>

      <MedicinePreviewDialog med={med} open={previewOpen} onOpenChange={setPreviewOpen} />
    </>
  );
}
