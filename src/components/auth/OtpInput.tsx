import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  autoFocus?: boolean;
}

/**
 * Accessible 6-box OTP input with auto-advance, paste support, and backspace.
 */
export function OtpInput({ value, onChange, length = 6, disabled = false, autoFocus = false }: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(length, "").split("").slice(0, length);

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  function handleChange(index: number, char: string) {
    const digit = char.replace(/\D/g, "").slice(-1);
    const next = digits.slice();
    next[index] = digit;
    const newVal = next.join("").slice(0, length);
    onChange(newVal);
    if (digit && index < length - 1) {
      refs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (digits[index]) {
        const next = digits.slice();
        next[index] = "";
        onChange(next.join(""));
      } else if (index > 0) {
        refs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      refs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      refs.current[index + 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    onChange(pasted);
    const nextFocus = Math.min(pasted.length, length - 1);
    refs.current[nextFocus]?.focus();
  }

  return (
    <div
      className="flex gap-2 justify-center"
      role="group"
      aria-label="One-time password"
    >
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]"
          maxLength={1}
          value={digits[i] || ""}
          disabled={disabled}
          aria-label={`Digit ${i + 1}`}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className={cn(
            "h-12 w-10 rounded-lg border-2 text-center text-xl font-bold tabular-nums transition-all outline-none",
            "bg-card text-foreground",
            "border-border focus:border-primary focus:ring-2 focus:ring-primary/20",
            digits[i] && "border-primary bg-primary/5",
            disabled && "opacity-50 cursor-not-allowed",
            "sm:h-14 sm:w-12 sm:text-2xl"
          )}
        />
      ))}
    </div>
  );
}
