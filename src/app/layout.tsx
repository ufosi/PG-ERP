import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "PG-ERP",
  description: "System ERP/MES dla firmy produkcyjnej",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pl" className="dark">
      <body>{children}</body>
    </html>
  );
}
