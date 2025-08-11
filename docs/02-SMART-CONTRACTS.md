# Smart Contracts Documentation

## 📋 Overview

The HyperLoops protocol is built around a single core smart contract `NoLossLottery.sol` that orchestrates all protocol functionality. This contract interfaces with HyperLend protocol to generate yield and manages the lottery system.

## 🏗️ Contract Architecture

### Core Contract: `NoLossLottery.sol`

**Location**: `/contracts/NoLossLottery.sol`  
**Solidity Version**: 0.8.20  
**License**: MIT  

#### Dependencies
- `@openzeppelin/contracts/token/ERC20/IERC20.sol`
- `@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol`
- `@openzeppelin/contracts/utils/ReentrancyGuard.sol`
- `@openzeppelin/contracts/utils/Pausable.sol`
- `@openzeppelin/contracts/access/Ownable.sol`

## 🔧 Contract Interfaces

### IPool.sol
HyperLend Pool interface (Aave V3 compatible) for supply and withdraw operations.

```solidity
interface IPool {
    function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
    function withdraw(address asset, uint256 amount, address to) external returns (uint256);
    function getUserAccountData(address user) external view returns (...);
}
```

### IProtocolDataProvider.sol
Interface for querying HyperLend protocol data and user reserve information.

```solidity
interface IProtocolDataProvider {
    function getUserReserveData(address asset, address user) external view returns (...);
    function getReserveData(address asset) external view returns (...);
}
```

### IWETHLike.sol
Interface for wrapped token operations (wHYPE).

```solidity
interface IWETHLike {
    function deposit() external payable;
    function withdraw(uint256 wad) external;
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}
```

## 📊 Contract State Variables

### Core State
```solidity
// HyperLend Integration
IPool public immutable hyperLendPool;           // HyperLend Pool contract
IProtocolDataProvider public immutable dataProvider; // Data provider
IERC20 public immutable depositToken;           // wHYPE token

// Protocol State  
uint256 public totalDeposits;                  // Total user deposits
uint256 public prizePool;                      // Accumulated prize pool
uint256 public currentRound;                   // Current lottery round
uint256 public totalTickets;                   // Total active tickets
uint256 public nextLotteryTime;                // Next lottery timestamp
uint256 public lastHarvestTime;                // Last yield harvest time

// Constants
uint256 public constant LOTTERY_INTERVAL = 1 days;    // 24 hour lottery cycle
uint256 public constant TICKET_UNIT = 1e16;           // 0.01 wHYPE per ticket
```

### User Management
```solidity
struct UserInfo {
    uint256 depositAmount;      // User's deposited amount
    uint256 depositTime;        // Timestamp of deposit
    uint256 tickets;           // Current lottery tickets
    uint256 lastTicketUpdate;  // Last ticket update timestamp
}

mapping(address => UserInfo) public users;
mapping(address => uint16) public userAllocationBps; // User yield allocation (0-10000)
```

### Lottery System
```solidity
struct LotteryResult {
    uint256 round;              // Lottery round number
    address winner;             // Winner address
    uint256 prize;             // Prize amount
    uint256 totalParticipants; // Number of participants
    uint256 totalTicketsAtDraw; // Total tickets at drawing
    uint256 timestamp;          // Drawing timestamp
    bytes32 randomSeed;        // Random seed used
}

mapping(uint256 => LotteryResult) public lotteryHistory;
```

## 🔍 View Functions

### Protocol State Queries

#### `getCurrentSupplyBalance() → uint256`
Returns the current hToken balance representing total supplied amount plus accrued interest.

#### `getAccruedYield() → uint256`
Calculates available yield: `currentSupplyBalance - totalDeposits`

#### `getUserInfo(address user) → UserInfo`
Returns complete user information including deposits, tickets, and timestamps.

#### `getParticipantCount() → uint256`
Returns the number of active participants in the lottery.

#### `isLotteryReady() → bool`
Checks if lottery can be executed (time passed, participants exist, prize pool available).

#### `getTimeToNextLottery() → uint256`
Returns seconds until next lottery drawing (0 if ready).

### Lottery Analytics

#### `getTotalTickets() → uint256`
Returns total active lottery tickets across all users.

#### `getUserTickets(address user) → uint256`
Returns lottery tickets for specific user.

#### `getRecentWinners(uint256 count) → (address[], uint256[], uint256[])`
Returns recent winners, prize amounts, and timestamps.

#### `getLifetimeStats() → (uint256, uint256, uint256, uint256, uint256)`
Returns comprehensive protocol statistics:
- Total won lifetime
- Lifetime depositor count
- Current participants
- Total managed funds
- Total tickets

### Yield Monitoring

#### `canHarvest() → bool`
Returns true if there's yield available to harvest.

#### `getHarvestableAmount() → uint256`
Returns amount of yield available for harvesting.

#### `getLiquidityRate() → uint256`
Returns current HyperLend liquidity rate for the deposit token.

## ✍️ Write Functions

### Deposit Operations

#### `depositWHYPE(uint256 amount)`
**Access**: Public  
**Modifiers**: `nonReentrant`, `whenNotPaused`

Deposits wHYPE tokens into the protocol:
1. Transfers wHYPE from user to contract
2. Approves HyperLend Pool to spend tokens
3. Supplies tokens to HyperLend
4. Updates user deposit amount and time
5. Adds user as participant if first deposit
6. Updates total deposits

**Events Emitted**: `Deposited(user, amount, timestamp)`

#### `withdraw(uint256 amount)`
**Access**: Public  
**Modifiers**: `nonReentrant`, `whenNotPaused`

