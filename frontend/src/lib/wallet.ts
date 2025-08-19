"use client";

import { createPublicClient, createWalletClient, custom, formatUnits, http } from "viem";
import type { Address, Chain } from "viem";
import { getAddresses, getChainId, switchChain } from "viem/actions";
import { NETWORKS } from "./chains";

export const hyperEVMChain: Chain = {
  id: NETWORKS.hyperEVM.chainId,
  name: NETWORKS.hyperEVM.name,
  nativeCurrency: NETWORKS.hyperEVM.nativeCurrency,
  rpcUrls: {
    default: { http: [NETWORKS.hyperEVM.rpcUrl] },
    public: { http: [NETWORKS.hyperEVM.rpcUrl] },
  },
};

export const publicClient = createPublicClient({
  chain: hyperEVMChain,
  transport: http(NETWORKS.hyperEVM.rpcUrl),
});

export async function getWalletClientFromEIP1193(ethereumProvider: any) {
  if (!ethereumProvider) return null;
  return createWalletClient({ chain: hyperEVMChain, transport: custom(ethereumProvider) });
}

export async function connectWallet(): Promise<{ address: Address; walletClient: ReturnType<typeof createWalletClient> } | null> {
  // Deprecated in favor of Privy-only connect path
  return null;
}

export function formatToken(amount: bigint, decimals: number, precision = 4) {
  const s = formatUnits(amount, decimals);
  const [i, d] = s.split(".");
  if (!d) return i;
  return `${i}.${d.slice(0, precision)}`;
}


