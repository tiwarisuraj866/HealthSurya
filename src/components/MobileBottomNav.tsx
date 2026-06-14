"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Beaker, Stethoscope, Pill } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/", label: "Home", icon: Home, exact: true },
  { to: "/labs", label: "Labs", icon: Beaker, exact: false },
  { to: "/doctors", label: "Doctors", icon: Stethoscope, exact: false },
  { to: "/medicine", label: "Medicine", icon: Pill, exact: false },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="glass-nav fixed bottom-0 left-0 right-0 z-50 lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Main navigation"
    >
      <div className="mx-auto flex h-16 max-w-lg items-stretch justify-around px-1">
        {tabs.map((tab) => {
          const isActive = tab.to === "/" ? pathname === "/" : pathname.startsWith(tab.to);
          return (
            <Link
              key={tab.to}
              href={tab.to}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-2 text-[10px] font-medium transition-colors active:bg-primary/10",
                isActive ? "text-primary font-semibold" : "text-muted-foreground"
              )}
            >
              <tab.icon className="h-5 w-5 shrink-0" strokeWidth={2} />
              <span className="truncate">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
