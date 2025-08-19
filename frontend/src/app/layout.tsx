import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'HyperLoops - No-Loss Lottery on Hyperliquid EVM',
  description: 'Deposit wHYPE tokens, earn yield through HyperLend, and win prizes in daily lotteries while keeping your principal safe.',
  keywords: ['DeFi', 'Lottery', 'Hyperliquid', 'HyperLend', 'No-Loss', 'Yield Farming'],
  authors: [{ name: 'HyperLoops Team' }],
  openGraph: {
    title: 'HyperLoops - No-Loss Lottery',
    description: 'The first no-loss lottery on Hyperliquid EVM',
    type: 'website',
    siteName: 'HyperLoops',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HyperLoops - No-Loss Lottery',
    description: 'Deposit wHYPE, earn yield, win prizes - principal always protected',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased bg-background text-foreground`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}