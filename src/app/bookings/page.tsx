"use client";

import { useEffect, useState } from "react";
import { getBookings } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { RefundPolicyNotice } from "@/components/RefundPolicyNotice";
import { useAuth } from "@/lib/auth";
import { Calendar, ArrowRight, Download } from "lucide-react";
import Link from "next/link";
import { RequireAuthGate } from "@/components/auth/RequireAuthGate";

const statusColor: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300",
  confirmed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300",
  sample_collected: "bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-300",
  processing: "bg-purple-100 text-purple-800 dark:bg-purple-950/30 dark:text-purple-300",
  completed: "bg-teal-100 text-teal-800 dark:bg-teal-950/30 dark:text-teal-300",
  cancelled: "bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-300",
};

export default function BookingsPage() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getBookings().then((data) => {
      setItems(data);
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
        <RequireAuthGate redirectTo="/bookings" actionLabel="view your lab bookings" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold font-sans tracking-tight">My Bookings</h1>
      <p className="mt-1 text-sm text-muted-foreground">Track pathology test orders, schedules, and view digital health reports.</p>

      <div className="mt-4">
        <RefundPolicyNotice variant="blood_test" compact />
      </div>

      <div className="mt-8 space-y-4">
        {loading ? (
          <p className="text-center py-10 text-sm text-muted-foreground animate-pulse">Fetching bookings data...</p>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border bg-card/50 glass-strong p-12 text-center shadow-sm max-w-lg mx-auto space-y-4">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <p className="font-semibold text-lg text-foreground">No bookings recorded yet</p>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              You haven&apos;t booked any medical lab tests yet. Check out verified pathology labs near you.
            </p>
            <Button asChild className="btn-gradient"><Link href="/labs">Find pathology labs</Link></Button>
          </div>
        ) : (
          items.map((b) => (
            <div key={b.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-card/60 glass p-5 shadow-sm hover:border-primary/20 transition-all">
              <div className="min-w-0">
                <div className="font-semibold text-foreground text-lg">{b.tests?.name}</div>
                <div className="text-sm text-muted-foreground mt-0.5">{b.labs?.name} · {b.labs?.city}</div>
                <div className="mt-2 text-xs text-muted-foreground bg-secondary/80 inline-block px-2 py-0.5 rounded font-medium">
                  Scheduled: {format(new Date(b.scheduled_at), "PPp")}
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-3 sm:gap-4">
                <span className="text-base font-extrabold text-primary">₹{Number(b.price).toFixed(0)}</span>
                <Badge className={`${statusColor[b.status] || ""} border-0 py-1 px-2.5 rounded-full capitalize font-semibold text-xs`}>
                  {b.status.replace("_", " ")}
                </Badge>
                {["sample_collected", "processing", "completed"].includes(b.status) && (
                  <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground" title="No cancellations/refunds allowed post-sample collection">
                    Non-Refundable
                  </span>
                )}
                {b.report_url && (
                  <a
                    href={`/api/bookings/${b.id}/report`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold bg-primary text-primary-foreground py-1.5 px-3 rounded-xl hover:brightness-105 transition-all shadow-sm"
                  >
                    <Download className="h-3.5 w-3.5" /> Download Report
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
