import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { SessionInitializer } from "@/components/SessionInitializer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OpportuLink — Ton avenir commence ici",
  description: "La plateforme d'opportunités pour les étudiants camerounais",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <Providers>
          <SessionInitializer />
          {children}
        </Providers>
      </body>
    </html>
  );
}
