import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, Star, Stethoscope } from "lucide-react";
import { fetchPromotedDoctors, type DoctorListing } from "@/lib/promoted-listings";
import { getUserCity, premiumTierRank, setUserCity } from "@/lib/location";
import { PromotedMarquee, PremiumBadge } from "./PromotedMarquee";
import { Button } from "@/components/ui/button";

export function PromotedDoctorsRail({ city }: { city: string }) {
  const [doctors, setDoctors] = useState<DoctorListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const c = city.trim() || getUserCity();
    if (city.trim()) setUserCity(city);
    setLoading(true);
    fetchPromotedDoctors(c, 14).then((d) => {
      setDoctors(d);
      setLoading(false);
    });
  }, [city]);

  if (loading) {
    return (
      <div className="rounded-3xl border bg-card/60 glass-card p-10 text-center text-sm text-muted-foreground flex flex-col items-center justify-center gap-3">
        <Stethoscope className="h-6 w-6 animate-pulse text-primary" />
        Loading top doctors near you…
      </div>
    );
  }

  if (doctors.length === 0) {
    return (
      <div className="rounded-3xl border bg-card/60 glass-card p-10 text-center">
        <p className="text-sm text-muted-foreground font-medium">No doctors listed in this area yet.</p>
        <Button asChild variant="link" className="mt-2 text-primary font-bold">
          <Link href="/register">Register as a doctor</Link>
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
              <Stethoscope className="h-4 w-4" />
            </span>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary">Local specialists</span>
          </div>
          <h2 className="mt-2 text-xl font-extrabold tracking-tight sm:text-2xl font-sans">Top Rated Doctors</h2>
          <p className="text-xs text-muted-foreground mt-0.5 font-medium">
            Subscribed partners first · Sorted by proximity in <span className="text-foreground font-semibold underline decoration-primary/50 decoration-2">{city.trim() || getUserCity()}</span>
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="glass h-9 font-semibold text-xs rounded-xl">
          <Link href={`/doctors?city=${encodeURIComponent(city.trim() || getUserCity())}`}>
            View all
          </Link>
        </Button>
      </div>

      <PromotedMarquee direction="left" durationSec={40}>
        {doctors.map((d) => (
          <DoctorMiniCard key={d.id} doctor={d} />
        ))}
      </PromotedMarquee>
    </section>
  );
}

function DoctorMiniCard({ doctor }: { doctor: DoctorListing }) {
  const isPremium = premiumTierRank(doctor.premium_tier) > 0;

  return (
    <Link
      href={`/doctors/${doctor.slug}`}
      className={`group flex w-[265px] shrink-0 flex-col overflow-hidden rounded-2xl border bg-card/85 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg ${
        isPremium
          ? "border-amber-400/40 shadow-[0_4px_15px_-4px_rgba(245,158,11,0.06)] hover:border-amber-400/70 hover:shadow-[0_12px_24px_-4px_rgba(245,158,11,0.15)] bg-gradient-to-b from-amber-500/[0.015] to-card/95"
          : "border-border/80 hover:border-primary/45"
      }`}
    >
      <div className="flex gap-3.5 p-4">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-secondary shadow-inner border border-border/40">
          {doctor.photo_url ? (
            <img src={doctor.photo_url} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-primary/30">
              {doctor.full_name.charAt(0)}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <PremiumBadge tier={doctor.premium_tier} />
          </div>
          <h3 className="mt-1.5 line-clamp-1 font-bold text-sm tracking-tight text-foreground group-hover:text-primary transition-colors">{doctor.full_name}</h3>
          <p className="line-clamp-1 text-xs text-muted-foreground font-medium">{doctor.specialization}</p>
          <div className="mt-2.5 flex items-center gap-2 text-[11px] text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="truncate max-w-[100px] font-medium">{doctor.clinic_city}</span>
            <span className="flex items-center gap-0.5 font-bold text-foreground bg-accent/10 text-accent px-1.5 py-0.5 rounded-md text-[10px]">
              <Star className="h-3 w-3 fill-accent text-accent" />
              {Number(doctor.rating).toFixed(1)}
            </span>
          </div>
        </div>
      </div>
      {doctor.consultation_fee != null && (
        <div className="border-t bg-muted/40 px-4 py-2.5 text-[11px] font-bold text-primary flex justify-between items-center group-hover:bg-primary/5 transition-colors">
          <span>Fee: ₹{Number(doctor.consultation_fee).toFixed(0)}</span>
          <span className="text-[10px] font-semibold text-muted-foreground group-hover:text-primary transition-colors">Book Clinic Visit &rarr;</span>
        </div>
      )}
    </Link>
  );
}
