import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EC Validator - FEMA Elevation Certificate Validation",
  description: "Automated validation system for FEMA Elevation Certificates",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.Node;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
