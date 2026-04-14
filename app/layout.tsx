import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Odyssey",
  description: "AI agents that earn, spend, and deliver.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}