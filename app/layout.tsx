import type { Metadata } from "next";
import "./globals.css";
import { AuthRefreshProvider } from "@/components/auth/AuthRefreshProvider";

export const metadata: Metadata = {
  title: "Duma AI - Image Editor",
  description: "Professional AI-powered product photo editing by Duma AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthRefreshProvider />
        {children}
      </body>
    </html>
  );
}
