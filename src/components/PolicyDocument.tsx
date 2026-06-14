import Link from "next/link";
import type { PolicyDoc } from "@/lib/policies";
import { LEGAL_ENTITY } from "@/lib/site-config";

export function PolicyDocument({ policy }: { policy: PolicyDoc }) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="text-sm text-muted-foreground">
        <Link href="/legal" className="hover:text-primary">Legal</Link>
        {" / "}
        <span className="text-foreground">{policy.title}</span>
      </p>
      <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">{policy.title}</h1>
      <p className="mt-2 text-muted-foreground">{policy.summary}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {LEGAL_ENTITY} · Last updated: {policy.lastUpdated}
      </p>

      <div className="prose-policy mt-10 space-y-8">
        {policy.sections.map((s) => (
          <section key={s.heading}>
            <h2 className="text-lg font-semibold text-foreground">{s.heading}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
          </section>
        ))}
      </div>

      <p className="mt-12 rounded-xl border bg-muted/30 p-4 text-xs text-muted-foreground">
        Questions? Contact{" "}
        <a href="mailto:support@healthsurya.com" className="font-medium text-primary hover:underline">
          support@healthsurya.com
        </a>
        . This document does not constitute legal advice.
      </p>
    </article>
  );
}
