import { useState, useCallback } from 'react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { CONTRACT_ADDRESSES } from '../utils/constants';
import { type UserInfo, type ContractState } from '../types';
import toast from 'react-hot-toast';

// Minimal ERC20 ABI
const ERC20_ABI = [
  { name: 'approve', type: 'function', stateMutability: 'nonpayable', inputs: [
    { name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }
  ], outputs: [{ type: 'bool' }] },
  { name: 'allowance', type: 'function', stateMutability: 'view', inputs: [
    { name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }
  ], outputs: [{ type: 'uint256' }] },
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [
    { name: 'account', type: 'address' }
  ], outputs: [{ type: 'uint256' }] },
  { name: 'decimals', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] },
  { name: 'symbol', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
] as const;

// NoLossLottery Contract ABI (slimmed)
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
      { type: 'uint256' },
      { type: 'uint256' },
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
  // Write functions
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
  const tokenAddress = chainId ? CONTRACT_ADDRESSES[chainId]?.wHYPE : '';

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

  // removed paused/totalTickets for slim contract

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
    // slimmed: no paused/totalTickets refetch
  }, [
    refetchTotalDeposits,
    refetchPrizePool,
    refetchCurrentRound,
    refetchParticipantCount,
    refetchTimeToNext,
    refetchAccruedYield,
    refetchUserInfo,
    refetchIsLotteryReady,
    
  ]);

  // Write functions: deposit uses ERC20 approve + depositWHYPE
  const deposit = useCallback(async (amount: string) => {
    if (!contractAddress || !address) {
      toast.error('Contract not available or wallet not connected');
      return;
    }
    if (!tokenAddress) {
      toast.error('Token not configured for this chain');
      return;
    }

    try {
      setIsLoading(true);
      const amountWei = parseEther(amount);
      // Approve wHYPE to lottery contract
      await writeContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [contractAddress as `0x${string}`, amountWei],
      });
      // Call depositWHYPE on lottery
      const tx = await writeContract({
        address: contractAddress as `0x${string}`,
        abi: NO_LOSS_LOTTERY_ABI,
        functionName: 'depositWHYPE',
        args: [amountWei],
      });

      toast.success('Approve + deposit submitted!');
      return tx;
    } catch (error) {
      console.error('Deposit failed:', error);
      toast.error('Deposit failed: ' + (error as Error).message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [contractAddress, tokenAddress, address, writeContract]);

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

  const harvest = useCallback(async () => {
    if (!contractAddress) return;
    try {
      setIsLoading(true);
      const tx = await writeContract({
        address: contractAddress as `0x${string}`,
        abi: NO_LOSS_LOTTERY_ABI,
        functionName: 'harvestYield',
        args: [],
      });
      toast.success('Harvest transaction submitted!');
      return tx;
    } catch (error) {
      console.error('Harvest failed:', error);
      toast.error('Harvest failed: ' + (error as Error).message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [contractAddress, writeContract]);

  const executeLottery = useCallback(async () => {
    if (!contractAddress) return;
    try {
      setIsLoading(true);
      const tx = await writeContract({
        address: contractAddress as `0x${string}`,
        abi: NO_LOSS_LOTTERY_ABI,
        functionName: 'executeLottery',
        args: [],
      });
      toast.success('Lottery execution submitted!');
      return tx;
    } catch (error) {
      console.error('Execute lottery failed:', error);
      toast.error('Execute lottery failed: ' + (error as Error).message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [contractAddress, writeContract]);

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
    depositAmount: (userInfo as unknown as readonly [bigint, bigint])[0],
    depositTime: 0n,
    tickets: (userInfo as unknown as readonly [bigint, bigint])[1],
    lastTicketUpdate: 0n,
  } : null;

  return {
    // Contract data
    contractState,
    userInfo: formattedUserInfo,
    accruedYield: accruedYield || 0n,
    isLotteryReady: isLotteryReady || false,
    
    // Contract address
    contractAddress,
    
    // Loading states
    isLoading,
    
    // Functions
    deposit,
    withdraw,
    harvest,
    executeLottery,
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