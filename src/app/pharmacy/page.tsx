"use client";

import { useAuth } from "@/lib/auth";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { StaffManagement } from "@/components/StaffManagement";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Pill, Users, Calendar, ClipboardList } from "lucide-react";
import { toast } from "sonner";

function PharmacyDashboardInner() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [pharmacy, setPharmacy] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        // Fetch pharmacy
        const { data: pharmacyData, error: pharmacyError } = (await supabase
          .from("pharmacies" as any)
          .select("*")
          .eq("owner_id", user.id)
          .maybeSingle()) as any;

        if (pharmacyError) throw pharmacyError;
        setPharmacy(pharmacyData);

        if (pharmacyData) {
          // Fetch pharmacy orders
          const { data: orderData, error: orderError } = await supabase
            .from("medicine_orders" as any)
            .select("*")
            .eq("pharmacy_id", pharmacyData.id)
            .order("created_at", { ascending: false });

          if (orderError) throw orderError;
          setOrders(orderData || []);
        }
      } catch (err: any) {
        console.error("Error loading pharmacy dashboard data:", err);
        toast.error("Failed to load pharmacy data.");
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!pharmacy) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <Pill className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold">No Pharmacy Registered</h1>
        <p className="mt-2 text-muted-foreground">You need to register your pharmacy details first.</p>
        <a href="/pharmacy-setup" className="mt-6 inline-flex btn-gradient px-4 py-2 rounded-xl text-sm font-semibold">
          Register Pharmacy
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{pharmacy.name} Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your pharmacy medicine orders, inventory payouts, and staff access.
        </p>
      </div>

      <Tabs defaultValue="orders" className="mt-8 space-y-6">
        <TabsList className="bg-muted p-1 rounded-xl">
          <TabsTrigger value="orders" className="rounded-lg"><ClipboardList className="h-4 w-4 mr-1.5" /> Orders</TabsTrigger>
          <TabsTrigger value="staff" className="rounded-lg"><Users className="h-4 w-4 mr-1.5" /> Staff Access</TabsTrigger>
        </TabsList>

        {/* Orders Tab */}
        <TabsContent value="orders">
          <Card className="rounded-2xl shadow-sm border border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Pill className="h-5 w-5 text-primary" /> Incoming Medicine Orders</CardTitle>
              <CardDescription>View, accept, and track medicine delivery orders from local patients.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-xl overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead>Order Number</TableHead>
                      <TableHead>Customer Address</TableHead>
                      <TableHead>Payment Mode</TableHead>
                      <TableHead>Total Bill</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No medicine orders received yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      orders.map((o) => (
                        <TableRow key={o.id}>
                          <TableCell className="font-semibold font-mono text-sm">{o.order_number}</TableCell>
                          <TableCell className="text-sm truncate max-w-[200px]">{o.delivery_address}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {o.payment_mode === "cod" ? "Cash on Delivery" : "Prepaid"}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold">₹{o.total}</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                o.status === "delivered" || o.status === "confirmed"
                                  ? "bg-success/15 text-success hover:bg-success/20 border-none"
                                  : o.status === "cancelled"
                                  ? "bg-destructive/15 text-destructive hover:bg-destructive/20 border-none"
                                  : "bg-warning/15 text-warning hover:bg-warning/20 border-none"
                              }
                            >
                              {o.status.toUpperCase()}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Staff Tab */}
        <TabsContent value="staff">
          <StaffManagement
            parentProfileId={user!.id}
            staffRole="pharmacy_staff"
            title="Pharmacy Staff Access Management"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}


export default function PharmacyDashboardPage() {
  return (
    <RoleGuard allow={["pharmacy", "pharmacy_staff"]}>
      <PharmacyDashboardInner />
    </RoleGuard>
  );
}
