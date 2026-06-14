"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AnimatedLogo } from "@/components/AnimatedLogo";
import { useMedicineCart } from "@/lib/medicine-cart";
import { NotificationCenter } from "@/components/NotificationCenter";
import {
  Menu, Home, Beaker, Stethoscope, Pill, Wallet, Calendar,
  LayoutDashboard, Info, Phone, LogIn, UserPlus, LogOut, ShieldCheck, ShoppingCart, Package, FlaskConical, User,
  Bell, LifeBuoy,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function Header() {
  const { user, signOut, roles } = useAuth();
  const { count: cartCount } = useMedicineCart();
  const pathname = usePathname();
  const isAdmin = roles.includes("admin") || roles.includes("super_admin");
  const [open, setOpen] = useState(false);

  const sections = [
    {
      label: "Browse",
      links: [
        { to: "/", label: "Home", icon: Home },
        { to: "/labs", label: "Find Labs", icon: Beaker },
        { to: "/doctors", label: "Find Doctors", icon: Stethoscope },
        { to: "/services", label: "Services", icon: Stethoscope },
        { to: "/medicine", label: "Medicine", icon: Pill },
        { to: "/medicine-cart", label: "Medicine Cart", icon: ShoppingCart, badge: cartCount },
      ],
    },
    {
      label: "Account",
      links: user
        ? [
            { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
            { to: "/profile", label: "My Profile", icon: User },
            { to: "/kyc", label: "KYC & Verification", icon: ShieldCheck },
            { to: "/bookings", label: "My Bookings", icon: Calendar },
            { to: "/orders", label: "Medicine Orders", icon: Package },
            { to: "/wallet", label: "Wallet", icon: Wallet },
            { to: "/notifications", label: "Notifications", icon: Bell },
            { to: "/support", label: "Help & Support", icon: LifeBuoy },
            ...(roles.includes("patient") ? [{ to: "/verify", label: "Partner Verification", icon: ShieldCheck }] : []),
            ...(roles.includes("doctor") ? [{ to: "/doctor-manage", label: "Doctor Dashboard", icon: Stethoscope }] : []),
            ...(roles.includes("lab") ? [
              { to: "/lab", label: "Lab Dashboard", icon: Beaker }
            ] : []),
            ...(roles.includes("pharmacy") ? [{ to: "/pharmacy", label: "Pharmacy Dashboard", icon: Pill }] : []),
            ...(isAdmin ? [
              { to: "/admin/kyc", label: "Admin · KYC Queue", icon: ShieldCheck },
              { to: "/admin/verifications", label: "Admin · Verifications", icon: ShieldCheck },
            ] : []),
          ]
        : [],
    },
    {
      label: "Company",
      links: [
        { to: "/about", label: "About", icon: Info },
        { to: "/contact", label: "Contact", icon: Phone },
      ],
    },
  ];

  return (
    <header className="glass-nav sticky top-0 z-50 w-full pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 px-4 sm:h-16 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-2 transition-opacity hover:opacity-90">
          <AnimatedLogo size="sm" />
        </Link>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {user && <NotificationCenter />}
          <Button asChild variant="ghost" size="icon" className="relative h-11 w-11 touch-target" aria-label="Medicine cart">
            <Link href="/medicine-cart">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </Link>
          </Button>
          {user ? (
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/wallet"><Wallet className="mr-1.5 h-4 w-4" /> Wallet</Link>
            </Button>
          ) : (
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link href="/register">Get Started</Link>
            </Button>
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Open menu" className="glass h-11 w-11 touch-target">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="glass-strong w-[min(100vw-2rem,20rem)] border-l-0 p-0 pb-[env(safe-area-inset-bottom)]">
              <SheetHeader className="border-b p-5">
                <SheetTitle className="flex items-center gap-2 text-left">
                  <AnimatedLogo size="sm" />
                </SheetTitle>
              </SheetHeader>

              <nav className="flex max-h-[calc(100dvh-8rem)] flex-col gap-6 overflow-y-auto p-5">
                {sections.map((s) =>
                  s.links.length === 0 ? null : (
                    <div key={s.label}>
                      <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {s.label}
                      </p>
                      <div className="space-y-1">
                        {s.links.map((l) => {
                          const isActive = l.to === "/" ? pathname === "/" : pathname.startsWith(l.to);
                          return (
                            <Link
                              key={l.to}
                              href={l.to}
                              onClick={() => setOpen(false)}
                              className={cn(
                                "flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                                isActive
                                  ? "bg-primary/15 text-primary"
                                  : "text-foreground/80 hover:bg-primary/10 hover:text-primary"
                              )}
                            >
                              <l.icon className="h-4 w-4 shrink-0" />
                              <span className="flex-1">{l.label}</span>
                              {"badge" in l && typeof l.badge === "number" && l.badge > 0 && (
                                <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-accent-foreground">
                                  {l.badge > 9 ? "9+" : l.badge}
                                </span>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )
                )}

                <div className="mt-2 border-t pt-4">
                  {user ? (
                    <Button onClick={() => { signOut(); setOpen(false); }} variant="outline" className="min-h-11 w-full">
                      <LogOut className="mr-2 h-4 w-4" /> Sign out
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <Button asChild variant="outline" className="min-h-11 w-full" onClick={() => setOpen(false)}>
                        <Link href="/login"><LogIn className="mr-2 h-4 w-4" /> Login</Link>
                      </Button>
                      <Button asChild className="min-h-11 w-full" onClick={() => setOpen(false)}>
                        <Link href="/register"><UserPlus className="mr-2 h-4 w-4" /> Get Started</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
