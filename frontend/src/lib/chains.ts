export const NETWORKS = {
  hyperEVM: {
    chainId: 999,
    name: "Hyperliquid EVM",
    rpcUrl:
      process.env.NEXT_PUBLIC_MAINNET_RPC_URL || "https://hyperliquid.drpc.org",
    blockExplorer: "https://explorer.hyperliquid.xyz",
    nativeCurrency: {
      name: "HYPE",
      symbol: "HYPE",
      decimals: 18,
    },
  },
  hyperEVMTestnet: {
    chainId: 998,
    name: "Hyperliquid EVM Testnet",
    rpcUrl:
      process.env.NEXT_PUBLIC_TESTNET_RPC_URL ||
      "https://rpc.hyperliquid-testnet.xyz/evm",
    blockExplorer: "https://explorer.hyperliquid-testnet.xyz",
    nativeCurrency: {
      name: "HYPE",
      symbol: "HYPE",
      decimals: 18,
    },
  },
};
