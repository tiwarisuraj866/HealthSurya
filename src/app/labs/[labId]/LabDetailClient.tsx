"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getLabDetails, createBooking } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { MapPin, Phone, Star, BadgeCheck, Truck, Clock, ArrowLeft } from "lucide-react";
import { DeliveryAddressForm } from "@/components/DeliveryAddressForm";
import { OrderPaymentStep } from "@/components/OrderPaymentStep";
import { EMPTY_ADDRESS, formatAddress, validateAddress } from "@/lib/address";
import { calculateSampleCollectionFee } from "@/lib/delivery-pricing";
import { calculateLabBill } from "@/lib/billing";
import { notifyLabBookingPlaced } from "@/lib/call-alerts";
import { getPreviewLabById, isPreviewLabId } from "@/lib/demo-listings";

interface LabTest {
  id: string;
  test_id: string;
  price: number;
  home_collection: boolean;
  available: boolean;
  turnaround_hours: number | null;
  tests: { name: string; category: string } | null;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export default function LabDetailClient({ labId }: { labId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scrollToBook = searchParams.get("book") === "true";

  const { user } = useAuth();
  const [lab, setLab] = useState<any>(null);
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const testsSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollToBook && lab) {
      setTimeout(() => testsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 400);
    }
  }, [scrollToBook, lab]);

  useEffect(() => {
    (async () => {
      try {
        const data = await getLabDetails(labId);
        if (data.lab) {
          setLab(data.lab);
        } else {
          // Fallback to preview lab
          const preview = getPreviewLabById(labId);
          if (preview) {
            setLab({
              ...preview,
              description: "Preview pathology center for testing.",
              phone: "9876500000",
              email: "preview@healthsurya.local",
              open_time: "07:00",
              close_time: "21:00",
            });
          } else {
            setLab(null);
          }
        }
        setLabTests((data.tests ?? []) as any);
        setReviews(data.reviews ?? []);
      } catch (err) {
        console.error("Error loading lab:", err);
        setLab(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [labId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p className="mt-4 text-muted-foreground text-sm">Loading lab details...</p>
      </div>
    );
  }

  if (lab === null) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6">
        <p className="text-muted-foreground">Pathology lab not found.</p>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/labs"><ArrowLeft className="mr-2 h-4 w-4" /> Browse labs</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link href="/labs" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to all labs
      </Link>

      <div className="overflow-hidden rounded-2xl border bg-card/60 glass-card">
        <div className="aspect-[21/8] w-full overflow-hidden bg-secondary">
          {lab.image_url ? (
            <img src={lab.image_url} className="h-full w-full object-cover" alt={lab.name} />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-hero-gradient text-4xl font-bold text-primary/40 sm:text-6xl">
              {lab.name.charAt(0)}
            </div>
          )}
        </div>
        <div className="p-4 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold font-sans sm:text-3xl">{lab.name}</h1>
                {lab.verified && <BadgeCheck className="h-6 w-6 text-primary" />}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-primary" />{lab.address}, {lab.city} - {lab.pincode}</span>
                <span className="flex items-center gap-1.5"><Phone className="h-4 w-4 text-primary" />{lab.phone}</span>
                {(lab.open_time || lab.close_time) && <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-primary" />{lab.open_time} - {lab.close_time}</span>}
              </div>
              <div className="mt-3 flex items-center gap-3">
                <span className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-semibold">
                  <Star className="h-3.5 w-3.5 fill-accent text-accent" /> {Number(lab.rating).toFixed(1)} ({lab.total_reviews})
                </span>
                {lab.home_collection && <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary hover:bg-primary/10"><Truck className="h-3 w-3" />Home collection</Badge>}
              </div>
              {lab.description && <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">{lab.description}</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-8 md:grid-cols-3">
        <div ref={testsSectionRef} id="tests" className="scroll-mt-24 md:col-span-2">
          <h2 className="text-lg font-bold font-sans border-b pb-2 mb-4">Available Tests & Pricing</h2>
          {labTests.length === 0 ? (
            <p className="rounded-xl border bg-card p-6 text-sm text-muted-foreground text-center">This lab hasn&apos;t published its tests yet.</p>
          ) : (
            <div className="space-y-2.5">
              {labTests.map((lt) => (
                <div key={lt.id} className="flex flex-col gap-3 rounded-xl border bg-card/40 hover:bg-card/70 transition-colors p-4 sm:flex-row sm:items-center sm:justify-between shadow-sm">
                  <div className="min-w-0">
                    <div className="font-semibold text-foreground">{lt.tests?.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{lt.tests?.category} {lt.turnaround_hours ? `· ${lt.turnaround_hours}h report delivery` : ""}</div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end sm:gap-4">
                    <div className="text-right">
                      <div className="font-bold text-primary">₹{Number(lt.price).toFixed(0)}</div>
                      {lt.home_collection && <div className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Home pickup available</div>}
                    </div>
                    {user ? (
                      <BookDialog lab={lab} labTest={lt} userId={user.id} onDone={() => router.push("/bookings")} />
                    ) : (
                      <Button size="sm" onClick={() => router.push(`/login?redirect=/labs/${labId}?book=true`)}>
                        Login to book
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-lg font-bold font-sans border-b pb-2 mb-4">Center Location</h2>
          <div className="overflow-hidden rounded-xl border shadow-sm mb-6 bg-card/40">
            <iframe
              title="Lab location map"
              src={`https://maps.google.com/maps?q=${encodeURIComponent(`${lab.address}, ${lab.city}`)}&output=embed`}
              className="h-48 w-full border-0 bg-secondary"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <h2 className="text-lg font-bold font-sans border-b pb-2 mb-4">Patient Reviews</h2>
          <div className="space-y-3">
            {reviews.length === 0 && <p className="rounded-xl border bg-card p-4 text-sm text-muted-foreground text-center">No reviews yet.</p>}
            {reviews.map((r) => (
              <div key={r.id} className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-0.5 text-sm mb-1.5">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-accent text-accent" />
                  ))}
                </div>
                {r.comment && <p className="text-sm text-muted-foreground leading-relaxed">{r.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function BookDialog({ lab, labTest, userId, onDone }: { lab: any; labTest: LabTest; userId: string; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [date, setDate] = useState("");
  const [home, setHome] = useState(labTest.home_collection);
  const [address, setAddress] = useState({ ...EMPTY_ADDRESS, city: lab.city, district: lab.city, state: "Uttar Pradesh", pincode: lab.pincode });
  const [notes, setNotes] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [payment, setPayment] = useState<"cod" | "prepaid" | "wallet">("prepaid");
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const pricing = calculateSampleCollectionFee(Number(labTest.price), address.pincode || lab.pincode, home, lab.pincode);
  const bill = useMemo(
    () => calculateLabBill(pricing.testPrice, home ? pricing.collectionFee : 0),
    [pricing.testPrice, pricing.collectionFee, home],
  );

  const submit = async () => {
    if (!date) return toast.error("Pick a date and time");
    if (isPreviewLabId(lab.id) && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== "pk_test_Y2xlcmsubW9jay5kZXYk") {
      toast.error("This is a demo lab. Please book with a registered lab.");
      return;
    }
    const phone = home ? address.phone : contactPhone.replace(/\s/g, "");
    if (!/^[6-9]\d{9}$/.test(phone)) return toast.error("Enter a valid 10-digit mobile number");
    if (home) {
      const err = validateAddress(address);
      if (err) return toast.error(err);
    }
    if (!policyAccepted) return toast.error("Please accept the refund policy");
    setLoading(true);

    const fullAddress = home ? formatAddress(address) : null;
    const meta = home
      ? {
          ...address,
          collection_fee: pricing.collectionFee,
          distance_km: pricing.distanceKm,
          gst_total: bill.gstTotal,
          test_gst: bill.testGst,
          refund_policy: "no_refund_after_sample",
        }
      : { gst_total: bill.gstTotal, test_gst: bill.testGst, refund_policy: "no_refund_after_sample" };

    try {
      const res = await createBooking({
        labId: lab.id,
        testId: labTest.test_id,
        scheduledAt: new Date(date).toISOString(),
        price: bill.grandTotal,
        homeCollection: home,
        address: home ? [fullAddress, JSON.stringify(meta)].filter(Boolean).join("\n---\n") : null,
        notes: [notes, payment !== "cod" ? `payment:${payment}` : "payment:cod"].filter(Boolean).join(" | "),
      });

      if (res.success) {
        notifyLabBookingPlaced({
          labId: lab.id,
          labName: lab.name,
          patientPhone: phone,
          testName: labTest.tests?.name ?? "Blood test",
        });
        toast.success(
          home
            ? "Booked! Lab will call you to confirm home collection."
            : "Booked! Lab will call you shortly to confirm your slot."
        );
        setOpen(false);
        setStep(0);
        onDone();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to make a booking.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setStep(0); }}>
      <DialogTrigger asChild><Button size="sm">Book test</Button></DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg glass-strong">
        <DialogHeader>
          <DialogTitle className="font-sans font-bold">Book {labTest.tests?.name}</DialogTitle>
        </DialogHeader>

        {step === 0 ? (
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Date & Time for {home ? "home collection" : "lab visit"} *</Label>
              <Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className="glass" />
            </div>
            {labTest.home_collection && (
              <div className="flex items-center justify-between rounded-lg border bg-card/40 p-3 shadow-sm">
                <div>
                  <Label className="cursor-pointer">Home sample collection</Label>
                  <p className="text-xs text-muted-foreground">Phlebotomist visits your address</p>
                </div>
                <Switch checked={home} onCheckedChange={setHome} />
              </div>
            )}
            {home && (
              <DeliveryAddressForm
                value={address}
                onChange={setAddress}
                title="Sample collection address"
                subtitle="Provide full address details for sample collection."
              />
            )}
            {!home && (
              <div className="space-y-2">
                <Label>Mobile for confirmation call *</Label>
                <Input
                  type="tel"
                  placeholder="10-digit mobile"
                  maxLength={10}
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value.replace(/\D/g, ""))}
                  className="glass"
                />
                <p className="text-xs text-muted-foreground">The lab will call you to confirm your schedule.</p>
              </div>
            )}
            <div className="space-y-2">
              <Label>Notes / Requirements (optional)</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} placeholder="Fasting status, gate passcode, directions..." className="glass" />
            </div>

            <div className="rounded-xl bg-secondary/80 p-4 text-sm shadow-sm space-y-1">
              <div className="flex justify-between"><span>Test price</span><span>₹{bill.testPrice.toFixed(0)}</span></div>
              <div className="flex justify-between text-muted-foreground">
                <span>GST on test (12%)</span><span>₹{bill.testGst.toFixed(0)}</span>
              </div>
              {home && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Collection fee ({pricing.distanceKm} km)</span>
                  <span>{bill.collectionFee === 0 ? "FREE" : `₹${bill.collectionFee.toFixed(0)}`}</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-2 mt-2 font-bold text-primary text-base">
                <span>Grand Total (incl. GST)</span><span>₹{bill.grandTotal.toFixed(0)}</span>
              </div>
            </div>
            <Button onClick={() => {
              if (!date) return toast.error("Pick date & time");
              if (home && validateAddress(address)) return toast.error(validateAddress(address)!);
              if (!home && !/^[6-9]\d{9}$/.test(contactPhone.replace(/\s/g, ""))) {
                return toast.error("Enter confirmation call phone number");
              }
              setStep(1);
            }} className="w-full btn-gradient">Continue to payment</Button>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <OrderPaymentStep
              payment={payment}
              onPaymentChange={setPayment}
              policyAccepted={policyAccepted}
              onPolicyChange={setPolicyAccepted}
              policyVariant="blood_test"
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(0)} className="flex-1">Back</Button>
              <Button onClick={submit} disabled={loading} className="flex-1 btn-gradient">
                {loading ? "Booking…" : `Confirm · ₹${bill.grandTotal.toFixed(0)}`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
