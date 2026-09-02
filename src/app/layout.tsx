import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import PageViewTracker from "@/components/PageViewTracker";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MatchCV — Supera los filtros ATS y consigue tu primer empleo",
  description:
    "Diagnóstico gratuito de compatibilidad con vacantes y CV optimizado para sistemas ATS, hecho para recién egresados y estudiantes universitarios.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Suspense fallback={null}>
          <PageViewTracker />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
