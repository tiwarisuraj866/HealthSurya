import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type DeliveryAddress, INDIAN_STATES } from "@/lib/address";
import { MapPin } from "lucide-react";

type Props = {
  value: DeliveryAddress;
  onChange: (v: DeliveryAddress) => void;
  title?: string;
  subtitle?: string;
};

export function DeliveryAddressForm({ value, onChange, title = "Complete delivery address", subtitle }: Props) {
  const set = (key: keyof DeliveryAddress, v: string) => onChange({ ...value, [key]: v });

  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="mb-4 flex items-start gap-2">
        <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div>
          <h3 className="font-semibold">{title}</h3>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          <p className="mt-1 text-xs text-muted-foreground">
            Accurate address helps our delivery partner and phlebotomist reach you on time.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>House / flat no. *</Label>
          <Input required placeholder="e.g. 12, B-204" value={value.houseNo} onChange={(e) => set("houseNo", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Street / locality *</Label>
          <Input required placeholder="e.g. MG Road, Sector 5" value={value.street} onChange={(e) => set("street", e.target.value)} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Village / area / landmark</Label>
          <Input placeholder="Village, colony or nearby landmark" value={value.village} onChange={(e) => set("village", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>City / town *</Label>
          <Input required value={value.city} onChange={(e) => set("city", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>District *</Label>
          <Input required placeholder="e.g. Mumbai Suburban" value={value.district} onChange={(e) => set("district", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>State *</Label>
          <Select value={value.state} onValueChange={(v) => set("state", v)}>
            <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
            <SelectContent>
              {INDIAN_STATES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Pincode *</Label>
          <Input required maxLength={6} inputMode="numeric" placeholder="6 digits" value={value.pincode} onChange={(e) => set("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Mobile number *</Label>
          <Input required type="tel" maxLength={10} placeholder="10-digit mobile" value={value.phone} onChange={(e) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Delivery instructions (optional)</Label>
          <Textarea rows={2} placeholder="Floor, gate code, best time to call…" value={value.landmark} onChange={(e) => set("landmark", e.target.value)} maxLength={300} />
        </div>
      </div>
    </div>
  );
}
