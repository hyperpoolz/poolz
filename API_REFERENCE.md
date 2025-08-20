# API Reference Guide

## Overview

This guide provides comprehensive documentation for integrating with the HyperPool protocol, including smart contract interfaces, frontend integration patterns, and external API usage.

## Table of Contents

- [Smart Contract API](#smart-contract-api)
- [Frontend Integration](#frontend-integration)
- [Event Monitoring](#event-monitoring)
- [Drand VRF Integration](#drand-vrf-integration)
- [HyperLend Integration](#hyperlend-integration)
- [Error Handling](#error-handling)
- [Gas Optimization](#gas-optimization)
- [Best Practices](#best-practices)

## Smart Contract API

### LotteryVRF Contract Interface

#### Core Functions

##### `depositWHYPE(uint256 amount)`

Deposits wHYPE tokens and receives lottery tickets.

**Parameters:**
- `amount` (uint256): Amount of wHYPE tokens to deposit (must be multiple of 0.1 wHYPE)

**Requirements:**
- Amount must be > 0
- Amount must be multiple of `TICKET_UNIT` (1e17 wei)
- Caller must have sufficient wHYPE balance
- Caller must have approved contract to spend tokens

**Events Emitted:**
- `Deposited(address indexed user, uint256 amount, uint256 newTickets)`

**Example:**
```typescript
// Deposit 1 wHYPE (receives 10 tickets)
const amount = ethers.parseEther("1.0");
await lotteryContract.depositWHYPE(amount);
```

##### `withdraw(uint256 amount)`

Withdraws deposited tokens and burns corresponding tickets.

**Parameters:**
- `amount` (uint256): Amount of wHYPE tokens to withdraw

**Requirements:**
- Amount must be > 0
- User must have sufficient deposit balance
- Amount must not exceed user's total deposits

**Events Emitted:**
- `Withdrawn(address indexed user, uint256 amount, uint256 burnedTickets)`

**Example:**
```typescript
// Withdraw 0.5 wHYPE
const amount = ethers.parseEther("0.5");
await lotteryContract.withdraw(amount);
```

##### `harvestYield()`

Harvests accumulated yield from HyperLend into the prize pool.

**Requirements:**
- Must wait `HARVEST_INTERVAL` since last harvest
- Must have accrued yield available

**Events Emitted:**
- `YieldHarvested(uint256 yieldAmount, uint256 prizePoolIncrease, address indexed caller, uint256 incentive)`
- `IncentivePaid(address indexed caller, uint256 amount, string action)`

**Returns:**
- Incentive payment to caller (1% of harvested yield)

**Example:**
```typescript
// Anyone can call this to earn incentives
const tx = await lotteryContract.harvestYield();
const receipt = await tx.wait();
```

##### `closeRound()`

Closes the current round and requests VRF randomness.

**Requirements:**
- Current round must be active
- Round must have exceeded `LOTTERY_INTERVAL` duration
- Must have participants in the round

**Events Emitted:**
- `RoundClosed(uint256 indexed round, uint256 drawBlock, uint256 totalTickets, uint256 prizeAmount)`
- `RoundVRFRequested(uint256 indexed round, uint256 requestId)`

**Example:**
```typescript
// Close current round (anyone can call)
await lotteryContract.closeRound();
```

##### `finalizeRound()`

Uses VRF randomness to select winner and distribute prize.

**Requirements:**
- Round must be in "Closed" state
- VRF randomness must be available
- Must be called after VRF fulfillment

**Events Emitted:**
- `RoundFinalized(uint256 indexed round, address indexed winner, uint256 prize)`
- `IncentivePaid(address indexed caller, uint256 amount, string action)`

**Example:**
```typescript
// Finalize round after VRF callback
await lotteryContract.finalizeRound();
```

#### View Functions

##### `getUserInfo(address user)`

Returns comprehensive user information.

**Parameters:**
- `user` (address): User address to query

**Returns:**
- `deposits` (uint256): Total deposited amount
- `tickets` (uint256): Current ticket count
- `allocationBps` (uint256): Allocation in basis points (out of 10000)

**Example:**
```typescript
const [deposits, tickets, allocation] = await lotteryContract.getUserInfo(userAddress);
console.log(`User has ${ethers.formatEther(deposits)} wHYPE deposited`);
console.log(`User has ${tickets} tickets`);
console.log(`User allocation: ${allocation / 100}%`);
```

##### `getRoundInfo(uint256 roundId)`

Returns detailed information about a specific round.

**Parameters:**
- `roundId` (uint256): Round number to query

**Returns:**
- `startTime` (uint256): Round start timestamp
- `endTime` (uint256): Round end timestamp
- `state` (uint8): Round state (0=Active, 1=Closed, 2=Finalized)
- `totalTickets` (uint256): Tickets when round closed
- `prizeAmount` (uint256): Prize pool amount
- `winner` (address): Winner address (if finalized)
- `participantCount` (uint256): Number of participants

**Example:**
```typescript
const roundInfo = await lotteryContract.getRoundInfo(1);
console.log(`Round 1 winner: ${roundInfo.winner}`);
console.log(`Prize: ${ethers.formatEther(roundInfo.prizeAmount)} wHYPE`);
```

##### `getCurrentRoundInfo()`

Returns information about the current active round.

**Returns:**
- `roundId` (uint256): Current round number
- `timeLeft` (uint256): Seconds until round can be closed
- `closeable` (bool): Whether round can be closed now
- `finalizable` (bool): Whether round can be finalized
- `totalTickets` (uint256): Current total tickets
- `prizePool` (uint256): Current prize pool amount

**Example:**
```typescript
const [roundId, timeLeft, closeable, finalizable, tickets, prize] = 
    await lotteryContract.getCurrentRoundInfo();

if (closeable) {
    console.log("Round can be closed!");
}
if (finalizable) {
    console.log("Round can be finalized!");
}
```

##### `canHarvest()`

Checks if yield harvesting is currently available.

**Returns:**
- `canHarvest` (bool): Whether harvest can be called
- `yieldAvailable` (uint256): Estimated yield amount
- `timeUntilNext` (uint256): Seconds until next harvest allowed

**Example:**
```typescript
const [canHarvest, yieldAmount, timeLeft] = await lotteryContract.canHarvest();
if (canHarvest) {
    console.log(`Can harvest ${ethers.formatEther(yieldAmount)} wHYPE yield`);
}
```

##### `getRecentWinners(uint256 count)`

Returns recent winner history.

**Parameters:**
- `count` (uint256): Number of recent winners to fetch

**Returns:**
- Array of winner objects with round info, winner address, and prize amount

**Example:**
```typescript
const recentWinners = await lotteryContract.getRecentWinners(5);
recentWinners.forEach((winner, i) => {
    console.log(`Round ${winner.round}: ${winner.winner} won ${ethers.formatEther(winner.prize)}`);
});
```

##### `getStats()`

Returns protocol-wide statistics.

**Returns:**
- `totalValueLocked` (uint256): Total deposits across all users
- `totalPrizesPaid` (uint256): Cumulative prizes distributed
- `totalParticipants` (uint256): Number of unique participants
- `currentPrizePool` (uint256): Current prize pool balance
- `avgPrizeSize` (uint256): Average prize amount
- `totalRounds` (uint256): Total rounds completed

**Example:**
```typescript
const stats = await lotteryContract.getStats();
console.log(`TVL: $${ethers.formatEther(stats.totalValueLocked)}`);
console.log(`Total participants: ${stats.totalParticipants}`);
```

### Constants

```typescript
// Contract constants
const TICKET_UNIT = await lotteryContract.TICKET_UNIT(); // 1e17 (0.1 wHYPE)
const LOTTERY_INTERVAL = await lotteryContract.LOTTERY_INTERVAL(); // 600 seconds
const HARVEST_INTERVAL = await lotteryContract.HARVEST_INTERVAL(); // 600 seconds
const INCENTIVE_BPS = await lotteryContract.INCENTIVE_BPS(); // 100 (1%)
```

## Frontend Integration

### Contract Setup

```typescript
import { ethers } from 'ethers';
import LotteryABI from './abis/LotteryVRF.json';

// Contract configuration
const LOTTERY_ADDRESS = "0xYourContractAddress";
const provider = new ethers.JsonRpcProvider("https://api.hyperliquid.xyz/evm");

// Read-only contract instance
const lotteryContract = new ethers.Contract(
    LOTTERY_ADDRESS,
    LotteryABI,
    provider
);

// For transactions, use signer
const lotteryContractWithSigner = lotteryContract.connect(signer);
```

### User Interface Integration

#### Wallet Connection

```typescript
import { usePrivy } from '@privy-io/react-auth';

function WalletConnection() {
    const { login, logout, authenticated, user } = usePrivy();
    
    if (!authenticated) {
        return <button onClick={login}>Connect Wallet</button>;
    }
    
    return (
        <div>
            <span>Connected: {user.wallet?.address}</span>
            <button onClick={logout}>Disconnect</button>
        </div>
    );
}
```

#### Deposit Flow

```typescript
import { parseEther, formatEther } from 'ethers';

async function handleDeposit(amount: string) {
    try {
        const depositAmount = parseEther(amount);
        
        // Check allowance
        const allowance = await tokenContract.allowance(userAddress, LOTTERY_ADDRESS);
        
        // Approve if needed
        if (allowance < depositAmount) {
            const approveTx = await tokenContract.approve(LOTTERY_ADDRESS, depositAmount);
            await approveTx.wait();
        }
        
        // Deposit
        const depositTx = await lotteryContractWithSigner.depositWHYPE(depositAmount);
        const receipt = await depositTx.wait();
        
        console.log("Deposit successful:", receipt);
        
    } catch (error) {
        console.error("Deposit failed:", error);
    }
}
```

#### Real-time Data Updates

```typescript
import { useEffect, useState } from 'react';

function useLotteryData(userAddress: string) {
    const [userData, setUserData] = useState(null);
    const [currentRound, setCurrentRound] = useState(null);
    const [stats, setStats] = useState(null);
    
    useEffect(() => {
        async function fetchData() {
            try {
                // Fetch user data
                const [deposits, tickets, allocation] = await lotteryContract.getUserInfo(userAddress);
                setUserData({ deposits, tickets, allocation });
                
                // Fetch current round
                const roundInfo = await lotteryContract.getCurrentRoundInfo();
                setCurrentRound(roundInfo);
                
                // Fetch stats
                const protocolStats = await lotteryContract.getStats();
                setStats(protocolStats);
                
            } catch (error) {
                console.error("Failed to fetch data:", error);
            }
        }
        
        fetchData();
        const interval = setInterval(fetchData, 10000); // Update every 10s
        
        return () => clearInterval(interval);
    }, [userAddress]);
    
    return { userData, currentRound, stats };
}
```

## Event Monitoring

### Setting Up Event Listeners

```typescript
// Listen for deposits
lotteryContract.on('Deposited', (user, amount, tickets, event) => {
    console.log(`${user} deposited ${formatEther(amount)} wHYPE for ${tickets} tickets`);
    
    // Update UI
    if (user.toLowerCase() === userAddress.toLowerCase()) {
        refreshUserData();
    }
    refreshStats();
});

// Listen for round finalization
lotteryContract.on('RoundFinalized', (round, winner, prize, event) => {
    console.log(`Round ${round} winner: ${winner} won ${formatEther(prize)} wHYPE`);
    
    // Show celebration if user won
    if (winner.toLowerCase() === userAddress.toLowerCase()) {
        showWinnerModal(round, prize);
    }
    
    refreshCurrentRound();
});

// Listen for yield harvests
lotteryContract.on('YieldHarvested', (yieldAmount, prizeIncrease, caller, incentive, event) => {
    console.log(`Yield harvested: ${formatEther(yieldAmount)} wHYPE`);
    console.log(`Caller ${caller} earned ${formatEther(incentive)} incentive`);
    
    refreshStats();
});
```

### Historical Event Queries

```typescript
async function getHistoricalWinners(fromBlock = 0, toBlock = 'latest') {
    const filter = lotteryContract.filters.RoundFinalized();
    const events = await lotteryContract.queryFilter(filter, fromBlock, toBlock);
    
    return events.map(event => ({
        round: event.args.round,
        winner: event.args.winner,
        prize: event.args.prize,
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash
    }));
}

async function getUserDeposits(userAddress: string) {
    const filter = lotteryContract.filters.Deposited(userAddress);
    const events = await lotteryContract.queryFilter(filter);
    
    return events.map(event => ({
        amount: event.args.amount,
        tickets: event.args.newTickets,
        timestamp: event.blockNumber, // Convert to actual timestamp if needed
        txHash: event.transactionHash
    }));
}
```

## Drand VRF Integration

### VRF Request Monitoring

```typescript
// Monitor VRF requests
lotteryContract.on('RoundVRFRequested', async (round, requestId, event) => {
    console.log(`VRF requested for round ${round}, ID: ${requestId}`);
    
    // Start monitoring Drand for fulfillment
    monitorVRFFulfillment(requestId);
});

async function monitorVRFFulfillment(requestId: bigint) {
    const drandContract = new ethers.Contract(DRAND_VRF_ADDRESS, DrandVRFABI, provider);
    
    // Listen for fulfillment
    const filter = drandContract.filters.RandomnessFulfilled(requestId);
    
    drandContract.once(filter, (reqId, randomness, event) => {
        console.log(`VRF fulfilled for request ${reqId}: ${randomness}`);
        
        // Check if round can now be finalized
        checkRoundFinalizeable();
    });
}
```

### Drand Beacon Integration

```typescript
// Fetch current Drand round
async function getCurrentDrandRound() {
    const response = await fetch('https://api.drand.sh/public/latest');
    const data = await response.json();
    
    return {
        round: data.round,
        randomness: data.randomness,
        signature: data.signature,
        previous_signature: data.previous_signature
    };
}

// Calculate future Drand round for deadline
function calculateDrandRound(deadline: number) {
    const DRAND_GENESIS_TIME = 1595431050; // Drand genesis timestamp
    const DRAND_PERIOD = 30; // 30 seconds per round
    
    const roundNumber = Math.floor((deadline - DRAND_GENESIS_TIME) / DRAND_PERIOD);
    return roundNumber;
}
```

## HyperLend Integration

### Pool Interaction

```typescript
import HyperLendPoolABI from './abis/HyperLendPool.json';

const hyperLendPool = new ethers.Contract(
    HYPERLEND_POOL_ADDRESS,
    HyperLendPoolABI,
    provider
);

// Check lending pool reserves
async function getPoolReserveData(assetAddress: string) {
    const reserveData = await hyperLendPool.getReserveData(assetAddress);
    
    return {
        liquidityRate: reserveData.currentLiquidityRate,
        utilizationRate: reserveData.currentUtilizationRate,
        totalSupply: reserveData.totalSupply,
        totalBorrow: reserveData.totalStableDebt.add(reserveData.totalVariableDebt)
    };
}
```

### Yield Calculation

```typescript
// Calculate expected APY from HyperLend
async function calculateExpectedAPY() {
    const reserveData = await getPoolReserveData(WHYPE_TOKEN_ADDRESS);
    
    // HyperLend uses ray math (1e27 precision)
    const RAY = BigInt(1e27);
    const SECONDS_PER_YEAR = BigInt(365 * 24 * 60 * 60);
    
    // Convert liquidityRate to APY
    const liquidityRate = reserveData.liquidityRate;
    const apy = (liquidityRate * SECONDS_PER_YEAR) / RAY;
    
    return Number(apy) / 1e27 * 100; // Convert to percentage
}
```

## Error Handling

### Custom Error Types

```typescript
// Define custom error types from contract
const LOTTERY_ERRORS = {
    AmountMustBePositive: "Amount must be greater than zero",
    InsufficientBalance: "Insufficient token balance",
    InvalidTicketAmount: "Amount must be multiple of 0.1 wHYPE",
    InsufficientDeposit: "Insufficient deposit for withdrawal",
    RoundNotActive: "No active round available",
    RoundNotEnded: "Round has not ended yet",
    NoTickets: "No tickets in this round",
    NoPrize: "No prize pool available"
};

// Error parsing helper
function parseContractError(error: any): string {
    const errorData = error.data || error.error?.data;
    
    if (errorData) {
        // Try to decode custom error
        const errorSelector = errorData.slice(0, 10);
        
        // Match against known selectors
        for (const [errorName, message] of Object.entries(LOTTERY_ERRORS)) {
            if (errorSelector === getErrorSelector(errorName)) {
                return message;
            }
        }
    }
    
    // Fallback to generic error message
    return error.reason || error.message || "Transaction failed";
}

function getErrorSelector(errorName: string): string {
    return ethers.id(`${errorName}()`).slice(0, 10);
}
```

### Transaction Error Handling

```typescript
async function safeContractCall(contractFunction: () => Promise<any>) {
    try {
        const tx = await contractFunction();
        const receipt = await tx.wait();
        
        if (receipt.status === 0) {
            throw new Error("Transaction reverted");
        }
        
        return receipt;
        
    } catch (error: any) {
        console.error("Contract call failed:", error);
        
        // Parse and display user-friendly error
        const userMessage = parseContractError(error);
        
        // Handle specific error types
        if (error.code === 'INSUFFICIENT_FUNDS') {
            throw new Error("Insufficient balance for gas fees");
        }
        
        if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
            throw new Error("Transaction would fail - check your inputs");
        }
        
        throw new Error(userMessage);
    }
}
```

## Gas Optimization

### Transaction Batching

```typescript
// Batch approval and deposit
async function depositWithApproval(amount: bigint) {
    const calls = [];
    
    // Check current allowance
    const allowance = await tokenContract.allowance(userAddress, LOTTERY_ADDRESS);
    
    if (allowance < amount) {
        calls.push({
            target: TOKEN_ADDRESS,
            data: tokenContract.interface.encodeFunctionData("approve", [LOTTERY_ADDRESS, amount])
        });
    }
    
    calls.push({
        target: LOTTERY_ADDRESS,
        data: lotteryContract.interface.encodeFunctionData("depositWHYPE", [amount])
    });
    
    // Execute batch transaction (requires multicall contract)
    await multicallContract.aggregate(calls);
}
```

### Gas Estimation

```typescript
async function estimateTransactionCost(functionName: string, args: any[]) {
    try {
        const gasEstimate = await lotteryContract[functionName].estimateGas(...args);
        const gasPrice = await provider.getFeeData();
        
        const cost = gasEstimate * (gasPrice.gasPrice || gasPrice.maxFeePerGas || 0n);
        
        return {
            gasLimit: gasEstimate,
            gasPrice: gasPrice.gasPrice,
            cost: cost,
            costFormatted: formatEther(cost)
        };
        
    } catch (error) {
        console.error("Gas estimation failed:", error);
        return null;
    }
}
```

## Best Practices

### Security Best Practices

1. **Always validate user inputs**
```typescript
function validateDepositAmount(amount: string): boolean {
    const depositAmount = parseEther(amount);
    const ticketUnit = parseEther("0.1");
    
    return depositAmount > 0 && depositAmount % ticketUnit === 0n;
}
```

2. **Use safe arithmetic**
```typescript
// Use BigInt for all calculations
const tickets = deposits / TICKET_UNIT;
const allocation = (tickets * 10000n) / totalTickets;
```

3. **Handle edge cases**
```typescript
async function safeGetUserInfo(address: string) {
    if (!ethers.isAddress(address)) {
        throw new Error("Invalid address");
    }
    
    try {
        return await lotteryContract.getUserInfo(address);
    } catch (error) {
        return { deposits: 0n, tickets: 0n, allocation: 0n };
    }
}
```

### Performance Optimization

1. **Cache contract instances**
```typescript
const contractCache = new Map();

function getContract(address: string, abi: any) {
    const key = `${address}-${JSON.stringify(abi)}`;
    
    if (!contractCache.has(key)) {
        contractCache.set(key, new ethers.Contract(address, abi, provider));
    }
    
    return contractCache.get(key);
}
```

2. **Batch multiple queries**
```typescript
async function fetchAllUserData(userAddress: string) {
    const [userInfo, balance, allowance] = await Promise.all([
        lotteryContract.getUserInfo(userAddress),
        tokenContract.balanceOf(userAddress),
        tokenContract.allowance(userAddress, LOTTERY_ADDRESS)
    ]);
    
    return { userInfo, balance, allowance };
}
```

3. **Use multicall for complex queries**
```typescript
import { Multicall } from '@ethersproject/providers';

async function batchQuery(calls: Array<{contract: Contract, method: string, params: any[]}>) {
    const multicall = new Multicall(provider);
    
    const results = await multicall.all(
        calls.map(call => call.contract[call.method](...call.params))
    );
    
    return results;
}
```

This API reference provides comprehensive guidance for integrating with the HyperPool protocol across all supported interfaces and use cases.