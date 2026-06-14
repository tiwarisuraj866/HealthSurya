import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import { Providers } from "@/components/Providers";
import { PostHogProvider } from "@/components/providers/PostHogProvider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Toaster } from "@/components/ui/sonner";
import { CustomerAlertsStrip } from "@/components/CustomerAlertsStrip";
import { AiAssistant } from "@/components/AiAssistant";
import { TesterPanel } from "@/components/TesterPanel";
import "./globals.css";

export const metadata: Metadata = {
  title: "HealthSurya — Your Trusted Health Partner",
  description:
    "Find trusted pathology labs and doctors. Book tests, compare prices, doctor appointments, medicine delivery — HealthSurya healthcare platform.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ClerkProvider appearance={{ theme: shadcn }}>
          <PostHogProvider>
            <Providers>
              <div className="site-mesh flex min-h-screen min-w-0 flex-col overflow-x-clip">
                <Header />
                <CustomerAlertsStrip />
                <main className="min-w-0 flex-1 pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0">
                  {children}
                </main>
                <Footer />
                <MobileBottomNav />
              </div>
              <AiAssistant />
              <TesterPanel />
              <Toaster
                richColors
                position="top-right"
                offset={{ top: "max(1rem, env(safe-area-inset-top))" }}
              />
            </Providers>
          </PostHogProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
