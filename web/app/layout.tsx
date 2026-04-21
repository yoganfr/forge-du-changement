import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ),
  title: {
    default: "La Forge du Changement",
    template: "%s | La Forge du Changement",
  },
  description:
    "Méthodologie et accompagnement pour structurer et tenir dans le temps une transformation alignée au niveau CODIR et directions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      data-theme="light"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Polices produit (Clash + Satoshi) — fichier dans /public ; pas d’@import dans globals (Turbopack). */}
        <link rel="stylesheet" href="/fonts/fonts.css" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
