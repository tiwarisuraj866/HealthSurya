import Link from "next/link";
import { AnimatedLogo } from "@/components/AnimatedLogo";
import type { AuthRoleConfig } from "@/lib/auth-roles";

export function AuthPageShell({
  title,
  subtitle,
  children,
  footer,
  role,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  role?: AuthRoleConfig;
}) {
  const RoleIcon = role?.icon;

  return (
    <div className="relative flex min-h-[calc(100dvh-4rem)] items-center justify-center overflow-hidden bg-hero-gradient py-12 px-4">
      {/* Background glowing rings / radial gradients */}
      <div className="pointer-events-none absolute -left-20 top-8 h-80 w-80 rounded-full bg-primary/10 blur-[100px]" />
      <div className="pointer-events-none absolute -right-12 bottom-16 h-96 w-96 rounded-full bg-accent/10 blur-[100px]" />
      
      {/* Grid overlay for medical theme */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_right,rgba(0,0,0,0.012)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.012)_1px,transparent_1px)] bg-[size:40px_40px]" />
      
      {/* Heartbeat pulse glow line in background */}
      <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/10 to-transparent pointer-events-none" />

      <div className="relative z-10 w-full max-w-[28rem]">
        <div className="overflow-hidden rounded-3xl border border-border/80 bg-card/75 backdrop-blur-2xl shadow-xl p-6 sm:p-8">
          
          {/* Centered Brand Header */}
          <div className="text-center mb-6">
            <Link href="/" className="inline-flex items-center gap-2 mb-2 transition-opacity hover:opacity-90">
              <AnimatedLogo size="md" showText={true} className="[&_span]:text-foreground" />
            </Link>
            
            {role && RoleIcon && (
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary/5 border border-primary/20 px-3 py-1 text-primary">
                <RoleIcon className="h-3.5 w-3.5" />
                <span className="text-[11px] font-bold tracking-wide uppercase">{role.label} Mode</span>
              </div>
            )}
            
            <h1 className="mt-4 text-2xl font-extrabold text-foreground tracking-tight sm:text-3xl font-sans">{title}</h1>
            <p className="mt-1 text-xs text-muted-foreground font-medium">{subtitle}</p>
          </div>

          {/* Form Content */}
          <div className="space-y-4">{children}</div>

          {/* Footer Info */}
          {footer && (
            <div className="mt-6 border-t border-border/50 pt-4 text-center text-xs text-muted-foreground">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
