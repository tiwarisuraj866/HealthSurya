import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { safeRedirectPath } from "@/lib/auth-redirect";
import { Button } from "@/components/ui/button";
import { LogIn, UserPlus } from "lucide-react";
import Link from "next/link";

/** Shown inside booking dialogs when user is not signed in. */
export function RequireAuthGate({ redirectTo, actionLabel }: { redirectTo: string; actionLabel: string }) {
  const router = useRouter();
  const safeRedirect = safeRedirectPath(redirectTo);

  return (
    <div className="space-y-4 py-2 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <LogIn className="h-7 w-7" />
      </div>
      <div>
        <p className="font-semibold">Sign in to {actionLabel}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a free patient account to book appointments and lab tests securely.
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button className="flex-1 gap-2" onClick={() => router.push(`/login?redirect=${encodeURIComponent(safeRedirect)}`)}>
          <LogIn className="h-4 w-4" />
          Sign in
        </Button>
        <Button variant="outline" className="flex-1 gap-2" asChild>
          <Link href={`/register?redirect=${encodeURIComponent(safeRedirect)}&role=patient`}>
            <UserPlus className="h-4 w-4" />
            Register
          </Link>
        </Button>
      </div>
    </div>
  );
}

/** Returns true if user can proceed; otherwise redirects to login. */
export function useRequireAuthRedirect() {
  const { user, loading } = useAuth();
  const router = useRouter();

  return {
    user,
    loading,
    requireAuth: (redirectTo: string, onAuthed: () => void) => {
      if (loading) return;
      if (!user) {
        router.push(`/login?redirect=${encodeURIComponent(safeRedirectPath(redirectTo))}`);
        return;
      }
      onAuthed();
    },
  };
}
