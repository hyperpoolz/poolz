# API Reference

## 📋 Overview

This document provides comprehensive API reference for the HyperLoops protocol, including smart contract functions, frontend hooks, and external integrations.

## 🔐 Smart Contract API

### NoLossLottery Contract

**Contract Address**: 
- Mainnet: `TBD`
- Testnet: `TBD`

#### Constructor

```solidity
constructor(
    address _hyperLendPool,    // 0x00A89d7a5A02160f20150EbEA7a2b5E4879A1A8b
    address _dataProvider,     // 0x5481bf8d3946E6A3168640c1D7523eB59F055a29
    address _depositToken      // 0x5555555555555555555555555555555555555555
)
```

**Parameters:**
- `_hyperLendPool`: Address of HyperLend Pool contract
- `_dataProvider`: Address of HyperLend Protocol Data Provider
- `_depositToken`: Address of wHYPE token

---

### View Functions

#### `totalDeposits() → uint256`

Returns the total amount of tokens deposited by all users.

**Returns:**
- `uint256`: Total deposits in wei

**Example:**
```javascript
const totalDeposits = await contract.totalDeposits();
console.log(`Total deposits: ${ethers.formatEther(totalDeposits)} wHYPE`);
```

---

#### `prizePool() → uint256`

Returns the current prize pool amount available for lottery distribution.

**Returns:**
- `uint256`: Prize pool amount in wei

---

#### `currentRound() → uint256`

Returns the current lottery round number.

**Returns:**
- `uint256`: Current round number (starts from 1)

---

#### `getParticipantCount() → uint256`

Returns the number of active participants in the lottery.

**Returns:**
- `uint256`: Number of participants

---

#### `getUserInfo(address user) → UserInfo`

Returns comprehensive information about a specific user.

**Parameters:**
- `user`: Address of the user

**Returns:**
- `UserInfo` struct containing:
  - `depositAmount` (uint256): User's total deposit
  - `depositTime` (uint256): Timestamp of latest deposit
  - `tickets` (uint256): Current lottery tickets
  - `lastTicketUpdate` (uint256): Last ticket update timestamp

**Example:**
```javascript
const userInfo = await contract.getUserInfo("0x123...");
console.log({
  deposit: ethers.formatEther(userInfo.depositAmount),
  tickets: userInfo.tickets.toString(),
  depositDate: new Date(userInfo.depositTime * 1000)
});
```

---

#### `getCurrentSupplyBalance() → uint256`

Returns the current hToken balance representing total supplied amount plus accrued interest.

**Returns:**
- `uint256`: Current supply balance in wei

---

#### `getAccruedYield() → uint256`

Calculates available yield as the difference between current supply balance and total deposits.

**Returns:**
- `uint256`: Accrued yield amount in wei

---

#### `isLotteryReady() → bool`

Checks if lottery can be executed based on time, participants, prize pool, and tickets.

**Returns:**
- `bool`: True if lottery can be executed

**Conditions:**
- Current time >= next lottery time
- At least one participant
- Prize pool > 0
- Total tickets > 0

---

#### `getTimeToNextLottery() → uint256`

Returns seconds until next lottery drawing.

**Returns:**
- `uint256`: Seconds remaining (0 if ready)

---

#### `getTotalTickets() → uint256`

Returns total active lottery tickets across all users.

**Returns:**
- `uint256`: Total tickets

---

#### `getUserTickets(address user) → uint256`

Returns lottery tickets for specific user.

**Parameters:**
- `user`: Address of the user

**Returns:**
- `uint256`: User's current tickets

---

#### `getRecentWinners(uint256 count) → (address[], uint256[], uint256[])`

Returns recent lottery winners with their prizes and timestamps.

**Parameters:**
- `count`: Number of recent winners to return

**Returns:**
- `address[]`: Winner addresses
- `uint256[]`: Prize amounts
- `uint256[]`: Win timestamps

**Example:**
```javascript
const [winners, prizes, timestamps] = await contract.getRecentWinners(5);
for (let i = 0; i < winners.length; i++) {
  console.log({
    winner: winners[i],
    prize: ethers.formatEther(prizes[i]),
    date: new Date(timestamps[i] * 1000)
  });
}
```

---

#### `getLifetimeStats() → (uint256, uint256, uint256, uint256, uint256)`

Returns comprehensive protocol statistics.

