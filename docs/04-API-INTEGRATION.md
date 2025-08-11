# API Integration Documentation

## 📋 Overview

HyperLoops integrates with multiple APIs and services to provide a seamless user experience. The primary integrations include blockchain connectivity, HyperLend protocol interaction, and external data sources.

## 🔗 Primary Integrations

### 1. Hyperliquid EVM Blockchain
Direct blockchain integration for smart contract interaction and transaction processing.

### 2. HyperLend Protocol  
Yield generation through Aave V3-compatible lending protocol on Hyperliquid.

### 3. Web3 Infrastructure
Wallet connectivity and transaction management through modern Web3 libraries.

## 🌐 Blockchain Integration

### RPC Endpoints

#### Hyperliquid EVM Mainnet
```typescript
const mainnetConfig = {
  chainId: 999,
  name: 'Hyperliquid EVM',
  rpcUrl: 'https://api.hyperliquid.xyz/evm',
  blockExplorer: 'https://explorer.hyperliquid.xyz',
};
```

#### Hyperliquid EVM Testnet
```typescript
const testnetConfig = {
  chainId: 998,  
  name: 'Hyperliquid EVM Testnet',
  rpcUrl: 'https://api.hyperliquid-testnet.xyz/evm',
  blockExplorer: 'https://explorer.hyperliquid-testnet.xyz',
};
```

### Web3 Library Stack

#### Wagmi Configuration
```typescript
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { hyperEVM, hyperEVMTestnet } from '../utils/chains';

export const wagmiConfig = getDefaultConfig({
  appName: 'HyperLoops - No-Loss Lottery',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID,
  chains: [hyperEVMTestnet, hyperEVM],
  ssr: true,
});
```

**Key Features:**
- Automatic chain switching
- Multiple wallet support
- Server-side rendering compatibility
- Connection persistence

#### Viem Integration
```typescript
import { formatUnits, parseUnits, type Hash } from 'viem';

// Type-safe contract interactions
const deposit = async (amount: string): Promise<Hash> => {
  const amountWei = parseUnits(amount, 18);
  return await writeContract({
    address: contractAddress as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'depositWHYPE',
    args: [amountWei],
  });
};
```

## 🏦 HyperLend Protocol Integration

### Protocol Architecture
HyperLend is built on Aave V3 architecture, providing:
- High-yield lending markets (5-20% APY)
- Deep liquidity pools
- Battle-tested smart contracts
- Instant deposits/withdrawals

### Core Contracts

#### Pool Contract (`IPool`)
**Address**: `0x00A89d7a5A02160f20150EbEA7a2b5E4879A1A8b`

```typescript
interface IPool {
  // Supply tokens to earn yield
  supply(
    asset: string,      // wHYPE token address
    amount: bigint,     // Amount to supply
    onBehalfOf: string, // Recipient address
    referralCode: number // Referral code (0)
  ): Promise<void>;

  // Withdraw tokens and earned yield
  withdraw(
    asset: string,  // wHYPE token address
    amount: bigint, // Amount to withdraw
    to: string      // Recipient address
  ): Promise<bigint>;

  // Get user account data
  getUserAccountData(user: string): Promise<{
    totalCollateralBase: bigint;
    totalDebtBase: bigint;
    availableBorrowsBase: bigint;
    currentLiquidationThreshold: bigint;
    ltv: bigint;
    healthFactor: bigint;
  }>;
}
```

#### Protocol Data Provider (`IProtocolDataProvider`)
**Address**: `0x5481bf8d3946E6A3168640c1D7523eB59F055a29`

```typescript
interface IProtocolDataProvider {
  // Get user's reserve data
  getUserReserveData(asset: string, user: string): Promise<{
    currentHTokenBalance: bigint;    // Current supply balance
    currentStableDebt: bigint;       // Stable debt amount
    currentVariableDebt: bigint;     // Variable debt amount
    principalStableDebt: bigint;     // Principal stable debt
    scaledVariableDebt: bigint;      // Scaled variable debt
    stableBorrowRate: bigint;        // Stable borrow rate
    liquidityRate: bigint;           // Current liquidity rate
    stableRateLastUpdated: number;   // Last update timestamp
    usageAsCollateralEnabled: boolean; // Collateral usage flag
  }>;

  // Get reserve data  
  getReserveData(asset: string): Promise<{
    availableLiquidity: bigint;      // Available liquidity
    totalStableDebt: bigint;         // Total stable debt
    totalVariableDebt: bigint;       // Total variable debt
    liquidityRate: bigint;           // Current liquidity rate
    variableBorrowRate: bigint;      // Variable borrow rate
    stableBorrowRate: bigint;        // Stable borrow rate
    averageStableBorrowRate: bigint; // Average stable rate
    liquidityIndex: bigint;          // Liquidity index
    variableBorrowIndex: bigint;     // Variable borrow index
    lastUpdateTimestamp: number;     // Last update time
  }>;
}
```

