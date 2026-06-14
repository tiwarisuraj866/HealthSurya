"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getDoctors } from "@/app/actions";
import { DoctorCard } from "@/components/DoctorCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Search, MapPin, SlidersHorizontal, Stethoscope, Locate, Loader2 } from "lucide-react";
import type { DoctorProfile } from "@/lib/doctor";
import { mergePreviewDoctors } from "@/lib/demo-listings";
import { PreviewDataNotice } from "@/components/PreviewDataNotice";
import { useGeolocation } from "@/hooks/useGeolocation";

function DoctorsContent() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") || "";
  const initialCity = searchParams.get("city") || "Jaunpur";

  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [dbCount, setDbCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState(initialQ);
  const [city, setCity] = useState(initialCity);
  const { detecting, locate } = useGeolocation();

  const handleLocate = async () => {
    const loc = await locate();
    if (loc) setCity(loc);
  };
  const [specialization, setSpecialization] = useState("all");
  const [maxFee, setMaxFee] = useState(2000);
  const [minExp, setMinExp] = useState(0);
  const [gender, setGender] = useState("all");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    (async () => {
      const data = await getDoctors({ q: q || undefined, city: city || undefined });
      if (cancelled) return;

      const merged = mergePreviewDoctors((data ?? []) as any, city);
      setDbCount((data ?? []).length);
      setDoctors(merged);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [city, q]);

  const specializations = useMemo(() => {
    const set = new Set(doctors.map((d) => d.specialization).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [doctors]);

  const filtered = useMemo(() => {
    return doctors.filter((d) => {
      if (specialization !== "all" && d.specialization !== specialization) return false;
      if (d.consultation_fee != null && Number(d.consultation_fee) > maxFee) return false;
      if (d.experience_years != null && d.experience_years < minExp) return false;
      if (gender !== "all" && d.gender?.toLowerCase() !== gender) return false;
      if (availableOnly && d.is_available === false) return false;
      return true;
    });
  }, [doctors, specialization, maxFee, minExp, gender, availableOnly]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-sans tracking-tight sm:text-3xl md:text-4xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Find Verified Doctors
        </h1>
        <p className="mt-2 text-muted-foreground text-sm sm:text-base">
          Browse verified healthcare specialists near you and book appointments easily.
        </p>
      </div>

      <div className="mb-6 glass-card p-4 sm:p-5 flex items-center gap-3">
        <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Stethoscope className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold">Ready to book an appointment?</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Click <strong>Book appointment</strong> on any doctor card to launch their clinic calendar.
          </p>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full min-h-11 lg:hidden glass mb-4"
        onClick={() => setFiltersOpen((o) => !o)}
      >
        <SlidersHorizontal className="mr-2 h-4 w-4" />
        {filtersOpen ? "Hide filters" : "Show filters"}
      </Button>

      <div className="grid gap-8 lg:grid-cols-4">
        {/* Sidebar filters */}
        <aside className={`space-y-5 glass-card p-5 lg:col-span-1 lg:sticky lg:top-20 lg:self-start ${filtersOpen ? "block" : "hidden lg:block"}`}>
          <div className="space-y-2 border-b pb-3 mb-4 flex items-center gap-2 font-semibold">
            <SlidersHorizontal className="h-4 w-4 text-primary" /> Refine Search
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs">Search Name or Specialty</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9 glass bg-card/50" placeholder="e.g. Cardiologist" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs">City</Label>
            <div className="relative pr-8">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9 pr-8 glass bg-card/50 w-full" value={city} onChange={(e) => setCity(e.target.value)} />
              <button
                type="button"
                onClick={handleLocate}
                disabled={detecting}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50 touch-target"
                title="Detect my current location"
              >
                {detecting ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : (
                  <Locate className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs">Specialization</Label>
            <Select value={specialization} onValueChange={setSpecialization}>
              <SelectTrigger className="glass bg-card/50"><SelectValue placeholder="All Specialities" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {specializations.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-xs font-medium"><Label>Max fee</Label><span className="text-primary font-semibold">₹{maxFee}</span></div>
            <Slider min={100} max={5000} step={100} value={[maxFee]} onValueChange={([v]) => setMaxFee(v)} />
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-xs font-medium"><Label>Min experience</Label><span className="text-primary font-semibold">{minExp} years</span></div>
            <Slider min={0} max={40} step={1} value={[minExp]} onValueChange={([v]) => setMinExp(v)} />
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs">Gender</Label>
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger className="glass bg-card/50"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between pt-3 border-t mt-4">
            <div className="space-y-0.5">
              <Label htmlFor="available-only" className="text-sm font-semibold">Available Now</Label>
              <p className="text-[10px] text-muted-foreground">Show active doctors</p>
            </div>
            <Switch id="available-only" checked={availableOnly} onCheckedChange={setAvailableOnly} />
          </div>
        </aside>

        {/* Results grid */}
        <div className="lg:col-span-3">
          {dbCount === 0 && !loading && <PreviewDataNotice />}
          <div className="mb-4 text-sm text-muted-foreground">
            {loading ? "Searching doctors..." : `${filtered.length} doctor${filtered.length === 1 ? "" : "s"} available`}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-4 min-[400px]:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse overflow-hidden rounded-2xl border bg-card">
                  <div className="aspect-[16/9] bg-muted" />
                  <div className="space-y-2 p-4">
                    <div className="h-4 w-3/4 rounded bg-muted" />
                    <div className="h-3 w-1/2 rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border bg-card/50 glass-strong p-12 text-center shadow-sm">
              <p className="font-semibold text-lg text-foreground">No doctors match your criteria</p>
              <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
                Try expanding your search parameters or check a different city.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 min-[400px]:grid-cols-2 xl:grid-cols-3">
              {filtered.map((d) => (
                <DoctorCard key={d.id} doctor={d} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DoctorsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading doctor parameters...</div>}>
      <DoctorsContent />
    </Suspense>
  );
}
