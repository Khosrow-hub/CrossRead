import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CrossRead",
  description: "Collaborative reading platform where readers annotate books, save versions, and build on each other's interpretations.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}