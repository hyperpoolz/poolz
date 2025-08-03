'use client';

import React from 'react';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NextUIProvider } from '@nextui-org/react';
import { Toaster } from 'react-hot-toast';
import { wagmiConfig } from '../config/wagmi';

import '@rainbow-me/rainbowkit/styles.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 3,
      staleTime: 30000, // 30 seconds
    },
  },
});

// Custom RainbowKit theme to match Hyperliquid branding
const customTheme = darkTheme({
  accentColor: '#00d4aa',
  accentColorForeground: '#000000',
  borderRadius: 'medium',
  fontStack: 'system',
  overlayBlur: 'small',
});

customTheme.colors.modalBackground = '#1a1a1b';
customTheme.colors.modalBorder = '#2a2a2b';
customTheme.colors.modalText = '#ffffff';
customTheme.colors.modalTextSecondary = '#a0a0a0';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={customTheme}>
          <NextUIProvider>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#1a1a1b',
                  color: '#ffffff',
                  border: '1px solid #2a2a2b',
                  borderRadius: '8px',
                },
                success: {
                  iconTheme: {
                    primary: '#00d4aa',
                    secondary: '#000000',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef5350',
                    secondary: '#ffffff',
                  },
                },
              }}
            />
          </NextUIProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}