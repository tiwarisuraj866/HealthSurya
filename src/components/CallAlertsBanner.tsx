import { useCallback, useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  CALL_ALERTS_EVENT,
  dismissCallAlert,
  getCallAlerts,
  type CallAlert,
} from "@/lib/call-alerts";
import { Phone, PhoneCall, X } from "lucide-react";

type Props = {
  /** pharmacy | lab partner alerts, or customer-facing notices */
  mode: "partner" | "customer";
  partnerId?: string;
  partnerType?: "pharmacy" | "lab";
};

export function CallAlertsBanner({ mode, partnerId, partnerType }: Props) {
  const [alerts, setAlerts] = useState<CallAlert[]>([]);

  const refresh = useCallback(() => {
    if (mode === "customer") {
      setAlerts(getCallAlerts({ audience: "customer", dismissed: false }).slice(0, 2));
      return;
    }
    const audiences = partnerType === "lab" ? (["lab"] as const) : partnerType === "pharmacy" ? (["pharmacy"] as const) : (["pharmacy", "lab"] as const);
    let list = getCallAlerts({ audience: [...audiences], dismissed: false });
    if (partnerId) list = list.filter((a) => !a.partnerId || a.partnerId === partnerId);
    setAlerts(list.slice(0, 3));
  }, [mode, partnerId, partnerType]);

  useEffect(() => {
    refresh();
    const onChange = () => refresh();
    window.addEventListener(CALL_ALERTS_EVENT, onChange);
    const poll = setInterval(refresh, 5000);
    return () => {
      window.removeEventListener(CALL_ALERTS_EVENT, onChange);
      clearInterval(poll);
    };
  }, [refresh]);

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2 border-b bg-warning/10 px-4 py-3 sm:px-6">
      {alerts.map((alert) => (
        <Alert
          key={alert.id}
          className={`relative border-warning/40 bg-background pr-12 sm:pr-10 ${mode === "partner" ? "animate-pulse border-l-4 border-l-warning" : ""}`}
        >
          {mode === "partner" ? (
            <PhoneCall className="h-4 w-4 text-warning-foreground" />
          ) : (
            <Phone className="h-4 w-4 text-primary" />
          )}
          <AlertTitle className="text-sm font-semibold">{alert.title}</AlertTitle>
          <AlertDescription className="text-xs">{alert.message}</AlertDescription>
          <div className="mt-2 flex flex-wrap gap-2">
            {mode === "partner" && (
              <Button size="sm" className="min-h-10 gap-1 text-xs" asChild>
                <a href={`tel:${alert.patientPhone}`} className="break-all">
                  <Phone className="h-3 w-3" /> Call {alert.patientPhone}
                </a>
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="min-h-10 text-xs"
              onClick={() => dismissCallAlert(alert.id)}
            >
              Dismiss
            </Button>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1 h-10 w-10 touch-target"
            onClick={() => dismissCallAlert(alert.id)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </Alert>
      ))}
    </div>
  );
}
