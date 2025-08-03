import { formatDistanceToNow, format } from 'date-fns';

/**
 * Format utilities for HyperLoops application
 */

// Number formatting
export const formatNumber = (value: number | string, decimals = 2): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0';
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

export const formatCompactNumber = (value: number | string): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0';
  
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(num);
};

// Currency formatting
export const formatCurrency = (
  value: number | string,
  symbol = 'wHYPE',
  decimals = 2
): string => {
  const formattedNumber = formatNumber(value, decimals);
  return `${formattedNumber} ${symbol}`;
};

export const formatCurrencyCompact = (
  value: number | string,
  symbol = 'wHYPE'
): string => {
  const formattedNumber = formatCompactNumber(value);
  return `${formattedNumber} ${symbol}`;
};

// Percentage formatting
export const formatPercentage = (value: number | string, decimals = 1): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0%';
  
  return `${formatNumber(num, decimals)}%`;
};

// Address formatting
export const truncateAddress = (
  address: string,
  startLength = 6,
  endLength = 4
): string => {
  if (!address || address.length < startLength + endLength) return address;
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
};

export const formatAddress = (address: string): string => {
  return truncateAddress(address, 6, 4);
};

// Time formatting
export const formatTimeDistance = (timestamp: number): string => {
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
};

export const formatDateTime = (timestamp: number): string => {
  return format(new Date(timestamp), 'MMM dd, yyyy HH:mm');
};

export const formatTimeRemaining = (futureTimestamp: number): string => {
  const now = Date.now();
  const diff = futureTimestamp - now;
  
  if (diff <= 0) return 'Now';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

// ETH/Wei formatting
export const formatEther = (wei: bigint, decimals = 4): string => {
  // Convert wei to ether (divide by 10^18)
  const ether = Number(wei) / 1e18;
  return formatNumber(ether, decimals);
};

export const formatWei = (ether: string | number): bigint => {
  const etherNum = typeof ether === 'string' ? parseFloat(ether) : ether;
  return BigInt(Math.floor(etherNum * 1e18));
};

// Transaction hash formatting
export const formatTxHash = (hash: string): string => {
  return truncateAddress(hash, 8, 6);
};

// APY formatting with trend indicators
export const formatAPY = (value: number, showTrend = false): string => {
  const formatted = formatPercentage(value, 1);
  if (!showTrend) return formatted;
  
  // Mock trend logic for demo
  const trend = value > 10 ? '↗️' : value > 5 ? '➡️' : '↘️';
  return `${formatted} ${trend}`;
};

// Prize pool formatting with visual indicators
export const formatPrizePool = (value: string | number): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (num > 1000) return `🏆 ${formatCurrencyCompact(num)}`;
  if (num > 100) return `🎯 ${formatCurrency(num)}`;
  return `🎲 ${formatCurrency(num)}`;
};

// Win probability formatting
export const formatWinProbability = (
  userTickets: number,
  totalTickets: number
): string => {
  if (totalTickets === 0) return '0%';
  const probability = (userTickets / totalTickets) * 100;
  return formatPercentage(probability, 2);
};

// Loading state formatters
export const formatLoadingText = (isLoading: boolean, text: string): string => {
  return isLoading ? `${text}...` : text;
};

// Error formatting
export const formatError = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unexpected error occurred';
};

// Validation helpers
export const isValidAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

export const isValidAmount = (amount: string): boolean => {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0;
};

// Theme utilities
export const getColorForValue = (
  value: number,
  thresholds: { low: number; medium: number }
): 'success' | 'warning' | 'error' => {
  if (value >= thresholds.medium) return 'success';
  if (value >= thresholds.low) return 'warning';
  return 'error';
};

export const getIconForStatus = (
  status: 'pending' | 'confirmed' | 'failed'
): string => {
  switch (status) {
    case 'pending': return '⏳';
    case 'confirmed': return '✅';
    case 'failed': return '❌';
    default: return '⚪';
  }
};