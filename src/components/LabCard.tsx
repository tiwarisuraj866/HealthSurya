import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, Star, BadgeCheck, Truck, FlaskConical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRequireAuthRedirect } from "@/components/auth/RequireAuthGate";
import { buildBookLabUrl } from "@/lib/auth-redirect";

export interface LabCardData {
  id: string;
  name: string;
  city: string;
  pincode: string;
  address: string;
  image_url: string | null;
  rating: number;
  total_reviews: number;
  verified: boolean;
  home_collection: boolean;
  minPrice?: number | null;
  is_available?: boolean;
}

export function LabCard({ lab }: { lab: LabCardData }) {
  const router = useRouter();
  const { requireAuth } = useRequireAuthRedirect();
  const bookUrl = buildBookLabUrl(lab.id);

  const onBook = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    requireAuth(bookUrl, () => {
      router.push(`/labs/${lab.id}?book=true`);
    });
  };

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <Link href={`/labs/${lab.id}`} className="flex flex-1 flex-col">
        <div className="aspect-[16/9] w-full overflow-hidden bg-secondary">
          {lab.image_url ? (
            <img src={lab.image_url} alt={lab.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" loading="lazy" decoding="async" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-hero-gradient text-3xl font-bold text-primary/40">
              {lab.name.charAt(0)}
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="line-clamp-1 font-semibold">{lab.name}</h3>
              {lab.is_available === false && (
                <span className="inline-flex items-center rounded-md bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium text-destructive ring-1 ring-inset ring-destructive/20">
                  On Leave
                </span>
              )}
            </div>
            {lab.verified && <BadgeCheck className="h-5 w-5 shrink-0 text-primary" />}
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span className="line-clamp-1">{lab.city} · {lab.pincode}</span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-accent text-accent" />
              <span className="text-sm font-medium">{Number(lab.rating).toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">({lab.total_reviews})</span>
            </div>
            <div className="flex items-center gap-2">
              {lab.home_collection && (
                <Badge variant="secondary" className="gap-1"><Truck className="h-3 w-3" />Home</Badge>
              )}
              {lab.minPrice != null && (
                <span className="text-sm font-semibold text-primary">from ₹{lab.minPrice}</span>
              )}
            </div>
          </div>
        </div>
      </Link>
      <div className="border-t px-4 pb-4 pt-3">
        <Button type="button" className="w-full gap-2 btn-gradient text-white font-semibold transition-all transform hover:scale-[1.01] hover:shadow-md" size="sm" onClick={onBook} disabled={lab.is_available === false}>
          <FlaskConical className="h-4 w-4" />
          {lab.is_available === false ? "Lab On Leave" : "Book lab test"}
        </Button>
      </div>
    </article>
  );
}
