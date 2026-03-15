import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Consultant Augmenté CGI — Préparation",
  description:
    "Préparez vos rendez-vous de prospection avec l'aide de l'IA",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
