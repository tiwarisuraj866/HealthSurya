"use client";

import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ShieldX, ArrowLeft, LayoutDashboard } from "lucide-react";
import Link from "next/link";

export default function UnauthorizedPage() {
  const { user } = useAuth();

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="glass-card max-w-md w-full p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-6">
          <ShieldX className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Access Denied</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          You do not have the required permissions to access this page. 
          Your account role is restricted from viewing this module.
        </p>

        {user && (
          <div className="mt-6 rounded-lg bg-muted/40 p-4 text-left text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Your Role:</span> {user.role.toUpperCase()}
          </div>
        )}

        <div className="mt-8 flex flex-col gap-3">
          <Button className="w-full btn-gradient" asChild>
            <Link href="/dashboard">
              <LayoutDashboard className="mr-2 h-4 w-4" /> Go to Dashboard
            </Link>
          </Button>
          <Button variant="ghost" className="w-full" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" /> Return to Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
