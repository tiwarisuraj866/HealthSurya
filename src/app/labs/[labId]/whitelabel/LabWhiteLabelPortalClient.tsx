"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getLabDetails, getLabBranding, saveLabBranding } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ShieldCheck,
  Palette,
  Settings,
  TrendingUp,
  FileText,
  Clock,
  MapPin,
  Phone,
  Loader2,
  CalendarCheck,
  Award,
  Download
} from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function LabWhiteLabelPortalClient({ labId }: { labId: string }) {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [lab, setLab] = useState<any>(null);
  const [labTests, setLabTests] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  
  // Branding state
  const [branding, setBranding] = useState<any>(null);
  const [configOpen, setConfigOpen] = useState(false);
  const [form, setForm] = useState({
    primaryColor: "#0f766e",
    logoUrl: "",
    bannerUrl: "",
    customTitle: "",
    slug: ""
  });
  const [savingBranding, setSavingBranding] = useState(false);

  const loadData = async () => {
    try {
      // Load lab details
      const detailRes = await getLabDetails(labId);
      if (detailRes.lab) {
        setLab(detailRes.lab);
        setLabTests(detailRes.tests || []);
        setBookings(detailRes.bookings || []);
      }
      
      // Load branding
      const brandingRes = await getLabBranding(labId);
      if (brandingRes.success && brandingRes.branding) {
        const b = brandingRes.branding;
        setBranding(b);
        setForm({
          primaryColor: b.primary_color || "#0f766e",
          logoUrl: b.logo_url || "",
          bannerUrl: b.banner_url || "",
          customTitle: b.custom_title || "",
          slug: b.slug || ""
        });
      }
    } catch (err) {
      toast.error("Failed to load white-label portal details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [labId]);

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBranding(true);
    try {
      const res = await saveLabBranding({
        labId,
        primaryColor: form.primaryColor,
        logoUrl: form.logoUrl,
        bannerUrl: form.bannerUrl,
        customTitle: form.customTitle,
        slug: form.slug
      });
      if (res.success) {
        toast.success("Portal branding configured successfully!");
        setConfigOpen(false);
        loadData();
      } else {
        toast.error(res.error || "Failed to save branding");
      }
    } catch (err: any) {
      toast.error(err.message || "Error saving branding");
    } finally {
      setSavingBranding(false);
    }
  };

  // Compute metrics
  const totalRevenue = useMemo(() => {
    // bookings is an array of bookings. filter completed ones and sum prices
    const completed = bookings.filter((b) => b.status === "completed" || b.status === "confirmed");
    return completed.reduce((sum, current) => sum + Number(current.price || 0), 0);
  }, [bookings]);

  const primaryColor = branding?.primary_color || "#0f766e";

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!lab) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-20 text-center">
        <p className="text-muted-foreground text-sm font-semibold">Laboratory center not found.</p>
      </div>
    );
  }

  const isOwner = lab.owner_id === user?.id;

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Branded Banner */}
      <div
        className="w-full h-48 sm:h-64 relative bg-slate-900 overflow-hidden flex items-end"
        style={{
          backgroundImage: branding?.banner_url ? `url(${branding.banner_url})` : "none",
          backgroundSize: "cover",
          backgroundPosition: "center",
          borderBottom: `4px solid ${primaryColor}`
        }}
      >
        {!branding?.banner_url && (
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 to-slate-800 opacity-90" />
        )}
        <div className="relative mx-auto max-w-5xl w-full px-4 sm:px-6 pb-6 flex flex-col sm:flex-row items-center gap-4 text-white">
          <div className="h-20 w-20 sm:h-24 sm:w-24 bg-white rounded-2xl overflow-hidden border-2 border-white/50 flex items-center justify-center shrink-0">
            {branding?.logo_url ? (
              <img src={branding.logo_url} alt="Logo" className="max-h-[80%] max-w-[80%] object-contain" />
            ) : (
              <ShieldCheck className="h-10 w-10" style={{ color: primaryColor }} />
            )}
          </div>
          <div className="text-center sm:text-left flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-extrabold truncate">
              {branding?.custom_title || lab.name}
            </h1>
            <p className="text-xs sm:text-sm text-white/80 mt-1 flex items-center justify-center sm:justify-start gap-1">
              <MapPin className="h-4 w-4 shrink-0" /> {lab.address}, {lab.city}
            </p>
          </div>

          {isOwner && (
            <Dialog open={configOpen} onOpenChange={setConfigOpen}>
              <DialogTrigger asChild>
                <Button className="glass border-white/20 hover:bg-white/10 gap-1.5 h-9 shrink-0 text-xs font-semibold">
                  <Palette className="h-4 w-4" /> Portal Branding Settings
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md glass-strong">
                <DialogHeader>
                  <DialogTitle className="font-sans font-bold flex items-center gap-1.5">
                    <Settings className="h-5 w-5 text-primary" /> White Label Configuration
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSaveBranding} className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="wl-title">Branded Portal Title *</Label>
                    <Input
                      id="wl-title"
                      required
                      placeholder="e.g. Thane Pathology Center"
                      value={form.customTitle}
                      onChange={(e) => setForm({ ...form, customTitle: e.target.value })}
                      className="glass"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="wl-color">Primary Brand Color *</Label>
                    <div className="flex gap-3 items-center">
                      <input
                        id="wl-color"
                        type="color"
                        value={form.primaryColor}
                        onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                        className="h-10 w-12 border rounded cursor-pointer"
                      />
                      <Input
                        value={form.primaryColor}
                        onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                        className="glass font-mono max-w-[120px]"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="wl-logo">Logo URL</Label>
                    <Input
                      id="wl-logo"
                      placeholder="https://example.com/logo.png"
                      value={form.logoUrl}
                      onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                      className="glass"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="wl-banner">Banner Image URL</Label>
                    <Input
                      id="wl-banner"
                      placeholder="https://example.com/banner.jpg"
                      value={form.bannerUrl}
                      onChange={(e) => setForm({ ...form, bannerUrl: e.target.value })}
                      className="glass"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="wl-slug">Branded URL Slug *</Label>
                    <Input
                      id="wl-slug"
                      required
                      placeholder="e.g. thane-diagnostics"
                      value={form.slug}
                      onChange={(e) => setForm({ ...form, slug: e.target.value })}
                      className="glass font-mono"
                    />
                  </div>
                  <Button type="submit" className="w-full btn-gradient min-h-11" disabled={savingBranding}>
                    {savingBranding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Save Brand settings
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-8">
        {/* Lab Metrics Dashboard for Lab Owner */}
        {isOwner && (
          <section className="glass-card p-6 rounded-2xl border bg-card/40 space-y-4">
            <h2 className="text-base font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="h-5 w-5 text-primary" /> Owner Business Insights
            </h2>
            <div className="grid gap-4 grid-cols-3">
              <div className="rounded-xl border bg-muted/20 p-4">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Total Bookings</span>
                <div className="text-xl sm:text-2xl font-extrabold mt-1">{bookings.length} cases</div>
              </div>
              <div className="rounded-xl border bg-muted/20 p-4">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Completed revenue</span>
                <div className="text-xl sm:text-2xl font-extrabold mt-1 text-emerald-600 dark:text-emerald-400">
                  ₹{Number(totalRevenue).toFixed(0)}
                </div>
              </div>
              <div className="rounded-xl border bg-muted/20 p-4">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Active tests</span>
                <div className="text-xl sm:text-2xl font-extrabold mt-1">{labTests.filter(t => t.available).length} packages</div>
              </div>
            </div>
          </section>
        )}

        <div className="grid gap-8 md:grid-cols-3">
          {/* Booking Section */}
          <div className="md:col-span-2 space-y-6">
            <h2 className="text-lg font-bold font-sans border-b pb-2 flex items-center gap-2">
              <CalendarCheck className="h-5 w-5" style={{ color: primaryColor }} /> Test Booking Catalog
            </h2>
            <div className="space-y-3">
              {labTests.length === 0 ? (
                <p className="rounded-xl border bg-card/50 p-6 text-sm text-muted-foreground text-center">
                  This white-label portal does not have any active tests configured.
                </p>
              ) : (
                labTests.map((lt) => (
                  <div
                    key={lt.id}
                    className="flex flex-col gap-3 rounded-xl border bg-card/45 p-4 sm:flex-row sm:items-center sm:justify-between shadow-sm transition-all hover:bg-card/70"
                  >
                    <div>
                      <div className="font-semibold text-foreground">{lt.tests?.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Category: {lt.tests?.category} {lt.turnaround_hours ? `· Reports in ${lt.turnaround_hours}h` : ""}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 justify-between sm:justify-end">
                      <div className="text-right">
                        <div className="font-extrabold text-base" style={{ color: primaryColor }}>
                          ₹{Number(lt.price).toFixed(0)}
                        </div>
                      </div>
                      <Button size="sm" style={{ backgroundColor: primaryColor }} asChild>
                        <Link href={`/labs/${labId}?book=true`}>Book package</Link>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Downloads / White Label Details */}
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold font-sans border-b pb-2 flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5" style={{ color: primaryColor }} /> Diagnostics Info
              </h2>
              <div className="rounded-xl border bg-card p-4 space-y-3 text-xs leading-relaxed text-muted-foreground">
                <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                  <Award className="h-4 w-4" style={{ color: primaryColor }} /> Certified Laboratory Partner
                </div>
                <p>
                  This portal is verified by HealthSurya. All medical lab tests are executed by NABL certified technicians using diagnostic equipment.
                </p>
                <div className="border-t pt-2 mt-2 space-y-1">
                  <p className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 shrink-0" />Timings: {lab.open_time} - {lab.close_time}</p>
                  <p className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 shrink-0" />Phone: {lab.phone}</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold font-sans border-b pb-2 flex items-center gap-2 mb-4">
                <Download className="h-5 w-5" style={{ color: primaryColor }} /> PDF Report Vault
              </h2>
              <div className="space-y-2">
                <div className="rounded-xl border bg-card/45 p-3 flex items-center justify-between text-xs transition-all hover:bg-card/70">
                  <div className="min-w-0 pr-2">
                    <div className="font-bold text-foreground truncate">CBC_Test_Report_Sample.pdf</div>
                    <span className="text-[10px] text-muted-foreground">Uploaded 2 days ago · 1.2 MB</span>
                  </div>
                  <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0 hover:text-primary">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
                <div className="rounded-xl border bg-card/45 p-3 flex items-center justify-between text-xs transition-all hover:bg-card/70">
                  <div className="min-w-0 pr-2">
                    <div className="font-bold text-foreground truncate">Thyroid_TSH_Report_Sample.pdf</div>
                    <span className="text-[10px] text-muted-foreground">Uploaded 1 week ago · 940 KB</span>
                  </div>
                  <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0 hover:text-primary">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