**Returns:**
- `uint256`: Total won lifetime
- `uint256`: Lifetime depositor count
- `uint256`: Current participant count
- `uint256`: Total managed funds
- `uint256`: Total tickets

---

### Write Functions

#### `depositWHYPE(uint256 amount)`

Deposits wHYPE tokens into the lottery protocol.

**Parameters:**
- `amount`: Amount of wHYPE to deposit (in wei)

**Requirements:**
- Contract not paused
- Amount > 0
- User has sufficient wHYPE balance
- User has approved contract to spend tokens

**Events Emitted:**
- `Deposited(user, amount, timestamp)`

**Example:**
```javascript
const amount = ethers.parseEther("100");

// 1. Approve contract to spend wHYPE
await wHYPEContract.approve(lotteryAddress, amount);

// 2. Deposit tokens
await lotteryContract.depositWHYPE(amount);
```

---

#### `withdraw(uint256 amount)`

Withdraws tokens from the lottery protocol.

**Parameters:**
- `amount`: Amount to withdraw (in wei)

**Requirements:**
- Contract not paused
- Amount > 0
- User has sufficient deposit balance

**Events Emitted:**
- `Withdrawn(user, amount, timestamp)`

**Example:**
```javascript
const amount = ethers.parseEther("50");
await lotteryContract.withdraw(amount);
```

---

#### `harvestYield()`

Harvests accumulated yield and distributes lottery tickets based on user allocations.

**Requirements:**
- Contract not paused
- Yield available to harvest

**Events Emitted:**
- `YieldHarvested(totalLotteryAmount, timestamp)`
- `TicketsUpdated(user, newTickets)` (per user)
- `PrizePoolUpdated(newAmount)`

---

#### `executeLottery()`

Executes the daily lottery drawing and distributes prizes.

**Requirements:**
- Contract not paused
- Time >= next lottery time
- At least one participant
- Prize pool > 0
- Total tickets > 0

**Events Emitted:**
- `LotteryExecuted(winner, prize, round)`

---

#### `setUserAllocationBps(uint16 bps)`

Sets user's yield allocation percentage to lottery vs auto-compound.

**Parameters:**
- `bps`: Basis points (0-10000, where 10000 = 100%)

**Requirements:**
- bps <= 10000

**Events Emitted:**
- `UserAllocationUpdated(user, allocationBps)`

**Examples:**
```javascript
// 100% to lottery (default)
await contract.setUserAllocationBps(10000);

// 50% to lottery, 50% auto-compound  
await contract.setUserAllocationBps(5000);

// 0% to lottery, 100% auto-compound
await contract.setUserAllocationBps(0);
```

---

### Admin Functions

#### `pause()` / `unpause()`

Emergency controls to halt/resume protocol operations.

**Access:** Owner only

---

#### `setFeeParameters(uint16 bps, address recipient)`

Sets protocol fee parameters.

**Parameters:**
- `bps`: Fee basis points (max 1000 = 10%)
- `recipient`: Fee recipient address

**Access:** Owner only

**Events Emitted:**
- `FeeParametersUpdated(bps, recipient)`

---

#### `fundPrizePool(uint256 amount)`

Seeds prize pool with additional tokens for promotions.

**Parameters:**
- `amount`: Amount of wHYPE to add to prize pool

**Access:** Owner only

**Events Emitted:**
- `PrizePoolFunded(amount, from)`
- `PrizePoolUpdated(newAmount)`

---

## 🌐 Frontend API

### Custom Hooks

#### `useContract()`

Primary hook for smart contract interaction.

**Returns:**
```typescript
interface UseContractReturn {
  // Contract state
  contractState: ContractState;
  userInfo: UserInfo | null;
  accruedYield: bigint;
  isLotteryReady: boolean;
  isPaused: boolean;
  totalTickets: bigint;
  
  // Functions
  deposit: (amount: string) => Promise<Hash>;
  withdraw: (amount: string) => Promise<Hash>;
  harvest: () => Promise<Hash>;
  executeLottery: () => Promise<Hash>;
  refetchAll: () => void;
  
  // Loading states
  isLoading: boolean;
  
  // Formatted helpers
  formatters: {
    totalDeposits: string;
    prizePool: string;
    accruedYield: string;
    userDeposit: string;
  };
}
```

