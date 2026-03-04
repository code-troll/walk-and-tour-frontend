import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "Walk and Tour Copenhagen | Walking Tours & Local Experiences",
  description:
    "Copenhagen walking tours and local experiences led by passionate guides. Free tours, castle visits, and day trips.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased" suppressHydrationWarning>
        <Header />
        <main className="pt-24">{children}</main>
      </body>
    </html>
  );
}
