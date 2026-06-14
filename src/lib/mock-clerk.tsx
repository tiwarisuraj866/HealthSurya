"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

const UserContext = createContext<any>(null);

export function ClerkProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };
    setRole(getCookie("mock_role") || null);
    setIsLoaded(true);
  }, []);

  let clerkId = null;
  let fullName = "";
  if (role === "admin") {
    clerkId = "f1000001-0001-4000-8000-000000000001";
    fullName = "Suraj Tiwari";
  } else if (role === "doctor") {
    clerkId = "c1000001-0001-4000-8000-000000000001";
    fullName = "Dr. Rajesh Gupta";
  } else if (role === "lab") {
    clerkId = "d1000001-0001-4000-8000-000000000001";
    fullName = "PathCare Diagnostics";
  } else if (role === "pharmacy") {
    clerkId = "d1000002-0001-4000-8000-000000000002";
    fullName = "MedLife Labs";
  } else if (role === "patient") {
    clerkId = "b1000001-0001-4000-8000-000000000001";
    fullName = "Rahul Sharma";
  }

  const mockUser = clerkId ? {
    id: clerkId,
    primaryEmailAddress: { emailAddress: `${role}@healthsurya.com` },
    firstName: fullName.split(" ")[0],
    lastName: fullName.split(" ").slice(1).join(" ") || "User",
    fullName: fullName,
    publicMetadata: {
      role: role,
      verification_status: "approved",
      is_active: true
    }
  } : null;

  return (
    <UserContext.Provider value={{ user: mockUser, isLoaded, isSignedIn: !!clerkId, role, setRole }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    return { isLoaded: false, isSignedIn: false, user: null };
  }
  return {
    isLoaded: context.isLoaded,
    isSignedIn: context.isSignedIn,
    user: context.user
  };
}

export function useClerk() {
  return {
    signOut: async () => {
      document.cookie = "mock_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      window.location.href = "/login";
    }
  };
}

export function useSignIn() {
  return {
    isLoaded: true,
    signIn: {
      create: async ({ identifier, password }: any) => {
        const getCookie = (name: string) => {
          const value = `; ${document.cookie}`;
          const parts = value.split(`; ${name}=`);
          if (parts.length === 2) return parts.pop()?.split(';').shift();
          return null;
        };
        let role = getCookie("mock_role");
        if (!role) {
          role = "patient";
          const clean = identifier.toLowerCase();
          if (clean.includes("doctor") || clean.includes("dr.") || clean.includes("dr_") || clean.startsWith("dr@")) role = "doctor";
          else if (clean.includes("lab")) role = "lab";
          else if (clean.includes("pharmacy")) role = "pharmacy";
          else if (clean.includes("admin")) role = "admin";
        }
        
        document.cookie = `mock_role=${role}; path=/`;
        document.cookie = `sb_session=${role}; path=/`;
        return { status: "complete", createdSessionId: "mock_session" };
      },
      prepareFirstFactor: async () => {},
      attemptFirstFactor: async () => {
        const getCookie = (name: string) => {
          const value = `; ${document.cookie}`;
          const parts = value.split(`; ${name}=`);
          if (parts.length === 2) return parts.pop()?.split(';').shift();
          return null;
        };
        let role = getCookie("mock_role") || "patient";
        document.cookie = `mock_role=${role}; path=/`;
        document.cookie = `sb_session=${role}; path=/`;
        return { status: "complete", createdSessionId: "mock_session" };
      },
      authenticateWithRedirect: async ({ redirectUrlComplete }: any) => {
        const getCookie = (name: string) => {
          const value = `; ${document.cookie}`;
          const parts = value.split(`; ${name}=`);
          if (parts.length === 2) return parts.pop()?.split(';').shift();
          return null;
        };
        let role = getCookie("mock_role") || "patient";
        document.cookie = `mock_role=${role}; path=/`;
        document.cookie = `sb_session=${role}; path=/`;
        window.location.href = redirectUrlComplete || "/";
      }
    },
    setActive: async () => {
      window.location.reload();
    }
  };
}

export function useSignUp() {
  return {
    isLoaded: true,
    signUp: {
      create: async ({ unsafeMetadata }: any) => {
        if (unsafeMetadata?.role) {
          document.cookie = `mock_intent_role=${unsafeMetadata.role}; path=/`;
        }
      },
      prepareVerification: async () => {},
      preparePhoneNumberVerification: async () => {},
      prepareEmailAddressVerification: async () => {},
      attemptVerification: async () => {
        const cookies = document.cookie.split("; ");
        const intentCookie = cookies.find(row => row.startsWith("mock_intent_role="));
        const role = intentCookie ? intentCookie.split("=")[1] : "patient";
        document.cookie = `mock_role=${role}; path=/`;
        return { status: "complete", createdSessionId: "mock_session" };
      },
      attemptPhoneNumberVerification: async () => {
        const cookies = document.cookie.split("; ");
        const intentCookie = cookies.find(row => row.startsWith("mock_intent_role="));
        const role = intentCookie ? intentCookie.split("=")[1] : "patient";
        document.cookie = `mock_role=${role}; path=/`;
        return { status: "complete", createdSessionId: "mock_session" };
      },
      attemptEmailAddressVerification: async () => {
        const cookies = document.cookie.split("; ");
        const intentCookie = cookies.find(row => row.startsWith("mock_intent_role="));
        const role = intentCookie ? intentCookie.split("=")[1] : "patient";
        document.cookie = `mock_role=${role}; path=/`;
        return { status: "complete", createdSessionId: "mock_session" };
      },
      authenticateWithRedirect: async ({ redirectUrlComplete }: any) => {
        const getCookie = (name: string) => {
          const value = `; ${document.cookie}`;
          const parts = value.split(`; ${name}=`);
          if (parts.length === 2) return parts.pop()?.split(';').shift();
          return null;
        };
        let role = getCookie("mock_role") || "patient";
        document.cookie = `mock_role=${role}; path=/`;
        document.cookie = `sb_session=${role}; path=/`;
        window.location.href = redirectUrlComplete || "/";
      }
    },
    setActive: async () => {
      window.location.reload();
    }
  };
}

export function AuthenticateWithRedirectCallback() {
  useEffect(() => {
    const timer = setTimeout(() => {
      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return null;
      };
      let role = getCookie("mock_role") || "patient";
      document.cookie = `mock_role=${role}; path=/`;
      document.cookie = `sb_session=${role}; path=/`;
      window.location.href = "/";
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ textAlign: "center", padding: "2rem" }}>
      <svg style={{ animation: "spin 1s linear infinite", width: "2rem", height: "2rem", margin: "0 auto 1rem", color: "var(--primary)" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="2" x2="12" y2="6"></line>
        <line x1="12" y1="18" x2="12" y2="22"></line>
        <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
        <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
        <line x1="2" y1="12" x2="6" y2="12"></line>
        <line x1="18" y1="12" x2="22" y2="12"></line>
        <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
        <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
      </svg>
      <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>Mock SSO Authenticating...</p>
    </div>
  );
}

