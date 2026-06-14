import { cn } from "@/lib/utils";
import type { AuthRoleConfig, AuthRoleId } from "@/lib/auth-roles";
import { AUTH_ROLES } from "@/lib/auth-roles";
import { Check } from "lucide-react";

type Props = {
  value: AuthRoleId;
  onChange: (role: AuthRoleId) => void;
  roles?: AuthRoleConfig[];
  compact?: boolean;
};

export function RolePicker({ value, onChange, roles = AUTH_ROLES, compact }: Props) {
  return (
    <div className={cn("grid gap-2", compact ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2")}>
      {roles.map((role) => {
        const selected = value === role.id;
        const Icon = role.icon;
        return (
          <button
            key={role.id}
            type="button"
            onClick={() => onChange(role.id)}
            className={cn(
              "group relative flex w-full flex-col rounded-xl border bg-card p-3 text-left transition-all",
              "hover:border-primary/40 hover:shadow-sm active:scale-[0.99]",
              selected ? "border-primary ring-2 ring-primary/25 shadow-sm" : "border-border/80",
              compact && "min-h-[5.5rem] p-2.5",
            )}
          >
            <div className="flex items-start gap-2.5">
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm",
                  role.accent,
                  compact && "h-8 w-8",
                )}
              >
                <Icon className={cn("h-4 w-4", compact && "h-3.5 w-3.5")} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className={cn("font-semibold leading-tight", compact ? "text-xs" : "text-sm")}>{role.label}</span>
                  {selected && <Check className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />}
                </div>
                <p className={cn("mt-0.5 line-clamp-2 text-muted-foreground", compact ? "text-[10px]" : "text-xs")}>
                  {role.tagline}
                </p>
              </div>
            </div>
            {!compact && (
              <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{role.description}</p>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function RoleSummary({ role }: { role: AuthRoleConfig }) {
  const Icon = role.icon;
  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5">
      <div className="flex items-center gap-2">
        <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br text-white", role.accent)}>
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-semibold">Signing in as {role.label}</p>
          <p className="text-xs text-muted-foreground">{role.afterSignup}</p>
        </div>
      </div>
    </div>
  );
}
