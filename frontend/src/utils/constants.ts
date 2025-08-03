import { type NetworkConfig, type ContractAddresses } from '../types';

// Hyperliquid EVM Network Configurations
export const NETWORKS: Record<string, NetworkConfig> = {
  hyperEVM: {
    chainId: 999,
    name: 'Hyperliquid EVM',
    rpcUrl: 'https://api.hyperliquid.xyz/evm',
    blockExplorer: 'https://explorer.hyperliquid.xyz',
    nativeCurrency: {
      name: 'HYPE',
      symbol: 'HYPE',
      decimals: 18,
    },
  },
  hyperEVMTestnet: {
    chainId: 998,
    name: 'Hyperliquid EVM Testnet',
    rpcUrl: 'https://api.hyperliquid-testnet.xyz/evm',
    blockExplorer: 'https://explorer.hyperliquid-testnet.xyz',
    nativeCurrency: {
      name: 'HYPE',
      symbol: 'HYPE',
      decimals: 18,
    },
  },
};

// Contract addresses for different networks
export const CONTRACT_ADDRESSES: Record<number, ContractAddresses> = {
  999: { // Mainnet
    hyperLendPool: '0x00A89d7a5A02160f20150EbEA7a2b5E4879A1A8b',
    dataProvider: '0x5481bf8d3946E6A3168640c1D7523eB59F055a29',
    wHYPE: '0x5555555555555555555555555555555555555555',
    noLossLottery: process.env.NEXT_PUBLIC_LOTTERY_CONTRACT_MAINNET || '',
  },
  998: { // Testnet
    hyperLendPool: '0x00A89d7a5A02160f20150EbEA7a2b5E4879A1A8b',
    dataProvider: '0x5481bf8d3946E6A3168640c1D7523eB59F055a29',
    wHYPE: '0x5555555555555555555555555555555555555555',
    noLossLottery: process.env.NEXT_PUBLIC_LOTTERY_CONTRACT_TESTNET || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  },
  31337: { // Local Hardhat
    hyperLendPool: '0x00A89d7a5A02160f20150EbEA7a2b5E4879A1A8b',
    dataProvider: '0x5481bf8d3946E6A3168640c1D7523eB59F055a29',
    wHYPE: '0x5555555555555555555555555555555555555555',
    noLossLottery: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  },
};

// Application constants
export const APP_CONFIG = {
  name: 'HyperLoops',
  description: 'No-Loss Lottery on Hyperliquid EVM',
  version: '1.0.0',
  author: 'HyperLoops Team',
  social: {
    twitter: 'https://twitter.com/hyperloops',
    github: 'https://github.com/hyperloops/protocol',
    discord: 'https://discord.gg/hyperloops',
  },
} as const;

// UI Constants
export const UI_CONFIG = {
  breakpoints: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
  },
  animations: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  colors: {
    primary: '#00d4aa',
    secondary: '#1a1a1b',
    background: '#0a0a0b',
    success: '#00d4aa',
    warning: '#ffa726',
    error: '#ef5350',
  },
} as const;

// Demo data for Session 1
export const DEMO_DATA = {
  poolStats: {
    totalDeposits: '12,450.5',
    currentAPY: 14.2,
    participantCount: 47,
    prizePool: '234.8',
    nextLotteryTime: Date.now() + 82800000, // 23 hours from now
    totalTickets: 1247,
    averageDepositTime: 15, // days
  },
  recentWinners: [
    {
      round: 15,
      winner: '0x742d35Cc6634C0532925a3b8D94B0c5097c3391e',
      prize: '89.3',
      timestamp: Date.now() - 86400000, // 1 day ago
      totalParticipants: 43,
      totalTickets: 1156,
    },
    {
      round: 14,
      winner: '0x8ba1f109551bD432803012645Hac136c',
      prize: '76.8',
      timestamp: Date.now() - 172800000, // 2 days ago
      totalParticipants: 39,
      totalTickets: 1089,
    },
    {
      round: 13,
      winner: '0x1234567890abcdef1234567890abcdef12345678',
      prize: '92.1',
      timestamp: Date.now() - 259200000, // 3 days ago
      totalParticipants: 41,
      totalTickets: 1134,
    },
  ],
  userStats: {
    depositAmount: '500.0',
    timeHeld: 12, // days
    tickets: 45,
    winProbability: 3.6, // percentage
    projectedYield24h: '1.94',
  },
} as const;

// Feature flags for development
export const FEATURE_FLAGS = {
  showDemoData: process.env.NODE_ENV === 'development',
  enableAdvancedCharts: true,
  enableNotifications: true,
  enableSoundEffects: false,
  enableExperimentalFeatures: false,
} as const;

// Error messages
export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: 'Please connect your wallet to continue',
  WRONG_NETWORK: 'Please switch to Hyperliquid EVM network',
  INSUFFICIENT_BALANCE: 'Insufficient balance for this transaction',
  TRANSACTION_FAILED: 'Transaction failed. Please try again.',
  CONTRACT_INTERACTION_FAILED: 'Failed to interact with smart contract',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNKNOWN_ERROR: 'An unknown error occurred. Please try again.',
} as const;