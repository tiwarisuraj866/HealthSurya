import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface FieldErrorProps {
  error?: string | null;
  valid?: boolean;
  className?: string;
}

/** Inline field-level error / success indicator */
export function FieldError({ error, valid, className }: FieldErrorProps) {
  if (!error && !valid) return null;
  return (
    <p className={cn(
      "flex items-center gap-1 text-xs mt-1",
      error ? "text-destructive" : "text-success",
      className
    )}>
      {error ? (
        <><AlertCircle className="h-3 w-3 shrink-0" />{error}</>
      ) : (
        <><CheckCircle2 className="h-3 w-3 shrink-0" />Looks good</>
      )}
    </p>
  );
}
