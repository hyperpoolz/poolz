import { useCallback, useEffect, useState } from 'react';
import { Address } from 'viem';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { getWalletClientFromEIP1193 } from '@/lib/wallet';

export function useWallet() {
  const [address, setAddress] = useState<Address | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login, logout, ready, authenticated } = usePrivy() as any;
  const { wallets, ready: walletsReady, connectWallet: privyConnectWallet, disconnectWallet } = useWallets() as any;

  const connect = useCallback(async () => {
    if (!ready) return;
    
    try {
      setConnecting(true);
      setError(null);

      if (!authenticated) {
        await login();
        return;
      }
      
      if (walletsReady && (!wallets || wallets.length === 0)) {
        await privyConnectWallet();
        return;
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to connect wallet');
    } finally {
      setConnecting(false);
    }
  }, [ready, authenticated, login, walletsReady, wallets, privyConnectWallet]);

  const disconnect = useCallback(async () => {
    try {
      setError(null);
      if (wallets && wallets.length > 0 && disconnectWallet) {
        await disconnectWallet(wallets[0]);
      }
    } catch {}
    
    try {
      await logout();
    } catch {}
    
    setAddress(null);
  }, [wallets, disconnectWallet, logout]);

  const getWalletClient = useCallback(async () => {
    if (!wallets || wallets.length === 0) return null;
    
    try {
      const primary = wallets[0];
      const provider = await primary.getEthereumProvider();
      return await getWalletClientFromEIP1193(provider);
    } catch {
      return null;
    }
  }, [wallets]);

  // Update address when wallet state changes
  useEffect(() => {
    if (!walletsReady) return;
    
    if (!authenticated) {
      setAddress(null);
      return;
    }

    const primary = wallets && wallets.length > 0 ? wallets[0] : null;
    if (!primary) return;

    (async () => {
      try {
        const provider = await primary.getEthereumProvider();
        const client = await getWalletClientFromEIP1193(provider);
        if (!client) return;
        
        const [addr] = await client.requestAddresses();
        setAddress(addr as Address);
      } catch (err) {
        console.error('Failed to get wallet address:', err);
      }
    })();
  }, [authenticated, walletsReady, wallets]);

  return {
    address,
    connecting,
    error,
    isConnected: !!address,
    connect,
    disconnect,
    getWalletClient,
  };
}