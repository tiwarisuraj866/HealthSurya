"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { supabase } from "@/integrations/supabase/client";

export type AppRole =
  | "patient"
  | "doctor"
  | "lab"
  | "pharmacy"
  | "franchise"
  | "courier"
  | "lab_staff"
  | "pharmacy_staff"
  | "support"
  | "finance"
  | "marketing"
  | "operations"
  | "admin"
  | "super_admin";

export type VerificationStatus = "pending" | "under_review" | "approved" | "rejected" | "suspended";

export interface UserProfile {
  id: string; // UUID in Supabase
  clerk_user_id: string;
  phone: string | null;
  email: string | null;
  full_name: string | null;
  role: AppRole;
  verification_status: VerificationStatus;
  is_active: boolean;
  wallet_balance?: number;
  created_at: string;
  updated_at: string;
}

interface AuthCtx {
  user: UserProfile | null; // Profile from Supabase
  clerkUser: ReturnType<typeof useUser>["user"]; // Raw Clerk User
  roles: AppRole[];
  loading: boolean;
  signOut: () => Promise<void>;
  refreshRoles: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();
  const { signOut: clerkSignOut } = useClerk();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const fetchProfile = async (idOrClerkId: string) => {
    if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === "pk_test_Y2xlcmsubW9jay5kZXYk") {
      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return null;
      };
      let mockRole = getCookie("mock_role");
      if (!mockRole && clerkUser?.primaryEmailAddress?.emailAddress) {
        const email = clerkUser.primaryEmailAddress.emailAddress.toLowerCase();
        if (email.includes("doctor") || email.includes("dr.") || email.includes("dr_") || email.startsWith("dr@")) mockRole = "doctor";
        else if (email.includes("lab")) mockRole = "lab";
        else if (email.includes("pharmacy")) mockRole = "pharmacy";
        else if (email.includes("admin")) mockRole = "admin";
      }
      mockRole = mockRole || "patient";
      const mockVerStatus = getCookie("mock_verification_status") || "approved";
      return {
        id: idOrClerkId,
        clerk_user_id: idOrClerkId,
        phone: "9876500501",
        email: `${mockRole}@healthsurya.com`,
        full_name: mockRole === "admin" ? "Suraj Tiwari" : mockRole === "doctor" ? "Dr. Rajesh Gupta" : mockRole === "lab" ? "PathCare Diagnostics" : `Test ${mockRole.charAt(0).toUpperCase() + mockRole.slice(1)}`,
        role: mockRole,
        verification_status: mockVerStatus as any,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any;
    }

    try {
      const { data, error } = (await (supabase
        .from("profiles" as any) as any)
        .select("*")
        .or(`id.eq.${idOrClerkId},clerk_user_id.eq.${idOrClerkId}`)
        .maybeSingle()) as any;

      if (error) {
        console.error("[AuthProvider] Error fetching profile:", error.message);
        return null;
      }
      return data as UserProfile | null;
    } catch (err) {
      console.error("[AuthProvider] Catch fetching profile:", err);
      return null;
    }
  };

  const loadAndSyncProfile = async (id: string, attempts = 5) => {
    setLoadingProfile(true);
    let currentAttempt = 0;

    const poll = async () => {
      const data = await fetchProfile(id);
      if (data) {
        setProfile(data);
        setLoadingProfile(false);
      } else if (currentAttempt < attempts) {
        currentAttempt++;
        console.log(`[AuthProvider] Profile not found, retrying in 1.5s (attempt ${currentAttempt}/${attempts})...`);
        setTimeout(poll, 1500);
      } else {
        console.warn("[AuthProvider] Profile not found after polling. Webhook or trigger might be pending.");
        setProfile(null);
        setLoadingProfile(false);
      }
    };

    poll();
  };

  useEffect(() => {
    if (!isClerkLoaded) {
      return;
    }

    if (clerkUser) {
      // Primary authentication: Clerk User
      if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === "pk_test_Y2xlcmsubW9jay5kZXYk") {
        const getCookie = (name: string) => {
          const value = `; ${document.cookie}`;
          const parts = value.split(`; ${name}=`);
          if (parts.length === 2) return parts.pop()?.split(';').shift();
          return null;
        };
        if (!getCookie("mock_role") && clerkUser.primaryEmailAddress?.emailAddress) {
          const email = clerkUser.primaryEmailAddress.emailAddress.toLowerCase();
          let derivedRole = "patient";
          if (email.includes("doctor") || email.includes("dr.") || email.includes("dr_") || email.startsWith("dr@")) derivedRole = "doctor";
          else if (email.includes("lab")) derivedRole = "lab";
          else if (email.includes("pharmacy")) derivedRole = "pharmacy";
          else if (email.includes("admin")) derivedRole = "admin";
          document.cookie = `sb_session=${derivedRole}; path=/`;
          document.cookie = `mock_role=${derivedRole}; path=/`;
        }
      }
      loadAndSyncProfile(clerkUser.id);
    } else {
      setProfile(null);
      setLoadingProfile(false);
    }
  }, [clerkUser, isClerkLoaded]);

  const signOut = async () => {
    setLoadingProfile(true);
    // clear local storage session / mock cookies
    if (typeof window !== "undefined") {
      document.cookie = "mock_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "sb_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
    await clerkSignOut();
    setProfile(null);
    setLoadingProfile(false);
  };

  const refreshRoles = async () => {
    const activeUserId = clerkUser?.id;
    if (activeUserId) {
      const data = await fetchProfile(activeUserId);
      if (data) setProfile(data);
    }
  };

  const roles: AppRole[] = profile ? [profile.role] : [];
  const loading = !isClerkLoaded || loadingProfile;

  if (typeof window !== "undefined") {
    (window as any).__clerkUser = clerkUser;
    (window as any).__isClerkLoaded = isClerkLoaded;
    (window as any).__loadingProfile = loadingProfile;
    (window as any).__authLoading = loading;
    (window as any).__authProfile = profile;
  }

  return (
    <AuthContext.Provider
      value={{
        user: profile,
        clerkUser,
        roles,
        loading,
        signOut,
        refreshRoles,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
