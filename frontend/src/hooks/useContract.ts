import { useState, useCallback } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { CONTRACT_ADDRESSES } from '../utils/constants';
import { type UserInfo, type ContractState } from '../types';
import toast from 'react-hot-toast';

// NoLossLottery Contract ABI (simplified for Session 1)
const NO_LOSS_LOTTERY_ABI = [
  // View functions
  {
    name: 'totalDeposits',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'prizePool',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'currentRound',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'getParticipantCount',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'getTimeToNextLottery',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'getCurrentSupplyBalance',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'getAccruedYield',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'getUserInfo',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'depositAmount', type: 'uint256' },
          { name: 'depositTime', type: 'uint256' },
          { name: 'tickets', type: 'uint256' },
          { name: 'lastTicketUpdate', type: 'uint256' },
        ],
      },
    ],
  },
  {
    name: 'isLotteryReady',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'bool' }],
  },
  {
    name: 'owner',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }],
  },
  {
    name: 'paused',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'bool' }],
  },
  // Write functions - Session 2 implementation
  {
    name: 'deposit',
    type: 'function',
    stateMutability: 'payable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'depositWHYPE',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'withdraw',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'harvestYield',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'executeLottery',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  // Events
  {
    name: 'Deposited',
    type: 'event',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'Withdrawn',
    type: 'event',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'LotteryExecuted',
    type: 'event',
    inputs: [
      { name: 'winner', type: 'address', indexed: true },
      { name: 'prize', type: 'uint256', indexed: false },
      { name: 'round', type: 'uint256', indexed: false },
    ],
  },
] as const;

export const useContract = () => {
  const { address, chainId } = useAccount();
  const { writeContract } = useWriteContract();
  const [isLoading, setIsLoading] = useState(false);

  // Get contract address for current chain
  const contractAddress = chainId ? CONTRACT_ADDRESSES[chainId]?.noLossLottery : '';

  // Contract read hooks
  const { data: totalDeposits, refetch: refetchTotalDeposits } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: NO_LOSS_LOTTERY_ABI,
    functionName: 'totalDeposits',
    query: { enabled: !!contractAddress },
  });

  const { data: prizePool, refetch: refetchPrizePool } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: NO_LOSS_LOTTERY_ABI,
    functionName: 'prizePool',
    query: { enabled: !!contractAddress },
  });

  const { data: currentRound, refetch: refetchCurrentRound } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: NO_LOSS_LOTTERY_ABI,
    functionName: 'currentRound',
    query: { enabled: !!contractAddress },
  });

  const { data: participantCount, refetch: refetchParticipantCount } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: NO_LOSS_LOTTERY_ABI,
    functionName: 'getParticipantCount',
    query: { enabled: !!contractAddress },
  });

  const { data: timeToNextLottery, refetch: refetchTimeToNext } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: NO_LOSS_LOTTERY_ABI,
    functionName: 'getTimeToNextLottery',
    query: { enabled: !!contractAddress },
  });

  const { data: accruedYield, refetch: refetchAccruedYield } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: NO_LOSS_LOTTERY_ABI,
    functionName: 'getAccruedYield',
    query: { enabled: !!contractAddress },
  });

  const { data: userInfo, refetch: refetchUserInfo } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: NO_LOSS_LOTTERY_ABI,
    functionName: 'getUserInfo',
    args: address ? [address] : undefined,
    query: { enabled: !!contractAddress && !!address },
  });

  const { data: isLotteryReady, refetch: refetchIsLotteryReady } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: NO_LOSS_LOTTERY_ABI,
    functionName: 'isLotteryReady',
    query: { enabled: !!contractAddress },
  });

  const { data: isPaused, refetch: refetchIsPaused } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: NO_LOSS_LOTTERY_ABI,
    functionName: 'paused',
    query: { enabled: !!contractAddress },
  });

  // Refetch all data
  const refetchAll = useCallback(() => {
    refetchTotalDeposits();
    refetchPrizePool();
    refetchCurrentRound();
    refetchParticipantCount();
    refetchTimeToNext();
    refetchAccruedYield();
    refetchUserInfo();
    refetchIsLotteryReady();
    refetchIsPaused();
  }, [
    refetchTotalDeposits,
    refetchPrizePool,
    refetchCurrentRound,
    refetchParticipantCount,
    refetchTimeToNext,
    refetchAccruedYield,
    refetchUserInfo,
    refetchIsLotteryReady,
    refetchIsPaused,
  ]);

  // Write functions for Session 2
  const deposit = useCallback(async (amount: string) => {
    if (!contractAddress || !address) {
      toast.error('Contract not available or wallet not connected');
      return;
    }

    try {
      setIsLoading(true);
      const amountWei = parseEther(amount);
      
      const hash = await writeContract({
        address: contractAddress as `0x${string}`,
        abi: NO_LOSS_LOTTERY_ABI,
        functionName: 'deposit',
        args: [],
        value: amountWei, // Send native HYPE as msg.value
      });

      toast.success('Deposit transaction submitted!');
      return hash;
    } catch (error) {
      console.error('Deposit failed:', error);
      toast.error('Deposit failed: ' + (error as Error).message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [contractAddress, address, writeContract]);

  const withdraw = useCallback(async (amount: string) => {
    if (!contractAddress || !address) {
      toast.error('Contract not available or wallet not connected');
      return;
    }

    try {
      setIsLoading(true);
      const amountWei = parseEther(amount);
      
      const hash = await writeContract({
        address: contractAddress as `0x${string}`,
        abi: NO_LOSS_LOTTERY_ABI,
        functionName: 'withdraw',
        args: [amountWei],
      });

      toast.success('Withdrawal transaction submitted!');
      return hash;
    } catch (error) {
      console.error('Withdrawal failed:', error);
      toast.error('Withdrawal failed: ' + (error as Error).message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [contractAddress, address, writeContract]);

  // Format contract state for easy consumption
  const contractState: ContractState = {
    totalDeposits: totalDeposits || 0n,
    prizePool: prizePool || 0n,
    currentRound: currentRound || 0n,
    participantCount: Number(participantCount || 0n),
    nextLotteryTime: timeToNextLottery || 0n,
    lastHarvestTime: 0n, // Will be implemented in Session 3
  };

  const formattedUserInfo: UserInfo | null = userInfo ? {
    depositAmount: (userInfo as unknown as readonly [bigint, bigint, bigint, bigint])[0],
    depositTime: (userInfo as unknown as readonly [bigint, bigint, bigint, bigint])[1],
    tickets: (userInfo as unknown as readonly [bigint, bigint, bigint, bigint])[2],
    lastTicketUpdate: (userInfo as unknown as readonly [bigint, bigint, bigint, bigint])[3],
  } : null;

  return {
    // Contract data
    contractState,
    userInfo: formattedUserInfo,
    accruedYield: accruedYield || 0n,
    isLotteryReady: isLotteryReady || false,
    isPaused: isPaused || false,
    
    // Contract address
    contractAddress,
    
    // Loading states
    isLoading,
    
    // Functions
    deposit,
    withdraw,
    refetchAll,
    
    // Formatted data helpers
    formatters: {
      totalDeposits: totalDeposits ? formatEther(totalDeposits) : '0',
      prizePool: prizePool ? formatEther(prizePool) : '0',
      accruedYield: accruedYield ? formatEther(accruedYield) : '0',
      userDeposit: formattedUserInfo ? formatEther(formattedUserInfo.depositAmount) : '0',
    },
  };
};