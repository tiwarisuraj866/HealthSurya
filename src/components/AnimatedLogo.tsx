import logo from "@/assets/logo.png";

type AnimatedLogoProps = {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
};

const sizes = {
  sm: "h-8 w-8",
  md: "h-10 w-10 sm:h-11 sm:w-11",
  lg: "h-14 w-14 sm:h-16 sm:w-16",
};

export function AnimatedLogo({ size = "md", showText = true, className = "" }: AnimatedLogoProps) {
  return (
    <span className={`inline-flex min-w-0 items-center gap-2.5 ${className}`}>
      <span className="relative shrink-0">
        <span className="logo-ring absolute inset-0 rounded-full" aria-hidden />
        <img
          src={logo.src}
          alt="HealthSurya"
          className={`logo-glow relative object-contain ${sizes[size]}`}
          loading="eager"
          decoding="async"
        />
      </span>
      {showText && (
        <span className="truncate text-sm font-bold tracking-tight sm:text-lg">
          Health<span className="bg-gradient-to-r from-primary to-teal-500 bg-clip-text text-transparent">Surya</span>
        </span>
      )}
    </span>
  );
}
