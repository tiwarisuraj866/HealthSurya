import { getPasswordStrength } from "@/lib/user-validation";
import { cn } from "@/lib/utils";

interface PasswordStrengthBarProps {
  password: string;
  showLabel?: boolean;
}

export function PasswordStrengthBar({ password, showLabel = true }: PasswordStrengthBarProps) {
  if (!password) return null;
  const { score, label, color } = getPasswordStrength(password);

  return (
    <div className="space-y-1.5 mt-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-all duration-300",
              i < score ? color : "bg-muted"
            )}
          />
        ))}
      </div>
      {showLabel && (
        <p className={cn(
          "text-[10px] font-medium",
          score <= 1 && "text-destructive",
          score === 2 && "text-warning",
          score >= 3 && "text-success"
        )}>
          {label}
          {score >= 3 && " ✓"}
        </p>
      )}
    </div>
  );
}
