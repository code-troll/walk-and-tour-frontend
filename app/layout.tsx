import "./globals.css";
import React from "react";
import type {Metadata} from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://walkandtour.dk"),
};

export default function RootLayout({
                                     children,
                                   }: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="font-sans">
    <body className="antialiased" suppressHydrationWarning>{ children }</body>
    </html>
  );
}
