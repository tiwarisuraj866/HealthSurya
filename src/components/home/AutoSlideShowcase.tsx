import { useEffect, useState } from "react";
import Link from "next/link";
import { Beaker, Stethoscope, Pill, Truck, FileText, ShieldCheck } from "lucide-react";
import { HOME_SERVICES } from "@/lib/promoted-listings";

const ICONS = {
  beaker: Beaker,
  stethoscope: Stethoscope,
  pill: Pill,
  truck: Truck,
  file: FileText,
  shield: ShieldCheck,
} as const;

const INTERVAL_MS = 4500;

export function AutoSlideShowcase() {
  const [index, setIndex] = useState(0);
  const [anim, setAnim] = useState<"from-top" | "from-side">("from-top");

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => {
        const next = (i + 1) % HOME_SERVICES.length;
        setAnim(next % 2 === 0 ? "from-top" : "from-side");
        return next;
      });
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  const s = HOME_SERVICES[index];
  const Icon = ICONS[s.icon];

  return (
    <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/10 via-card to-accent/5 p-1 shadow-lg">
      <div className="relative min-h-[200px] overflow-hidden rounded-[1.35rem] bg-card p-6 sm:min-h-[220px] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Our services</p>
        <div
          key={`${index}-${anim}`}
          className={`mt-4 animate-in duration-500 fill-mode-both ${
            anim === "from-top" ? "slide-in-from-top-8 fade-in" : "slide-in-from-right-12 fade-in"
          }`}
        >
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
              <Icon className="h-7 w-7" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xl font-bold sm:text-2xl">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground sm:text-base">{s.desc}</p>
              <Link
                href={s.to}
                className="mt-4 inline-flex text-sm font-semibold text-primary hover:underline"
              >
                Explore →
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-4 left-6 right-6 flex justify-center gap-1.5 sm:left-8">
          {HOME_SERVICES.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Service ${i + 1}`}
              onClick={() => {
                setIndex(i);
                setAnim(i % 2 === 0 ? "from-top" : "from-side");
              }}
              className={`h-1.5 rounded-full transition-all ${i === index ? "w-6 bg-primary" : "w-1.5 bg-primary/30"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
