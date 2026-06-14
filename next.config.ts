import type { NextConfig } from "next";
import path from "path";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config) => {
    const isMockClerk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === "pk_test_Y2xlcmsubW9jay5kZXYk" || !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    if (isMockClerk) {
      config.resolve.alias["@clerk/nextjs/server"] = path.resolve(__dirname, "./src/lib/mock-clerk-server.ts");
      config.resolve.alias["@clerk/nextjs"] = path.resolve(__dirname, "./src/lib/mock-clerk.tsx");
    }
    return config;
  },
  turbopack: {
    resolveAlias: (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === "pk_test_Y2xlcmsubW9jay5kZXYk" || !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) ? {
      "@clerk/nextjs": "./src/lib/mock-clerk.tsx",
      "@clerk/nextjs/server": "./src/lib/mock-clerk-server.ts",
    } : {}
  },
  experimental: {
    turbo: {
      resolveAlias: (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === "pk_test_Y2xlcmsubW9jay5kZXYk" || !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) ? {
        "@clerk/nextjs": "./src/lib/mock-clerk.tsx",
        "@clerk/nextjs/server": "./src/lib/mock-clerk-server.ts",
      } : {}
    }
  } as any
};

export default withSentryConfig(nextConfig, {
  org: "healthsurya",
  project: "healthsurya-nextjs",
  silent: true,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  disableLogger: true,
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
});
