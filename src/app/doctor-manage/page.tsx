"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  getDoctorProfile,
  updateAppointmentStatus,
  addDoctorGalleryPhoto,
  deleteDoctorGalleryPhoto,
  updateDoctorAvailability,
  createReferredLabBooking,
  getLabs,
  getLabDetails,
} from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  BarChart3,
  Calendar,
  Eye,
  Globe,
  MessageCircle,
  Settings,
  Trash2,
  ImagePlus,
  Loader2,
  Plus,
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AppointmentStatus, DoctorAppointment, DoctorGalleryItem, DoctorProfile } from "@/lib/doctor";
import { doctorPublicUrl } from "@/lib/doctor";

export default function DoctorManagePage() {
  const { roles, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !roles.includes("doctor")) {
      router.replace("/unauthorized");
    }
  }, [authLoading, roles, router]);

  const [loading, setLoading] = useState(true);
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [gallery, setGallery] = useState<DoctorGalleryItem[]>([]);
  const [referredBookings, setReferredBookings] = useState<any[]>([]);
  const [newImage, setNewImage] = useState({ image_url: "", caption: "" });
  const [submittingImage, setSubmittingImage] = useState(false);

  // Referral Modal State
  const [isReferModalOpen, setIsReferModalOpen] = useState(false);
  const [labs, setLabs] = useState<any[]>([]);
  const [selectedLabId, setSelectedLabId] = useState("");
  const [tests, setTests] = useState<any[]>([]);
  const [selectedTestId, setSelectedTestId] = useState("");
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [homeCollection, setHomeCollection] = useState(false);
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [commissionAmount, setCommissionAmount] = useState("");
  const [submittingReferral, setSubmittingReferral] = useState(false);

  const openReferModal = async () => {
    setIsReferModalOpen(true);
    try {
      const labsData = await getLabs({});
      setLabs(labsData || []);
    } catch (err) {
      toast.error("Failed to load labs list");
    }
  };

  const handleLabChange = async (labId: string) => {
    setSelectedLabId(labId);
    setSelectedTestId("");
    setTests([]);
    setCommissionAmount("");
    if (!labId) return;
    try {
      const details = await getLabDetails(labId);
      setTests(details.tests || []);
    } catch (err) {
      toast.error("Failed to load tests for selected lab");
    }
  };

  const handleTestChange = (testId: string) => {
    setSelectedTestId(testId);
    const test = tests.find((t) => (t.id === testId || t.test_id === testId));
    if (test) {
      const price = Number(test.price || 0);
      setCommissionAmount((price * 0.15).toFixed(0));
    } else {
      setCommissionAmount("");
    }
  };

  const handleReferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLabId) return toast.error("Please select a lab");
    if (!selectedTestId) return toast.error("Please select a pathology test");
    if (!patientName.trim()) return toast.error("Please enter patient name");
    if (patientPhone.length < 10) return toast.error("Please enter a valid 10-digit phone number");
    if (!scheduledAt) return toast.error("Please specify a preferred date");
    if (homeCollection && !address.trim()) return toast.error("Please specify sample collection address");

    const test = tests.find((t) => (t.id === selectedTestId || t.test_id === selectedTestId));
    if (!test) return toast.error("Selected test invalid");

    setSubmittingReferral(true);
    try {
      const res = await createReferredLabBooking({
        patientName,
        patientPhone,
        patientEmail: patientEmail || null,
        labId: selectedLabId,
        testId: test.test_id || test.id,
        scheduledAt: new Date(scheduledAt).toISOString(),
        price: Number(test.price),
        homeCollection,
        address: homeCollection ? address : null,
        notes: notes || null,
        commissionAmount: commissionAmount ? Number(commissionAmount) : undefined,
      });

      if (res.success) {
        toast.success("Patient referred to lab test successfully!");
        setIsReferModalOpen(false);
        // Reset fields
        setPatientName("");
        setPatientPhone("");
        setPatientEmail("");
        setSelectedLabId("");
        setSelectedTestId("");
        setTests([]);
        setScheduledAt("");
        setHomeCollection(false);
        setAddress("");
        setNotes("");
        setCommissionAmount("");
        // Reload list
        load();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to submit referral booking");
    } finally {
      setSubmittingReferral(false);
    }
  };

  const load = async () => {
    try {
      const res = await getDoctorProfile();
      if (!res) {
        setDoctor(null);
        return;
      }
      setDoctor(res.doctor as DoctorProfile);
      setAppointments(res.appointments as DoctorAppointment[]);
      setGallery(res.gallery as DoctorGalleryItem[]);
      setReferredBookings(res.referredBookings || []);
    } catch (err: any) {
      toast.error("Failed to load doctor profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleUpdateStatus = async (id: string, status: AppointmentStatus) => {
    try {
      const res = await updateAppointmentStatus(id, status);
      if (res.success) {
        toast.success("Status updated successfully");
        load();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    }
  };

  const handleAddGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctor || !newImage.image_url) return;
    setSubmittingImage(true);
    try {
      const res = await addDoctorGalleryPhoto(newImage.image_url, newImage.caption);
      if (res.success) {
        setNewImage({ image_url: "", caption: "" });
        toast.success("Photo added to gallery");
        load();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to add photo");
    } finally {
      setSubmittingImage(false);
    }
  };

  const handleRemoveGallery = async (id: string) => {
    try {
      const res = await deleteDoctorGalleryPhoto(id);
      if (res.success) {
        toast.success("Photo removed");
        load();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to remove photo");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center glass-card mt-10">
        <h1 className="text-2xl font-bold font-sans">Doctor Dashboard</h1>
        <p className="mt-2 text-muted-foreground max-w-md mx-auto">
          Create your professional profile to get your auto-generated mini website and start receiving bookings.
        </p>
        <div className="mt-6">
          <Button asChild className="min-h-11 px-6">
            <Link href="/doctor-setup">Set up Professional Profile</Link>
          </Button>
        </div>
      </div>
    );
  }

  const pendingCount = appointments.filter((a) => a.status === "pending").length;
  const siteUrl = doctorPublicUrl(doctor.slug);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 space-y-8">
      {/* Header Panel */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-extrabold font-sans bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Doctor Dashboard
          </h1>
          <p className="mt-1.5 text-muted-foreground text-sm">
            Manage consultations, appointment requests, clinic gallery, and track your metrics.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary shrink-0" />
              <a
                href={siteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-primary hover:underline truncate max-w-xs sm:max-w-md"
              >
                {siteUrl}
              </a>
            </div>
            
            <div className="flex items-center gap-2 rounded-lg border bg-card/50 px-3 py-1">
              <span className={`h-2 w-2 rounded-full ${doctor.is_available !== false ? "bg-emerald-500 animate-pulse" : "bg-destructive"}`} />
              <span className="text-xs font-medium">{doctor.is_available !== false ? "Available" : "On Leave"}</span>
              <Switch
                className="ml-2"
                checked={doctor.is_available !== false}
                onCheckedChange={async (checked) => {
                  try {
                    const res = await updateDoctorAvailability(checked);
                    if (res.success) {
                      setDoctor((prev: any) => ({ ...prev, is_available: checked }));
                      toast.success(checked ? "Status: Available" : "Status: On Leave");
                    }
                  } catch (err: any) {
                    toast.error(err.message || "Failed to update status");
                  }
                }}
              />
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={openReferModal} className="btn-gradient text-white border-none shadow-sm">
            <Plus className="mr-1.5 h-4 w-4" /> Refer Patient to Lab
          </Button>
          <Button asChild variant="outline" size="sm" className="glass">
            <a href={`/doctors/${doctor.slug}`} target="_blank" rel="noopener noreferrer">
              <Eye className="mr-1.5 h-4 w-4 text-primary" /> View Mini Site
            </a>
          </Button>
          <Button asChild size="sm">
            <Link href="/doctor-setup">
              <Settings className="mr-1.5 h-4 w-4" /> Edit Profile
            </Link>
          </Button>
        </div>
      </div>

      {/* Analytics Stats Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Stat icon={Eye} label="Profile Views" value={doctor.profile_views} />
        <Stat icon={Calendar} label="Appointments" value={appointments.length} />
        <Stat icon={MessageCircle} label="WhatsApp Clicks" value={doctor.whatsapp_clicks} />
        <Stat icon={BarChart3} label="Rating" value={doctor.rating > 0 ? `${doctor.rating} ★` : "New"} />
      </div>

      {pendingCount > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3.5 text-sm text-amber-500 font-semibold flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
          </span>
          You have {pendingCount} pending appointment request{pendingCount > 1 ? "s" : ""} requiring action.
        </div>
      )}

      {/* Appointment Requests Section */}
      <section className="glass-card p-6 rounded-2xl shadow-sm">
        <h2 className="text-xl font-bold font-sans border-b pb-3 mb-4">Patient Appointment Requests</h2>
        <div className="space-y-3">
          {appointments.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No requests yet. Share your mini-website link to get bookings.
            </div>
          ) : (
            appointments.map((a) => (
              <div
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card/40 p-4 hover:bg-card/70 transition-all"
              >
                <div>
                  <p className="font-bold text-foreground text-base">{a.patient_name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Phone: {a.patient_phone} · Preferred Date: <strong className="text-foreground">{a.preferred_date}</strong>
                  </p>
                  {a.symptoms && (
                    <div className="mt-2 text-xs bg-muted/50 p-2 rounded-lg text-muted-foreground border">
                      <strong className="text-foreground">Symptoms:</strong> {a.symptoms}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={a.status === "pending" ? "secondary" : "outline"} className="capitalize">
                    {a.status}
                  </Badge>
                  <Select value={a.status} onValueChange={(v) => handleUpdateStatus(a.id, v as AppointmentStatus)}>
                    <SelectTrigger className="w-[120px] min-h-9 glass bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(["pending", "confirmed", "completed", "cancelled"] as const).map((s) => (
                        <SelectItem key={s} value={s} className="capitalize">
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Clinic Gallery Section */}
      <section className="glass-card p-6 rounded-2xl shadow-sm space-y-4">
        <div>
          <h2 className="text-xl font-bold font-sans">Clinic Gallery Photos</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Showcase your facility. These images will be displayed on your public profile.
          </p>
        </div>

        <form onSubmit={handleAddGallery} className="flex flex-wrap gap-4 rounded-xl border bg-card/20 p-4 items-end">
          <div className="min-w-0 w-full flex-1 space-y-1.5 sm:min-w-[15rem]">
            <Label className="text-xs font-semibold uppercase tracking-wider text-primary">Image URL</Label>
            <Input
              required
              value={newImage.image_url}
              onChange={(e) => setNewImage({ ...newImage, image_url: e.target.value })}
              placeholder="e.g. https://images.unsplash.com/photo-..."
              className="glass"
            />
          </div>
          <div className="min-w-0 w-full flex-1 space-y-1.5 sm:min-w-[10rem]">
            <Label className="text-xs font-semibold uppercase tracking-wider text-primary">Caption (Optional)</Label>
            <Input
              value={newImage.caption}
              onChange={(e) => setNewImage({ ...newImage, caption: e.target.value })}
              placeholder="e.g. Waiting Lounge"
              className="glass"
            />
          </div>
          <Button type="submit" className="min-h-11 px-5" disabled={submittingImage}>
            {submittingImage ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ImagePlus className="mr-1.5 h-4 w-4" />}
            Add Photo
          </Button>
        </form>

        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 mt-4">
          {gallery.map((g) => (
            <div key={g.id} className="relative overflow-hidden rounded-xl border group shadow-sm bg-card/50 aspect-video">
              <img src={g.image_url} alt={g.caption || ""} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
              {g.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-2 py-1 truncate">
                  {g.caption}
                </div>
              )}
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="absolute right-2 top-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleRemoveGallery(g.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* Referred Pathology Bookings & Commissions */}
      <section className="glass-card p-6 rounded-2xl shadow-sm space-y-6">
        <div>
          <h2 className="text-xl font-bold font-sans">Pathology Referrals & Commission Earnings</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Track patients you referred for lab tests, view status updates, and monitor your referral commissions.
          </p>
        </div>

        {/* Commission stats */}
        <div className="grid gap-4 grid-cols-3">
          <div className="rounded-xl border bg-muted/20 p-4">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Total Referred</span>
            <div className="text-xl font-extrabold mt-1">{referredBookings.length} cases</div>
          </div>
          <div className="rounded-xl border bg-muted/20 p-4">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Earned Commission</span>
            <div className="text-xl font-extrabold mt-1 text-emerald-600 dark:text-emerald-400">
              ₹{referredBookings
                .filter(b => b.status === "completed" || b.status === "fnf")
                .reduce((acc, curr) => acc + Number(curr.commission_amount || 0), 0)
                .toFixed(0)}
            </div>
          </div>
          <div className="rounded-xl border bg-muted/20 p-4">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Pending Commission</span>
            <div className="text-xl font-extrabold mt-1 text-amber-600 dark:text-amber-400">
              ₹{referredBookings
                .filter(b => b.status !== "completed" && b.status !== "fnf" && b.status !== "cancelled")
                .reduce((acc, curr) => acc + Number(curr.commission_amount || 0), 0)
                .toFixed(0)}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {referredBookings.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No referred pathology bookings recorded yet.
            </div>
          ) : (
            <div className="border rounded-xl overflow-hidden bg-card/40">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead>Patient Name</TableHead>
                    <TableHead>Test Details</TableHead>
                    <TableHead>Test Price</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referredBookings.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-semibold">{b.profiles?.full_name || "Patient"}</TableCell>
                      <TableCell>
                        <div>{b.tests?.name || "Blood Test"}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {new Date(b.scheduled_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">₹{Number(b.price).toFixed(0)}</TableCell>
                      <TableCell className="font-bold text-primary">₹{Number(b.commission_amount || 0).toFixed(0)}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            b.status === "completed"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300 border-none capitalize text-xs"
                              : b.status === "fnf"
                              ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-300 border-none capitalize text-xs"
                              : b.status === "cancelled"
                              ? "bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-300 border-none capitalize text-xs"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300 border-none capitalize text-xs"
                          }
                        >
                          {b.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </section>

      {/* Refer Patient to Lab Modal */}
      {isReferModalOpen && (
        <Dialog open={isReferModalOpen} onOpenChange={setIsReferModalOpen}>
          <DialogContent className="max-w-lg overflow-y-auto max-h-[90vh] bg-card border border-border rounded-2xl shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold font-sans">Refer Patient to Pathology Lab</DialogTitle>
              <DialogDescription>
                Directly book a diagnostic test for a patient and earn your referral commission.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleReferSubmit} className="space-y-4 py-2">
              {/* Patient details section */}
              <div className="border bg-muted/20 p-4 rounded-xl space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-primary">1. Patient Information</h3>
                
                <div className="space-y-1.5">
                  <Label htmlFor="ref-patient-name" className="text-xs font-semibold">Patient Full Name *</Label>
                  <Input
                    id="ref-patient-name"
                    required
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="glass h-10"
                  />
                </div>

                <div className="grid gap-3 grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="ref-patient-phone" className="text-xs font-semibold">Mobile Number *</Label>
                    <div className="flex gap-1.5">
                      <span className="flex h-10 items-center rounded-md border bg-muted px-2.5 text-xs font-mono text-muted-foreground select-none">
                        +91
                      </span>
                      <Input
                        id="ref-patient-phone"
                        required
                        maxLength={10}
                        value={patientPhone}
                        onChange={(e) => setPatientPhone(e.target.value.replace(/\D/g, ""))}
                        placeholder="9876543210"
                        className="glass h-10 font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="ref-patient-email" className="text-xs font-semibold">Email Address (Optional)</Label>
                    <Input
                      id="ref-patient-email"
                      type="email"
                      value={patientEmail}
                      onChange={(e) => setPatientEmail(e.target.value)}
                      placeholder="patient@gmail.com"
                      className="glass h-10"
                    />
                  </div>
                </div>
              </div>

              {/* Lab & Test Selection */}
              <div className="border bg-muted/20 p-4 rounded-xl space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-primary">2. Select Lab & Pathology Test</h3>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Diagnostic Lab Partner *</Label>
                  <select
                    required
                    value={selectedLabId}
                    onChange={(e) => handleLabChange(e.target.value)}
                    className="w-full h-10 rounded-md border bg-card px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring text-foreground"
                  >
                    <option value="" className="text-foreground bg-card">-- Choose a Lab --</option>
                    {labs.map((l) => (
                      <option key={l.id} value={l.id} className="text-foreground bg-card">
                        {l.name} ({l.city || "Thane"})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedLabId && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Available Pathology Test *</Label>
                    <select
                      required
                      value={selectedTestId}
                      onChange={(e) => handleTestChange(e.target.value)}
                      className="w-full h-10 rounded-md border bg-card px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring text-foreground"
                    >
                      <option value="" className="text-foreground bg-card">-- Choose a Test --</option>
                      {tests.map((t) => (
                        <option key={t.id || t.test_id} value={t.id || t.test_id} className="text-foreground bg-card">
                          {t.tests?.name} (Price: ₹{t.price} · TAT: {t.turnaround_hours || 24}h)
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Booking Logistics */}
              <div className="border bg-muted/20 p-4 rounded-xl space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-primary">3. Booking Date & Logistics</h3>

                <div className="space-y-1.5">
                  <Label htmlFor="ref-scheduled-at" className="text-xs font-semibold">Preferred Appointment Date & Time *</Label>
                  <Input
                    id="ref-scheduled-at"
                    type="datetime-local"
                    required
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="glass h-10"
                  />
                </div>

                <div className="flex flex-col gap-2 justify-center py-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="ref-home-collection" className="text-xs font-semibold cursor-pointer">
                      Home Sample Collection
                    </Label>
                    <Switch
                      id="ref-home-collection"
                      checked={homeCollection}
                      onCheckedChange={setHomeCollection}
                    />
                  </div>
                </div>

                {homeCollection && (
                  <div className="space-y-1.5">
                    <Label htmlFor="ref-address" className="text-xs font-semibold">Patient Address for Sample Collection *</Label>
                    <Input
                      id="ref-address"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Enter patient full address with pincode"
                      className="glass h-10"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="ref-notes" className="text-xs font-semibold">Referral Notes / Clinical Instructions (Optional)</Label>
                  <Input
                    id="ref-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Fasting required for 12 hours"
                    className="glass h-10"
                  />
                </div>

                {selectedTestId && commissionAmount && (
                  <div className="space-y-1.5">
                    <Label htmlFor="ref-commission" className="text-xs font-semibold">Referral Commission (₹)</Label>
                    <Input
                      id="ref-commission"
                      type="number"
                      value={commissionAmount}
                      onChange={(e) => setCommissionAmount(e.target.value)}
                      className="glass h-10 text-emerald-600 font-bold"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Calculated 15% commission is pre-filled. Adjust if necessary.
                    </p>
                  </div>
                )}
              </div>

              <DialogFooter className="mt-4 flex gap-2">
                <Button type="button" variant="outline" onClick={() => setIsReferModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submittingReferral} className="btn-gradient">
                  {submittingReferral ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Referring...
                    </>
                  ) : (
                    "Confirm Referral & Book"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border bg-card/30 glass p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
        <Icon className="h-4 w-4 text-primary shrink-0" />
      </div>
      <div className="mt-2 text-2xl font-extrabold tracking-tight text-foreground">{value}</div>
    </div>
  );
}
