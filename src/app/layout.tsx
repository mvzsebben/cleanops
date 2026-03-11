import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CleanOps",
  description: "Centralised booking dashboard for cleaning operations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
