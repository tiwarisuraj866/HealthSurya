"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useMedicineCart } from "@/lib/medicine-cart";
import { createOrder } from "@/app/actions";
import { DEFAULT_PHARMACY_ID, cartItemNeedsRx } from "@/lib/medicine";
import { EMPTY_ADDRESS, formatAddress, validateAddress } from "@/lib/address";
import { calculateMedicineDeliveryFee } from "@/lib/delivery-pricing";
import { calculateMedicineBill } from "@/lib/billing";
import { loadPrescriptionUpload, clearPrescriptionUpload } from "@/lib/prescription";
import { notifyMedicineOrderPlaced } from "@/lib/call-alerts";
import { DeliveryAddressForm } from "@/components/DeliveryAddressForm";
import { OrderPaymentStep } from "@/components/OrderPaymentStep";
import { PrescriptionUploadBlock, hasValidPrescription } from "@/components/PrescriptionUploadBlock";
import { MedicineBillSummary } from "@/components/MedicineBillSummary";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ChevronRight, ChevronLeft } from "lucide-react";

const STEPS = ["Delivery Address", "Payment Details", "Confirm Order"] as const;

export default function MedicineCheckoutPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { items, subtotal, clear } = useMedicineCart();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState({ ...EMPTY_ADDRESS, city: "Mumbai", state: "Maharashtra", pincode: "400001" });
  const [payment, setPayment] = useState<"cod" | "prepaid" | "wallet">("prepaid");
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [rxUploaded, setRxUploaded] = useState(false);

  useEffect(() => {
    setRxUploaded(hasValidPrescription(false));
  }, []);

  const rxItems = useMemo(
    () => items.filter((i) => cartItemNeedsRx({ ...i, category: i.category ?? "" })),
    [items],
  );
  const needsRx = rxItems.length > 0;

  const fee = useMemo(
    () => calculateMedicineDeliveryFee(subtotal, address.pincode || "400001"),
    [subtotal, address.pincode],
  );
  const bill = useMemo(() => calculateMedicineBill(subtotal, fee.finalFee), [subtotal, fee.finalFee]);

  const next = () => {
    if (step === 0) {
      const err = validateAddress(address);
      if (err) return toast.error(err);
      if (needsRx && !hasValidPrescription(true)) {
        return toast.error("Upload doctor prescription for Rx medicines");
      }
    }
    if (step === 1 && !policyAccepted) return toast.error("Please accept the refund policy to continue");
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const onSubmit = async () => {
    if (!user || items.length === 0) return;
    if (!policyAccepted) return toast.error("Please accept the refund policy");
    if (needsRx && !hasValidPrescription(true)) return toast.error("Prescription upload required");

    const rx = loadPrescriptionUpload();
    setLoading(true);

    const orderPayload = {
      pharmacyId: items[0]?.pharmacyId ?? DEFAULT_PHARMACY_ID,
      deliveryAddress: formatAddress(address),
      city: address.city,
      pincode: address.pincode,
      phone: address.phone,
      notes: address.landmark || "",
      paymentMode: payment === "wallet" ? "wallet" : payment as "cod" | "prepaid",
      subtotal: bill.subtotal,
      deliveryFee: fee.finalFee,
      total: bill.grandTotal,
      prescriptionFile: rx?.fileName || null,
      items: items.map((i) => ({
        medicineId: i.medicineId.startsWith("d") ? null : i.medicineId,
        medicineName: i.name,
        quantity: i.quantity,
        unitPrice: i.price,
      })),
    };

    try {
      // For prepaid (Razorpay), first create the order then open checkout
      if (payment === "prepaid") {
        const orderRes = await fetch("/api/payments/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: Math.round(bill.grandTotal * 100), // paise
            receipt: `med-${Date.now()}`,
            notes: { type: "medicine_order" },
          }),
        });

        if (!orderRes.ok) {
          toast.error("Could not initiate payment. Try again.");
          setLoading(false);
          return;
        }
        const rzpOrder = await orderRes.json();

        // Place the DB order first (status=confirmed will be set on verify)
        const res = await createOrder(orderPayload);
        if (!res.success) throw new Error("Order creation failed");

        const Razorpay = (window as any).Razorpay;
        if (!Razorpay) {
          toast.error("Payment gateway not loaded. Please refresh.");
          setLoading(false);
          return;
        }

        const rzp = new Razorpay({
          key: rzpOrder.key,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency,
          order_id: rzpOrder.order_id,
          name: "HealthSurya",
          description: `Medicine order ${res.orderNumber || ""}`,
          handler: async (response: any) => {
            // Verify payment on backend
            const verifyRes = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                entity_type: "medicine_order",
                entity_id: res.orderId,
              }),
            });

            clear();
            clearPrescriptionUpload();
            notifyMedicineOrderPlaced({
              orderId: res.orderId,
              pharmacyId: items[0]?.pharmacyId ?? DEFAULT_PHARMACY_ID,
              patientPhone: address.phone,
              patientName: address.houseNo ? undefined : user.email?.split("@")[0],
              itemSummary: items.map((i) => `${i.name} ×${i.quantity}`).join(", "),
            });

            if (verifyRes.ok) {
              toast.success("Payment confirmed · Pharmacy will call you shortly!");
            } else {
              toast.success("Order placed! Payment pending confirmation.");
            }
            router.push(`/orders/${res.orderId}`);
          },
          modal: { ondismiss: () => setLoading(false) },
          prefill: { email: user.email || "" },
          theme: { color: "#7c3aed" },
        });
        rzp.open();
        return; // Don't setLoading(false) yet — wait for handler
      }

      // For COD and wallet — place order directly
      const res = await createOrder(orderPayload);
      if (res.success) {
        clear();
        clearPrescriptionUpload();
        notifyMedicineOrderPlaced({
          orderId: res.orderId,
          pharmacyId: items[0]?.pharmacyId ?? DEFAULT_PHARMACY_ID,
          patientPhone: address.phone,
          patientName: address.houseNo ? undefined : user.email?.split("@")[0],
          itemSummary: items.map((i) => `${i.name} ×${i.quantity}`).join(", "),
        });
        toast.success("Order placed! Pharmacy will ring you shortly.");
        router.push(`/orders/${res.orderId}`);
      }
    } catch (err: any) {
      toast.error(err.message || "Could not place order");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-muted-foreground text-sm">Your cart is empty.</p>
        <Button className="mt-4 btn-gradient" onClick={() => router.push("/medicine")}>Browse medicines</Button>
      </div>
    );
  }

  return (
    <>
      <script src="https://checkout.razorpay.com/v1/checkout.js" async />
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold font-sans tracking-tight">Checkout</h1>
      <p className="mt-1 text-xs text-muted-foreground uppercase font-semibold tracking-wider">
        Step {step + 1} of {STEPS.length}: {STEPS[step]}
      </p>

      <div className="mt-4 flex gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= step ? "bg-primary" : "bg-secondary"}`} />
        ))}
      </div>

      <div className="mt-8 space-y-5">
        {step === 0 && (
          <div className="space-y-4 animate-fade-in">
            <DeliveryAddressForm
              value={address}
              onChange={setAddress}
              title="Delivery address"
              subtitle="Where should our courier drop off your medicines?"
            />
            {needsRx && (
              <PrescriptionUploadBlock
                required
                rxItemNames={rxItems.map((i) => `${i.name} × ${i.quantity}`)}
                onChange={() => setRxUploaded(hasValidPrescription(true))}
              />
            )}
          </div>
        )}

        {step === 1 && (
          <div className="animate-fade-in">
            <OrderPaymentStep
              payment={payment}
              onPaymentChange={setPayment}
              policyAccepted={policyAccepted}
              onPolicyChange={setPolicyAccepted}
              policyVariant="medicine"
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <div className="rounded-2xl border bg-card/60 glass p-5 text-sm shadow-sm space-y-1">
              <p className="font-semibold text-foreground">Delivery Recipient</p>
              <p className="text-muted-foreground mt-1">{formatAddress(address)}</p>
              <p className="text-muted-foreground">Mobile Contact: {address.phone}</p>
              {needsRx && loadPrescriptionUpload() && (
                <p className="text-xs text-emerald-600 font-semibold mt-2">✓ Verified prescription upload attached</p>
              )}
            </div>
            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <p className="mb-3 font-semibold text-foreground">Items summary</p>
              <ul className="mb-3 space-y-1 text-sm border-b pb-3">
                {items.map((i) => (
                  <li key={i.medicineId} className="flex justify-between">
                    <span className="text-muted-foreground">{i.name} × {i.quantity}</span>
                    <span className="font-medium">₹{(i.price * i.quantity).toFixed(0)}</span>
                  </li>
                ))}
              </ul>
              <MedicineBillSummary bill={bill} distanceKm={fee.distanceKm} />
              <p className="mt-3 text-xs text-muted-foreground border-t pt-3">
                Selected Payment: <span className="font-semibold text-primary">{payment === "cod" ? "Cash on delivery (COD)" : payment === "wallet" ? "Digital Health Wallet" : "Card / UPI"}</span>
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 flex gap-3">
        {step > 0 && (
          <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)} className="glass">
            <ChevronLeft className="mr-1 h-4 w-4" /> Back
          </Button>
        )}
        {step < STEPS.length - 1 ? (
          <Button type="button" className="flex-grow btn-gradient" onClick={next}>
            Continue <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button type="button" className="flex-grow btn-gradient h-11" disabled={loading} onClick={onSubmit}>
            {loading
              ? "Placing order..."
              : payment === "prepaid"
                ? `Pay ₹${bill.grandTotal.toFixed(0)} & Confirm`
                : `Confirm Order · ₹${bill.grandTotal.toFixed(0)} COD`}
          </Button>
        )}
      </div>
      </div>
    </>
  );
}
