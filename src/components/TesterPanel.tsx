"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, User, Shield, Stethoscope, Beaker, Pill, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const ROLES = [
  { id: "admin", label: "Admin", icon: Shield, color: "text-rose-500 bg-rose-500/10 border-rose-500/20" },
  { id: "doctor", label: "Doctor", icon: Stethoscope, color: "text-sky-500 bg-sky-500/10 border-sky-500/20" },
  { id: "lab", label: "Lab Partner", icon: Beaker, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
  { id: "pharmacy", label: "Pharmacy", icon: Pill, color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
  { id: "patient", label: "Patient", icon: User, color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20" },
];

function getCookie(name: string) {
  if (typeof window === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return null;
}

function setCookie(name: string, value: string, days = 30) {
  if (typeof window === "undefined") return;
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${value}; expires=${date.toUTCString()}; path=/; SameSite=Lax; Secure`;
}

function eraseCookie(name: string) {
  if (typeof window === "undefined") return;
  document.cookie = `${name}=; Max-Age=-99999999; path=/; SameSite=Lax; Secure`;
}

export function TesterPanel() {
  const [hasTesterKey, setHasTesterKey] = useState(false);
  const [activeRole, setActiveRole] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if tester_key exists and set roles
    const key = getCookie("tester_key");
    if (key) {
      setHasTesterKey(true);
      setActiveRole(getCookie("mock_role") || getCookie("sb_session") || "none");
    }
  }, []);

  if (!hasTesterKey) return null;

  const handleRoleSwitch = (roleId: string) => {
    setCookie("mock_role", roleId);
    setCookie("sb_session", roleId);
    window.location.href = "/dashboard";
  };

  const handleReset = () => {
    eraseCookie("mock_role");
    eraseCookie("sb_session");
    eraseCookie("tester_key");
    window.location.href = "/";
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
      {isOpen ? (
        <div className="mb-3 w-72 rounded-2xl border border-white/20 bg-background/80 p-4 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center justify-between border-b pb-3 border-border/40">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-rose-500 animate-pulse" />
              <div>
                <h4 className="text-sm font-bold text-foreground">Tester Control</h4>
                <p className="text-[10px] text-muted-foreground">Select role to impersonate online</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 space-y-2">
            {ROLES.map((role) => {
              const RoleIcon = role.icon;
              const isActive = activeRole === role.id;
              return (
                <button
                  key={role.id}
                  onClick={() => handleRoleSwitch(role.id)}
                  className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-xs font-semibold transition-all hover:translate-x-1 ${
                    isActive
                      ? "border-primary bg-primary text-primary-foreground"
                      : `border-border/60 bg-muted/30 text-foreground hover:bg-muted/80`
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className={`rounded-lg border p-1 ${role.color} ${isActive ? "bg-white/10 border-white/20 text-white" : ""}`}>
                      <RoleIcon className="h-3.5 w-3.5" />
                    </span>
                    {role.label}
                  </span>
                  {isActive && <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[9px] font-bold">Active</span>}
                </button>
              );
            })}
          </div>

          <div className="mt-4 border-t pt-3 border-border/40 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="flex-1 text-[11px] font-semibold h-9 rounded-xl text-rose-500 hover:bg-rose-500/5 hover:text-rose-600 border-rose-500/20"
            >
              Exit Testing
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.reload()}
              className="px-3 h-9 rounded-xl"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-500 text-white shadow-lg shadow-rose-500/20 hover:scale-105 hover:bg-rose-600 transition-all cursor-pointer border border-rose-400/20"
        >
          <ShieldAlert className="h-6 w-6 animate-pulse" />
        </button>
      )}
    </div>
  );
}