Withdraws tokens from the protocol:
1. Validates user has sufficient deposit balance
2. Updates user deposit amount and total deposits
3. Burns user tickets if deposit becomes zero
4. Removes user from participants if no deposit left
5. Withdraws underlying wHYPE from HyperLend
6. Transfers wHYPE to user

**Events Emitted**: `Withdrawn(user, amount, timestamp)`

### Yield Management

#### `harvestYield()`
**Access**: Public  
**Modifiers**: `nonReentrant`, `whenNotPaused`

Harvests accumulated yield and distributes tickets:
1. Calculates gross yield since last harvest
2. For each participant:
   - Calculates user's proportional yield share
   - Splits yield based on user allocation preferences
   - Awards lottery tickets for yield contributed to lottery
   - Auto-compounds remaining yield to user's deposit
3. Withdraws lottery portion from HyperLend to prize pool
4. Updates total deposits with auto-compounded amounts

**Events Emitted**: 
- `YieldHarvested(totalLotteryAmount, timestamp)`
- `TicketsUpdated(user, newTickets)` (per user)
- `PrizePoolUpdated(newAmount)`

### Lottery Operations

#### `executeLottery()`
**Access**: Public  
**Modifiers**: `nonReentrant`, `whenNotPaused`

Executes the daily lottery drawing:
1. Validates lottery is ready (time, participants, prize pool, tickets)
2. Generates secure random seed
3. Selects winner using weighted ticket selection
4. Transfers entire prize pool to winner
5. Records lottery result in history
6. Resets all user tickets to zero
7. Advances to next round and schedules next lottery

**Events Emitted**: `LotteryExecuted(winner, prize, round)`

### Administration Functions

#### `pause()` / `unpause()`
**Access**: Owner only

Emergency controls to halt/resume protocol operations.

#### `setUserAllocationBps(uint16 bps)`
**Access**: User (for their own allocation)

Sets user's yield allocation percentage (0-10000 basis points):
- 10000 (100%): All yield to lottery
- 5000 (50%): Half to lottery, half auto-compounded
- 0 (0%): All yield auto-compounded

#### `fundPrizePool(uint256 amount)`
**Access**: Owner only

Allows admin to seed prize pool with additional wHYPE for promotions.

#### Emergency Functions

**`rescueERC20(address token, uint256 amount, address to)`**  
**Access**: Owner only, when paused

Rescues accidentally sent tokens (except deposit token).

**`rescueNative(uint256 amount, address payable to)`**  
**Access**: Owner only, when paused

Rescues accidentally sent native tokens.

## 🔐 Security Features

### Access Control
- **OpenZeppelin Ownable**: Admin-only functions protected
- **Pausable**: Emergency stop mechanism
- **ReentrancyGuard**: Protection against reentrancy attacks

### Input Validation
- Amount validation (> 0)
- Balance verification before operations  
- Address validation (non-zero addresses)
- Basis points validation (≤ 10000)

### State Management
- Effects-before-interactions pattern
- Careful state updates before external calls
- Proper event emission for transparency

### Randomness
- Secure pseudo-random generation using:
  - Block hash
  - Contract address
  - Current round
  - Total tickets
  - Previous random seed

## ⚡ Gas Optimization

### Efficient Loops
- Single-pass ticket distribution during yield harvest
- Efficient participant array management
- Minimal storage writes

### Batch Operations
- Combined approve + deposit in single transaction
- Bulk state updates during harvest

### Storage Layout
- Packed structs where possible
- Immutable variables for gas savings
- Efficient mapping usage

## 📊 Contract Deployment

### Constructor Parameters
```solidity
constructor(
    address _hyperLendPool,      // 0x00A89d7a5A02160f20150EbEA7a2b5E4879A1A8b
    address _dataProvider,       // 0x5481bf8d3946E6A3168640c1D7523eB59F055a29
    address _depositToken        // 0x5555555555555555555555555555555555555555 (wHYPE)
)
```

### Network Deployments

**Hyperliquid EVM Mainnet (Chain ID: 999)**
- Contract Address: `TBD`
- HyperLend Pool: `0x00A89d7a5A02160f20150EbEA7a2b5E4879A1A8b`
- Data Provider: `0x5481bf8d3946E6A3168640c1D7523eB59F055a29`
- wHYPE Token: `0x5555555555555555555555555555555555555555`

**Hyperliquid EVM Testnet (Chain ID: 998)**
- Contract Address: `TBD`  
- HyperLend Pool: `0x00A89d7a5A02160f20150EbEA7a2b5E4879A1A8b`
- Data Provider: `0x5481bf8d3946E6A3168640c1D7523eB59F055a29`
- wHYPE Token: `0x5555555555555555555555555555555555555555`

## 🧪 Testing Coverage

The contract includes comprehensive test suites covering:

### Unit Tests (`NoLossLottery.test.js`)
- ✅ Contract deployment and initialization
- ✅ Access control and owner permissions
- ✅ Emergency pause/unpause functionality
- ✅ State variable initialization
- ✅ View function responses

### Integration Tests (`NoLossLottery.allocation.test.js`)
- ✅ Yield allocation mechanisms
- ✅ HyperLend integration points
- ✅ Multi-user scenarios
- ✅ Lottery execution flows

### Test Statistics
- **Total Tests**: 12+ passing
- **Coverage**: >90% function coverage
- **Gas Usage**: Optimized for cost efficiency

## 🔄 Upgrade Path

### Current Version: 1.0.0
- Core functionality implemented
- HyperLend integration complete
- Basic lottery system operational

### Future Enhancements
- **V1.1**: Chainlink VRF integration for randomness
- **V1.2**: Multi-asset support (USDC, USDT)
- **V1.3**: Advanced lottery game modes
- **V2.0**: Governance token and DAO integration

---

**Next**: Explore [Frontend Documentation](./03-FRONTEND.md) to understand the user interface implementation.