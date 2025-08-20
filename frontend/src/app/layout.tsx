import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HyperPool - No-Loss Lottery on Hyperliquid",
  description: "Win with your yield, never lose your deposit. A no-loss lottery on Hyperliquid where you deposit wHYPE, earn yield, and get tickets for a chance to win the prize every round.",
  keywords: "hyperliquid, lottery, no-loss, defi, yield, wHYPE, blockchain, ethereum, hyperEVM",
  authors: [{ name: "HyperPool Team" }],
  creator: "HyperPool",
  publisher: "HyperPool",
  openGraph: {
    title: "HyperPool - No-Loss Lottery on Hyperliquid",
    description: "Win with your yield, never lose your deposit. Deposit wHYPE and get tickets for a chance to win accumulated yield.",
    url: "https://hyperpool.xyz",
    siteName: "HyperPool",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "HyperPool - No-Loss Lottery on Hyperliquid",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "HyperPool - No-Loss Lottery on Hyperliquid",
    description: "Win with your yield, never lose your deposit. A no-loss lottery on Hyperliquid.",
    creator: "@hyperpool",
    images: ["/og-image.svg"],
  },
  robots: {
    index: true,
    follow: true,
  },
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#0f2540",
  icons: {
    icon: [
      {
        url: "/favicon.svg",
        type: "image/svg+xml",
      },
    ],
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
