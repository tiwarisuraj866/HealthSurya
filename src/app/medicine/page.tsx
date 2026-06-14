"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MedicineCard } from "@/components/MedicineCard";
import { getMedicines } from "@/app/actions";
import { MEDICINE_CATEGORIES, type CatalogMedicine } from "@/lib/medicine";
import { useMedicineCart } from "@/lib/medicine-cart";
import { MapPin, Search, Upload, Zap, ShoppingCart } from "lucide-react";

function MedicineContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { count } = useMedicineCart();
  const [pincode, setPincode] = useState("400001");
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [category, setCategory] = useState("");
  const [catalog, setCatalog] = useState<CatalogMedicine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getMedicines({ q, category, pincode }).then((data) => {
      setCatalog(data as unknown as CatalogMedicine[]);
      setLoading(false);
    });
  }, [q, category, pincode]);

  return (
    <div>
      {/* Hero Section */}
      <section className="border-b bg-hero-gradient">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <Badge className="mb-3 gap-1 bg-primary/10 text-primary hover:bg-primary/15 border-primary/20">
                <Zap className="h-3 w-3" /> Express delivery available
              </Badge>
              <h1 className="text-3xl font-bold font-sans tracking-tight sm:text-4xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Medicine Delivery
              </h1>
              <p className="mt-2 max-w-xl text-muted-foreground text-sm sm:text-base">
                Search medicines, upload prescription at checkout, and get door-step delivery with real-time tracking.
              </p>
            </div>
            <Button asChild variant="outline" className="relative gap-2 glass bg-card/50">
              <Link href="/medicine-cart">
                <ShoppingCart className="h-4 w-4" /> Cart
                {count > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                    {count}
                  </span>
                )}
              </Link>
            </Button>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <div className="flex items-center gap-2 rounded-xl border bg-card/60 glass px-3 sm:w-44">
              <MapPin className="h-4 w-4 shrink-0 text-primary" />
              <Input
                className="border-0 shadow-none focus-visible:ring-0"
                placeholder="Pincode"
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
              />
            </div>
            <div className="flex flex-1 items-center gap-2 rounded-xl border bg-card/60 glass px-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                className="border-0 shadow-none focus-visible:ring-0"
                placeholder="Search medicines (Paracetamol, Vitamin D, Insulins...)"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <Button className="btn-gradient" onClick={() => router.push(`/medicine?q=${encodeURIComponent(q)}`)}>Search</Button>
          </div>

          {pincode.length === 6 && (
            <p className="mt-2 text-xs text-emerald-600 font-semibold">✓ Delivery active in pincode {pincode}</p>
          )}
        </div>
      </section>

      {/* Prescription Upload Block */}
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-5 shadow-sm">
          <div>
            <p className="font-semibold text-foreground">Order with prescription</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Upload Rx at checkout — our verified pharmacist will check it before dispatch.</p>
          </div>
          <Button variant="secondary" className="gap-2 glass" onClick={() => router.push("/medicine-cart")}>
            <Upload className="h-4 w-4" /> Upload prescription
          </Button>
        </div>
      </section>

      {/* Categories Horizontal Selector */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          <Button size="sm" variant={category === "" ? "default" : "outline"} onClick={() => setCategory("")} className={category === "" ? "btn-gradient" : "glass"}>All Medicines</Button>
          {MEDICINE_CATEGORIES.map((c) => (
            <Button key={c} size="sm" variant={category === c ? "default" : "outline"} onClick={() => setCategory(c)} className={category === c ? "btn-gradient shrink-0" : "glass shrink-0"}>
              {c}
            </Button>
          ))}
        </div>
      </section>

      {/* Catalog Grid */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <h2 className="text-lg font-bold font-sans border-b pb-2 mb-6">{category || "Popular Medicines"}</h2>
        {loading ? (
          <p className="mt-8 text-center text-muted-foreground text-sm">Searching catalog...</p>
        ) : catalog.length === 0 ? (
          <p className="mt-8 rounded-2xl border bg-card p-10 text-center text-sm text-muted-foreground">No medicines found in this area. Try modifying your search keywords.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {catalog.map((med) => (
              <MedicineCard key={med.id} med={med} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default function MedicinePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading catalog parameters...</div>}>
      <MedicineContent />
    </Suspense>
  );
}
