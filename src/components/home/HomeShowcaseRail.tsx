import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Beaker,
  Stethoscope,
  Pill,
  Truck,
  MapPin,
  Star,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import {
  fetchPromotedDoctors,
  fetchPromotedLabs,
  getInstantPromotedDoctors,
  getInstantPromotedLabs,
  type DoctorListing,
  type LabListing,
} from "@/lib/promoted-listings";
import { getUserCity, premiumTierRank, setUserCity, DEFAULT_CITY } from "@/lib/location";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ROTATE_MS = 6000;

const SERVICE_CARDS = [
  {
    icon: Beaker,
    title: "Pathology Labs",
    desc: "Compare prices & book tests",
    to: "/labs" as const,
    iconWrap: "bg-gradient-to-br from-cyan-500 to-teal-600",
  },
  {
    icon: Stethoscope,
    title: "Doctors",
    desc: "Mini sites & appointments",
    to: "/doctors" as const,
    iconWrap: "bg-gradient-to-br from-violet-500 to-indigo-600",
  },
  {
    icon: Truck,
    title: "Home Collection",
    desc: "Sample pickup at home",
    to: "/labs" as const,
    iconWrap: "bg-gradient-to-br from-amber-500 to-orange-500",
  },
  {
    icon: Pill,
    title: "Medicine",
    desc: "Order with delivery",
    to: "/medicine" as const,
    iconWrap: "bg-gradient-to-br from-emerald-500 to-green-600",
  },
];

const SLIDES = [
  { id: "services", label: "Services" },
  { id: "doctors", label: "Doctors" },
  { id: "labs", label: "Labs" },
] as const;

function HighlightBadge({ tier }: { tier?: string | null }) {
  if (!tier || tier === "free") return null;
  const label =
    tier === "gold" ? "Top" : tier === "silver" ? "Pro" : tier === "featured" ? "Trusted" : "Featured";
  return (
    <span className="inline-flex items-center gap-0.5 rounded-full bg-violet-600 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
      <Star className="h-2 w-2 fill-white" />
      {label}
    </span>
  );
}

export function HomeShowcaseRail({ city }: { city: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const resolvedCity = city.trim() || (mounted ? getUserCity() : DEFAULT_CITY);
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const [doctors, setDoctors] = useState<DoctorListing[]>(() => getInstantPromotedDoctors(city.trim() || DEFAULT_CITY, 4));
  const [labs, setLabs] = useState<LabListing[]>(() => getInstantPromotedLabs(city.trim() || DEFAULT_CITY, 4));
  const [refreshing, setRefreshing] = useState(false);
  const touchStartX = useRef(0);

  const showLoadingDoctors = doctors.length === 0 && refreshing;
  const showLoadingLabs = labs.length === 0 && refreshing;

  useEffect(() => {
    if (city.trim()) setUserCity(city);
    setRefreshing(true);
    let cancelled = false;
    Promise.all([fetchPromotedDoctors(resolvedCity, 4), fetchPromotedLabs(resolvedCity, 4)])
      .then(([d, l]) => {
        if (!cancelled) {
          setDoctors(d);
          setLabs(l);
        }
      })
      .finally(() => {
        if (!cancelled) setRefreshing(false);
      });
    return () => {
      cancelled = true;
    };
  }, [city, resolvedCity]);

  const goTo = useCallback((index: number) => {
    setSlide(((index % SLIDES.length) + SLIDES.length) % SLIDES.length);
  }, []);

  const next = useCallback(() => goTo(slide + 1), [goTo, slide]);
  const prev = useCallback(() => goTo(slide - 1), [goTo, slide]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) < 40) return;
    if (diff > 0) next();
    else prev();
  };

  useEffect(() => {
    if (paused) return;
    const id = setInterval(next, ROTATE_MS);
    return () => clearInterval(id);
  }, [paused, next]);

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl border bg-card shadow-md"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2.5 sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-teal-600 text-white">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-primary">Near {resolvedCity}</p>
            <p className="truncate text-sm font-bold">{SLIDES[slide].label}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={prev} aria-label="Previous">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={next} aria-label="Next">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stacked slides — only active slide affects height (no extra whitespace) */}
      <div className="relative px-3 pb-2 pt-1 sm:px-4 sm:pb-3">
        <div className="relative min-h-[220px] sm:min-h-[240px]">
          <SlidePanel active={slide === 0}>
            <div className="grid grid-cols-2 gap-2">
              {SERVICE_CARDS.map((c) => (
                <Link
                  key={c.title}
                  href={c.to}
                  className="flex items-center gap-2.5 rounded-xl border bg-muted/30 p-2.5 transition-colors hover:border-primary/30 hover:bg-muted/50 active:scale-[0.98] sm:p-3"
                >
                  <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white shadow-sm", c.iconWrap)}>
                    <c.icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold leading-tight sm:text-sm">{c.title}</p>
                    <p className="line-clamp-1 text-[10px] text-muted-foreground sm:text-xs">{c.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </SlidePanel>

          <SlidePanel active={slide === 1}>
            <SlideHeader
              title="Top doctors"
              linkTo="/doctors"
              search={{ city: resolvedCity }}
              linkClass="bg-violet-600 hover:bg-violet-700"
            />
            {showLoadingDoctors ? (
              <ListingSkeleton />
            ) : doctors.length === 0 ? (
              <EmptyHint text="No doctors listed yet." />
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {doctors.slice(0, 4).map((d) => (
                  <DoctorSlideCard key={d.id} doctor={d} />
                ))}
              </div>
            )}
          </SlidePanel>

          <SlidePanel active={slide === 2}>
            <SlideHeader
              title="Trusted labs"
              linkTo="/labs"
              search={{ city: resolvedCity }}
              linkClass="bg-cyan-600 hover:bg-cyan-700"
            />
            {showLoadingLabs ? (
              <ListingSkeleton />
            ) : labs.length === 0 ? (
              <EmptyHint text="No labs listed yet." />
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {labs.slice(0, 4).map((lab) => (
                  <LabSlideCard key={lab.id} lab={lab} />
                ))}
              </div>
            )}
          </SlidePanel>
        </div>
      </div>

      <div className="flex items-center justify-center gap-1.5 border-t bg-muted/20 px-3 py-2">
        {SLIDES.map((s, i) => (
          <button
            key={s.id}
            type="button"
            aria-label={`Show ${s.label}`}
            aria-current={i === slide}
            onClick={() => goTo(i)}
            className={cn(
              "h-1.5 rounded-full transition-all",
              i === slide ? "w-6 bg-primary" : "w-1.5 bg-primary/30 hover:bg-primary/50",
            )}
          />
        ))}
      </div>
    </div>
  );
}

function SlidePanel({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "transition-opacity duration-300",
        active ? "relative opacity-100" : "pointer-events-none absolute inset-0 opacity-0",
      )}
      aria-hidden={!active}
    >
      {children}
    </div>
  );
}

