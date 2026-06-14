import type { Metadata } from "next";
import { Beaker, Stethoscope, Truck, Pill, FileText, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Our Services — HealthSurya",
  description: "Explore HealthSurya's complete suite of healthcare services including pathology booking, doctor referral listings, home sample collection, and live report tracking.",
};

const servicesList = [
  {
    icon: Beaker,
    title: "Pathology Booking",
    desc: "Search and book diagnostic tests at trusted labs in your city.",
  },
  {
    icon: FileText,
    title: "Report Tracking",
    desc: "Track sample collection, processing and report delivery in real time.",
  },
  {
    icon: Truck,
    title: "Home Collection",
    desc: "Request sample pickup from your home with verified phlebotomists.",
  },
  {
    icon: Stethoscope,
    title: "Doctor Referrals",
    desc: "Doctors can create digital referrals and manage patient diagnostics.",
  },
  {
    icon: Users,
    title: "Lab Management",
    desc: "Operational dashboard for labs to manage bookings, tests and reports.",
  },
  {
    icon: Pill,
    title: "Medicine Cart Delivery",
    desc: "Order prescription and OTC medicines from partnered local pharmacies with express delivery.",
  },
];

export default function ServicesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 space-y-10">
      <div className="max-w-2xl space-y-3">
        <h1 className="text-4xl font-extrabold font-sans tracking-tight sm:text-5xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Our Services
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          A complete suite of healthcare workflows built for patients, doctors and labs.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-10">
        {servicesList.map((s) => (
          <div
            key={s.title}
            className="rounded-2xl border bg-card/40 glass p-6 shadow-sm hover:scale-[1.02] active:scale-[0.99] transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/25 shadow-inner">
                <s.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 font-bold text-lg text-foreground font-sans">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
