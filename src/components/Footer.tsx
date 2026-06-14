import Link from "next/link";
import logo from "@/assets/logo.png";
import { POLICIES } from "@/lib/policies";
import { HeartPulse, Mail, MapPin } from "lucide-react";

const linkClass =
  "block rounded-lg px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-primary/5 hover:text-foreground md:px-0 md:py-1.5 md:hover:bg-transparent";

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <details className="group border-b border-border/50 pb-4 open:pb-5 md:hidden [&_summary::-webkit-details-marker]:hidden">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between rounded-lg px-1 text-sm font-semibold">
          {title}
          <span className="text-lg text-muted-foreground transition-transform group-open:rotate-180">▾</span>
        </summary>
        <ul className="mt-2 space-y-0.5 pl-1">{children}</ul>
      </details>
      <div className="hidden md:block">
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        <ul className="mt-4 space-y-2">{children}</ul>
      </div>
    </>
  );
}

export function Footer() {
  const mainPolicies = POLICIES.filter((p) =>
    ["privacy-policy", "terms-of-service", "refund-cancellation-policy", "data-security-policy"].includes(p.id),
  );

  return (
    <footer className="mt-auto border-t bg-gradient-to-b from-surface to-muted/30 pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-8">
      <div className="h-1 bg-gradient-to-r from-violet-500 via-primary to-teal-500" />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-4">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <img src={logo.src} alt="HealthSurya" className="h-10 w-10 object-contain" loading="lazy" decoding="async" />
              <span className="text-xl font-bold">HealthSurya</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Your trusted health partner — book lab tests, doctor appointments &amp; medicine delivery in Jaunpur and beyond.
            </p>
            <div className="mt-5 flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5">
                <MapPin className="h-3.5 w-3.5 text-primary" /> Jaunpur · UP
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5">
                <HeartPulse className="h-3.5 w-3.5 text-primary" /> Verified partners
              </span>
            </div>
          </div>

          <div className="lg:col-span-2">
            <FooterColumn title="Services">
              <li><Link href="/labs" className={linkClass}>Find Labs</Link></li>
              <li><Link href="/doctors" className={linkClass}>Find Doctors</Link></li>
              <li><Link href="/medicine" className={linkClass}>Medicine</Link></li>
              <li><Link href="/services" className={linkClass}>All Services</Link></li>
            </FooterColumn>
          </div>

          <div className="lg:col-span-3">
            <FooterColumn title="Legal">
              <li><Link href="/legal" className={linkClass}>All policies</Link></li>
              {mainPolicies.map((p) => (
                <li key={p.id}>
                  <Link href={`/legal/${p.id}`} className={linkClass}>{p.title}</Link>
                </li>
              ))}
            </FooterColumn>
          </div>

          <div className="lg:col-span-3">
            <FooterColumn title="Account">
              <li><Link href="/login" className={linkClass}>Sign in</Link></li>
              <li><Link href="/register?role=patient" className={linkClass}>Patient registration</Link></li>
              <li><Link href="/register?role=doctor" className={linkClass}>Doctor registration</Link></li>
              <li><Link href="/register?role=lab" className={linkClass}>Lab registration</Link></li>
              <li><Link href="/about" className={linkClass}>About us</Link></li>
              <li><Link href="/contact" className={linkClass}>Contact</Link></li>
            </FooterColumn>
          </div>
        </div>
      </div>

      <div className="border-t border-border/60 bg-card/50">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-center text-xs text-muted-foreground sm:flex-row sm:px-6 sm:text-left">
          <p>© {new Date().getFullYear()} HealthSurya. All rights reserved.</p>
          <p className="inline-flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5" />
            Not for medical emergencies · Call 108 / 102
          </p>
        </div>
      </div>
    </footer>
  );
}
