import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  loadPrescriptionUpload,
  savePrescriptionUpload,
  clearPrescriptionUpload,
  processPrescriptionFile,
  type PrescriptionUpload,
} from "@/lib/prescription";
import { FileText, Upload, X, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

type Props = {
  required: boolean;
  rxItemNames: string[];
  onChange?: (upload: PrescriptionUpload | null) => void;
};

export function PrescriptionUploadBlock({ required, rxItemNames, onChange }: Props) {
  const [upload, setUpload] = useState<PrescriptionUpload | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = loadPrescriptionUpload();
    setUpload(saved);
    onChange?.(saved);
  }, [onChange]);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setLoading(true);
    try {
      const processed = await processPrescriptionFile(file);
      savePrescriptionUpload(processed);
      setUpload(processed);
      onChange?.(processed);
      toast.success("Prescription uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const remove = () => {
    clearPrescriptionUpload();
    setUpload(null);
    onChange?.(null);
  };

  if (!required && rxItemNames.length === 0) return null;

  return (
    <div className="rounded-2xl border border-warning/40 bg-warning/5 p-5">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning-foreground" />
        <div className="flex-1">
          <Label className="text-base font-semibold">
            Doctor prescription {required ? "required" : ""}
          </Label>
          <p className="mt-1 text-sm text-muted-foreground">
            Your cart includes prescription (Rx) medicines. Upload a valid doctor prescription before checkout.
          </p>
          <ul className="mt-2 list-inside list-disc text-xs text-muted-foreground">
            {rxItemNames.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>
      </div>

      {upload ? (
        <Alert className="mt-4 border-success/30 bg-success/10">
          <CheckCircle2 className="h-4 w-4 text-success" />
          <AlertTitle className="text-sm">Prescription uploaded</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-2 text-xs">
            <span className="flex items-center gap-1 truncate">
              <FileText className="h-3.5 w-3.5 shrink-0" />
              {upload.fileName}
            </span>
            <Button type="button" variant="ghost" size="sm" className="h-7 shrink-0 text-destructive" onClick={remove}>
              <X className="h-3.5 w-3.5" /> Remove
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-primary/40 bg-background p-6 transition-colors hover:bg-primary/5">
          <Upload className="h-8 w-8 text-primary/60" />
          <span className="mt-2 text-sm font-medium">{loading ? "Uploading…" : "Click to upload prescription"}</span>
          <span className="text-xs text-muted-foreground">JPG, PNG, WEBP or PDF · Max 4 MB</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="sr-only"
            disabled={loading}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </label>
      )}
    </div>
  );
}

export function hasValidPrescription(required: boolean): boolean {
  if (!required) return true;
  return loadPrescriptionUpload() != null;
}
