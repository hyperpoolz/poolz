import { useState, useEffect } from 'react';
import { 
  fetchCurrentInterestRates, 
  fetchMarketData, 
  calculateExpected24hReturn,
  fetchUserValueChange,
  getMockData,
  type InterestRateData,
  type MarketData,
  type UserValueChange
} from '../utils/hyperlend-api';

// wHYPE token address on Hyperliquid (this should be replaced with actual address)
const WHYPE_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000'; // Placeholder

export interface HyperLendData {
  interestRates: InterestRateData | null;
  marketData: MarketData | null;
  currentAPY: number;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export interface UserHyperLendData {
  valueChange: UserValueChange | null;
  expectedReturn: { expectedReturn: number; apy: number } | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to fetch general HyperLend market data
 */
export function useHyperLendData(): HyperLendData {
  const [data, setData] = useState<HyperLendData>({
    interestRates: null,
    marketData: null,
    currentAPY: 0,
    isLoading: true,
    error: null,
    lastUpdated: null
  });

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setData(prev => ({ ...prev, isLoading: true, error: null }));

        // Try to fetch real data first
        const [rateData, marketData] = await Promise.all([
          fetchCurrentInterestRates(WHYPE_TOKEN_ADDRESS),
          fetchMarketData(WHYPE_TOKEN_ADDRESS)
        ]);

        if (isMounted) {
          // If API calls fail, use mock data
          if (!rateData && !marketData) {
            console.warn('HyperLend API unavailable, using mock data');
            const mockData = getMockData();
            
            setData({
              interestRates: mockData.interestRate,
              marketData: mockData.marketData,
              currentAPY: 12.3, // Mock APY
              isLoading: false,
              error: null,
              lastUpdated: new Date()
            });
          } else {
            // Calculate APY from rate data
            let apy = 12.3; // Default fallback
            if (rateData?.currentLiquidityRate) {
              apy = (parseFloat(rateData.currentLiquidityRate) / 1e18) * 100;
            }

            setData({
              interestRates: rateData,
              marketData: marketData,
              currentAPY: apy,
              isLoading: false,
              error: null,
              lastUpdated: new Date()
            });
          }
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error fetching HyperLend data:', error);
          
          // Fallback to mock data on error
          const mockData = getMockData();
          setData({
            interestRates: mockData.interestRate,
            marketData: mockData.marketData,
            currentAPY: 12.3,
            isLoading: false,
            error: 'Using mock data - API unavailable',
            lastUpdated: new Date()
          });
        }
      }
    };

    fetchData();

    // Set up polling for real-time updates (every 5 minutes)
    const interval = setInterval(fetchData, 5 * 60 * 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return data;
}

/**
 * Hook to fetch user-specific HyperLend data
 */
export function useUserHyperLendData(userAddress: string | undefined, depositAmount: number = 0): UserHyperLendData {
  const [data, setData] = useState<UserHyperLendData>({
    valueChange: null,
    expectedReturn: null,
    isLoading: false,
    error: null
  });

  useEffect(() => {
    if (!userAddress || depositAmount <= 0) {
      setData({
        valueChange: null,
        expectedReturn: null,
        isLoading: false,
        error: null
      });
      return;
    }

    let isMounted = true;

    const fetchUserData = async () => {
      try {
        setData(prev => ({ ...prev, isLoading: true, error: null }));

        const [valueChange, expectedReturn] = await Promise.all([
          fetchUserValueChange(userAddress),
          calculateExpected24hReturn(depositAmount, WHYPE_TOKEN_ADDRESS)
        ]);

        if (isMounted) {
          // Provide fallback data if API is unavailable
          const mockData = getMockData();
          
          setData({
            valueChange: valueChange || { tokenValue: '0', usdValue: '0' },
            expectedReturn: expectedReturn || mockData.expectedReturn(depositAmount),
            isLoading: false,
            error: valueChange === null && expectedReturn === null ? 'Using mock data - API unavailable' : null
          });
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error fetching user HyperLend data:', error);
          
          // Fallback to mock calculation
          const mockData = getMockData();
          setData({
            valueChange: { tokenValue: '0', usdValue: '0' },
            expectedReturn: mockData.expectedReturn(depositAmount),
            isLoading: false,
            error: 'Using mock data - API unavailable'
          });
        }
      }
    };

    fetchUserData();

    return () => {
      isMounted = false;
    };
  }, [userAddress, depositAmount]);

  return data;
}

/**
 * Utility function to format APY percentage
 */
export function formatAPY(apy: number): string {
  return `${apy.toFixed(1)}%`;
}

/**
 * Utility function to format token amounts
 */
export function formatTokenAmount(amount: number, decimals: number = 2): string {
  if (amount < 0.001) return '< 0.001';
  return amount.toFixed(decimals);
}

/**
 * Utility function to calculate daily return from APY
 */
export function calculateDailyReturn(amount: number, apy: number): number {
  return (amount * apy) / (100 * 365);
}