import { useState, useCallback } from 'react';
import { useAccount, useReadContract, useWriteContract, usePublicClient } from 'wagmi';
import { parseEther, formatEther, type Hash } from 'viem';
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
  // Public array getter for participants
  {
    name: 'participants',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'uint256' }],
    outputs: [{ type: 'address' }],
  },
  // Public mapping getter for users
  {
    name: 'users',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'address' }],
    outputs: [
      { type: 'uint256' }, // depositAmount
      { type: 'uint256' }, // tickets
    ],
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
  // Public variables getters
  {
    name: 'lastHarvestTime',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'nextLotteryTime',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'totalTickets',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'userAllocationBps',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ type: 'uint16' }],
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
  {
    name: 'YieldHarvested',
    type: 'event',
    inputs: [
      { name: 'yieldAmount', type: 'uint256', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
] as const;

// Minimal ABI for HyperLend Data Provider to read liquidityRate
const DATA_PROVIDER_ABI = [
  {
    name: 'getReserveData',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'asset', type: 'address' }],
    outputs: [
      { type: 'uint256' }, // availableLiquidity
      { type: 'uint256' }, // totalStableDebt
      { type: 'uint256' }, // totalVariableDebt
      { type: 'uint256' }, // liquidityRate
      { type: 'uint256' }, // variableBorrowRate
      { type: 'uint256' }, // stableBorrowRate
      { type: 'uint256' }, // averageStableBorrowRate
      { type: 'uint256' }, // liquidityIndex
      { type: 'uint256' }, // variableBorrowIndex
      { type: 'uint40' },  // lastUpdateTimestamp
    ],
  },
] as const;

