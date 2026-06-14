"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, Plus, UserCheck, UserMinus, ShieldAlert } from "lucide-react";

interface StaffManagementProps {
  parentProfileId: string;
  staffRole: "lab_staff" | "pharmacy_staff";
  title: string;
}

export function StaffManagement({ parentProfileId, staffRole, title }: StaffManagementProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [adding, setAdding] = useState(false);

  // Fetch staff members
  const { data: staff = [], isLoading } = useQuery({
    queryKey: ["staff_members", parentProfileId],
    queryFn: async () => {
      const { data, error } = (await (supabase
        .from("staff_members" as any) as any)
        .select("*")
        .eq("parent_partner_id" as any, parentProfileId)
        .order("created_at", { ascending: false })) as any;

      if (error) throw error;
      return data;
    },
    enabled: Boolean(parentProfileId),
  });

  // Add staff mutation
  const addStaffMutation = useMutation({
    mutationFn: async (params: { name: string; phone: string }) => {
      const { data, error } = (await (supabase.from("staff_members" as any) as any).insert({
        parent_partner_id: parentProfileId,
        role: staffRole,
        name: params.name,
        phone: params.phone,
        is_active: true,
      } as any)) as any;

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Staff member added!");
      setName("");
      setPhone("");
      setAdding(false);
      queryClient.invalidateQueries({ queryKey: ["staff_members"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to add staff member.");
    },
  });

  // Toggle active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async (params: { id: string; is_active: boolean }) => {
      const { error } = (await (supabase
        .from("staff_members" as any) as any)
        .update({ is_active: params.is_active } as any)
        .eq("id" as any, params.id)) as any;

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Staff member status updated!");
      queryClient.invalidateQueries({ queryKey: ["staff_members"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update staff status.");
    },
  });

  const onAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      toast.error("Please enter both Name and Mobile number.");
      return;
    }
    addStaffMutation.mutate({ name, phone });
  };

  return (
    <div className="mt-8 bg-card border rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
        <div>
          <h2 className="text-xl font-bold">{title}</h2>
          <p className="text-sm text-muted-foreground">
            Invite staff members to log in and access operational tools.
          </p>
        </div>
        <Button onClick={() => setAdding(!adding)} size="sm" className="btn-gradient">
          <Plus className="mr-1.5 h-4 w-4" /> {adding ? "Close Form" : "Add Staff"}
        </Button>
      </div>

      {adding && (
        <form onSubmit={onAddSubmit} className="mt-4 p-4 border rounded-xl bg-muted/20 space-y-4">
          <h3 className="text-sm font-semibold">Add New Staff Member</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="staff-name">Staff Name</Label>
              <Input
                id="staff-name"
                placeholder="Enter full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="staff-phone">Mobile Number</Label>
              <Input
                id="staff-phone"
                placeholder="e.g. 9876543210"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" className="btn-gradient" disabled={addStaffMutation.isPending}>
              {addStaffMutation.isPending ? "Adding..." : "Add Staff Member"}
            </Button>
          </div>
        </form>
      )}

      {/* Staff Table */}
      <div className="mt-6 border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Registration Status</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    No staff members registered.
                  </TableCell>
                </TableRow>
              ) : (
                staff.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-semibold">{s.name}</TableCell>
                    <TableCell className="font-mono">{s.phone}</TableCell>
                    <TableCell>
                      {s.clerk_user_id ? (
                        <Badge variant="outline" className="bg-success/5 text-success border-success/20">
                          Registered
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-warning/5 text-warning border-warning/20">
                          Pending First Sign-In
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {s.is_active ? (
                        <span className="flex items-center gap-1.5 text-xs text-success font-medium">
                          <span className="h-2 w-2 rounded-full bg-success" /> Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs text-destructive font-medium">
                          <span className="h-2 w-2 rounded-full bg-destructive" /> Inactive
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {s.is_active ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => toggleActiveMutation.mutate({ id: s.id, is_active: false })}
                        >
                          <UserMinus className="h-4 w-4 mr-1" /> Deactivate
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-success hover:bg-success/10"
                          onClick={() => toggleActiveMutation.mutate({ id: s.id, is_active: true })}
                        >
                          <UserCheck className="h-4 w-4 mr-1" /> Activate
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
