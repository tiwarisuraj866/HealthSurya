"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getOrders } from "@/app/actions";
import { getDemoOrders } from "@/lib/medicine-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { RefundPolicyNotice } from "@/components/RefundPolicyNotice";
import { Package, Bike, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { RequireAuthGate } from "@/components/auth/RequireAuthGate";

const statusStyle: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300",
  confirmed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300",
  packing: "bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-300",
  picked_up: "bg-purple-100 text-purple-800 dark:bg-purple-950/30 dark:text-purple-300",
  out_for_delivery: "bg-violet-100 text-violet-800 dark:bg-violet-950/30 dark:text-violet-300",
  nearby: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-300",
  delivered: "bg-teal-100 text-teal-800 dark:bg-teal-950/30 dark:text-teal-300",
  cancelled: "bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-300",
};

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getOrders().then((data) => {
      const demo = getDemoOrders(user.id);
      // Merge db orders and local storage demo orders
      const merged = [
        ...(data ?? []),
        ...demo.filter((d: { id: string }) => !(data ?? []).some((r: any) => r.id === d.id))
      ];
      setOrders(merged);
      setLoading(false);
    }).catch((err) => {
      console.error(err);
      if (user) setOrders(getDemoOrders(user.id));
      setLoading(false);
    });
  }, [user]);

  if (authLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6">
        <p className="text-muted-foreground text-sm">Verifying session...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <RequireAuthGate redirectTo="/orders" actionLabel="view your medicine orders" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-bold font-sans tracking-tight">Medicine Orders</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track pharmacy orders live with milestone statuses.</p>
        </div>
        <Button asChild variant="outline" className="glass bg-card/50">
          <Link href="/medicine">Order medicines</Link>
        </Button>
      </div>

      <div className="mt-4">
        <RefundPolicyNotice variant="medicine" compact />
      </div>

      <div className="mt-8 space-y-3">
        {loading ? (
          <p className="text-center py-10 text-sm text-muted-foreground animate-pulse">Fetching orders...</p>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl border bg-card/50 glass-strong p-12 text-center shadow-sm max-w-lg mx-auto space-y-4">
            <Package className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <p className="font-semibold text-lg text-foreground">No orders placed yet</p>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Ready to buy medicine online? Enter your pincode and find products.
            </p>
            <Button asChild className="btn-gradient"><Link href="/medicine">Shop medicines</Link></Button>
          </div>
        ) : (
          orders.map((o) => (
            <Link
              key={o.id}
              href={`/orders/${o.id}`}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-card/60 glass p-5 shadow-sm hover:border-primary/20 transition-all block group"
            >
              <div>
                <p className="font-semibold text-foreground text-lg group-hover:text-primary transition-colors">#{o.order_number}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(o.created_at), "PPp")}</p>
                {o.eta_minutes && o.status !== "delivered" && o.status !== "cancelled" && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-primary font-medium">
                    <Bike className="h-4 w-4 animate-bounce" /> ETA ~{o.eta_minutes} mins
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-end gap-3 sm:gap-4">
                <span className="text-base font-extrabold text-primary">₹{Number(o.total).toFixed(0)}</span>
                <Badge className={`${statusStyle[o.status] || ""} border-0 py-1 px-2.5 rounded-full capitalize font-semibold text-xs`}>
                  {String(o.status).replace(/_/g, " ")}
                </Badge>
                <span className="text-xs font-bold text-primary inline-flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                  Track Delivery <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
