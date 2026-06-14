import type { Metadata } from "next";
import Link from "next/link";
import { POLICIES } from "@/lib/policies";
import { ChevronRight, Scale } from "lucide-react";

export const metadata: Metadata = {
  title: "Legal & Policies — HealthSurya",
  description: "Privacy policy, terms of service, data security, refund policy, and healthcare platform policies for HealthSurya users and partners.",
};

export default function LegalIndexPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 space-y-8">
      <div className="flex items-center gap-3 border-b pb-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/25 shadow-inner">
          <Scale className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold font-sans bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Legal & Policies
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Transparency and compliance guidelines for patients, doctors, labs, and pharmacies.
          </p>
        </div>
      </div>

      <ul className="divide-y divide-border/50 rounded-2xl border bg-card/40 glass overflow-hidden shadow-xl">
        {POLICIES.map((p) => (
          <li key={p.id} className="transition-colors hover:bg-card/60">
            <Link
              href={`/legal/${p.id}`}
              className="flex items-center justify-between gap-4 px-6 py-4.5"
            >
              <div className="space-y-1">
                <p className="font-bold text-foreground font-sans text-base">{p.title}</p>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{p.summary}</p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