**Example:**
```typescript
const {
  contractState,
  userInfo,
  deposit,
  withdraw,
  isLoading,
  formatters
} = useContract();

// Display formatted data
console.log(`Total deposits: ${formatters.totalDeposits} wHYPE`);

// Make deposit
const handleDeposit = async () => {
  try {
    await deposit("100");
    console.log("Deposit successful");
  } catch (error) {
    console.error("Deposit failed:", error);
  }
};
```

---

#### `useHyperLendData()`

Hook for fetching HyperLend protocol data.

**Returns:**
```typescript
interface UseHyperLendDataReturn {
  liquidityRate: bigint | null;
  utilizationRate: number | null;
  availableLiquidity: bigint | null;
  totalSupplied: bigint | null;
  isLoading: boolean;
  error: string | null;
}
```

---

### Utility Functions

#### `formatBalance(balance, decimals, precision)`

Formats token balances for display.

**Parameters:**
- `balance`: Token balance (bigint)
- `decimals`: Token decimals (default: 18)
- `precision`: Display precision (default: 4)

**Returns:** Formatted string

**Example:**
```typescript
const formatted = formatBalance(
  BigInt("1000000000000000000"), // 1 token in wei
  18,
  4
);
console.log(formatted); // "1.0000"
```

---

#### `formatTimeRemaining(seconds)`

Formats time remaining for countdown displays.

**Parameters:**
- `seconds`: Number of seconds

**Returns:** Formatted time string

**Example:**
```typescript
const timeString = formatTimeRemaining(3661);
console.log(timeString); // "1h 1m"
```

---

#### `truncateAddress(address)`

Truncates Ethereum addresses for display.

**Parameters:**
- `address`: Full Ethereum address

**Returns:** Truncated address string

**Example:**
```typescript
const short = truncateAddress("0x1234567890123456789012345678901234567890");
console.log(short); // "0x1234...7890"
```

---

## 🔗 External API Integrations

### HyperLend Protocol API

#### Pool Contract Methods

**`supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)`**

Supplies tokens to HyperLend for yield generation.

**`withdraw(address asset, uint256 amount, address to)`**

Withdraws tokens from HyperLend pool.

**`getUserAccountData(address user)`**

Returns user's account data including collateral and debt information.

---

#### Data Provider Methods

**`getUserReserveData(address asset, address user)`**

Returns user's reserve data for specific asset.

**`getReserveData(address asset)`**

Returns general reserve data for asset including rates and liquidity.

---

### Blockchain API (Wagmi/Viem)

#### Reading Contract Data

```typescript
import { useReadContract } from 'wagmi';

const { data: totalDeposits } = useReadContract({
  address: contractAddress as `0x${string}`,
  abi: CONTRACT_ABI,
  functionName: 'totalDeposits',
});
```

#### Writing to Contract

```typescript
import { useWriteContract } from 'wagmi';

const { writeContract } = useWriteContract();

const deposit = async (amount: string) => {
  const hash = await writeContract({
    address: contractAddress as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'depositWHYPE',
    args: [parseEther(amount)],
  });
  return hash;
};
```

---

## 📊 Constants & Configuration

### Contract Addresses

```typescript
export const CONTRACT_ADDRESSES: Record<number, ContractAddresses> = {
  999: { // Mainnet
    hyperLendPool: '0x00A89d7a5A02160f20150EbEA7a2b5E4879A1A8b',
    dataProvider: '0x5481bf8d3946E6A3168640c1D7523eB59F055a29',
    wHYPE: '0x5555555555555555555555555555555555555555',
    noLossLottery: process.env.NEXT_PUBLIC_LOTTERY_CONTRACT_MAINNET || '',
  },
  998: { // Testnet
    hyperLendPool: '0x00A89d7a5A02160f20150EbEA7a2b5E4879A1A8b',
    dataProvider: '0x5481bf8d3946E6A3168640c1D7523eB59F055a29',
    wHYPE: '0x5555555555555555555555555555555555555555',
    noLossLottery: process.env.NEXT_PUBLIC_LOTTERY_CONTRACT_TESTNET || '',
  },
};
```

### Protocol Constants

```typescript
export const PROTOCOL_CONSTANTS = {
  LOTTERY_INTERVAL: 86400, // 24 hours in seconds
  TICKET_UNIT: '10000000000000000', // 0.01 wHYPE in wei
  MAX_FEE_BPS: 1000, // 10% maximum protocol fee
  DEFAULT_ALLOCATION_BPS: 10000, // 100% to lottery by default
} as const;
```