function SlideHeader({
  title,
  linkTo,
  search,
  linkClass,
}: {
  title: string;
  linkTo: "/doctors" | "/labs";
  search: { city: string };
  linkClass: string;
}) {
  return (
    <div className="mb-2 flex items-center justify-between gap-2">
      <h3 className="text-sm font-bold">{title}</h3>
      <Button asChild size="sm" variant="secondary" className={cn("h-7 px-2.5 text-xs text-white", linkClass)}>
        <Link href={`${linkTo}?city=${encodeURIComponent(search.city)}`}>View all</Link>
      </Button>
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return <p className="py-6 text-center text-xs text-muted-foreground">{text}</p>;
}

function ListingSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-lg border bg-muted/40 p-2">
          <div className="aspect-square rounded-md bg-muted" />
          <div className="mt-1.5 h-2.5 w-3/4 rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

function DoctorSlideCard({ doctor }: { doctor: DoctorListing }) {
  const premium = premiumTierRank(doctor.premium_tier) > 0;
  return (
    <Link
      href={`/doctors/${doctor.slug}`}
      className={cn(
        "flex flex-col overflow-hidden rounded-lg border bg-card p-1.5 shadow-sm transition-transform active:scale-[0.98] hover:shadow-md",
        premium && "ring-1 ring-amber-400/40",
      )}
    >
      <div className="aspect-square overflow-hidden rounded-md bg-violet-100">
        {doctor.photo_url ? (
          <img src={doctor.photo_url} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm font-bold text-violet-400">
            {doctor.full_name.charAt(0)}
          </div>
        )}
      </div>
      <div className="mt-1.5 min-w-0 px-0.5">
        <HighlightBadge tier={doctor.premium_tier} />
        <p className="line-clamp-1 text-[11px] font-semibold leading-tight">{doctor.full_name}</p>
        <p className="line-clamp-1 text-[10px] text-muted-foreground">{doctor.specialization}</p>
        <div className="mt-0.5 flex items-center gap-0.5 text-[10px]">
          <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
          <span className="font-medium">{Number(doctor.rating).toFixed(1)}</span>
        </div>
      </div>
    </Link>
  );
}

function LabSlideCard({ lab }: { lab: LabListing }) {
  const premium = premiumTierRank(lab.premium_tier) > 0;
  return (
    <Link
      href={`/labs/${lab.id}`}
      className={cn(
        "flex flex-col overflow-hidden rounded-lg border bg-card p-1.5 shadow-sm transition-transform active:scale-[0.98] hover:shadow-md",
        premium && "ring-1 ring-amber-400/40",
      )}
    >
      <div className="aspect-square overflow-hidden rounded-md bg-cyan-50">
        {lab.image_url ? (
          <img src={lab.image_url} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm font-bold text-cyan-400/70">{lab.name.charAt(0)}</div>
        )}
      </div>
      <div className="mt-1.5 min-w-0 px-0.5">
        <div className="flex items-start justify-between gap-0.5">
          <p className="line-clamp-1 text-[11px] font-semibold">{lab.name}</p>
          {lab.verified && <BadgeCheck className="h-3 w-3 shrink-0 text-cyan-600" />}
        </div>
        <p className="line-clamp-1 text-[10px] text-muted-foreground">{lab.city}</p>
        {lab.minPrice != null && <p className="text-[10px] font-semibold text-cyan-700">from ₹{lab.minPrice}</p>}
      </div>
    </Link>
  );
}
