import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const headerList = await headers();
  const host = headerList.get("host") ?? "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";

  return {
    metadataBase: new URL(`${protocol}://${host}`),
    title: "La roue des conseils | Français A2",
    description: "Une roulette interactive pour pratiquer les conseils à l’oral en français.",
    openGraph: {
      title: "La roue des conseils",
      description: "Tourne la roue et donne deux conseils en français.",
      images: [{ url: "/og.png", width: 1536, height: 1024, alt: "La roue des conseils — Français A2" }],
      locale: "fr_FR",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "La roue des conseils",
      description: "Une activité orale et interactive pour le niveau A2.",
      images: ["/og.png"],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
