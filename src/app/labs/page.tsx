"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getLabs } from "@/app/actions";
import { LabCard, type LabCardData } from "@/components/LabCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, MapPin, SlidersHorizontal, Locate, Loader2 } from "lucide-react";
import { PreviewDataNotice } from "@/components/PreviewDataNotice";
import { DEFAULT_CITY } from "@/lib/location";
import { supabase } from "@/integrations/supabase/client";
import { useGeolocation } from "@/hooks/useGeolocation";

interface Test {
  id: string;
  name: string;
  category: string;
}

interface LabRow extends LabCardData {
  owner_id: string;
}

const POPULAR_TESTS = ["CBC", "Thyroid Profile", "Vitamin D", "HbA1c", "Lipid Profile", "LFT", "KFT"];

function LabsContent() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") || "";
  const initialCity = searchParams.get("city") || "";
  const initialCityResolved = initialCity || DEFAULT_CITY;

  const [labs, setLabs] = useState<LabRow[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);

  // filters
  const [testId, setTestId] = useState<string>("all");
  const [q, setQ] = useState(initialQ);
  const [city, setCity] = useState(initialCityResolved);
  const { detecting, locate } = useGeolocation();

  const handleLocate = async () => {
    const loc = await locate();
    if (loc) setCity(loc);
  };
  const [dbCount, setDbCount] = useState(0);
  const [maxPrice, setMaxPrice] = useState(5000);
  const [minRating, setMinRating] = useState(0);
  const [homeOnly, setHomeOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // lab_id -> { minPrice, matchedTest, homeCollection }
  const [labTestMap, setLabTestMap] = useState<Record<string, { minPrice: number; matchedTest: boolean; homeCollection: boolean }>>({});

  // Load tests catalog from DB
  useEffect(() => {
    supabase.from("tests" as any).select("id, name, category").order("name").then(({ data }) => {
      setTests((data as any) ?? []);
      if (initialQ && data) {
        const match = (data as any[] ?? []).find((t) => t.name.toLowerCase().includes(initialQ.toLowerCase()));
        if (match) setTestId(match.id);
      }
    });
  }, [initialQ]);

  // Load labs using the secure server action
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    (async () => {
      const data = await getLabs({ q: q || undefined, city: city || undefined });
      if (cancelled) return;

      // Fetch lab tests for matching test filter
      let ltQuery = supabase
        .from("lab_tests" as any)
        .select("lab_id, price, home_collection, test_id, available")
        .eq("available", true);

      if (testId !== "all") {
        ltQuery = ltQuery.eq("test_id", testId);
      }

      const { data: lts } = await ltQuery as any;
      if (cancelled) return;

      const priceMap: Record<string, { minPrice: number; matchedTest: boolean; homeCollection: boolean }> = {};
      for (const lt of (lts ?? []) as any[]) {
        const prev = priceMap[lt.lab_id];
        const price = Number(lt.price);
        if (!prev || price < prev.minPrice) {
          priceMap[lt.lab_id] = { minPrice: price, matchedTest: true, homeCollection: lt.home_collection };
        }
      }

      setLabTestMap(priceMap);
      setLabs((data ?? []) as LabRow[]);
      setDbCount((data ?? []).length);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [city, testId]);

  const filtered = useMemo(() => {
    return labs
      .filter((l) => (verifiedOnly ? l.verified : true))
      .filter((l) => (availableOnly ? l.is_available !== false : true))
      .filter((l) => Number(l.rating) >= minRating)
      .filter((l) => (homeOnly ? l.home_collection : true))
      .filter((l) => {
        if (testId === "all") {
          if (q && !l.name.toLowerCase().includes(q.toLowerCase())) return false;
          return true;
        }
        const m = labTestMap[l.id];
        if (!m) return false;
        if (m.minPrice > maxPrice) return false;
        return true;
      })
      .map((l) => ({ ...l, minPrice: labTestMap[l.id]?.minPrice ?? null }));
  }, [labs, labTestMap, testId, q, maxPrice, minRating, homeOnly, verifiedOnly, availableOnly]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-sans tracking-tight sm:text-3xl md:text-4xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Find Labs Near You
        </h1>
        <p className="mt-2 text-muted-foreground text-sm sm:text-base">
          Select a test, compare pathology labs, and book with home collection.
        </p>
      </div>

      {/* Main Search Panel */}
      <div className="mb-6 glass-card p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-primary">Select test</Label>
            <Select value={testId} onValueChange={setTestId}>
              <SelectTrigger className="min-h-11 w-full glass bg-card/50">
                <SelectValue placeholder="Choose a test to book" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All tests</SelectItem>
                {tests.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-primary">City / pincode</Label>
            <div className="relative pr-8">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="min-h-11 pl-9 pr-8 glass bg-card/50 w-full" placeholder="e.g. Jaunpur" value={city} onChange={(e) => setCity(e.target.value)} />
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
          <div className="flex items-end">
            <Button
              type="button"
              variant="outline"
              className="min-h-11 w-full lg:hidden glass"
              onClick={() => setFiltersOpen((o) => !o)}
            >
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              {filtersOpen ? "Hide filters" : "More filters"}
            </Button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 items-center">
          <span className="text-xs text-muted-foreground">Popular Tests:</span>
          {POPULAR_TESTS.map((name) => {
            const match = tests.find((t) => t.name.toLowerCase().includes(name.toLowerCase()));
            const isSelected = (match && testId === match.id) || (!match && q === name);
            return (
              <button
                key={name}
                type="button"
                onClick={() => {
                  if (match) setTestId(match.id);
                  else setQ(name);
                }}
                className={`rounded-full border px-3.5 py-1.5 text-xs transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] ${
                  isSelected
                    ? "bg-primary text-primary-foreground font-semibold border-primary shadow-md shadow-primary/25"
                    : "glass hover:border-primary hover:text-primary"
                }`}
              >
                {name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-[minmax(0,280px)_1fr]">
        {/* Filters sidebar */}
        <aside
          className={`space-y-6 glass-card p-5 md:sticky md:top-20 md:self-start ${filtersOpen ? "block" : "hidden md:block"}`}
        >
          <div className="flex items-center gap-2 text-sm font-semibold border-b pb-3">
            <SlidersHorizontal className="h-4 w-4 text-primary" /> Filter Options
          </div>

          <div className="space-y-2 md:hidden">
            <Label>Test</Label>
            <Select value={testId} onValueChange={setTestId}>
              <SelectTrigger className="min-h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All tests</SelectItem>
                {tests.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 hidden md:block">
            <Label className="text-muted-foreground text-xs">Location</Label>
            <div className="relative pr-8">
              <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-8 pr-8 glass w-full" placeholder="City or Pincode" value={city} onChange={(e) => setCity(e.target.value)} />
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
            <Label className="text-muted-foreground text-xs">Search Lab Name</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-8 glass" placeholder="Search labs..." value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>

          {testId !== "all" && (
            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-xs font-medium"><Label>Max price</Label><span className="text-primary font-semibold">₹{maxPrice}</span></div>
              <Slider value={[maxPrice]} max={10000} step={50} onValueChange={(v) => setMaxPrice(v[0])} />
            </div>
          )}

          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-xs font-medium"><Label>Minimum rating</Label><span className="text-accent font-semibold">{minRating}★+</span></div>
            <Slider value={[minRating]} max={5} step={0.5} onValueChange={(v) => setMinRating(v[0])} />
          </div>

          <div className="flex items-center justify-between border-t pt-4">
            <Label className="cursor-pointer">Available Now</Label>
            <Switch checked={availableOnly} onCheckedChange={setAvailableOnly} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="cursor-pointer">Home Sample Collection</Label>
            <Switch checked={homeOnly} onCheckedChange={setHomeOnly} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="cursor-pointer">Verified Labs Only</Label>
            <Switch checked={verifiedOnly} onCheckedChange={setVerifiedOnly} />
          </div>
        </aside>

        {/* Results Section */}
        <section>
          {dbCount === 0 && !loading && <PreviewDataNotice />}
          <div className="mb-4 text-sm text-muted-foreground">
            {loading ? "Searching pathology labs..." : `${filtered.length} lab${filtered.length === 1 ? "" : "s"} available`}
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
              <p className="font-semibold text-lg text-foreground">No labs match your criteria</p>
              <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
                Try loosening your filters, changing the city name, or selecting &quot;All tests&quot;.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 min-[400px]:grid-cols-2 xl:grid-cols-3">
              {filtered.map((l) => (
                <LabCard key={l.id} lab={l} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default function LabsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading search parameters...</div>}>
      <LabsContent />
    </Suspense>
  );
}
