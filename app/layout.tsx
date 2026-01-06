import type { Metadata } from "next";
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
