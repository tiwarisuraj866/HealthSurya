import { useEffect, useState } from "react";
import Link from "next/link";
import { Beaker, MapPin, Star, BadgeCheck } from "lucide-react";
import { fetchPromotedLabs, type LabListing } from "@/lib/promoted-listings";
import { getUserCity, premiumTierRank, setUserCity } from "@/lib/location";
import { PromotedMarquee, PremiumBadge } from "./PromotedMarquee";
import { Button } from "@/components/ui/button";

export function PromotedLabsRail({ city }: { city: string }) {
  const [labs, setLabs] = useState<LabListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const c = city.trim() || getUserCity();
    if (city.trim()) setUserCity(city);
    setLoading(true);
    fetchPromotedLabs(c, 14).then((d) => {
      setLabs(d);
      setLoading(false);
    });
  }, [city]);

  if (loading) {
    return (
      <div className="rounded-3xl border bg-card/60 glass-card p-10 text-center text-sm text-muted-foreground flex flex-col items-center justify-center gap-3">
        <Beaker className="h-6 w-6 animate-pulse text-primary" />
        Loading pathology & diagnostic centers…
      </div>
    );
  }

  if (labs.length === 0) {
    return (
      <div className="rounded-3xl border bg-card/60 glass-card p-10 text-center">
        <p className="text-sm text-muted-foreground font-medium">No labs listed in this area yet.</p>
        <Button asChild variant="link" className="mt-2 text-primary font-bold">
          <Link href="/register">Register your lab</Link>
        </Button>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-border/80 bg-card/40 glass-card py-6 shadow-md transition-all hover:shadow-lg">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3 px-4 sm:px-6">
        <div>
          <div className="flex items-center gap-2 text-primary">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Beaker className="h-4 w-4" />
            </span>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary">Diagnostics</span>
          </div>
          <h2 className="mt-2 text-xl font-extrabold tracking-tight sm:text-2xl font-sans">Pathology & Diagnostic Centers</h2>
          <p className="text-xs text-muted-foreground mt-0.5 font-medium">
            Featured labs first · Nearest to <span className="text-foreground font-semibold underline decoration-primary/50 decoration-2">{city.trim() || getUserCity()}</span>
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="glass h-9 font-semibold text-xs rounded-xl">
          <Link href={`/labs?city=${encodeURIComponent(city.trim() || getUserCity())}`}>
            View all
          </Link>
        </Button>
      </div>

      <PromotedMarquee direction="right" durationSec={42}>
        {labs.map((lab) => (
          <LabMiniCard key={lab.id} lab={lab} />
        ))}
      </PromotedMarquee>
    </section>
  );
}

function LabMiniCard({ lab }: { lab: LabListing }) {
  const isPremium = premiumTierRank(lab.premium_tier) > 0;

  return (
    <Link
      href={`/labs/${lab.id}`}
      className={`group flex w-[280px] shrink-0 flex-col overflow-hidden rounded-2xl border bg-card/85 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg ${
        isPremium
          ? "border-amber-400/40 shadow-[0_4px_15px_-4px_rgba(245,158,11,0.06)] hover:border-amber-400/70 hover:shadow-[0_12px_24px_-4px_rgba(245,158,11,0.15)] bg-gradient-to-b from-amber-500/[0.015] to-card/95"
          : "border-border/80 hover:border-primary/45"
      }`}
    >
      <div className="aspect-[2/1] w-full overflow-hidden bg-secondary border-b border-border/40 relative">
        {lab.image_url ? (
          <img src={lab.image_url} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-hero-gradient text-3xl font-bold text-primary/30">
            {lab.name.charAt(0)}
          </div>
        )}
        {lab.verified && (
          <span className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-full bg-emerald-500/95 text-white px-2 py-0.5 text-[9px] font-extrabold uppercase shadow-sm">
            <BadgeCheck className="h-3 w-3 shrink-0" />
            Verified
          </span>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 font-bold text-sm tracking-tight text-foreground group-hover:text-primary transition-colors">{lab.name}</h3>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <PremiumBadge tier={lab.premium_tier} />
        </div>
        <p className="mt-2.5 flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
          <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="truncate">{lab.city} · Pincode {lab.pincode}</span>
        </p>
        <div className="mt-3.5 flex items-center justify-between border-t border-border/40 pt-3">
          <span className="flex items-center gap-1 font-bold text-foreground bg-accent/10 text-accent px-1.5 py-0.5 rounded-md text-[10px]">
            <Star className="h-3 w-3 fill-accent text-accent" />
            {Number(lab.rating).toFixed(1)}
          </span>
          {lab.minPrice != null && (
            <span className="text-xs font-bold text-primary">Tests from <strong className="text-sm">₹{lab.minPrice}</strong></span>
          )}
        </div>
      </div>
    </Link>
  );
}
