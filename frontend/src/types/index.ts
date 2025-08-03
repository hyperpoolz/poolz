// Core types for HyperLoops application

export interface UserInfo {
  depositAmount: bigint;
  depositTime: bigint;
  tickets: bigint;
  lastTicketUpdate: bigint;
}

export interface ContractState {
  totalDeposits: bigint;
  prizePool: bigint;
  currentRound: bigint;
  participantCount: number;
  nextLotteryTime: bigint;
  lastHarvestTime: bigint;
}

export interface LotteryResult {
  round: number;
  winner: string;
  prize: string;
  timestamp: number;
  totalParticipants: number;
  totalTickets: number;
  randomSeed: string;
}

export interface PoolStats {
  totalDeposits: string;
  currentAPY: number;
  participantCount: number;
  prizePool: string;
  nextLotteryTime: number;
  totalTickets: number;
  averageDepositTime: number;
}

export interface WalletState {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  chainId: number | null;
  balance: string;
  wHYPEBalance: string;
}

export interface TransactionState {
  id: string;
  type: 'deposit' | 'withdraw' | 'harvest' | 'lottery';
  status: 'pending' | 'confirmed' | 'failed' | 'cancelled';
  hash?: string;
  timestamp: number;
  amount?: string;
  gasUsed?: number;
  error?: string;
}

// Contract addresses
export interface ContractAddresses {
  hyperLendPool: string;
  dataProvider: string;
  wHYPE: string;
  noLossLottery: string;
}

// Network configuration
export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  blockExplorer?: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}