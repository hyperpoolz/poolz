import { useEffect, useState, useCallback } from 'react';
import { Address } from 'viem';
import { contractAddresses, V2_LOTTERY_ABI } from '@/lib/contracts';
import { publicClient } from '@/lib/wallet';

export interface UserData {
  userDeposit: bigint;
  userTickets: bigint;
}

const initialState: UserData = {
  userDeposit: BigInt(0),
  userTickets: BigInt(0),
};

export function useUserData(address: Address | null) {
  const [data, setData] = useState<UserData>(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserData = useCallback(async () => {
    if (!address) {
      setData(initialState);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [userInfo, userTickets] = await Promise.all([
        publicClient.readContract({
          address: contractAddresses.lotteryContract as Address,
          abi: V2_LOTTERY_ABI,
          functionName: "getUserInfo",
          args: [address],
        }) as Promise<[bigint, bigint]>,
        publicClient.readContract({
          address: contractAddresses.lotteryContract as Address,
          abi: V2_LOTTERY_ABI,
          functionName: "tickets",
          args: [address],
        }) as Promise<bigint>,
      ]);

      setData({
        userDeposit: userInfo[0],
        userTickets,
      });
    } catch (err) {
      console.error('User data fetch error:', err);
      setError('Failed to fetch user data');
      setData(initialState);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchUserData();
    if (!address) return;
    
    const interval = setInterval(fetchUserData, 8000);
    return () => clearInterval(interval);
  }, [fetchUserData, address]);

  return { data, loading, error, refetch: fetchUserData };
}