export const useContract = () => {
  const { address, chainId } = useAccount();
  const { writeContract } = useWriteContract();
  const publicClient = usePublicClient();
  const [isLoading, setIsLoading] = useState(false);

  // Get contract address for current chain
  const contractAddress = chainId ? CONTRACT_ADDRESSES[chainId]?.noLossLottery : '';
  const tokenAddress = chainId ? CONTRACT_ADDRESSES[chainId]?.wHYPE : '';
  const dataProviderAddress = chainId ? CONTRACT_ADDRESSES[chainId]?.dataProvider : '';

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

  const { data: lastHarvestTime, refetch: refetchLastHarvest } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: NO_LOSS_LOTTERY_ABI,
    functionName: 'lastHarvestTime',
    query: { enabled: !!contractAddress },
  });

  const { data: nextLotteryTime, refetch: refetchNextLotteryTime } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: NO_LOSS_LOTTERY_ABI,
    functionName: 'nextLotteryTime',
    query: { enabled: !!contractAddress },
  });

  const { data: totalTickets, refetch: refetchTotalTickets } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: NO_LOSS_LOTTERY_ABI,
    functionName: 'totalTickets',
    query: { enabled: !!contractAddress },
  });

  const { data: userAllocBps, refetch: refetchUserAlloc } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: NO_LOSS_LOTTERY_ABI,
    functionName: 'userAllocationBps',
    args: address ? [address] : undefined,
    query: { enabled: !!contractAddress && !!address },
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

  // Liquidity rate from HyperLend Data Provider
  const { data: reserveData } = useReadContract({
    address: dataProviderAddress as `0x${string}`,
    abi: DATA_PROVIDER_ABI,
    functionName: 'getReserveData',
    args: tokenAddress ? [tokenAddress as `0x${string}`] : undefined,
    query: { enabled: !!dataProviderAddress && !!tokenAddress },
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
    refetchLastHarvest();
    refetchNextLotteryTime();
    refetchTotalTickets();
    refetchUserAlloc();
    // no explicit refetch for reserveData read hook (auto refresh via wagmi)
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
    refetchLastHarvest,
    refetchNextLotteryTime,
    refetchTotalTickets,
    refetchUserAlloc,
    
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

      toast.loading('Step 1/2: Approving wHYPE…', { id: 'approve' });
      const approveHash = await writeContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [contractAddress as `0x${string}`, amountWei],
      }) as unknown as Hash;
      // Wait for approval confirmation to avoid race conditions
      try {
        if (publicClient) {
          await publicClient.waitForTransactionReceipt({ hash: approveHash as `0x${string}` });
        }
        toast.success('Approval confirmed', { id: 'approve' });
      } catch (approvalError) {
        console.warn('Approval receipt failed, but transaction was sent:', approvalError);
        toast.success('Approval transaction sent! Please check your wallet.', { id: 'approve' });
      }

      toast.loading('Step 2/2: Depositing to HyperLoops…', { id: 'deposit' });
      // Provide a friendly readable description via toast and rely on wallet's UI
      const depositHash = await writeContract({
        address: contractAddress as `0x${string}`,
        abi: NO_LOSS_LOTTERY_ABI,
        functionName: 'depositWHYPE',
        args: [amountWei],
      }) as unknown as Hash;
      
      try {
        if (publicClient) {
          await publicClient.waitForTransactionReceipt({ hash: depositHash as `0x${string}` });
        }
        toast.success('Deposit confirmed on-chain', { id: 'deposit' });
      } catch (receiptError) {
        console.warn('Transaction receipt failed, but transaction was sent:', receiptError);
        toast.success('Deposit transaction sent! Please check your wallet.', { id: 'deposit' });
      }
      // Refresh all reads
      refetchAll();
      return depositHash;
    } catch (error) {
      console.error('Deposit failed:', error);
      const message = (error as Error).message || '';
      if (message.toLowerCase().includes('insufficient funds')) {
        toast.error('Insufficient HYPE for gas on this network');
      } else if (message.toLowerCase().includes('user rejected')) {
        toast.error('Transaction rejected');
      } else {
        toast.error('Deposit failed: ' + message);
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [contractAddress, tokenAddress, address, writeContract, publicClient, refetchAll]);

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
      }) as unknown as Hash;

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: hash as `0x${string}` });
      }
      toast.success('Withdrawal confirmed!');
      refetchAll();
      return hash;
    } catch (error) {
      console.error('Withdrawal failed:', error);
      toast.error('Withdrawal failed: ' + (error as Error).message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [contractAddress, address, writeContract, publicClient, refetchAll]);

  const harvest = useCallback(async () => {
    if (!contractAddress) return;
    try {
      setIsLoading(true);
      toast.loading('Harvesting yield...', { id: 'harvest' });
      
      const tx = await writeContract({
        address: contractAddress as `0x${string}`,
        abi: NO_LOSS_LOTTERY_ABI,
        functionName: 'harvestYield',
        args: [],
      }) as unknown as Hash;
      
      if (publicClient && tx) {
        toast.loading('Waiting for confirmation...', { id: 'harvest' });
        try {
          await publicClient.waitForTransactionReceipt({ 
            hash: tx as `0x${string}`,
            timeout: 60000 // 60 second timeout
          });
          toast.success('Yield harvested successfully!', { id: 'harvest' });
        } catch (receiptError) {
          // Transaction might still be successful even if receipt fails
          console.warn('Transaction receipt failed, but transaction was sent:', receiptError);
          toast.success('Harvest transaction sent! Please check your wallet.', { id: 'harvest' });
        }
      } else {
        toast.success('Harvest transaction sent!', { id: 'harvest' });
      }
      
      // Always refetch data after attempt
      refetchAll();
      return tx;
    } catch (error) {
      console.error('Harvest failed:', error);
      const message = (error as Error).message || '';
      if (message.toLowerCase().includes('user rejected')) {
        toast.error('Transaction rejected by user', { id: 'harvest' });
      } else {
        toast.error('Harvest failed: ' + message.slice(0, 100), { id: 'harvest' });
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [contractAddress, writeContract, publicClient, refetchAll]);

  const executeLottery = useCallback(async () => {
    if (!contractAddress) return;
    try {
      setIsLoading(true);
      toast.loading('Executing lottery...', { id: 'lottery-execute' });
      
      const tx = await writeContract({
        address: contractAddress as `0x${string}`,
        abi: NO_LOSS_LOTTERY_ABI,
        functionName: 'executeLottery',
        args: [],
      }) as unknown as Hash;
      
      toast.loading('Waiting for confirmation...', { id: 'lottery-execute' });
      
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: tx as `0x${string}` });
      }
      
      toast.success('Lottery executed successfully!', { id: 'lottery-execute' });
      refetchAll();
      return tx;
    } catch (error) {
      console.error('Execute lottery failed:', error);
      const message = (error as Error).message || '';
      if (message.toLowerCase().includes('user rejected')) {
        toast.error('Transaction rejected by user', { id: 'lottery-execute' });
      } else {
        toast.error('Lottery execution failed: ' + message.slice(0, 100), { id: 'lottery-execute' });
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [contractAddress, writeContract, publicClient, refetchAll]);

  // Format contract state for easy consumption
  const contractState: ContractState = {
    totalDeposits: totalDeposits || 0n,
    prizePool: prizePool || 0n,
    currentRound: currentRound || 0n,
    participantCount: Number(participantCount || 0n),
    nextLotteryTime: nextLotteryTime || 0n,
    lastHarvestTime: lastHarvestTime || 0n,
  };

  const formattedUserInfo: UserInfo | null = userInfo ? {
    depositAmount: (userInfo as unknown as readonly [bigint, bigint])[0],
    depositTime: 0n,
    tickets: (userInfo as unknown as readonly [bigint, bigint])[1],
    lastTicketUpdate: 0n,
  } : null;

  // Derived values
  const liquidityRate = reserveData ? (reserveData as unknown as readonly [
    bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, number
  ])[3] : 0n; // liquidityRate in 1e18 (APY)

  const expected24hReturn = formattedUserInfo
    ? (formattedUserInfo.depositAmount * liquidityRate) / BigInt(1e18) / BigInt(365)
    : 0n;

  const winProbabilityBps = ((): bigint => {
    if (!formattedUserInfo) return 0n;
    const userT = formattedUserInfo.tickets;
    const totalT = totalTickets || 0n;
    if (!userT || !totalT) return 0n;
    return (userT * 10000n) / totalT; // basis points
  })();

  return {
    // Contract data
    contractState,
    userInfo: formattedUserInfo,
    accruedYield: accruedYield || 0n,
    isLotteryReady: isLotteryReady || false,
    liquidityRate,
    
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
      userAllocationBps: userAllocBps ? String(userAllocBps) : '10000',
      totalTickets: totalTickets ? String(totalTickets) : '0',
      expected24hReturn: expected24hReturn ? formatEther(expected24hReturn) : '0',
      winProbabilityPercent: ((Number(winProbabilityBps || 0n) / 100).toFixed(2)),
    },
  };
};