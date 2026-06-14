"use client";

// HealthSurya V2 — Profile Completion widget (dashboard).
// Shows completion %, verification readiness, trust score and the
// single highest-impact next step. Links to the full KYC Centre.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Sparkles, ArrowRight, BadgeCheck, Lightbulb } from "lucide-react";
import { KYC_STATUS_LABEL, type KycStatus } from "@/lib/kyc";

interface KycSummary {
  percentage: number;
  readiness: "not_eligible" | "eligible" | "priority";
  status: KycStatus;
  missing: { key: string; label: string; weight: number; suggestion: string; required: boolean }[];
  trust: { score: number; grade: string };
}

const GRADE_LABEL: Record<string, string> = {
  new: "New", fair: "Fair", good: "Good", excellent: "Excellent",
};

export function ProfileCompletionCard() {
  const { user } = useAuth();
  const [data, setData] = useState<KycSummary | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const res = await fetch("/api/kyc");
        if (!res.ok) { setHidden(true); return; }
        setData(await res.json());
      } catch {
        setHidden(true);
      }
    })();
  }, [user]);

  if (!user || hidden) return null;

  // Skeleton shimmer while loading
  if (!data) {
    return (
      <div className="animate-pulse rounded-2xl border bg-card p-5">
        <div className="h-4 w-44 rounded bg-muted" />
        <div className="mt-3 h-2.5 w-full rounded bg-muted" />
        <div className="mt-3 h-3 w-2/3 rounded bg-muted" />
      </div>
    );
  }

  const approved = data.status === "approved";
  const nextStep = [...(data.missing ?? [])].sort((a, b) => b.weight - a.weight)[0];

  return (
    <div className="relative overflow-hidden rounded-2xl border bg-card p-5">
      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-primary/10 blur-2xl" />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <ShieldCheck className="h-4 w-4 text-primary" /> Profile Completion
        </p>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="h-3 w-3" /> Trust: {GRADE_LABEL[data.trust?.grade] ?? "New"}
          </Badge>
          <Badge variant={approved ? "default" : "outline"} className="gap-1">
            {approved && <BadgeCheck className="h-3 w-3" />}
            {KYC_STATUS_LABEL[data.status] ?? data.status}
          </Badge>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <Progress value={data.percentage} className="h-2.5 flex-1" />
        <span className="text-sm font-bold tabular-nums">{data.percentage}%</span>
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        {data.readiness === "priority"
          ? "100% complete — your profile gets priority verification review."
          : data.readiness === "eligible"
          ? "You're eligible for verification review. Optional documents boost your trust score."
          : `Reach 80% to become eligible for verification (${Math.max(0, 80 - data.percentage)}% to go).`}
      </p>

      {!approved && nextStep && (
        <p className="mt-2 flex items-start gap-1.5 rounded-xl bg-primary/5 px-3 py-2 text-xs">
          <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <span><span className="font-medium">{nextStep.label}</span> — {nextStep.suggestion} (+{nextStep.weight}%)</span>
        </p>
      )}

      <Button asChild size="sm" variant={approved ? "outline" : "default"} className="mt-3 w-full sm:w-auto">
        <Link href="/kyc">
          {approved ? "View KYC Centre" : "Continue verification"} <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
        </Link>
      </Button>
    </div>
  );
}
