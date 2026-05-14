import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import CommandPalette from "@/components/CommandPalette";
import { SessionProvider } from "@/components/providers/SessionProvider";

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
        <SessionProvider>
          <Suspense fallback={null}>
            {children}
          </Suspense>
          <Suspense fallback={null}>
            <CommandPalette />
          </Suspense>
        </SessionProvider>
      </body>
    </html>
  );
}
