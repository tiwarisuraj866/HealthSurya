import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, Pill, Beaker } from "lucide-react";

type Variant = "medicine" | "blood_test" | "both";

export function RefundPolicyNotice({ variant = "both", compact = false }: { variant?: Variant; compact?: boolean }) {
  const showMed = variant === "medicine" || variant === "both";
  const showBlood = variant === "blood_test" || variant === "both";

  return (
    <div className={compact ? "space-y-2 text-xs" : "space-y-3"}>
      {showMed && (
        <Alert className="border-primary/20 bg-primary/5">
          <Pill className="h-4 w-4 text-primary" />
          <AlertTitle className="text-sm">Medicine refund policy</AlertTitle>
          <AlertDescription className="text-xs leading-relaxed text-muted-foreground">
            Refunds for medicine orders are accepted within <strong>2 days</strong> of delivery only for damaged,
            wrong, or missing items (with photo proof). Opened medicines and Rx items cannot be returned once
            dispatched. COD refunds are processed to your HealthSurya wallet or bank within 5–7 working days.
          </AlertDescription>
        </Alert>
      )}
      {showBlood && (
        <Alert className="border-warning/30 bg-warning/10">
          <Beaker className="h-4 w-4 text-warning-foreground" />
          <AlertTitle className="text-sm">Blood test / sample collection</AlertTitle>
          <AlertDescription className="text-xs leading-relaxed text-muted-foreground">
            <strong>No refund</strong> after the sample has been collected from your home or at the lab.
            Cancellation with full refund is allowed only before sample collection. Home collection charges are
            non-refundable once the phlebotomist is dispatched.
          </AlertDescription>
        </Alert>
      )}
      {!compact && (
        <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          By placing an order you agree to our{" "}
          <Link href="/legal/refund-cancellation-policy" className="font-medium text-primary hover:underline">
            Refund &amp; Cancellation Policy
          </Link>
          . Contact support@healthsurya.com for disputes.
        </p>
      )}
    </div>
  );
}
