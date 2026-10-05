import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kalan Blon — La porte du savoir",
  description: "L'APC simplifiée pour les enseignants maliens",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">{children}</body>
    </html>
  );
}