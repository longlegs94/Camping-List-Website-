import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const incoming = await headers();
  const host = incoming.get("x-forwarded-host") ?? incoming.get("host") ?? "localhost:3000";
  const protocol = incoming.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const image = `${protocol}://${host}/og.jpg`;
  return {
    title: "CampList — Group Camping Planner",
    description: "Plan meals, combine groceries, assign supplies, and get your whole camp crew packed.",
    openGraph: {
      title: "CampList — Group Camping Planner",
      description: "Everything your camp crew needs. One list.",
      type: "website",
      images: [{ url: image, width: 1731, height: 909, alt: "CampList camping checklist" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "CampList — Group Camping Planner",
      description: "Everything your camp crew needs. One list.",
      images: [image],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
