import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Prospecta — CRM para Workana",
    template: "%s — Prospecta",
  },
  description: "CRM personal para organizar oportunidades, seguimientos y cierres en Workana.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
