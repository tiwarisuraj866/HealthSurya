import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, Star, BadgeCheck, IndianRupee, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DoctorProfile } from "@/lib/doctor";
import { useRequireAuthRedirect } from "@/components/auth/RequireAuthGate";
import { buildBookDoctorUrl } from "@/lib/auth-redirect";

export function DoctorCard({ doctor }: { doctor: DoctorProfile }) {
  const router = useRouter();
  const { requireAuth } = useRequireAuthRedirect();
  const bookUrl = buildBookDoctorUrl(doctor.slug);

  const onBook = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    requireAuth(bookUrl, () => {
      router.push(`/doctors/${doctor.slug}?book=true`);
    });
  };

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <Link href={`/doctors/${doctor.slug}`} className="flex flex-1 flex-col">
        <div className="aspect-[16/9] w-full overflow-hidden bg-secondary">
          {doctor.photo_url ? (
            <img src={doctor.photo_url} alt={doctor.full_name} className="h-full w-full object-cover transition-transform group-hover:scale-105" loading="lazy" decoding="async" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-hero-gradient text-3xl font-bold text-primary/40">
              {doctor.full_name.charAt(0)}
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="line-clamp-1 font-semibold">{doctor.full_name}</h3>
                {doctor.is_available === false && (
                  <span className="inline-flex items-center rounded-md bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium text-destructive ring-1 ring-inset ring-destructive/20">
                    On Leave
                  </span>
                )}
              </div>
              {doctor.specialization && (
                <p className="text-xs text-muted-foreground">{doctor.specialization}</p>
              )}
            </div>
            {doctor.verified && <BadgeCheck className="h-5 w-5 shrink-0 text-primary" />}
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="line-clamp-1">
              {doctor.clinic_city}
              {doctor.clinic_pincode ? ` · ${doctor.clinic_pincode}` : ""}
            </span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-accent text-accent" />
              <span className="text-sm font-medium">{Number(doctor.rating).toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">({doctor.total_reviews})</span>
            </div>
            {doctor.consultation_fee != null && (
              <span className="flex items-center text-sm font-semibold text-primary">
                <IndianRupee className="h-3.5 w-3.5" />
                {Number(doctor.consultation_fee).toFixed(0)}
              </span>
            )}
          </div>
        </div>
      </Link>
      <div className="border-t px-4 pb-4 pt-3">
        <Button type="button" className="w-full gap-2 btn-gradient text-white font-semibold transition-all transform hover:scale-[1.01] hover:shadow-md" size="sm" onClick={onBook} disabled={doctor.is_available === false}>
          <CalendarCheck className="h-4 w-4" />
          {doctor.is_available === false ? "On Leave" : "Book appointment"}
        </Button>
      </div>
    </article>
  );
}
