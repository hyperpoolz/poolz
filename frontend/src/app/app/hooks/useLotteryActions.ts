import { useCallback, useState } from 'react';
import { Address } from 'viem';
import { contractAddresses, ERC20_ABI, V2_LOTTERY_ABI, WETH_LIKE_ABI } from '@/lib/contracts';
import { publicClient } from '@/lib/wallet';
import { useWallet } from './useWallet';

type ActionType = 'deposit' | 'withdraw' | 'harvest' | 'close' | 'finalize';

export function useLotteryActions() {
  const [loading, setLoading] = useState<ActionType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { address, getWalletClient } = useWallet();

  const clearError = useCallback(() => setError(null), []);

  const executeAction = useCallback(async (
    actionType: ActionType,
    action: () => Promise<void>
  ) => {
    try {
      setLoading(actionType);
      setError(null);
      await action();
    } catch (err: any) {
      const message = err?.shortMessage || err?.message || `${actionType} failed`;
      setError(message);
      throw err;
    } finally {
      setLoading(null);
    }
  }, []);

  const deposit = useCallback(async (amount: bigint, decimals: number, ticketUnit: bigint) => {
    if (!address || amount === BigInt(0)) return;
    if (ticketUnit !== BigInt(0) && amount % ticketUnit !== BigInt(0)) {
      throw new Error('Amount must be in multiples of ticket unit');
    }

    await executeAction('deposit', async () => {
      const walletClient = await getWalletClient();
      if (!walletClient) throw new Error("No wallet connected");

      // Check balance and wrap if needed
      const currentBal = (await publicClient.readContract({
        address: contractAddresses.depositToken as Address,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [address],
      })) as bigint;

      if (currentBal < amount) {
        const deficit = amount - currentBal;
        const { request } = await publicClient.simulateContract({
          address: contractAddresses.depositToken as Address,
          abi: WETH_LIKE_ABI,
          functionName: "deposit",
          args: [],
          account: address,
          value: deficit,
        });
        const wrapHash = await walletClient.writeContract(request);
        await publicClient.waitForTransactionReceipt({ hash: wrapHash });
      }

      // Check allowance and approve if needed
      const allowance = (await publicClient.readContract({
        address: contractAddresses.depositToken as Address,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [address, contractAddresses.lotteryContract as Address],
      })) as bigint;

      if (allowance < amount) {
        const { request } = await publicClient.simulateContract({
          address: contractAddresses.depositToken as Address,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [contractAddresses.lotteryContract as Address, amount],
          account: address,
        });
        const approveHash = await walletClient.writeContract(request);
        await publicClient.waitForTransactionReceipt({ hash: approveHash });
      }

      // Deposit
      const { request } = await publicClient.simulateContract({
        address: contractAddresses.lotteryContract as Address,
        abi: V2_LOTTERY_ABI,
        functionName: "depositWHYPE",
        args: [amount],
        account: address,
      });
      const depositHash = await walletClient.writeContract(request);
      await publicClient.waitForTransactionReceipt({ hash: depositHash });
    });
  }, [address, executeAction, getWalletClient]);

  const withdraw = useCallback(async (amount: bigint, ticketUnit: bigint) => {
    if (!address || amount === BigInt(0)) return;
    if (ticketUnit !== BigInt(0) && amount % ticketUnit !== BigInt(0)) {
      throw new Error('Amount must be in multiples of ticket unit');
    }

    await executeAction('withdraw', async () => {
      const walletClient = await getWalletClient();
      if (!walletClient) throw new Error("No wallet connected");

      const { request } = await publicClient.simulateContract({
        address: contractAddresses.lotteryContract as Address,
        abi: V2_LOTTERY_ABI,
        functionName: "withdraw",
        args: [amount],
        account: address,
      });
      const hash = await walletClient.writeContract(request);
      await publicClient.waitForTransactionReceipt({ hash });
    });
  }, [address, executeAction, getWalletClient]);

  const harvestYield = useCallback(async () => {
    if (!address) return;

    await executeAction('harvest', async () => {
      const walletClient = await getWalletClient();
      if (!walletClient) throw new Error("No wallet connected");

      const { request } = await publicClient.simulateContract({
        address: contractAddresses.lotteryContract as Address,
        abi: V2_LOTTERY_ABI,
        functionName: "harvestYield",
        args: [],
        account: address,
      });
      const hash = await walletClient.writeContract(request);
      await publicClient.waitForTransactionReceipt({ hash });
    });
  }, [address, executeAction, getWalletClient]);

  const closeRound = useCallback(async () => {
    if (!address) return;

    await executeAction('close', async () => {
      const walletClient = await getWalletClient();
      if (!walletClient) throw new Error("No wallet connected");

      const { request } = await publicClient.simulateContract({
        address: contractAddresses.lotteryContract as Address,
        abi: V2_LOTTERY_ABI,
        functionName: "closeRound",
        args: [],
        account: address,
      });
      const hash = await walletClient.writeContract(request);
      await publicClient.waitForTransactionReceipt({ hash });
    });
  }, [address, executeAction, getWalletClient]);

  const finalizeRound = useCallback(async (currentRound: bigint) => {
    if (!address) return;

    await executeAction('finalize', async () => {
      const walletClient = await getWalletClient();
      if (!walletClient) throw new Error("No wallet connected");

      // Handle VRF if needed using server-side SDK
      const roundInfo = (await publicClient.readContract({
        address: contractAddresses.lotteryContract as Address,
        abi: V2_LOTTERY_ABI,
        functionName: "getRoundInfo",
        args: [currentRound],
      })) as readonly [bigint, bigint, bigint, bigint, bigint, string, number, bigint];

      const requestId = roundInfo?.[2] as bigint; // requestId per ABI

      if (requestId && requestId > BigInt(0)) {
        try {
          const res = await fetch('/api/vrf/fulfill', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requestId: requestId.toString(), wait: true }),
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err?.message || 'VRF fulfillment failed');
          }
          // If already fulfilled, continue
          const data = await res.json().catch(() => null);
          if (data?.alreadyFulfilled) {
            // proceed to finalize
          }
        } catch (e) {
          // Surface but do not swallow; finalize will likely revert if not ready
          throw e;
        }
      }

      // Finalize round
      const { request } = await publicClient.simulateContract({
        address: contractAddresses.lotteryContract as Address,
        abi: V2_LOTTERY_ABI,
        functionName: "finalizeRound",
        args: [],
        account: address,
      });
      const hash = await walletClient.writeContract(request);
      await publicClient.waitForTransactionReceipt({ hash });
    });
  }, [address, executeAction, getWalletClient]);

  return {
    loading,
    error,
    clearError,
    actions: {
      deposit,
      withdraw,
      harvestYield,
      closeRound,
      finalizeRound,
    },
  };
}