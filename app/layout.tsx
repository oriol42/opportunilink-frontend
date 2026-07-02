import type { Metadata, Viewport } from "next";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/700.css";
import "@fontsource/fraunces/400.css";
import "@fontsource/fraunces/500.css";
import "@fontsource/fraunces/600.css";
import "@fontsource/fraunces/500-italic.css";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { SessionInitializer } from "@/components/SessionInitializer";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";

export const metadata: Metadata = {
  title: "OpportuLink — Ton avenir commence ici",
  description: "La plateforme d'opportunités pour les étudiants camerounais",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "OpportuLink" },
};

export const viewport: Viewport = {
  themeColor: "#10b981",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  return (
    <html lang="fr">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        {plausibleDomain && (
          <script defer data-domain={plausibleDomain} src="https://plausible.io/js/script.js" />
        )}
      </head>
      <body style={{ fontFamily: "var(--font-sans)", margin: 0 }}>
        <Providers>
          <SessionInitializer />
          <ServiceWorkerRegistrar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
