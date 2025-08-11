/**
 * HyperLend API integration for fetching expected returns and market data
 */

const HYPERLEND_API_BASE = 'https://api.hyperlend.finance';
const HYPERLIQUID_CHAIN = 'hyperliquid'; // Chain identifier for HyperLend API

// Type definitions based on HyperLend API documentation
export interface InterestRateData {
  timestamp: number;
  currentLiquidityRate: string;
  currentVariableBorrowRate: string;
}

export interface UserValueChange {
  tokenValue: string;
  usdValue: string;
}

export interface MarketData {
  liquidityRate: string;
  variableBorrowRate: string;
  totalSupply: string;
  totalBorrow: string;
  utilizationRate: string;
}

export interface UserHistoricalNetWorth {
  timestamp: number;
  usdValue: string;
}

/**
 * Fetch current interest rates for wHYPE token
 */
export async function fetchCurrentInterestRates(tokenAddress: string): Promise<InterestRateData | null> {
  try {
    const response = await fetch(
      `${HYPERLEND_API_BASE}/data/interestRateHistory?chain=${HYPERLIQUID_CHAIN}&token=${tokenAddress}&limit=1`
    );
    
    if (!response.ok) {
      console.warn('Failed to fetch interest rates:', response.statusText);
      return null;
    }
    
    const data = await response.json();
    return data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Error fetching interest rates:', error);
    return null;
  }
}

/**
 * Fetch user's 24-hour value change
 */
export async function fetchUserValueChange(userAddress: string): Promise<UserValueChange | null> {
  try {
    const response = await fetch(
      `${HYPERLEND_API_BASE}/data/user/valueChange?address=${userAddress}&chain=${HYPERLIQUID_CHAIN}`
    );
    
    if (!response.ok) {
      console.warn('Failed to fetch user value change:', response.statusText);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching user value change:', error);
    return null;
  }
}

/**
 * Fetch current market data for wHYPE
 */
export async function fetchMarketData(tokenAddress: string): Promise<MarketData | null> {
  try {
    const response = await fetch(
      `${HYPERLEND_API_BASE}/data/markets?chain=${HYPERLIQUID_CHAIN}`
    );
    
    if (!response.ok) {
      console.warn('Failed to fetch market data:', response.statusText);
      return null;
    }
    
    const markets = await response.json();
    // Find the market for our token
    const market = markets.find((m: any) => m.asset?.toLowerCase() === tokenAddress.toLowerCase());
    
    return market || null;
  } catch (error) {
    console.error('Error fetching market data:', error);
    return null;
  }
}

/**
 * Calculate expected 24-hour return based on current interest rates and deposit amount
 */
export async function calculateExpected24hReturn(
  depositAmount: number,
  tokenAddress: string
): Promise<{ expectedReturn: number; apy: number } | null> {
  try {
    const rateData = await fetchCurrentInterestRates(tokenAddress);
    if (!rateData) {
      return null;
    }
    
    // Convert rate from wei/ray format to percentage (assuming 18 decimals)
    const annualRate = parseFloat(rateData.currentLiquidityRate) / 1e18;
    const dailyRate = annualRate / 365;
    const expectedReturn = depositAmount * dailyRate;
    
    return {
      expectedReturn,
      apy: annualRate * 100 // Convert to percentage
    };
  } catch (error) {
    console.error('Error calculating expected return:', error);
    return null;
  }
}

/**
 * Fetch historical net worth for a user
 */
export async function fetchUserHistoricalNetWorth(userAddress: string): Promise<UserHistoricalNetWorth[] | null> {
  try {
    const response = await fetch(
      `${HYPERLEND_API_BASE}/data/user/historicalNetWorth?address=${userAddress}&chain=${HYPERLIQUID_CHAIN}`
    );
    
    if (!response.ok) {
      console.warn('Failed to fetch user historical net worth:', response.statusText);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching user historical net worth:', error);
    return null;
  }
}

/**
 * Mock data for development/demo purposes when API is unavailable
 */
export const getMockData = () => ({
  interestRate: {
    timestamp: Date.now(),
    currentLiquidityRate: '123000000000000000', // ~12.3% APY in wei
    currentVariableBorrowRate: '156000000000000000'
  },
  expectedReturn: (depositAmount: number) => ({
    expectedReturn: depositAmount * 0.123 / 365, // Daily return at 12.3% APY
    apy: 12.3
  }),
  marketData: {
    liquidityRate: '123000000000000000',
    variableBorrowRate: '156000000000000000',
    totalSupply: '1750000000000000000000', // 1750 wHYPE
    totalBorrow: '875000000000000000000', // 875 wHYPE
    utilizationRate: '500000000000000000' // 50%
  }
});

/**
 * Hook for using HyperLend data with fallback to mock data
 */
export const useHyperLendData = () => {
  const [isLoading, setIsLoading] = React.useState(false);
  
  const fetchWithFallback = async <T>(
    apiCall: () => Promise<T | null>,
    fallback: T
  ): Promise<T> => {
    setIsLoading(true);
    try {
      const result = await apiCall();
      return result || fallback;
    } catch (error) {
      console.warn('API call failed, using mock data:', error);
      return fallback;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    isLoading,
    fetchWithFallback
  };
};

// Re-export React for the hook
import React from 'react';