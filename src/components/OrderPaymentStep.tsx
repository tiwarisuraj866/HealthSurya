import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { RefundPolicyNotice } from "@/components/RefundPolicyNotice";

type PaymentMode = "cod" | "prepaid" | "wallet";

type Props = {
  payment: PaymentMode;
  onPaymentChange: (v: PaymentMode) => void;
  policyAccepted: boolean;
  onPolicyChange: (v: boolean) => void;
  policyVariant: "medicine" | "blood_test";
  prepaidAvailable?: boolean;
};

export function OrderPaymentStep({
  payment,
  onPaymentChange,
  policyAccepted,
  onPolicyChange,
  policyVariant,
  prepaidAvailable = true,
}: Props) {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border bg-card p-5">
        <Label className="text-base font-semibold">Payment method</Label>
        <p className="mb-3 text-sm text-muted-foreground">Choose how you want to pay — secure & instant confirmation.</p>
        <RadioGroup value={payment} onValueChange={(v) => onPaymentChange(v as PaymentMode)} className="grid gap-2">
          <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${payment === "cod" ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}>
            <RadioGroupItem value="cod" className="mt-1" />
            <div>
              <p className="font-medium">Cash on delivery (COD)</p>
              <p className="text-xs text-muted-foreground">Pay when medicines arrive or after sample collection.</p>
            </div>
          </label>
          {prepaidAvailable && (
            <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${payment === "prepaid" ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}>
              <RadioGroupItem value="prepaid" className="mt-1" />
              <div>
                <p className="font-medium">Pay online — UPI / Card / Net banking</p>
                <p className="text-xs text-muted-foreground">Faster confirmation · Recommended for express delivery.</p>
              </div>
            </label>
          )}
          <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${payment === "wallet" ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}>
            <RadioGroupItem value="wallet" className="mt-1" />
            <div>
              <p className="font-medium">HealthSurya wallet</p>
              <p className="text-xs text-muted-foreground">Use wallet balance if available.</p>
            </div>
          </label>
        </RadioGroup>
      </div>

      <RefundPolicyNotice variant={policyVariant} compact />

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border bg-muted/30 p-4">
        <Checkbox checked={policyAccepted} onCheckedChange={(c) => onPolicyChange(c === true)} className="mt-0.5" />
        <span className="text-sm leading-snug">
          I have read and agree to the refund & cancellation policy for {policyVariant === "medicine" ? "medicine delivery" : "lab tests / sample collection"}.
        </span>
      </label>
    </div>
  );
}
