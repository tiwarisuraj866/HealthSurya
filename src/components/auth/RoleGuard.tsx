"use client";

// HealthSurya V2 — Role-based access guard for client pages.
// Usage: <RoleGuard allow={["pharmacy"]}> ...dashboard... </RoleGuard>
// - Not signed in            → redirected to /login (with redirect back)
// - Signed in, wrong role    → redirected to /unauthorized
// - admin / super_admin      → always allowed (admin override)

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth, type AppRole } from "@/lib/auth";
import { Loader2 } from "lucide-react";

export function RoleGuard({
  allow,
  children,
  allowAdmin = true,
}: {
  allow: AppRole[];
  children: ReactNode;
  allowAdmin?: boolean;
}) {
  const { user, roles, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isAdmin = roles.includes("admin") || roles.includes("super_admin");
  const permitted = roles.some((r) => allow.includes(r)) || (allowAdmin && isAdmin);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname || "/dashboard")}`);
      return;
    }
    if (!permitted) {
      router.replace("/unauthorized");
    }
  }, [loading, user, permitted, router, pathname]);

  if (loading || !user || !permitted) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
