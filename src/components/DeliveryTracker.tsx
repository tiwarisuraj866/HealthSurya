import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TRACKING_STEPS, type MedicineOrderStatus } from "@/lib/medicine";
import { Bike, Check, MapPin, Phone, Package } from "lucide-react";
import { format } from "date-fns";

export interface TrackingEvent {
  id: string;
  status: MedicineOrderStatus;
  title: string;
  description: string | null;
  created_at: string;
}

export interface OrderTrackData {
  id: string;
  order_number: string;
  status: MedicineOrderStatus;
  eta_minutes: number | null;
  delivery_address: string;
  city: string;
  pincode: string;
  rider_name: string | null;
  rider_phone: string | null;
  total: number;
  items: { medicine_name: string; quantity: number; unit_price: number }[];
  events: TrackingEvent[];
}

function stepIndex(status: MedicineOrderStatus) {
  return TRACKING_STEPS.findIndex((s) => s.status === status);
}

export function DeliveryTracker({ order }: { order: OrderTrackData }) {
  const current = stepIndex(order.status);
  const isDelivered = order.status === "delivered";
  const isCancelled = order.status === "cancelled";
  const activeRider = order.rider_name && !isDelivered && !isCancelled;

  return (
    <div className="space-y-6">
      {/* Zomato-style map panel */}
      <div className="tracking-map relative overflow-hidden rounded-2xl border bg-card">
        <div className="tracking-map-grid absolute inset-0" />
        <div className="relative z-10 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Live tracking</p>
              <h2 className="mt-1 text-lg font-bold sm:text-xl">
                {isDelivered ? "Delivered!" : isCancelled ? "Order cancelled" : order.eta_minutes ? `Arriving in ~${order.eta_minutes} min` : "Tracking your order"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">Order #{order.order_number}</p>
            </div>
            <Badge className={isDelivered ? "bg-success/20 text-success" : isCancelled ? "bg-destructive/20 text-destructive" : "bg-primary/15 text-primary"}>
              {order.status.replace(/_/g, " ")}
            </Badge>
          </div>

          {!isCancelled && (
            <div className="tracking-route mt-6 flex items-end justify-between px-2">
              <div className="flex flex-col items-center gap-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                  <Package className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-medium text-muted-foreground">Pharmacy</span>
              </div>
              <div className="relative mx-2 mb-4 h-1 flex-1 rounded-full bg-border">
                <div
                  className="tracking-pulse absolute inset-y-0 left-0 rounded-full bg-primary transition-all duration-700"
                  style={{ width: `${Math.max(8, ((current + 1) / TRACKING_STEPS.length) * 100)}%` }}
                />
                {activeRider && (
                  <div
                    className="tracking-rider absolute -top-3 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-md"
                    style={{ left: `${Math.min(92, ((current + 0.5) / TRACKING_STEPS.length) * 100)}%` }}
                  >
                    <Bike className="h-4 w-4" />
                  </div>
                )}
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full shadow-lg ${isDelivered ? "bg-success text-success-foreground" : "bg-secondary text-foreground"}`}>
                  <MapPin className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-medium text-muted-foreground">You</span>
              </div>
            </div>
          )}

          <p className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            {order.delivery_address}, {order.city} - {order.pincode}
          </p>
        </div>
      </div>

      {/* Delivery partner card */}
      {activeRider && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Bike className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold">{order.rider_name}</p>
              <p className="text-sm text-muted-foreground">HealthSurya delivery partner</p>
            </div>
          </div>
          {order.rider_phone && (
            <Button asChild size="sm" variant="outline">
              <a href={`tel:${order.rider_phone}`}>
                <Phone className="mr-1.5 h-4 w-4" /> Call
              </a>
            </Button>
          )}
        </div>
      )}

      {/* Vertical timeline */}
      <div className="rounded-2xl border bg-card p-5">
        <h3 className="font-semibold">Order timeline</h3>
        <ol className="mt-4 space-y-0">
          {(order.events.length > 0 ? order.events : []).slice().reverse().map((ev, idx, arr) => {
            const done = stepIndex(ev.status) <= current || isDelivered;
            const isLast = idx === arr.length - 1;
            return (
              <li key={ev.id} className="relative flex gap-4 pb-6 last:pb-0">
                {!isLast && <span className="absolute left-[11px] top-6 h-full w-0.5 bg-border" />}
                <div className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${done ? "bg-primary text-primary-foreground" : "border-2 bg-background"}`}>
                  {done && <Check className="h-3.5 w-3.5" />}
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="font-medium">{ev.title}</p>
                  {ev.description && <p className="text-sm text-muted-foreground">{ev.description}</p>}
                  <p className="mt-0.5 text-xs text-muted-foreground">{format(new Date(ev.created_at), "PPp")}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Order summary */}
      <div className="rounded-2xl border bg-card p-5">
        <h3 className="font-semibold">Items ({order.items.length})</h3>
        <ul className="mt-3 space-y-2">
          {order.items.map((it, i) => (
            <li key={i} className="flex flex-wrap justify-between gap-2 text-sm">
              <span className="min-w-0 flex-1">{it.medicine_name} × {it.quantity}</span>
              <span className="font-medium">₹{(it.unit_price * it.quantity).toFixed(0)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t pt-3 font-semibold">
          <span>Total paid</span>
          <span className="text-primary">₹{Number(order.total).toFixed(0)}</span>
        </div>
      </div>
    </div>
  );
}
