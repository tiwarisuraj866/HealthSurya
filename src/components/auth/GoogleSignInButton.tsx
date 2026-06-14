import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useSignIn } from "@clerk/nextjs";
import { toast } from "sonner";

export function GoogleSignInButton({
  redirectPath,
  disabled,
  className,
  role,
  intentRole,
}: {
  redirectPath: string;
  disabled?: boolean;
  className?: string;
  role?: string;
  intentRole?: string;
}) {
  const [loading, setLoading] = useState(false);
  const { signIn, isLoaded } = useSignIn() as any;

  const onClick = async () => {
    if (!isLoaded || !signIn) {
      toast.error("Authentication service is loading. Please try again.");
      return;
    }
    setLoading(true);
    try {
      const activeRole = role || intentRole;
      if (activeRole) {
        try { sessionStorage.setItem("hs_intent_role", activeRole); } catch {}
        if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === "pk_test_Y2xlcmsubW9jay5kZXYk") {
          document.cookie = `sb_session=${activeRole}; path=/`;
          document.cookie = `mock_role=${activeRole}; path=/`;
        }
      }
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: redirectPath,
      });
    } catch (err: any) {
      toast.error(err?.message || "Could not connect to Google. Check Clerk settings.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className={`w-full min-h-11 gap-2 border-border/80 bg-background/80 transition-transform hover:scale-[1.01] hover:bg-background ${className ?? ""}`}
      onClick={onClick}
      disabled={loading || disabled}
    >
      <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
      {loading ? "Redirecting to Google…" : "Continue with Google"}
    </Button>
  );
}
