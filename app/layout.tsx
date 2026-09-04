import "./globals.css";
import React from "react";
import type {Metadata} from "next";
import {Work_Sans} from "next/font/google";

/**
 * Work Sans is the brand's text typeface for digital and print alike
 * (brand identity manual, p. 15), in Light, Regular and Medium.
 *
 * It was named in `globals.css` from the start but never actually served, so
 * every screen fell back to the browser's default sans. Loading it here is what
 * makes the design system's typography real; do not add weights the manual does
 * not list.
 */
const workSans = Work_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-work-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://walkandtour.dk"),
};

export default function RootLayout({
                                     children,
                                   }: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${workSans.variable} font-sans`}>
    <body className="antialiased" suppressHydrationWarning>{ children }</body>
    </html>
  );
}
