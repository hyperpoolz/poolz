import { useEffect, useState, useCallback } from 'react';
import { Address } from 'viem';
import { contractAddresses, ERC20_ABI, V2_LOTTERY_ABI } from '@/lib/contracts';
import { publicClient } from '@/lib/wallet';

export interface ContractData {
  decimals: number;
  symbol: string;
  ticketUnit: bigint;
  totalTickets: bigint;
  prizePool: bigint;
  currentRound: bigint;
  timeLeft: number;
  canFinalizeRound: boolean;
  roundState: number;
  drawBlock: bigint;
  lastWinner: string | null;
  lastPrize: bigint;
  lastFinalizedRound: bigint;
  incentiveBps: number;
  lastUpdatedMs: number;
}

const initialState: ContractData = {
  decimals: 18,
  symbol: "wHYPE",
  ticketUnit: BigInt("100000000000000000"),
  totalTickets: BigInt(0),
  prizePool: BigInt(0),
  currentRound: BigInt(1),
  timeLeft: 0,
  canFinalizeRound: false,
  roundState: 0,
  drawBlock: BigInt(0),
  lastWinner: null,
  lastPrize: BigInt(0),
  lastFinalizedRound: BigInt(0),
  incentiveBps: 0,
  lastUpdatedMs: Date.now(),
};

export function useContractData() {
  const [data, setData] = useState<ContractData>(initialState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContractData = useCallback(async () => {
    try {
      setError(null);
      
      // Fetch basic token info (only once)
      const [decimals, symbol] = await Promise.all([
        publicClient.readContract({
          address: contractAddresses.depositToken as Address,
          abi: ERC20_ABI,
          functionName: "decimals",
        }) as Promise<number>,
        publicClient.readContract({
          address: contractAddresses.depositToken as Address,
          abi: ERC20_ABI,
          functionName: "symbol",
        }) as Promise<string>,
      ]);

      // Fetch lottery contract data
      const [ticketUnit, totalTickets, prizePool, roundInfo, incentiveBps] = await Promise.all([
        publicClient.readContract({
          address: contractAddresses.lotteryContract as Address,
          abi: V2_LOTTERY_ABI,
          functionName: "TICKET_UNIT",
        }) as Promise<bigint>,
        publicClient.readContract({
          address: contractAddresses.lotteryContract as Address,
          abi: V2_LOTTERY_ABI,
          functionName: "totalTickets",
        }) as Promise<bigint>,
        publicClient.readContract({
          address: contractAddresses.lotteryContract as Address,
          abi: V2_LOTTERY_ABI,
          functionName: "prizePool",
        }) as Promise<bigint>,
        publicClient.readContract({
          address: contractAddresses.lotteryContract as Address,
          abi: V2_LOTTERY_ABI,
          functionName: "getCurrentRoundInfo",
        }) as Promise<[bigint, bigint, boolean, boolean]>,
        publicClient.readContract({
          address: contractAddresses.lotteryContract as Address,
          abi: V2_LOTTERY_ABI,
          functionName: "INCENTIVE_BPS",
        }) as Promise<bigint>,
      ]);

      const currentRound = roundInfo[0];
      const timeLeft = Number(roundInfo[1]);
      const canFinalizeRound = Boolean(roundInfo[3]);

      // Get current round data
      let roundState = 0;
      let drawBlock = BigInt(0);
      try {
        const roundData = (await publicClient.readContract({
          address: contractAddresses.lotteryContract as Address,
          abi: V2_LOTTERY_ABI,
          functionName: "rounds",
          args: [currentRound],
        })) as any;
        
        drawBlock = (roundData?.[1] as bigint) ?? BigInt(0);
        roundState = Number(roundData?.[5] ?? 0);
      } catch {}

      // Get previous round winner info
      let lastWinner: string | null = null;
      let lastPrize = BigInt(0);
      let lastFinalizedRound = BigInt(0);
      
      try {
        if (currentRound > BigInt(1)) {
          const prev = (await publicClient.readContract({
            address: contractAddresses.lotteryContract as Address,
            abi: V2_LOTTERY_ABI,
            functionName: "getRoundInfo",
            args: [currentRound - BigInt(1)],
          })) as readonly [bigint, bigint, bigint, bigint, bigint, string, number, bigint];
          
          const prevState = Number(prev[6] || 0);
          if (prevState === 2) {
            lastFinalizedRound = currentRound - BigInt(1);
            lastWinner = prev[5];
            lastPrize = prev[4];
          }
        }
      } catch {}

      setData({
        decimals,
        symbol,
        ticketUnit,
        totalTickets,
        prizePool,
        currentRound,
        timeLeft,
        canFinalizeRound,
        roundState,
        drawBlock,
        lastWinner,
        lastPrize,
        lastFinalizedRound,
        incentiveBps: Number(incentiveBps),
        lastUpdatedMs: Date.now(),
      });

      setLoading(false);
    } catch (err) {
      console.error('Contract data fetch error:', err);
      setError('Failed to fetch contract data');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContractData();
    const interval = setInterval(fetchContractData, 8000);
    return () => clearInterval(interval);
  }, [fetchContractData]);

  return { data, loading, error, refetch: fetchContractData };
}