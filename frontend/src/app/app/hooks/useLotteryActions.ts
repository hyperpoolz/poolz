import { useCallback, useState } from 'react';
import { Address, parseUnits } from 'viem';
import { contractAddresses, ERC20_ABI, V2_LOTTERY_ABI, WETH_LIKE_ABI, VRF_ABI } from '@/lib/contracts';
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

      // Handle VRF if needed
      const roundData = (await publicClient.readContract({
        address: contractAddresses.lotteryContract as Address,
        abi: V2_LOTTERY_ABI,
        functionName: "rounds",
        args: [currentRound],
      })) as any;

      const requestId = roundData?.[2];

      if (requestId && requestId > BigInt(0)) {
        const vrfRequest = (await publicClient.readContract({
          address: contractAddresses.vrfContract as Address,
          abi: VRF_ABI,
          functionName: "getRequest",
          args: [requestId],
        })) as any;

        if (!vrfRequest.fulfilled) {
          // Fulfill VRF request
          const info = await fetch('https://api.drand.sh/v2/beacons/evmnet/info').then(r => r.json());
          
          const roundFromDeadline = (genesis: number, period: number, deadline: number) => {
            if (deadline <= genesis) return 1n;
            const delta = BigInt(deadline - genesis);
            const p = BigInt(period);
            return delta % p === 0n ? (delta / p) : (delta / p + 1n);
          };
          
          const genesis = Number(info.genesis_time);
          const period = Number(info.period);
          const deadline = Number(vrfRequest.deadline);
          const minRound = BigInt(vrfRequest.minRound);
          
          const r = roundFromDeadline(genesis, period, deadline);
          const targetRound = r < minRound ? minRound : r;
          
          const { signature } = await fetch(`https://api.drand.sh/v2/beacons/evmnet/rounds/${targetRound}`).then(r => r.json());
          
          const h = signature.startsWith('0x') ? signature.slice(2) : signature;
          const realSignature: [bigint, bigint] = [
            BigInt('0x' + h.slice(0, 64)),
            BigInt('0x' + h.slice(64))
          ];

          const { request: vrfRequest_ } = await publicClient.simulateContract({
            address: contractAddresses.vrfContract as Address,
            abi: VRF_ABI,
            functionName: "fulfillRandomness",
            args: [requestId, targetRound, realSignature],
            account: address,
          });

          const vrfHash = await walletClient.writeContract(vrfRequest_);
          await publicClient.waitForTransactionReceipt({ hash: vrfHash });
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