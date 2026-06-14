"use client";

import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ShieldAlert, LogOut, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function SuspendedPage() {
  const { signOut } = useAuth();

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="glass-card max-w-md w-full p-8 text-center border-destructive/20">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-6">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-destructive">Account Suspended</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Your HealthSurya account has been suspended due to policy violations, verification failure, or administrative action.
        </p>

        <p className="mt-6 text-xs text-muted-foreground">
          If you believe this is a mistake, please reach out to our compliance team at{" "}
          <span className="font-semibold text-foreground">compliance@healthsurya.com</span>.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <Button variant="outline" className="w-full" onClick={() => signOut()}>
            <LogOut className="mr-2 h-4 w-4" /> Sign out
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
