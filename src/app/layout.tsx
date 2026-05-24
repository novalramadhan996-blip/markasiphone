import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Markas iPhone",
  description: "iBox inspired store with CMS",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}