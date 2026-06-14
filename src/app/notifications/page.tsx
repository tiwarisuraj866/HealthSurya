"use client";

// HealthSurya V2 — Notification Centre (in-app channel history).

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, CheckCheck, Inbox, ChevronRight } from "lucide-react";

interface AppNotification {
  id: string;
  event: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

const EVENT_EMOJI: Record<string, string> = {
  verification_submitted: "📋",
  verification_approved: "✅",
  verification_rejected: "⚠️",
  verification_under_review: "🔍",
  ticket_created: "🎫",
  ticket_reply: "💬",
  ticket_resolved: "✅",
  appointment_confirmation: "🩺",
  lab_booking_confirmation: "🧪",
  welcome: "👋",
};

function formatWhen(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  return sameDay
    ? d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (res.ok) setItems(data.notifications ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  const unread = items.filter((n) => !n.is_read).length;

  const markAll = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    }).catch(() => {});
  };

  const openItem = async (n: AppNotification) => {
    if (!n.is_read) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
      fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [n.id] }),
      }).catch(() => {});
    }
    if (n.link) router.push(n.link);
  };

  if (authLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-3 px-4 py-8">
        <Skeleton className="h-9 w-52" />
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-2xl" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <Bell className="mx-auto h-12 w-12 text-primary" />
        <h1 className="mt-4 text-2xl font-bold">Notifications</h1>
        <p className="mt-2 text-sm text-muted-foreground">Sign in to see your verification, booking and ticket updates.</p>
        <Button asChild className="mt-6">
          <Link href="/login?redirect=/notifications">Sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Bell className="h-6 w-6 text-primary" /> Notifications
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Verification, appointment, booking and ticket updates — all in one place.
          </p>
        </div>
        {unread > 0 && (
          <Button variant="outline" size="sm" onClick={markAll}>
            <CheckCheck className="mr-1.5 h-4 w-4" /> Mark all read ({unread})
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed py-14 text-center">
          <Inbox className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 font-medium">No notifications yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Updates about your KYC, bookings and support tickets will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <button
              key={n.id}
              onClick={() => openItem(n)}
              className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-all hover:border-primary/40 ${
                n.is_read ? "bg-card" : "bg-primary/5 border-primary/20"
              }`}
            >
              <span className="text-xl leading-none">{EVENT_EMOJI[n.event] ?? "🔔"}</span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className={`truncate text-sm ${n.is_read ? "font-medium" : "font-semibold"}`}>{n.title}</span>
                  <span className="shrink-0 text-[11px] text-muted-foreground">{formatWhen(n.created_at)}</span>
                </span>
                {n.body && <span className="mt-0.5 block text-xs text-muted-foreground">{n.body}</span>}
              </span>
              {n.link && <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
