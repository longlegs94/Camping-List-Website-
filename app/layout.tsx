import type { Metadata, Viewport } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { TopBar, BottomNav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "Group Camping Planner",
  description:
    "Plan meals, groceries, gear and packing lists for your group camping trip.",
};

export const viewport: Viewport = {
  themeColor: "#34a165",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <StoreProvider>
          <TopBar />
          <main className="mx-auto max-w-3xl px-4 pb-24 pt-4">{children}</main>
          <BottomNav />
        </StoreProvider>
      </body>
    </html>
  );
}
