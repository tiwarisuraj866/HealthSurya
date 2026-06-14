"use client";

import { useEffect, useState, useRef } from "react";
import { getUserNotifications, markNotificationRead, markAllNotificationsRead } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Bell, Check, MailOpen, BellOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const loadNotifications = async () => {
    try {
      const res = await getUserNotifications();
      if (res.success) {
        setNotifications(res.notifications || []);
      }
    } catch (err) {
      console.error("Failed to load notifications", err);
    }
  };

  useEffect(() => {
    loadNotifications();

    // Poll for notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      const res = await markNotificationRead(id);
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
      }
    } catch (err) {
      toast.error("Failed to update notification");
    }
  };

  const handleMarkAllRead = async () => {
    setLoading(true);
    try {
      const res = await markAllNotificationsRead();
      if (res.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        toast.success("All notifications marked as read");
      }
    } catch (err) {
      toast.error("Failed to mark all as read");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell icon button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(!open)}
        className="relative h-11 w-11 touch-target rounded-full hover:bg-muted"
        aria-label="Toggle Notification Panel"
      >
        <Bell className="h-5 w-5 text-foreground" />
        {unreadCount > 0 && (
          <span className="absolute right-2 top-2 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive"></span>
          </span>
        )}
      </Button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 mt-2.5 w-80 glass-strong border rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in duration-200">
          <header className="px-4 py-3 border-b bg-card/50 flex items-center justify-between">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">Alert Center</span>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                className="h-6 text-[10px] hover:bg-muted font-semibold text-primary px-2 gap-1 rounded-md"
                onClick={handleMarkAllRead}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <MailOpen className="h-3 w-3" />}
                Mark all read
              </Button>
            )}
          </header>

          <div className="max-h-72 overflow-y-auto divide-y divide-border/30 bg-card/10">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-xs text-muted-foreground flex flex-col items-center gap-1.5">
                <BellOff className="h-8 w-8 text-muted-foreground/40" />
                No notifications logged.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.read && handleMarkRead(n.id)}
                  className={`p-3.5 text-xs text-left cursor-pointer transition-colors flex items-start justify-between gap-3 ${
                    n.read ? "hover:bg-muted/30 bg-transparent" : "bg-primary/5 hover:bg-primary/10"
                  }`}
                >
                  <div className="space-y-1 pr-2">
                    <div className="font-bold text-foreground flex items-center gap-1.5">
                      {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
                      {n.title}
                    </div>
                    <p className="text-muted-foreground text-[11px] leading-relaxed">{n.message}</p>
                    <span className="block text-[9px] text-muted-foreground/60">
                      {new Date(n.created_at).toLocaleDateString()} at{" "}
                      {new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  {!n.read && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-full text-muted-foreground hover:text-primary shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkRead(n.id);
                      }}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
