import { useState, useCallback, useEffect } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { formatEther } from 'viem';
import { CONTRACT_ADDRESSES } from '../utils/constants';
import { useContract } from './useContract';

export interface LotteryEvent {
  round: bigint;
  winner: string;
  prize: bigint;
  timestamp: bigint;
  blockNumber: bigint;
  transactionHash: string;
}

export interface ParticipantData {
  address: string;
  depositAmount: bigint;
  tickets: bigint;
  winProbability: number;
}

export interface AnalyticsData {
  lotteryHistory: LotteryEvent[];
  participants: ParticipantData[];
  lastWinner: LotteryEvent | null;
  totalParticipants: number;
  isLoading: boolean;
  error: string | null;
}

// ABI for reading events and participant data
const ANALYTICS_ABI = [
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
    name: 'participants',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'uint256' }],
    outputs: [{ type: 'address' }],
  },
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
    name: 'totalTickets',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
] as const;

export const useAnalytics = () => {
  const { chainId } = useAccount();
  const publicClient = usePublicClient();
  const { contractState } = useContract();
  
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    lotteryHistory: [],
    participants: [],
    lastWinner: null,
    totalParticipants: 0,
    isLoading: false,
    error: null,
  });

  const contractAddress = chainId ? CONTRACT_ADDRESSES[chainId]?.noLossLottery : '';

  const fetchLotteryHistory = useCallback(async () => {
    if (!publicClient || !contractAddress) return;
    
    try {
      // Get lottery events from the last 100 blocks (adjust as needed)
      const currentBlock = await publicClient.getBlockNumber();
      const fromBlock = currentBlock - 10000n; // Look back ~1 day worth of blocks
      
      const logs = await publicClient.getLogs({
        address: contractAddress as `0x${string}`,
        event: {
          type: 'event',
          name: 'LotteryExecuted',
          inputs: [
            { name: 'winner', type: 'address', indexed: true },
            { name: 'prize', type: 'uint256', indexed: false },
            { name: 'round', type: 'uint256', indexed: false },
          ],
        },
        fromBlock,
        toBlock: 'latest',
      });

      const lotteryEvents: LotteryEvent[] = [];
      
      for (const log of logs) {
        if (log.args) {
          const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
          lotteryEvents.push({
            round: log.args.round as bigint,
            winner: log.args.winner as string,
            prize: log.args.prize as bigint,
            timestamp: block.timestamp,
            blockNumber: log.blockNumber,
            transactionHash: log.transactionHash,
          });
        }
      }

      // Sort by round descending (most recent first)
      lotteryEvents.sort((a, b) => Number(b.round - a.round));
      
      return lotteryEvents;
    } catch (error) {
      console.error('Error fetching lottery history:', error);
      return [];
    }
  }, [publicClient, contractAddress]);

  const fetchParticipants = useCallback(async () => {
    if (!publicClient || !contractAddress) {
      console.warn('Missing publicClient or contractAddress for fetchParticipants');
      return { participants: [], totalParticipants: 0 };
    }
    
    try {
      console.log('Fetching participants from contract:', contractAddress);
      
      // First get the total number of participants
      const participantCount = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: ANALYTICS_ABI,
        functionName: 'getParticipantCount',
      }) as bigint;

      console.log('Participant count from contract:', participantCount.toString());

      const totalTickets = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: ANALYTICS_ABI,
        functionName: 'totalTickets',
      }) as bigint;

      console.log('Total tickets from contract:', totalTickets.toString());

      const participants: ParticipantData[] = [];
      
      // Fetch each participant's data
      for (let i = 0; i < Number(participantCount); i++) {
        try {
          console.log(`Fetching participant ${i}/${Number(participantCount) - 1}`);
          
          // Get participant address
          const participantAddress = await publicClient.readContract({
            address: contractAddress as `0x${string}`,
            abi: ANALYTICS_ABI,
            functionName: 'participants',
            args: [BigInt(i)],
          }) as string;

          console.log(`Participant ${i} address:`, participantAddress);

          // Get participant's user data
          const userData = await publicClient.readContract({
            address: contractAddress as `0x${string}`,
            abi: ANALYTICS_ABI,
            functionName: 'users',
            args: [participantAddress],
          }) as readonly [bigint, bigint];

          const [depositAmount, tickets] = userData;
          
          console.log(`Participant ${i} data:`, {
            address: participantAddress,
            depositAmount: depositAmount.toString(),
            tickets: tickets.toString()
          });
          
          const winProbability = totalTickets > 0n 
            ? (Number(tickets) / Number(totalTickets)) * 100 
            : 0;

          participants.push({
            address: participantAddress,
            depositAmount,
            tickets,
            winProbability,
          });
        } catch (error) {
          console.error(`Error fetching participant ${i}:`, error);
        }
      }

      // Sort by deposit amount descending
      participants.sort((a, b) => Number(b.depositAmount - a.depositAmount));
      
      console.log('Final participants data:', participants);
      
      return { participants, totalParticipants: Number(participantCount) };
    } catch (error) {
      console.error('Error fetching participants:', error);
      return { participants: [], totalParticipants: 0 };
    }
  }, [publicClient, contractAddress]);

  const fetchAnalyticsData = useCallback(async () => {
    if (!publicClient || !contractAddress) return;
    
    setAnalyticsData(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const [lotteryHistory, participantData] = await Promise.all([
        fetchLotteryHistory(),
        fetchParticipants(),
      ]);

      const lastWinner = lotteryHistory.length > 0 ? lotteryHistory[0] : null;

      setAnalyticsData({
        lotteryHistory,
        participants: participantData.participants,
        lastWinner,
        totalParticipants: participantData.totalParticipants,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      setAnalyticsData(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch analytics data',
      }));
    }
  }, [publicClient, contractAddress, fetchLotteryHistory, fetchParticipants]);

  // Fetch data on mount and when contract changes
  useEffect(() => {
    if (contractAddress && publicClient) {
      fetchAnalyticsData();
    }
  }, [contractAddress, publicClient, fetchAnalyticsData]);

  return {
    ...analyticsData,
    refresh: fetchAnalyticsData,
    formatters: {
      formatAddress: (address: string) => 
        `${address.slice(0, 6)}...${address.slice(-4)}`,
      formatAmount: (amount: bigint) => 
        Number(formatEther(amount)).toFixed(4),
      formatDate: (timestamp: bigint) => 
        new Date(Number(timestamp) * 1000).toLocaleDateString(),
      formatDateTime: (timestamp: bigint) => 
        new Date(Number(timestamp) * 1000).toLocaleString(),
    },
  };
};