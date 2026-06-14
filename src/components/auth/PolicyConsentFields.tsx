import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export function PolicyConsentFields({
  termsAccepted,
  privacyAccepted,
  onTermsChange,
  onPrivacyChange,
}: {
  termsAccepted: boolean;
  privacyAccepted: boolean;
  onTermsChange: (v: boolean) => void;
  onPrivacyChange: (v: boolean) => void;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-primary/15 bg-primary/5 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">Required agreements</p>

      <div className="flex items-start gap-3">
        <Checkbox
          id="terms-consent"
          className="mt-0.5 h-5 w-5"
          checked={termsAccepted}
          onCheckedChange={(c) => onTermsChange(c === true)}
        />
        <Label htmlFor="terms-consent" className="cursor-pointer text-xs leading-relaxed font-normal text-muted-foreground">
          I accept the{" "}
          <Link href="/legal/terms-of-service" className="font-medium text-primary hover:underline" target="_blank">
            Terms of Service
          </Link>
          {" "}and{" "}
          <Link href="/legal/user-registration-policy" className="font-medium text-primary hover:underline" target="_blank">
            User Registration Policy
          </Link>
          . <span className="text-destructive">*</span>
        </Label>
      </div>

      <div className="flex items-start gap-3">
        <Checkbox
          id="privacy-consent"
          className="mt-0.5 h-5 w-5"
          checked={privacyAccepted}
          onCheckedChange={(c) => onPrivacyChange(c === true)}
        />
        <Label htmlFor="privacy-consent" className="cursor-pointer text-xs leading-relaxed font-normal text-muted-foreground">
          I have read and agree to the{" "}
          <Link href="/legal/privacy-policy" className="font-medium text-primary hover:underline" target="_blank">
            Privacy Policy
          </Link>
          {" "}and consent to processing of my health-related booking data. <span className="text-destructive">*</span>
        </Label>
      </div>
    </div>
  );
}

export function policiesAccepted(terms: boolean, privacy: boolean): boolean {
  return terms && privacy;
}
