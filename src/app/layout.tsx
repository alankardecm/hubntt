import type { Metadata } from "next";
import "./globals.css";
import EnvironmentBanner from "@/components/EnvironmentBanner";

export const metadata: Metadata = {
  title: "Netturbo Hub",
  description: "Hub operacional da Netturbo com RAG, dashboards, datalake e monitoramento.",
};

import CommandPalette from "@/components/CommandPalette";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <EnvironmentBanner />
        {children}
        <CommandPalette />
      </body>
    </html>
  );
}
