import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { captchaMatches, createCaptchaChallenge } from "@/lib/captcha";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onChallengeChange?: (code: string) => void;
};

export function LoginCaptcha({ value, onChange, onChallengeChange }: Props) {
  const [challenge, setChallenge] = useState({ code: "•••••" });

  const refresh = useCallback(() => {
    const next = createCaptchaChallenge();
    setChallenge(next);
    onChange("");
    onChallengeChange?.(next.code);
  }, [onChange, onChallengeChange]);

  useEffect(() => {
    const initial = createCaptchaChallenge();
    setChallenge(initial);
  }, []);

  useEffect(() => {
    if (challenge.code && challenge.code !== "•••••") {
      onChallengeChange?.(challenge.code);
    }
  }, [challenge.code, onChallengeChange]);

  return (
    <div className="space-y-1.5">
      <Label htmlFor="login-captcha">Security code (required)</Label>
      <div className="flex items-center gap-2">
        <div
          className="flex h-10 min-w-[7rem] select-none items-center justify-center rounded-md border bg-muted font-mono text-lg font-bold tracking-[0.35em] text-foreground"
          aria-hidden
        >
          {challenge.code}
        </div>
        <Button type="button" variant="outline" size="icon" className="h-10 w-10 shrink-0" onClick={refresh} aria-label="New code">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      <Input
        id="login-captcha"
        className="min-h-10 font-mono uppercase tracking-widest"
        placeholder="Enter code above"
        required
        autoComplete="off"
        inputMode="text"
        maxLength={8}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <p className="text-[10px] text-muted-foreground">Codes are case-insensitive. Refresh if hard to read.</p>
    </div>
  );
}

export function validateLoginCaptcha(input: string, expected: string): boolean {
  return captchaMatches(input, expected);
}
