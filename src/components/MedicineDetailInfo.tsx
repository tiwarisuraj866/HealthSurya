import { estimateApproxExpiry, estimatePharmacySellerCount } from "@/lib/medicine-expiry";
import { medicineNeedsPrescription, type CatalogMedicine } from "@/lib/medicine";
import { Badge } from "@/components/ui/badge";
import { Calendar, Store } from "lucide-react";

type Props = {
  med: CatalogMedicine;
  showSellerNote?: boolean;
};

export function MedicineDetailInfo({ med, showSellerNote = true }: Props) {
  const expiry = estimateApproxExpiry(med.id);
  const sellerCount = med.seller_count ?? estimatePharmacySellerCount(med.id);
  const needsRx = medicineNeedsPrescription(med.requires_prescription, med.category);

  return (
    <div className="space-y-3 text-sm">
      {showSellerNote && (
        <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3">
          <Store className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-muted-foreground">
            Available from <span className="font-medium text-foreground">{sellerCount}+ verified pharmacies</span> near you.
            Seller names are not shown — the nearest partner will fulfil your order.
          </p>
        </div>
      )}

      <div className="flex items-start gap-2 rounded-lg border border-dashed p-3">
        <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div>
          <p className="font-medium">Approx. expiry date</p>
          <p className="text-muted-foreground">{expiry.label}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Batch varies by pharmacy. You will receive stock with at least 3 months shelf life.
          </p>
        </div>
      </div>

      {needsRx && (
        <Badge variant="outline" className="border-warning/50 text-warning-foreground">
          Rx · Doctor prescription required
        </Badge>
      )}
    </div>
  );
}
