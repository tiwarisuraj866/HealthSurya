"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getDoctorDetails, createDoctorAppointment } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import {
  MapPin, Phone, Star, BadgeCheck, Clock, MessageCircle,
  Stethoscope, GraduationCap, Building2, IndianRupee, CalendarCheck, ArrowLeft,
} from "lucide-react";
import type { DoctorProfile, DoctorGalleryItem, DoctorReview } from "@/lib/doctor";
import {
  formatDoctorTimings,
  whatsappLink,
  trackDoctorEvent,
} from "@/lib/doctor";
import { RequireAuthGate } from "@/components/auth/RequireAuthGate";
import { isPreviewDoctorId } from "@/lib/demo-listings";

export default function DoctorDetailClient({ slug }: { slug: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const openBookOnLoad = searchParams.get("book") === "true";

  const { user } = useAuth();
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [gallery, setGallery] = useState<DoctorGalleryItem[]>([]);
  const [reviews, setReviews] = useState<DoctorReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewTracked, setViewTracked] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);
  const bookSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (openBookOnLoad) {
      setBookOpen(true);
      setTimeout(() => bookSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 300);
    }
  }, [openBookOnLoad]);

  useEffect(() => {
    (async () => {
      try {
        const data = await getDoctorDetails(slug);
        if (data) {
          setDoctor(data.doctor as unknown as DoctorProfile);
          setGallery(data.gallery as unknown as DoctorGalleryItem[]);
          setReviews(data.reviews as unknown as DoctorReview[]);
        } else {
          setDoctor(null);
        }
      } catch (err) {
        console.error("Error fetching doctor details:", err);
        setDoctor(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  useEffect(() => {
    if (!doctor?.id || viewTracked) return;
    setViewTracked(true);
    trackDoctorEvent(doctor.id, "profile_view");
  }, [doctor?.id, viewTracked]);

  useEffect(() => {
    if (!doctor) return;
    document.title = doctor.seo_title || `Dr. ${doctor.full_name} — HealthSurya Mini-Site`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", doctor.seo_description || doctor.about || `Profile website for Dr. ${doctor.full_name}.`);
    }
  }, [doctor]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p className="mt-4 text-muted-foreground text-sm">Loading doctor profile...</p>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <h1 className="text-2xl font-bold font-sans">Doctor Profile Not Found</h1>
        <p className="mt-2 text-muted-foreground text-sm">This page may be unpublished, inactive, or the link is incorrect.</p>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/doctors"><ArrowLeft className="mr-2 h-4 w-4" /> Back to doctors</Link>
        </Button>
      </div>
    );
  }

  const waPhone = doctor.whatsapp || doctor.clinic_phone || "";
  const mapSrc =
    doctor.map_embed_url ||
    (doctor.map_lat && doctor.map_lng
      ? `https://maps.google.com/maps?q=${doctor.map_lat},${doctor.map_lng}&z=15&output=embed`
      : doctor.clinic_address
        ? `https://maps.google.com/maps?q=${encodeURIComponent(`${doctor.clinic_address}, ${doctor.clinic_city}`)}&output=embed`
        : null);

  const onWhatsApp = () => {
    if (!waPhone) return toast.error("WhatsApp contact number not available");
    trackDoctorEvent(doctor.id, "whatsapp_click");
    const msg = `Hello Dr. ${doctor.full_name}, I found you on HealthSurya and would like to schedule an appointment.`;
    window.open(whatsappLink(waPhone, msg), "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-background pb-36 lg:pb-12">
      {/* Hero Section */}
      <section className={`relative overflow-hidden border-b bg-gradient-to-br ${
        doctor.theme_color === "blue"
          ? "from-blue-600 via-blue-700 to-indigo-600"
          : doctor.theme_color === "emerald"
          ? "from-emerald-600 via-emerald-700 to-teal-600"
          : doctor.theme_color === "indigo"
          ? "from-indigo-600 via-indigo-700 to-violet-600"
          : doctor.theme_color === "violet"
          ? "from-violet-600 via-violet-700 to-purple-600"
          : "from-teal-600 via-teal-700 to-emerald-600"
      } text-white py-12`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_50%)]" />
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="h-32 w-32 shrink-0 overflow-hidden rounded-2xl border-4 border-white/30 bg-white/10 shadow-xl ring-2 ring-white/10 sm:h-36 sm:w-36">
              {doctor.photo_url ? (
                <img src={doctor.photo_url} alt={doctor.full_name} className="h-full w-full object-cover" loading="eager" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-white/70">
                  {doctor.full_name.charAt(0)}
                </div>
              )}
            </div>
            <div className="flex-grow">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold font-sans sm:text-3xl md:text-4xl">{doctor.full_name}</h1>
                {doctor.verified && <BadgeCheck className="h-7 w-7 text-emerald-300 fill-emerald-950" />}
              </div>
              {doctor.specialization && (
                <p className="mt-1 flex items-center gap-1.5 text-lg text-white/90">
                  <Stethoscope className="h-5 w-5 text-emerald-200" />{doctor.specialization}
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-2 text-xs sm:text-sm">
                {doctor.qualification && (
                  <span className="flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 backdrop-blur-sm">
                    <GraduationCap className="h-4 w-4 text-emerald-200" />{doctor.qualification}
                  </span>
                )}
                {doctor.experience_years != null && (
                  <span className="rounded-full bg-white/15 px-3 py-1 backdrop-blur-sm">{doctor.experience_years}+ yrs exp</span>
                )}
                <span className="flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 backdrop-blur-sm">
                  <Star className="h-4 w-4 fill-amber-300 text-amber-300" />
                  {Number(doctor.rating).toFixed(1)} ({doctor.total_reviews})
                </span>
                {doctor.consultation_fee != null && (
                  <span className="flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 font-semibold backdrop-blur-sm">
                    <IndianRupee className="h-3.5 w-3.5 text-emerald-200" />
                    ₹{Number(doctor.consultation_fee).toFixed(0)} Consultation Fee
                  </span>
                )}
              </div>
              <div className="mt-6 hidden flex-wrap gap-2 sm:flex">
                <AppointmentDialog doctor={doctor} open={bookOpen} onOpenChange={setBookOpen} />
                {waPhone && (
                  <Button type="button" variant="secondary" className="gap-2 bg-white text-primary hover:bg-white/90" onClick={onWhatsApp}>
                    <MessageCircle className="h-4 w-4" /> Message WhatsApp
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Section Nav */}
      <nav className="sticky top-[56px] z-30 border-b bg-card/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 py-2 text-sm sm:px-6">
          {[
            { id: "about", label: "About" },
            { id: "services", label: "Services" },
            { id: "clinic", label: "Clinic Info" },
            { id: "reviews", label: "Reviews" },
            { id: "book", label: "Book Slot" },
          ].map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="shrink-0 rounded-full px-4 py-1.5 font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
            >
              {s.label}
            </a>
          ))}
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-3">
          <div className="space-y-10 lg:col-span-2">
            {doctor.about && (
              <section id="about" className="scroll-mt-36">
                <h2 className="text-xl font-bold font-sans border-b pb-2">About Doctor</h2>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{doctor.about}</p>
              </section>
            )}

            {doctor.services?.length > 0 && (
              <section id="services" className="scroll-mt-36">
                <h2 className="text-xl font-bold font-sans border-b pb-2">Treatments & Services</h2>
                <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
                  {doctor.services.map((s) => (
                    <li key={s} className="rounded-xl border bg-card/40 hover:bg-card/75 transition-colors px-4 py-3 text-sm flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" /> {s}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section id="clinic" className="scroll-mt-36">
              <h2 className="text-xl font-bold font-sans border-b pb-2">Clinic Details</h2>
              <div className="mt-3 rounded-2xl border bg-card p-5 space-y-3 shadow-sm">
                {doctor.clinic_name && (
                  <p className="flex items-center gap-2 font-semibold text-foreground">
                    <Building2 className="h-4 w-4 text-primary" />{doctor.clinic_name}
                  </p>
                )}
                {doctor.clinic_address && (
                  <p className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {doctor.clinic_address}, {doctor.clinic_city}
                    {doctor.clinic_pincode ? ` - ${doctor.clinic_pincode}` : ""}
                  </p>
                )}
                {doctor.clinic_phone && (
                  <p className="flex items-center gap-2 text-sm text-foreground">
                    <Phone className="h-4 w-4 text-primary" />{doctor.clinic_phone}
                  </p>
                )}
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 text-primary" />{formatDoctorTimings(doctor)}
                </p>
              </div>
            </section>

            {mapSrc && (
              <section id="map" className="scroll-mt-36">
                <h2 className="text-xl font-bold font-sans border-b pb-2">Clinic Location</h2>
                <div className="mt-3 overflow-hidden rounded-2xl border shadow-sm">
                  <iframe title="Clinic location map" src={mapSrc} className="h-64 w-full border-0 sm:h-80 bg-secondary" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                </div>
              </section>
            )}

            {gallery.length > 0 && (
              <section id="gallery" className="scroll-mt-36">
                <h2 className="text-xl font-bold font-sans border-b pb-2">Clinic Photos</h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {gallery.map((g) => (
                    <figure key={g.id} className="overflow-hidden rounded-xl border bg-card shadow-sm">
                      <img src={g.image_url} alt={g.caption ?? "Clinic photograph"} className="aspect-video w-full object-cover" />
                      {g.caption && <figcaption className="p-2.5 text-xs text-muted-foreground bg-card border-t">{g.caption}</figcaption>}
                    </figure>
                  ))}
                </div>
              </section>
            )}

            <section id="reviews" className="scroll-mt-36">
              <h2 className="text-xl font-bold font-sans border-b pb-2">Feedback & Reviews</h2>
              <div className="mt-3 space-y-3">
                {reviews.length === 0 && (
                  <p className="rounded-xl border bg-card/50 p-6 text-sm text-muted-foreground text-center">No reviews yet for this doctor.</p>
                )}
                {reviews.map((r) => (
                  <div key={r.id} className="rounded-xl border bg-card p-4 shadow-sm">
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: r.rating }).map((_, i) => (
                          <Star key={i} className="h-3.5 w-3.5 fill-accent text-accent" />
                        ))}
                      </div>
                      <span className="text-xs font-semibold text-foreground">{r.reviewer_name ?? "Patient"}</span>
                    </div>
                    {r.comment && <p className="text-sm text-muted-foreground leading-relaxed">{r.comment}</p>}
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right sidebar booking block */}
          <aside className="space-y-6">
            <div ref={bookSectionRef} id="book" className="scroll-mt-36 rounded-2xl border bg-gradient-to-br from-violet-500/10 to-accent/5 p-5 shadow-sm lg:sticky lg:top-24">
              <div className="flex items-center gap-2 border-b pb-3 mb-3">
                <CalendarCheck className="h-5 w-5 text-primary" />
                <h3 className="font-bold font-sans">Book Appointment Slot</h3>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Request a slot instantly. Dr. {doctor.full_name.split(" ").pop()} will call or WhatsApp you to confirm the appointment.
              </p>
              <div className="mt-4 space-y-2">
                <AppointmentDialog doctor={doctor} fullWidth open={bookOpen} onOpenChange={setBookOpen} />
                {waPhone && (
                  <Button type="button" variant="outline" className="w-full gap-2 glass bg-card/60" onClick={onWhatsApp}>
                    <MessageCircle className="h-4 w-4 text-emerald-500" /> Chat on WhatsApp
                  </Button>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile sticky booking bar */}
      <div className="fixed bottom-[68px] left-0 right-0 z-40 border-t bg-card/90 p-3 backdrop-blur-md lg:hidden shadow-lg">
        <div className="mx-auto flex max-w-lg gap-2">
          {waPhone && (
            <Button type="button" variant="outline" className="flex-1 gap-1.5" onClick={onWhatsApp}>
              <MessageCircle className="h-4 w-4 text-emerald-500" /> WhatsApp
            </Button>
          )}
          <AppointmentDialog doctor={doctor} fullWidth open={bookOpen} onOpenChange={setBookOpen} />
        </div>
      </div>
    </div>
  );
}

function AppointmentDialog({
  doctor,
  fullWidth,
  open: controlledOpen,
  onOpenChange,
}: {
  doctor: DoctorProfile;
  fullWidth?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { user } = useAuth();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ patient_name: "", patient_phone: "", preferred_date: "", symptoms: "" });

  useEffect(() => {
    if (user?.full_name && !form.patient_name) {
      setForm((f) => ({ ...f, patient_name: user.full_name! }));
    }
    if (user?.phone && !form.patient_phone) {
      setForm((f) => ({ ...f, patient_phone: user.phone!.replace(/\D/g, "").slice(-10) }));
    }
  }, [user, form.patient_name, form.patient_phone]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (isPreviewDoctorId(doctor.id) && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== "pk_test_Y2xlcmsubW9jay5kZXYk") {
      toast.error("This is a demo profile. Bookings are only accepted for live partners.");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(form.patient_phone.replace(/\s/g, ""))) {
      return toast.error("Enter a valid 10-digit mobile number");
    }

    setLoading(true);
    try {
      const res = await createDoctorAppointment({
        doctorId: doctor.id,
        patientName: form.patient_name,
        patientPhone: form.patient_phone,
        preferredDate: form.preferred_date,
        symptoms: form.symptoms || null,
      });

      if (res.success) {
        toast.success("Appointment request sent successfully!");
        setOpen(false);
        setForm({ patient_name: user?.full_name || "", patient_phone: user?.phone?.slice(-10) || "", preferred_date: "", symptoms: "" });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to book appointment.");
    } finally {
      setLoading(false);
    }
  };

  if (doctor.is_available === false) {
    return (
      <Button disabled className={fullWidth ? "w-full gap-2" : "gap-2"} variant="secondary">
        <CalendarCheck className="h-4 w-4" /> Doctor Not Available (On Leave)
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className={fullWidth ? "w-full gap-2 btn-gradient" : "gap-2 btn-gradient"}>
          <CalendarCheck className="h-4 w-4" /> Book appointment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md glass-strong">
        <DialogHeader>
          <DialogTitle className="font-sans font-bold">Request Appointment</DialogTitle>
        </DialogHeader>
        {!user ? (
          <RequireAuthGate redirectTo={`/doctors/${doctor.slug}?book=true`} actionLabel="request an appointment" />
        ) : (
          <form onSubmit={submit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Patient full name *</Label>
              <Input required value={form.patient_name} onChange={(e) => setForm({ ...form, patient_name: e.target.value })} className="glass" />
            </div>
            <div className="space-y-2">
              <Label>Mobile number *</Label>
              <Input required type="tel" value={form.patient_phone} onChange={(e) => setForm({ ...form, patient_phone: e.target.value })} className="glass" />
            </div>
            <div className="space-y-2">
              <Label>Preferred date *</Label>
              <Input required type="date" value={form.preferred_date} onChange={(e) => setForm({ ...form, preferred_date: e.target.value })} className="glass" />
            </div>
            <div className="space-y-2">
              <Label>Symptoms or notes (optional)</Label>
              <Textarea value={form.symptoms} onChange={(e) => setForm({ ...form, symptoms: e.target.value })} maxLength={500} placeholder="Mention symptoms or questions for the doctor..." className="glass" />
            </div>
            <Button type="submit" className="w-full btn-gradient" disabled={loading}>{loading ? "Sending Slot Request…" : "Submit appointment request"}</Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
