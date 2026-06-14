"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getOrderDetails } from "@/app/actions";
import { getDemoOrder } from "@/lib/medicine-api";
import { DeliveryTracker, type OrderTrackData } from "@/components/DeliveryTracker";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function OrderTrackClient({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<OrderTrackData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const demo = getDemoOrder(orderId);
    if (demo) {
      setOrder({
        id: demo.id,
        order_number: demo.order_number,
        status: demo.status,
        eta_minutes: demo.eta_minutes,
        delivery_address: demo.delivery_address,
        city: demo.city,
        pincode: demo.pincode,
        rider_name: demo.rider_name,
        rider_phone: demo.rider_phone,
        total: Number(demo.total),
        items: demo.items ?? [],
        events: demo.events ?? [],
      });
      setLoading(false);
      return;
    }
    try {
      const data = await getOrderDetails(orderId);
      if (data) {
        setOrder({
          id: data.order.id,
          order_number: data.order.order_number,
          status: data.order.status,
          eta_minutes: data.order.eta_minutes,
          delivery_address: data.order.delivery_address,
          city: data.order.city,
          pincode: data.order.pincode,
          rider_name: data.order.rider_name,
          rider_phone: data.order.rider_phone,
          total: Number(data.order.total),
          items: data.items ?? [],
          events: data.events ?? [],
        });
      }
    } catch (err) {
      console.error("Error loading order:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`order-${orderId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "medicine_orders", filter: `id=eq.${orderId}` }, load)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "order_tracking_events", filter: `order_id=eq.${orderId}` }, load)
      .subscribe();
    
    const poll = setInterval(load, 12000);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
    };
  }, [orderId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p className="mt-4 text-muted-foreground text-sm">Opening live delivery tracker...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <p className="text-muted-foreground text-sm">Order tracking details not found.</p>
        <Button asChild className="mt-4 btn-gradient">
          <Link href="/orders"><ArrowLeft className="mr-2 h-4 w-4" /> View order history</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <Link href="/orders" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to orders
      </Link>
      <DeliveryTracker order={order} />
    </div>
  );
}
