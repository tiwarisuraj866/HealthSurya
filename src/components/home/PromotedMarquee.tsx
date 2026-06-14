import { type ReactNode } from "react";
import { Crown } from "lucide-react";

type Props = {
  children: ReactNode;
  direction?: "left" | "right";
  durationSec?: number;
};

/** Continuous horizontal auto-scroll rail */
export function PromotedMarquee({ children, direction = "left", durationSec = 35 }: Props) {
  return (
    <div className="relative overflow-hidden">
      <div
        className={`flex w-max gap-4 ${direction === "left" ? "animate-marquee-left" : "animate-marquee-right"}`}
        style={{ animationDuration: `${durationSec}s` }}
      >
        <div className="flex shrink-0 gap-4">{children}</div>
        <div className="flex shrink-0 gap-4" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}

export function PremiumBadge({ tier }: { tier?: string | null }) {
  if (!tier || tier === "free") return null;
  const isGold = tier === "gold";
  const isSilver = tier === "silver";
  const isFeatured = tier === "featured";
  
  const label = isGold ? "Gold Partner" : isSilver ? "Silver Partner" : isFeatured ? "Featured Partner" : "Premium";
  
  const badgeClasses = isGold
    ? "bg-amber-500/10 border border-amber-500/30 text-amber-700"
    : isSilver
    ? "bg-slate-400/10 border border-slate-400/30 text-slate-700"
    : isFeatured
    ? "bg-primary/10 border border-primary/30 text-primary"
    : "bg-teal-500/10 border border-teal-500/30 text-teal-700";

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider shadow-sm ${badgeClasses}`}>
      <Crown className="h-3 w-3 text-amber-500" />
      {label}
    </span>
  );
}
