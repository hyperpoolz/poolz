import { defineChain } from 'viem';
import { NETWORKS } from './constants';

// Define Hyperliquid EVM chains for Wagmi/Viem
export const hyperEVM = defineChain({
  id: NETWORKS.hyperEVM.chainId,
  name: NETWORKS.hyperEVM.name,
  nativeCurrency: NETWORKS.hyperEVM.nativeCurrency,
  rpcUrls: {
    default: {
      http: [NETWORKS.hyperEVM.rpcUrl],
    },
    public: {
      http: [NETWORKS.hyperEVM.rpcUrl],
    },
  },
  blockExplorers: {
    default: {
      name: 'Hyperliquid Explorer',
      url: NETWORKS.hyperEVM.blockExplorer!,
    },
  },
  testnet: false,
});

export const hyperEVMTestnet = defineChain({
  id: NETWORKS.hyperEVMTestnet.chainId,
  name: NETWORKS.hyperEVMTestnet.name,
  nativeCurrency: NETWORKS.hyperEVMTestnet.nativeCurrency,
  rpcUrls: {
    default: {
      http: [NETWORKS.hyperEVMTestnet.rpcUrl],
    },
    public: {
      http: [NETWORKS.hyperEVMTestnet.rpcUrl],
    },
  },
  blockExplorers: {
    default: {
      name: 'Hyperliquid Testnet Explorer',
      url: NETWORKS.hyperEVMTestnet.blockExplorer!,
    },
  },
  testnet: true,
});

// Export supported chains
export const supportedChains = [hyperEVM, hyperEVMTestnet] as const;

// Helper function to get chain by ID
export const getChainById = (chainId: number) => {
  return supportedChains.find(chain => chain.id === chainId);
};

// Helper function to check if chain is supported
export const isSupportedChain = (chainId: number): boolean => {
  return supportedChains.some(chain => chain.id === chainId);
};

// Get default chain based on environment
export const getDefaultChain = () => {
  return process.env.NODE_ENV === 'production' ? hyperEVM : hyperEVMTestnet;
};