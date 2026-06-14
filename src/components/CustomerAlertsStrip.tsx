"use client";

import { useAuth } from "@/lib/auth";
import { CallAlertsBanner } from "@/components/CallAlertsBanner";

export function CustomerAlertsStrip() {
  const { user } = useAuth();
  if (!user) return null;
  return <CallAlertsBanner mode="customer" />;
}
