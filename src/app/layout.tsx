import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import EnvironmentBanner from "@/components/EnvironmentBanner";
import CommandPalette from "@/components/CommandPalette";

export const metadata: Metadata = {
  title: "Netturbo Hub",
  description: "Hub operacional da Netturbo com RAG, dashboards, datalake e monitoramento.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="h-full flex flex-col">
        <EnvironmentBanner />
        <Suspense fallback={null}>
          {children}
        </Suspense>
        <Suspense fallback={null}>
          <CommandPalette />
        </Suspense>
      </body>
    </html>
  );
}
