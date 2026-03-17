import "./globals.css";
import React from "react";

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
