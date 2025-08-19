import { useState, useCallback, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, usePublicClient } from 'wagmi';
import { parseEther, formatEther, type Hash } from 'viem';
import toast from 'react-hot-toast';

// V2 Contract Address (from deployment)
const V2_CONTRACT_ADDRESS = '0x79A84DB1F6A1C3a303A49120720b81EAdD177F7d';
const WHYPE_TOKEN_ADDRESS = '0x5555555555555555555555555555555555555555';

// Minimal ERC20 ABI for approvals
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
] as const;

// NoLossLotteryV2Micro ABI - based on the contract
const V2_LOTTERY_ABI = [
  // Constants
  { name: 'TICKET_UNIT', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'LOTTERY_INTERVAL', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'HARVEST_INTERVAL', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'DRAW_BLOCKS_DELAY', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'INCENTIVE_BPS', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  
  // State variables
  { name: 'totalDeposits', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'prizePool', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'lastHarvestTime', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'currentRound', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'totalTickets', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  
  // Round data
  { name: 'rounds', type: 'function', stateMutability: 'view', inputs: [{ name: '', type: 'uint256' }], outputs: [
    { name: 'endTime', type: 'uint256' },
    { name: 'drawBlock', type: 'uint256' },
    { name: 'totalTickets', type: 'uint256' },
    { name: 'prizeAmount', type: 'uint256' },
    { name: 'winner', type: 'address' },
    { name: 'state', type: 'uint8' }
  ]},
  
  // User data
  { name: 'deposits', type: 'function', stateMutability: 'view', inputs: [{ name: '', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'tickets', type: 'function', stateMutability: 'view', inputs: [{ name: '', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'roundTickets', type: 'function', stateMutability: 'view', inputs: [{ name: '', type: 'uint256' }, { name: '', type: 'address' }], outputs: [{ type: 'uint256' }] },
  
  // Participants
  { name: 'participants', type: 'function', stateMutability: 'view', inputs: [{ name: '', type: 'uint256' }], outputs: [{ type: 'address' }] },
  { name: 'roundParticipants', type: 'function', stateMutability: 'view', inputs: [{ name: '', type: 'uint256' }, { name: '', type: 'uint256' }], outputs: [{ type: 'address' }] },
  { name: 'isParticipant', type: 'function', stateMutability: 'view', inputs: [{ name: '', type: 'address' }], outputs: [{ type: 'bool' }] },
  
  // Write functions
  { name: 'depositWHYPE', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'amount', type: 'uint256' }], outputs: [] },
  { name: 'withdraw', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'amount', type: 'uint256' }], outputs: [] },
  { name: 'harvestYield', type: 'function', stateMutability: 'nonpayable', inputs: [], outputs: [] },
  { name: 'closeRound', type: 'function', stateMutability: 'nonpayable', inputs: [], outputs: [] },
  { name: 'finalizeRound', type: 'function', stateMutability: 'nonpayable', inputs: [], outputs: [] },
  
  // Events
  { name: 'Deposited', type: 'event', inputs: [
    { name: 'user', type: 'address', indexed: true },
    { name: 'amount', type: 'uint256', indexed: false },
    { name: 'newTickets', type: 'uint256', indexed: false }
  ]},
  { name: 'Withdrawn', type: 'event', inputs: [
    { name: 'user', type: 'address', indexed: true },
    { name: 'amount', type: 'uint256', indexed: false },
    { name: 'burnedTickets', type: 'uint256', indexed: false }
  ]},
  { name: 'YieldHarvested', type: 'event', inputs: [
    { name: 'yieldAmount', type: 'uint256', indexed: false },
    { name: 'prizePoolIncrease', type: 'uint256', indexed: false },
    { name: 'caller', type: 'address', indexed: true },
    { name: 'incentive', type: 'uint256', indexed: false }
  ]},
  { name: 'RoundClosed', type: 'event', inputs: [
    { name: 'round', type: 'uint256', indexed: true },
    { name: 'endTime', type: 'uint256', indexed: false },
    { name: 'drawBlock', type: 'uint256', indexed: false },
    { name: 'totalTickets', type: 'uint256', indexed: false }
  ]},
  { name: 'RoundFinalized', type: 'event', inputs: [
    { name: 'round', type: 'uint256', indexed: true },
    { name: 'winner', type: 'address', indexed: true },
    { name: 'prizeAmount', type: 'uint256', indexed: false },
    { name: 'randomNumber', type: 'uint256', indexed: false }
  ]},
] as const;

// Round state enum
enum RoundState {
  Active = 0,
  Closed = 1,
  Finalized = 2
}

export interface V2ContractData {
  // Constants
  ticketUnit: bigint;
  lotteryInterval: bigint; 
  harvestInterval: bigint;
  drawBlocksDelay: bigint;
  incentiveBps: bigint;
  
  // State
  totalDeposits: bigint;
  prizePool: bigint;
  lastHarvestTime: bigint;
  currentRound: bigint;
  totalTickets: bigint;
  
  // Current round data
  currentRoundData: {
    endTime: bigint;
    drawBlock: bigint;
    totalTickets: bigint;
    prizeAmount: bigint;
    winner: string;
    state: RoundState;
  };
  
  // User data
  userDeposit: bigint;
  userTickets: bigint;
  userRoundTickets: bigint;
  isUserParticipant: boolean;
  
  // Derived values
  participantCount: number;
  timeToNextDraw: number;
  canHarvest: boolean;
  canCloseRound: boolean;
  canFinalizeRound: boolean;
  userWinProbability: number;
}

export const useContractV2 = () => {
  const { address } = useAccount();
  const { writeContract } = useWriteContract();
  const publicClient = usePublicClient();
  const [isLoading, setIsLoading] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);

  // Read contract constants
  const { data: ticketUnit } = useReadContract({
    address: V2_CONTRACT_ADDRESS,
    abi: V2_LOTTERY_ABI,
    functionName: 'TICKET_UNIT',
  });

  const { data: lotteryInterval } = useReadContract({
    address: V2_CONTRACT_ADDRESS,
    abi: V2_LOTTERY_ABI,
    functionName: 'LOTTERY_INTERVAL',
  });

  const { data: harvestInterval } = useReadContract({
    address: V2_CONTRACT_ADDRESS,
    abi: V2_LOTTERY_ABI,
    functionName: 'HARVEST_INTERVAL',
  });

  const { data: drawBlocksDelay } = useReadContract({
    address: V2_CONTRACT_ADDRESS,
    abi: V2_LOTTERY_ABI,
    functionName: 'DRAW_BLOCKS_DELAY',
  });

  const { data: incentiveBps } = useReadContract({
    address: V2_CONTRACT_ADDRESS,
    abi: V2_LOTTERY_ABI,
    functionName: 'INCENTIVE_BPS',
  });

  // Read state variables
  const { data: totalDeposits, refetch: refetchTotalDeposits } = useReadContract({
    address: V2_CONTRACT_ADDRESS,
    abi: V2_LOTTERY_ABI,
    functionName: 'totalDeposits',
  });

  const { data: prizePool, refetch: refetchPrizePool } = useReadContract({
    address: V2_CONTRACT_ADDRESS,
    abi: V2_LOTTERY_ABI,
    functionName: 'prizePool',
  });

  const { data: lastHarvestTime, refetch: refetchLastHarvestTime } = useReadContract({
    address: V2_CONTRACT_ADDRESS,
    abi: V2_LOTTERY_ABI,
    functionName: 'lastHarvestTime',
  });

  const { data: currentRound, refetch: refetchCurrentRound } = useReadContract({
    address: V2_CONTRACT_ADDRESS,
    abi: V2_LOTTERY_ABI,
    functionName: 'currentRound',
  });

  const { data: totalTickets, refetch: refetchTotalTickets } = useReadContract({
    address: V2_CONTRACT_ADDRESS,
    abi: V2_LOTTERY_ABI,
    functionName: 'totalTickets',
  });

  // Read current round data
  const { data: currentRoundData, refetch: refetchRoundData } = useReadContract({
    address: V2_CONTRACT_ADDRESS as `0x${string}`,
    abi: V2_LOTTERY_ABI,
    functionName: 'rounds',
    args: currentRound ? [currentRound] : undefined,
    query: { enabled: !!currentRound },
  });

  // Read the actual deposit token address from the contract
  const { data: depositTokenAddress } = useReadContract({
    address: V2_CONTRACT_ADDRESS as `0x${string}`,
    abi: [{ name: 'depositToken', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] }],
    functionName: 'depositToken',
  });

  // Read user data
  const { data: userDeposit, refetch: refetchUserDeposit } = useReadContract({
    address: V2_CONTRACT_ADDRESS,
    abi: V2_LOTTERY_ABI,
    functionName: 'deposits',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: userTickets, refetch: refetchUserTickets } = useReadContract({
    address: V2_CONTRACT_ADDRESS,
    abi: V2_LOTTERY_ABI,
    functionName: 'tickets',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: userRoundTickets, refetch: refetchUserRoundTickets } = useReadContract({
    address: V2_CONTRACT_ADDRESS,
    abi: V2_LOTTERY_ABI,
    functionName: 'roundTickets',
    args: currentRound && address ? [currentRound, address] : undefined,
    query: { enabled: !!currentRound && !!address },
  });

  const { data: isUserParticipant, refetch: refetchIsUserParticipant } = useReadContract({
    address: V2_CONTRACT_ADDRESS,
    abi: V2_LOTTERY_ABI,
    functionName: 'isParticipant',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Fetch participant count by iterating through participants array
  useEffect(() => {
    const fetchParticipantCount = async () => {
      if (!publicClient) return;
      
      try {
        let count = 0;
        while (true) {
          try {
            await publicClient.readContract({
              address: V2_CONTRACT_ADDRESS,
              abi: V2_LOTTERY_ABI,
              functionName: 'participants',
              args: [BigInt(count)],
            });
            count++;
          } catch {
            break;
          }
        }
        setParticipantCount(count);
      } catch (error) {
        console.error('Failed to fetch participant count:', error);
      }
    };

    fetchParticipantCount();
  }, [publicClient, totalTickets]);

  const refetchAll = useCallback(() => {
    refetchTotalDeposits();
    refetchPrizePool();
    refetchLastHarvestTime();
    refetchCurrentRound();
    refetchTotalTickets();
    refetchRoundData();
    refetchUserDeposit();
    refetchUserTickets();
    refetchUserRoundTickets();
    refetchIsUserParticipant();
  }, [
    refetchTotalDeposits,
    refetchPrizePool,
    refetchLastHarvestTime,
    refetchCurrentRound,
    refetchTotalTickets,
    refetchRoundData,
    refetchUserDeposit,
    refetchUserTickets,
    refetchUserRoundTickets,
    refetchIsUserParticipant,
  ]);

  // Write functions
  const deposit = useCallback(async (amount: string) => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!depositTokenAddress) {
      toast.error('Contract not fully loaded yet, please wait...');
      return;
    }

    try {
      setIsLoading(true);
      const amountWei = parseEther(amount);
      
      console.log('Deposit attempt:', {
        amount,
        amountWei: amountWei.toString(),
        address,
        contractAddress: V2_CONTRACT_ADDRESS,
        tokenAddress: depositTokenAddress
      });

      // Step 1: Approve the actual deposit token
      toast.loading('Step 1/2: Approving tokens...', { id: 'approve' });
      
      try {
        const approveResult = await writeContract({
          address: depositTokenAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [V2_CONTRACT_ADDRESS as `0x${string}`, amountWei],
        });

        console.log('Approval result:', approveResult);
        
        // wagmi writeContract returns the hash directly or wrapped in result
        const approveHash = typeof approveResult === 'string' ? approveResult : approveResult?.hash || approveResult;
        console.log('Extracted approval hash:', approveHash);

        if (publicClient && approveHash) {
          toast.loading('Waiting for approval confirmation...', { id: 'approve' });
          await publicClient.waitForTransactionReceipt({ hash: approveHash as `0x${string}` });
        }
        toast.success('Approval confirmed', { id: 'approve' });
      } catch (approvalError) {
        console.error('Approval failed:', approvalError);
        
        // Check if it's a user rejection
        const errorMessage = (approvalError as Error).message || '';
        if (errorMessage.toLowerCase().includes('user rejected') || errorMessage.toLowerCase().includes('user denied')) {
          toast.error('Transaction rejected by user', { id: 'approve' });
        } else {
          toast.error('Approval failed: ' + errorMessage.slice(0, 100), { id: 'approve' });
        }
        throw approvalError;
      }

      // Step 2: Deposit
      toast.loading('Step 2/2: Depositing to HyperLoops V2...', { id: 'deposit' });
      
      try {
        const depositResult = await writeContract({
          address: V2_CONTRACT_ADDRESS as `0x${string}`,
          abi: V2_LOTTERY_ABI,
          functionName: 'depositWHYPE',
          args: [amountWei],
        });

        console.log('Deposit result:', depositResult);
        
        // wagmi writeContract returns the hash directly or wrapped in result
        const depositHash = typeof depositResult === 'string' ? depositResult : depositResult?.hash || depositResult;
        console.log('Extracted deposit hash:', depositHash);

        if (publicClient && depositHash) {
          toast.loading('Waiting for deposit confirmation...', { id: 'deposit' });
          await publicClient.waitForTransactionReceipt({ hash: depositHash as `0x${string}` });
        }
        toast.success('Deposit confirmed!', { id: 'deposit' });
        
        refetchAll();
        return depositHash;
      } catch (depositError) {
        console.error('Deposit transaction failed:', depositError);
        
        const errorMessage = (depositError as Error).message || '';
        if (errorMessage.toLowerCase().includes('user rejected') || errorMessage.toLowerCase().includes('user denied')) {
          toast.error('Transaction rejected by user', { id: 'deposit' });
        } else {
          toast.error('Deposit failed: ' + errorMessage.slice(0, 100), { id: 'deposit' });
        }
        throw depositError;
      }
    } catch (error) {
      console.error('Overall deposit failed:', error);
      const message = (error as Error).message || '';
      if (message.toLowerCase().includes('user rejected')) {
        toast.error('Transaction rejected');
      } else if (!message.includes('Approval failed') && !message.includes('Deposit failed')) {
        toast.error('Deposit failed: ' + message.slice(0, 50));
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [address, depositTokenAddress, writeContract, publicClient, refetchAll]);

  const withdraw = useCallback(async (amount: string) => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      setIsLoading(true);
      const amountWei = parseEther(amount);
      
      toast.loading('Withdrawing from HyperLoops V2...', { id: 'withdraw' });
      const hash = await writeContract({
        address: V2_CONTRACT_ADDRESS,
        abi: V2_LOTTERY_ABI,
        functionName: 'withdraw',
        args: [amountWei],
      }) as Hash;

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }
      toast.success('Withdrawal confirmed!', { id: 'withdraw' });
      
      refetchAll();
      return hash;
    } catch (error) {
      console.error('Withdrawal failed:', error);
      toast.error('Withdrawal failed: ' + (error as Error).message.slice(0, 50), { id: 'withdraw' });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [address, writeContract, publicClient, refetchAll]);

  const harvestYield = useCallback(async () => {
    try {
      setIsLoading(true);
      toast.loading('Harvesting yield...', { id: 'harvest' });
      
      const hash = await writeContract({
        address: V2_CONTRACT_ADDRESS,
        abi: V2_LOTTERY_ABI,
        functionName: 'harvestYield',
        args: [],
      }) as Hash;

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }
      toast.success('Yield harvested!', { id: 'harvest' });
      
      refetchAll();
      return hash;
    } catch (error) {
      console.error('Harvest failed:', error);
      toast.error('Harvest failed: ' + (error as Error).message.slice(0, 50), { id: 'harvest' });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [writeContract, publicClient, refetchAll]);

  const closeCurrentRound = useCallback(async () => {
    try {
      setIsLoading(true);
      toast.loading('Closing current round...', { id: 'close-round' });
      
      const hash = await writeContract({
        address: V2_CONTRACT_ADDRESS,
        abi: V2_LOTTERY_ABI,
        functionName: 'closeRound',
        args: [],
      }) as Hash;

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }
      toast.success('Round closed!', { id: 'close-round' });
      
      refetchAll();
      return hash;
    } catch (error) {
      console.error('Close round failed:', error);
      toast.error('Close round failed: ' + (error as Error).message.slice(0, 50), { id: 'close-round' });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [writeContract, publicClient, refetchAll]);

  const finalizeRound = useCallback(async () => {
    try {
      setIsLoading(true);
      toast.loading('Finalizing round...', { id: 'finalize-round' });
      
      const hash = await writeContract({
        address: V2_CONTRACT_ADDRESS,
        abi: V2_LOTTERY_ABI,
        functionName: 'finalizeRound',
        args: [],
      }) as Hash;

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }
      toast.success('Round finalized!', { id: 'finalize-round' });
      
      refetchAll();
      return hash;
    } catch (error) {
      console.error('Finalize round failed:', error);
      toast.error('Finalize round failed: ' + (error as Error).message.slice(0, 50), { id: 'finalize-round' });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [writeContract, publicClient, refetchAll]);

  // Derived values
  const currentTime = Math.floor(Date.now() / 1000);
  const currentRoundDataParsed = currentRoundData as unknown as [bigint, bigint, bigint, bigint, string, number] | undefined;
  
  const timeToNextDraw = currentRoundDataParsed ? 
    Math.max(0, Number(currentRoundDataParsed[0]) - currentTime) : 0;

  const canHarvest = lastHarvestTime ? 
    currentTime >= (Number(lastHarvestTime) + Number(harvestInterval || 0n)) : true;

  const canCloseRound = currentRoundDataParsed ? 
    currentTime >= Number(currentRoundDataParsed[0]) && currentRoundDataParsed[5] === RoundState.Active : false;

  const canFinalizeRound = currentRoundDataParsed ? 
    currentRoundDataParsed[5] === RoundState.Closed : false;

  const userWinProbability = userTickets && totalTickets && totalTickets > 0n ? 
    (Number(userTickets) / Number(totalTickets)) * 100 : 0;

  const contractData: V2ContractData = {
    // Constants
    ticketUnit: ticketUnit || 0n,
    lotteryInterval: lotteryInterval || 0n,
    harvestInterval: harvestInterval || 0n,
    drawBlocksDelay: drawBlocksDelay || 0n,
    incentiveBps: incentiveBps || 0n,
    
    // State
    totalDeposits: totalDeposits || 0n,
    prizePool: prizePool || 0n,
    lastHarvestTime: lastHarvestTime || 0n,
    currentRound: currentRound || 0n,
    totalTickets: totalTickets || 0n,
    
    // Current round
    currentRoundData: {
      endTime: currentRoundDataParsed?.[0] || 0n,
      drawBlock: currentRoundDataParsed?.[1] || 0n,
      totalTickets: currentRoundDataParsed?.[2] || 0n,
      prizeAmount: currentRoundDataParsed?.[3] || 0n,
      winner: currentRoundDataParsed?.[4] || '0x0',
      state: currentRoundDataParsed?.[5] || RoundState.Active,
    },
    
    // User data
    userDeposit: userDeposit || 0n,
    userTickets: userTickets || 0n,
    userRoundTickets: userRoundTickets || 0n,
    isUserParticipant: isUserParticipant || false,
    
    // Derived
    participantCount,
    timeToNextDraw,
    canHarvest,
    canCloseRound,
    canFinalizeRound,
    userWinProbability,
  };

  return {
    contractData,
    isLoading,
    depositTokenAddress,
    
    // Functions
    deposit,
    withdraw,
    harvestYield,
    closeCurrentRound,
    finalizeRound,
    refetchAll,
    
    // Formatters
    formatters: {
      prizePool: formatEther(contractData.prizePool),
      totalDeposits: formatEther(contractData.totalDeposits),
      userDeposit: formatEther(contractData.userDeposit),
      userTickets: contractData.userTickets.toString(),
      totalTickets: contractData.totalTickets.toString(),
      ticketUnit: formatEther(contractData.ticketUnit),
      userWinProbability: contractData.userWinProbability.toFixed(2),
    },
  };
};