import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { hyperEVM, hyperEVMTestnet } from '../utils/chains';

// Prefer mainnet first so wallets default to mainnet in production/dev
export const wagmiConfig = getDefaultConfig({
  appName: 'HyperLoops - No-Loss Lottery',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'demo-project-id',
  chains: [hyperEVM, hyperEVMTestnet],
  ssr: true,
});

export { hyperEVM, hyperEVMTestnet };