### Network Configuration

```typescript
export const NETWORK_CONFIG = {
  999: { // Hyperliquid EVM Mainnet
    name: 'Hyperliquid EVM',
    rpcUrl: 'https://api.hyperliquid.xyz/evm',
    blockExplorer: 'https://explorer.hyperliquid.xyz',
    chainId: 999,
  },
  998: { // Hyperliquid EVM Testnet
    name: 'Hyperliquid EVM Testnet', 
    rpcUrl: 'https://api.hyperliquid-testnet.xyz/evm',
    blockExplorer: 'https://explorer.hyperliquid-testnet.xyz',
    chainId: 998,
  },
} as const;
```

---

## 🚨 Error Codes & Messages

### Smart Contract Errors

| Error | Message | Cause |
|-------|---------|-------|
| `InvalidAmount` | "Amount must be greater than 0" | Zero or negative amount |
| `InsufficientBalance` | "Insufficient deposit balance" | Withdrawal exceeds deposit |
| `ContractPaused` | "Pausable: paused" | Contract is paused |
| `NotReady` | "Lottery not ready by time" | Lottery execution too early |
| `NoParticipants` | "No participants" | No active participants |
| `InvalidAllocation` | "bps>10000" | Allocation exceeds 100% |

### Frontend Errors

| Error Type | Message | Resolution |
|------------|---------|------------|
| `WalletNotConnected` | "Please connect your wallet" | Connect wallet |
| `WrongNetwork` | "Please switch to Hyperliquid EVM" | Switch network |
| `InsufficientAllowance` | "Please approve token spending" | Approve tokens |
| `TransactionFailed` | "Transaction failed" | Check gas/retry |

---

## 📝 TypeScript Definitions

### Core Types

```typescript
interface UserInfo {
  depositAmount: bigint;
  depositTime: bigint;
  tickets: bigint;
  lastTicketUpdate: bigint;
}

interface ContractState {
  totalDeposits: bigint;
  prizePool: bigint;
  currentRound: bigint;
  participantCount: number;
  nextLotteryTime: bigint;
}

interface LotteryResult {
  round: number;
  winner: string;
  prize: bigint;
  totalParticipants: number;
  totalTicketsAtDraw: bigint;
  timestamp: number;
  randomSeed: string;
}
```

### Network Types

```typescript
interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  blockExplorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

interface ContractAddresses {
  hyperLendPool: string;
  dataProvider: string;
  wHYPE: string;
  noLossLottery: string;
}
```

---

## 📚 Usage Examples

### Complete Integration Example

```typescript
import { useContract } from '../hooks/useContract';
import { formatEther, parseEther } from 'viem';

export const LotteryInterface: React.FC = () => {
  const {
    contractState,
    userInfo,
    deposit,
    withdraw,
    harvest,
    executeLottery,
    isLoading,
    formatters
  } = useContract();

  const handleDeposit = async (amount: string) => {
    try {
      await deposit(amount);
      console.log(`Deposited ${amount} wHYPE successfully`);
    } catch (error) {
      console.error('Deposit failed:', error);
    }
  };

  const handleWithdraw = async (amount: string) => {
    try {
      await withdraw(amount);
      console.log(`Withdrew ${amount} wHYPE successfully`);
    } catch (error) {
      console.error('Withdrawal failed:', error);
    }
  };

  return (
    <div>
      <h2>Protocol Stats</h2>
      <p>Total Deposits: {formatters.totalDeposits} wHYPE</p>
      <p>Prize Pool: {formatters.prizePool} wHYPE</p>
      <p>Your Deposit: {formatters.userDeposit} wHYPE</p>
      
      {userInfo && (
        <p>Your Tickets: {userInfo.tickets.toString()}</p>
      )}

      <button 
        onClick={() => handleDeposit('100')}
        disabled={isLoading}
      >
        Deposit 100 wHYPE
      </button>

      <button 
        onClick={() => handleWithdraw('50')}
        disabled={isLoading}
      >
        Withdraw 50 wHYPE
      </button>
    </div>
  );
};
```

---

**This API reference provides complete documentation for interacting with the HyperLoops protocol at all levels, from smart contracts to frontend integration.**