### Integration Implementation

#### Yield Calculation
```typescript
const getCurrentSupplyBalance = async (): Promise<bigint> => {
  const userData = await dataProvider.getUserReserveData(
    wHYPE_ADDRESS,
    CONTRACT_ADDRESS
  );
  return userData.currentHTokenBalance;
};

const getAccruedYield = async (): Promise<bigint> => {
  const currentBalance = await getCurrentSupplyBalance();
  const totalDeposits = await contract.totalDeposits();
  
  return currentBalance > totalDeposits 
    ? currentBalance - totalDeposits 
    : 0n;
};
```

#### Supply Operations
```typescript
const supplyToHyperLend = async (amount: bigint) => {
  // 1. Approve HyperLend Pool to spend wHYPE
  await wHYPEContract.approve(POOL_ADDRESS, amount);
  
  // 2. Supply tokens to earn yield
  await poolContract.supply(
    WHYPE_ADDRESS,      // Asset to supply
    amount,             // Amount to supply
    CONTRACT_ADDRESS,   // On behalf of our contract
    0                   // No referral code
  );
};
```

#### Withdrawal Operations
```typescript
const withdrawFromHyperLend = async (amount: bigint) => {
  // Withdraw specific amount (or max with type(uint256).max)
  const withdrawn = await poolContract.withdraw(
    WHYPE_ADDRESS,      // Asset to withdraw
    amount,             // Amount to withdraw
    CONTRACT_ADDRESS    // Withdraw to our contract
  );
  
  return withdrawn; // Actual amount withdrawn
};
```

## 🔐 Smart Contract Integration

### Contract ABIs

#### NoLossLottery ABI (Key Functions)
```typescript
export const NO_LOSS_LOTTERY_ABI = [
  // View Functions
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
    name: 'getUserInfo',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{
      type: 'tuple',
      components: [
        { name: 'depositAmount', type: 'uint256' },
        { name: 'depositTime', type: 'uint256' },
        { name: 'tickets', type: 'uint256' },
        { name: 'lastTicketUpdate', type: 'uint256' },
      ],
    }],
  },

  // Write Functions
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
    name: 'LotteryExecuted', 
    type: 'event',
    inputs: [
      { name: 'winner', type: 'address', indexed: true },
      { name: 'prize', type: 'uint256', indexed: false },
      { name: 'round', type: 'uint256', indexed: false },
    ],
  },
] as const;
```

### Contract Interaction Patterns

#### Read Operations
```typescript
import { useReadContract } from 'wagmi';

// Single contract read
const { data: totalDeposits } = useReadContract({
  address: contractAddress as `0x${string}`,
  abi: NO_LOSS_LOTTERY_ABI,
  functionName: 'totalDeposits',
  query: { enabled: !!contractAddress },
});

// User-specific data
const { data: userInfo } = useReadContract({
  address: contractAddress as `0x${string}`,
  abi: NO_LOSS_LOTTERY_ABI,
  functionName: 'getUserInfo',
  args: address ? [address] : undefined,
  query: { enabled: !!contractAddress && !!address },
});
```

#### Write Operations
```typescript
import { useWriteContract } from 'wagmi';

const { writeContract } = useWriteContract();

const deposit = async (amount: string) => {
  const amountWei = parseEther(amount);
  
  // Step 1: Approve wHYPE token
  await writeContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [contractAddress as `0x${string}`, amountWei],
  });
  
  // Step 2: Deposit to lottery
  const hash = await writeContract({
    address: contractAddress as `0x${string}`,
    abi: NO_LOSS_LOTTERY_ABI,
    functionName: 'depositWHYPE',
    args: [amountWei],
  });
  
  return hash;
};
```

## 📊 Data Management

### TanStack Query Integration

#### Cache Configuration
```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,      // 30 seconds
      gcTime: 5 * 60 * 1000,     // 5 minutes
      retry: 3,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  },
});
```

#### Data Fetching Patterns
```typescript
// Automatic refetching with Wagmi
const { data, refetch } = useReadContract({
  address: contractAddress,
  abi: CONTRACT_ABI,
  functionName: 'getTotalTickets',
  query: {
    enabled: !!contractAddress,
    refetchInterval: 30000, // 30 seconds
  },
});

// Manual refetch after operations
const handleDeposit = async (amount: string) => {
  await deposit(amount);
  
  // Refetch all contract data
  setTimeout(() => {
    refetchTotalDeposits();
    refetchUserInfo();
    refetchPrizePool();
  }, 2000);
};
```

### State Synchronization

#### Real-time Updates
```typescript
const useContract = () => {
  // Multiple read contracts
  const queries = [
    useReadContract({ /* totalDeposits */ }),
    useReadContract({ /* prizePool */ }),
    useReadContract({ /* userInfo */ }),
  ];

  // Bulk refetch function
  const refetchAll = useCallback(() => {
    queries.forEach(query => query.refetch());
  }, [queries]);

  return { refetchAll, ...otherData };
};
```

