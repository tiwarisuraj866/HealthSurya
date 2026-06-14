"use client";

// HealthSurya — OAuth (Google) callback with role-based login enforcement.
// If the user picked a role on the login screen (stored in sessionStorage
// before the OAuth redirect) and the authenticated account is registered
// under a different role, the session is rejected instead of silently
// logging them into the wrong portal.

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const ADMIN_ROLES = ["admin", "super_admin", "support", "finance", "marketing", "operations"];

function roleMatches(actual: string, intent: string) {
  if (ADMIN_ROLES.includes(actual)) return true;
  if (actual === intent) return true;
  if (actual === "lab_staff" && intent === "lab") return true;
  if (actual === "pharmacy_staff" && intent === "pharmacy") return true;
  return false;
}

export default function SSOCallbackPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const handled = useRef(false);

  useEffect(() => {
    if (loading || !user || handled.current) return;

    let intent: string | null = null;
    try { intent = sessionStorage.getItem("hs_intent_role"); } catch {}
    if (!intent) return; // no role selected — nothing to enforce

    handled.current = true;
    try { sessionStorage.removeItem("hs_intent_role"); } catch {}

    if (!roleMatches(user.role, intent)) {
      toast.error(
        `Role mismatch: this Google account is registered as "${user.role}". ` +
          `Please select the matching role and sign in again.`,
        { duration: 6000 }
      );
      (async () => {
        await signOut();
        router.replace(`/login?role=${encodeURIComponent(intent!)}`);
      })();
    }
  }, [loading, user, signOut, router]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Completing secure sign-in…</p>
      <AuthenticateWithRedirectCallback />
    </div>
  );
}
