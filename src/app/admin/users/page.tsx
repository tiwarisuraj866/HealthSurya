"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Search, Loader2, ShieldCheck, MoreHorizontal, AlertCircle, Ban, Power } from "lucide-react";

const ROLES = [
  "patient",
  "doctor",
  "lab",
  "pharmacy",
  "franchise",
  "lab_staff",
  "pharmacy_staff",
  "support",
  "finance",
  "marketing",
  "operations",
  "admin",
  "super_admin",
];

const STATUSES = ["pending", "under_review", "approved", "rejected", "suspended"];

function AdminUsersInner() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState("all");

  // Fetch profiles from Supabase via React Query
  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["admin_profiles", search, roleFilter, statusFilter, activeFilter],
    queryFn: async () => {
      let query: any = supabase.from("profiles" as any).select("*");

      if (search) {
        query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
      }
      if (roleFilter !== "all") {
        query = query.eq("role", roleFilter);
      }
      if (statusFilter !== "all") {
        query = query.eq("verification_status", statusFilter);
      }
      if (activeFilter !== "all") {
        query = query.eq("is_active", activeFilter === "active");
      }

      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Action mutation
  const actionMutation = useMutation({
    mutationFn: async (params: {
      action: string;
      targetUserId: string;
      targetClerkId: string;
      newRole?: string;
    }) => {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success("User updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["admin_profiles"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update user.");
    },
  });

  const handleAction = (action: string, profile: any, extra = {}) => {
    actionMutation.mutate({
      action,
      targetUserId: profile.id,
      targetClerkId: profile.clerk_user_id,
      ...extra,
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="mt-1 text-muted-foreground">
            Manage roles, verify partner accounts, and regulate system access.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 grid gap-4 md:grid-cols-4 bg-card border rounded-2xl p-5">
        <div className="space-y-1.5">
          <Label htmlFor="admin-search">Search users</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="admin-search"
              placeholder="Name, email, phone..."
              className="pl-9 min-h-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Filter by Role</Label>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="min-h-10">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {ROLES.map((role) => (
                <SelectItem key={role} value={role}>
                  {role.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Filter by Status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="min-h-10">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Active Status</Label>
          <Select value={activeFilter} onValueChange={setActiveFilter}>
            <SelectTrigger className="min-h-10">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* User list */}
      <div className="mt-8 border rounded-2xl overflow-hidden bg-card shadow-sm">
        {isLoading ? (
          <div className="flex h-60 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Phone / Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Verification</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    No users found matching your filters.
                  </TableCell>
                </TableRow>
              ) : (
                profiles.map((p: any) => (
                  <TableRow key={p.id} className="hover:bg-muted/10">
                    <TableCell className="font-semibold">{p.full_name || "N/A"}</TableCell>
                    <TableCell>
                      <div className="text-sm font-mono">{p.phone || "No phone"}</div>
                      <div className="text-xs text-muted-foreground">{p.email || "No email"}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                        {p.role?.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          p.verification_status === "approved"
                            ? "bg-success/10 text-success border-success/20"
                            : p.verification_status === "pending" ||
                              p.verification_status === "under_review"
                            ? "bg-warning/10 text-warning border-warning/20"
                            : "bg-destructive/10 text-destructive border-destructive/20"
                        }
                      >
                        {p.verification_status?.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {p.is_active ? (
                        <span className="flex items-center gap-1.5 text-xs text-success font-medium">
                          <span className="h-2 w-2 rounded-full bg-success" /> Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs text-destructive font-medium">
                          <span className="h-2 w-2 rounded-full bg-destructive" /> Suspended
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 glass-strong">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />

                          {p.verification_status !== "approved" && (
                            <DropdownMenuItem
                              onClick={() => handleAction("approve", p, { newRole: p.role })}
                            >
                              <ShieldCheck className="mr-2 h-4 w-4 text-success" /> Approve Verification
                            </DropdownMenuItem>
                          )}

                          {p.verification_status !== "rejected" && (
                            <DropdownMenuItem onClick={() => handleAction("reject", p)}>
                              <AlertCircle className="mr-2 h-4 w-4 text-destructive" /> Reject Verification
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuSeparator />

                          {p.is_active ? (
                            <DropdownMenuItem onClick={() => handleAction("suspend", p)}>
                              <Ban className="mr-2 h-4 w-4 text-destructive" /> Suspend Account
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleAction("activate", p)}>
                              <Power className="mr-2 h-4 w-4 text-success" /> Activate Account
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuSeparator />
                          <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                          <div className="grid grid-cols-2 gap-1 p-2">
                            {ROLES.slice(0, 5).map((r) => (
                              <Button
                                key={r}
                                variant={p.role === r ? "default" : "outline"}
                                size="sm"
                                className="text-[10px] h-6 py-0 px-1.5"
                                onClick={() => handleAction("change_role", p, { newRole: r })}
                              >
                                {r.slice(0, 8)}
                              </Button>
                            ))}
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
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


export default function AdminUsersPage() {
  return (
    <RoleGuard allow={["admin", "super_admin"]} allowAdmin={false}>
      <AdminUsersInner />
    </RoleGuard>
  );
}