## 🛠️ Error Handling

### Contract Interaction Errors
```typescript
const deposit = async (amount: string) => {
  try {
    const hash = await writeContract({
      address: contractAddress,
      abi: CONTRACT_ABI,
      functionName: 'depositWHYPE',
      args: [parseEther(amount)],
    });
    
    toast.success('Deposit submitted successfully!');
    return hash;
    
  } catch (error) {
    console.error('Deposit failed:', error);
    
    if (error.message.includes('insufficient balance')) {
      toast.error('Insufficient wHYPE balance');
    } else if (error.message.includes('user rejected')) {
      toast.error('Transaction cancelled by user');
    } else {
      toast.error('Deposit failed: ' + error.message);
    }
    
    throw error;
  }
};
```

### Network Error Handling
```typescript
const handleNetworkError = (error: Error) => {
  if (error.message.includes('network')) {
    toast.error('Network connection failed. Please check your connection.');
  } else if (error.message.includes('timeout')) {
    toast.error('Request timed out. Please try again.');
  } else {
    toast.error('An unexpected error occurred.');
  }
};
```

## 🔄 Real-time Data Updates

### Event Listening (Future Enhancement)
```typescript
// Listen for contract events
const watchContractEvent = () => {
  return wagmiConfig.watchContractEvent({
    address: contractAddress,
    abi: CONTRACT_ABI,
    eventName: 'LotteryExecuted',
    onLogs(logs) {
      logs.forEach((log) => {
        const { winner, prize, round } = log.args;
        toast.success(`🎉 Lottery ${round} won by ${truncateAddress(winner)}!`);
        refetchAll(); // Update all data
      });
    },
  });
};
```

### Background Sync Strategy
```typescript
// Periodic background updates
useEffect(() => {
  const interval = setInterval(() => {
    if (document.visibilityState === 'visible') {
      refetchAll();
    }
  }, 30000); // 30 seconds

  return () => clearInterval(interval);
}, [refetchAll]);

// Refetch on window focus
useEffect(() => {
  const handleFocus = () => refetchAll();
  window.addEventListener('focus', handleFocus);
  return () => window.removeEventListener('focus', handleFocus);
}, [refetchAll]);
```

## 🚀 Performance Optimization

### Request Batching
```typescript
// Batch multiple contract reads
const useContractData = () => {
  const multicallContract = getContract({
    address: contractAddress,
    abi: CONTRACT_ABI,
    publicClient,
  });

  const batchedData = await multicallContract.multicall([
    { functionName: 'totalDeposits' },
    { functionName: 'prizePool' },
    { functionName: 'getParticipantCount' },
  ]);

  return {
    totalDeposits: batchedData[0],
    prizePool: batchedData[1], 
    participantCount: batchedData[2],
  };
};
```

### Caching Strategy
```typescript
// Aggressive caching for static data
const { data: contractConstants } = useReadContract({
  address: contractAddress,
  abi: CONTRACT_ABI,
  functionName: 'LOTTERY_INTERVAL',
  query: {
    staleTime: Infinity, // Never stale
    gcTime: Infinity,    // Never garbage collect
  },
});

// Short cache for dynamic data
const { data: prizePool } = useReadContract({
  address: contractAddress,
  abi: CONTRACT_ABI,
  functionName: 'prizePool',
  query: {
    staleTime: 10000,    // 10 seconds
    refetchInterval: 30000, // 30 seconds
  },
});
```

## 🔐 Security Considerations

### Input Validation
```typescript
const validateDepositAmount = (amount: string, balance: bigint): string | null => {
  const amountNum = parseFloat(amount);
  
  if (isNaN(amountNum) || amountNum <= 0) {
    return 'Amount must be greater than 0';
  }
  
  if (parseEther(amount) > balance) {
    return 'Insufficient balance';
  }
  
  return null; // Valid
};
```

### Transaction Simulation
```typescript
// Simulate transaction before execution
const simulateDeposit = async (amount: string) => {
  try {
    await publicClient.simulateContract({
      address: contractAddress,
      abi: CONTRACT_ABI,
      functionName: 'depositWHYPE',
      args: [parseEther(amount)],
      account: userAddress,
    });
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
```

## 📚 External Services

### HyperLend API (Future)
```typescript
// Fetch additional HyperLend data
const fetchHyperLendData = async () => {
  const response = await fetch('https://api.hyperlend.finance/reserves/wHYPE');
  return response.json();
};

const { data: hyperLendData } = useQuery({
  queryKey: ['hyperlend', 'whype'],
  queryFn: fetchHyperLendData,
  staleTime: 60000, // 1 minute
});
```

### Price Feeds (Future)
```typescript
// Get wHYPE price data
const fetchTokenPrice = async () => {
  const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=hyperliquid&vs_currencies=usd');
  return response.json();
};
```

---

**Next**: Learn about [Deployment](./05-DEPLOYMENT.md) and getting the protocol running.