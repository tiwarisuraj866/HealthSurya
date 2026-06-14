import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About HealthSurya — Digital Healthcare Ecosystem",
  description: "HealthSurya is a modern digital healthcare ecosystem connecting patients, doctors, pathology labs, diagnostic centers, and medicine services.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 space-y-10">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <h1 className="text-4xl font-extrabold font-sans tracking-tight sm:text-5xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          About HealthSurya
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          HealthSurya is a modern digital healthcare ecosystem designed to connect patients, doctors, pathology labs, diagnostic centers, courier partners and medicine services through one centralized HealthTech platform.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 mt-10">
        {[
          {
            title: "Our Mission",
            body: "Digitize pathology workflows and make healthcare accessible, transparent and reliable for every Indian.",
          },
          {
            title: "Our Vision",
            body: "Become India's most trusted HealthTech platform — combining diagnostics, pharmacy and AI-driven insights.",
          },
          {
            title: "What We Do",
            body: "Online test booking, report tracking, doctor referrals and lab management — all in one secure platform.",
          },
          {
            title: "Why We Exist",
            body: "Health is the foundation of life. We bring sunshine — Surya — to your health journey.",
          },
        ].map((c) => (
          <div key={c.title} className="rounded-2xl border bg-card/40 glass p-6 shadow-sm hover:scale-[1.02] transition-transform">
            <h3 className="font-bold text-lg text-foreground border-b pb-2 mb-2 text-primary">{c.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{c.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
