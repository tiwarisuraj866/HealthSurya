"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, ShieldCheck, Clock, BadgeCheck, Stethoscope, Beaker, Pill, ArrowRight, Locate, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { setUserCity, getUserCity, DEFAULT_CITY } from "@/lib/location";
import { HomeServicesSection } from "@/components/home/HomeServicesSection";
import { AUTH_ROLES } from "@/lib/auth-roles";
import { useGeolocation } from "@/hooks/useGeolocation";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const { detecting, locate } = useGeolocation();

  useEffect(() => {
    setCity(getUserCity() || DEFAULT_CITY);
  }, []);

  useEffect(() => {
    if (city.trim()) setUserCity(city);
  }, [city]);

  const handleLocate = async () => {
    const loc = await locate();
    if (loc) setCity(loc);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/labs?q=${encodeURIComponent(q)}&city=${encodeURIComponent(city)}`);
  };

  return (
    <div>
      <section className="bg-hero-gradient border-b">
        <div className="page-wrap py-8 sm:py-12 lg:py-14">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full border bg-card/80 px-2.5 py-1 text-[11px] font-medium text-primary backdrop-blur-sm">
              <ShieldCheck className="h-3 w-3" /> Verified labs &amp; doctors
            </div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Your Trusted <span className="text-primary">Health Partner</span>
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
              Book lab tests, doctor visits &amp; medicine — compare prices and book with confidence.
            </p>

            <form
              onSubmit={handleSearch}
              className="glass-card mx-auto mt-5 flex w-full max-w-2xl flex-col gap-1.5 p-1.5 sm:flex-row sm:p-2"
            >
              <div className="flex flex-1 items-center gap-2 rounded-lg px-2">
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                <Input
                  className="h-10 border-0 bg-transparent shadow-none focus-visible:ring-0 sm:h-11"
                  placeholder="Test name (CBC, Thyroid…)"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
              <div className="flex flex-1 items-center gap-2 rounded-lg px-2 sm:border-l relative pr-8">
                <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                <Input
                  className="h-10 border-0 bg-transparent shadow-none focus-visible:ring-0 sm:h-11 w-full"
                  placeholder="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleLocate}
                  disabled={detecting}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50 touch-target"
                  title="Detect my current location"
                >
                  {detecting ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <Locate className="h-4 w-4" />
                  )}
                </button>
              </div>
              <Button type="submit" className="h-10 w-full sm:h-11 sm:w-auto sm:px-6 btn-gradient">
                Search labs
              </Button>
            </form>

            <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
              <span>Popular:</span>
              {["CBC", "Thyroid", "Vitamin D"].map((t) => (
                <Link
                  key={t}
                  href={`/labs?q=${encodeURIComponent(t)}`}
                  className="rounded-full border bg-card/60 px-2 py-0.5 transition-colors hover:text-primary"
                >
                  {t}
                </Link>
              ))}
            </div>
          </div>

          <div className="mx-auto mt-6 grid max-w-3xl grid-cols-3 gap-2 sm:gap-3">
            {[
              { href: "/labs", icon: Beaker, label: "Labs" },
              { href: "/doctors", icon: Stethoscope, label: "Doctors" },
              { href: "/medicine", icon: Pill, label: "Medicine" },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex flex-col items-center gap-1 rounded-xl border bg-card/70 py-3 text-xs font-medium backdrop-blur-sm transition-colors hover:border-primary/40 hover:bg-card sm:py-4 sm:text-sm"
              >
                <item.icon className="h-5 w-5 text-primary" />
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <HomeServicesSection city={city} />

      <section className="border-y bg-surface/80">
        <div className="page-wrap grid grid-cols-1 gap-5 py-8 sm:grid-cols-3 sm:gap-6 sm:py-10">
          {[
            { icon: BadgeCheck, title: "Verified partners", desc: "Registered labs and doctors with credentials." },
            { icon: ShieldCheck, title: "Secure reports", desc: "Encrypted reports with QR verification." },
            { icon: Clock, title: "Fast turnaround", desc: "Most reports in 24–48 hours." },
          ].map((f) => (
            <div key={f.title} className="flex gap-3">
              <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-card text-primary shadow-sm">
                <f.icon className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">{f.title}</h3>
                <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="page-wrap py-8 sm:py-10">
        <div className="mb-5 text-center sm:text-left">
          <h2 className="text-xl font-bold sm:text-2xl">Join HealthSurya</h2>
          <p className="mt-1 text-sm text-muted-foreground">Choose your account type — each role gets a tailored dashboard.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {AUTH_ROLES.map((role) => {
            const Icon = role.icon;
            return (
              <Link
                key={role.id}
                href={`/register?role=${role.id}`}
                className="group flex flex-col rounded-2xl border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-md active:scale-[0.99]"
              >
                <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm ${role.accent}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-3 font-semibold">{role.label}</h3>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{role.description}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
                  {role.registerCta}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            );
          })}
        </div>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </section>
    </div>
  );
}
