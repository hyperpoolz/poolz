# Smart Contracts Documentation

## Overview

HyperPool's smart contract architecture consists of several key components working together to provide a secure, fair, and efficient no-loss lottery system. The contracts are deployed on Hyperliquid EVM and integrate with HyperLend for yield generation and Drand for verifiable randomness.

## Contract Architecture

```
LotteryVRF (Main Contract)
├── Inherits: Ownable, ReentrancyGuard, VRFConsumerBase
├── Interfaces: IDrandVRF, IPool, IProtocolDataProvider
└── Libraries: LotteryErrors, LotteryViewsV2
```

## Core Contracts

### 1. LotteryVRF.sol - Main Lottery Contract

**Location**: `/contracts/LotteryVRF.sol`

The main lottery contract that handles all user interactions, yield management, and round mechanics.

#### Key Features

- **No-loss deposits**: Users can withdraw anytime
- **Proportional tickets**: 1 ticket per 0.1 wHYPE deposited
- **VRF-based randomness**: Uses Drand for fair winner selection
- **Yield harvesting**: Automatically compounds yield into prize pools
- **Incentivized operations**: Rewards users for calling harvest/close/finalize

#### Constants

```solidity
uint256 public constant TICKET_UNIT = 1e17;           // 0.1 wHYPE per ticket
uint256 public constant LOTTERY_INTERVAL = 10 minutes; // Round duration
uint256 public constant HARVEST_INTERVAL = 10 minutes; // Min harvest delay
uint256 public constant INCENTIVE_BPS = 100;          // 1% incentive fee
```

#### State Variables

```solidity
// Core protocol contracts
IPool public immutable hyperLendPool;
IProtocolDataProvider public immutable dataProvider;
IERC20 public immutable depositToken;
IDrandVRF public immutable drandVRF;

// Financial state
uint256 public totalDeposits;      // Total user deposits
uint256 public prizePool;          // Accumulated yield for prizes
uint256 public currentRound;       // Current round number
uint256 public lastHarvestTime;    // Last yield harvest timestamp

// User tracking
mapping(address => uint256) public deposits;    // User deposit amounts
mapping(address => uint256) public tickets;     // User ticket counts
uint256 public totalTickets;                   // Total tickets in circulation
address[] public participants;                 // Array of all participants
mapping(address => bool) public isParticipant; // Quick participant lookup
```

#### Round Management

```solidity
enum RoundState { Active, Closed, Finalized }

struct Round {
    uint256 startTime;         // Round start timestamp
    uint256 endTime;           // Round end timestamp
    uint256 requestId;         // VRF request ID
    bytes32 randomness;        // VRF-provided randomness
    bool randomnessReady;      // VRF callback received flag
    uint256 totalTickets;      // Snapshot of tickets when closed
    uint256 prizeAmount;       // Prize pool when closed
    address winner;            // Selected winner address
    RoundState state;          // Current round state
    uint256 participantCount;  // Number of participants
    bool incentivePaid;        // Incentive payment flag
}
```

#### Core Functions

##### User Actions

**`depositWHYPE(uint256 amount)`**
- Deposits wHYPE tokens and supplies them to HyperLend
- Calculates and assigns lottery tickets
- Updates user and global state
- Emits `Deposited` event

```solidity
function depositWHYPE(uint256 amount) external nonReentrant {
    // Validation checks
    if (amount == 0) revert LotteryErrors.AmountMustBePositive();
    if (amount % TICKET_UNIT != 0) revert LotteryErrors.InvalidTicketAmount();
    
    // Calculate tickets
    uint256 beforeTickets = deposits[msg.sender] / TICKET_UNIT;
    uint256 afterTickets = (deposits[msg.sender] + amount) / TICKET_UNIT;
    uint256 newTickets = afterTickets - beforeTickets;
    
    // Transfer and supply to HyperLend
    depositToken.safeTransferFrom(msg.sender, address(this), amount);
    depositToken.safeIncreaseAllowance(address(hyperLendPool), amount);
    hyperLendPool.supply(address(depositToken), amount, address(this), 0);
    
    // Update state
    deposits[msg.sender] += amount;
    totalDeposits += amount;
    tickets[msg.sender] += newTickets;
    totalTickets += newTickets;
    
    _addParticipant(msg.sender);
    emit Deposited(msg.sender, amount, newTickets);
}
```

**`withdraw(uint256 amount)`**
- Withdraws specified amount from HyperLend
- Burns corresponding lottery tickets
- Transfers tokens back to user
- Emits `Withdrawn` event

##### Yield Management

**`harvestYield()`**
- Collects accrued yield from HyperLend
- Adds yield to prize pool (minus incentive)
- Pays caller incentive fee
- Rate-limited by `HARVEST_INTERVAL`

##### Round Operations

**`closeRound()`**
- Closes active round and snapshots state
- Requests VRF randomness from Drand
- Freezes participant tickets for winner selection
- Transitions round to `Closed` state

**`finalizeRound()`**
- Uses VRF randomness to select winner
- Distributes prize (minus incentive to caller)
- Creates new round automatically
- Transitions to `Finalized` state

#### Events

```solidity
event Deposited(address indexed user, uint256 amount, uint256 newTickets);
event Withdrawn(address indexed user, uint256 amount, uint256 burnedTickets);
event YieldHarvested(uint256 yieldAmount, uint256 prizePoolIncrease, address indexed caller, uint256 incentive);
event RoundClosed(uint256 indexed round, uint256 drawBlock, uint256 totalTickets, uint256 prizeAmount);
event RoundVRFRequested(uint256 indexed round, uint256 requestId);
event RoundFinalized(uint256 indexed round, address indexed winner, uint256 prize);
event IncentivePaid(address indexed caller, uint256 amount, string action);
```

#### View Functions

**`getUserInfo(address user)`**
- Returns user's deposits, tickets, and allocation BPS

**`getRoundInfo(uint256 roundId)`**
- Returns complete round information

**`getCurrentRoundInfo()`**
- Returns current round status and timing

**`canHarvest()`**
- Checks if yield harvesting is available

**`getRecentWinners(uint256 count)`**
- Returns recent winner history

**`getStats()`**
- Returns protocol-wide statistics

### 2. DrandVRF_Split.sol - Verifiable Randomness

**Location**: `/contracts/DrandVRF_Split.sol`

Provides verifiable randomness using Drand's BLS threshold signatures.

#### Key Features

- **BLS Signature Verification**: Uses BN254 elliptic curve
- **Drand Integration**: Connects to Drand beacon network
- **Request/Fulfill Pattern**: Async randomness provision
- **Deadline-based**: Uses time-based round calculation

#### Core Functions

**`requestRandomness(uint256 deadline, bytes32 salt, address consumer)`**
- Creates randomness request with deadline
- Returns unique request ID
- Stores consumer callback address

**`fulfillRandomness(uint256 requestId, uint256 drandRound, uint256[2] signature)`**
- Verifies BLS signature against Drand public key
- Calls consumer's `rawFulfillRandomness` callback
- Emits fulfillment events

### 3. BLSVerifier.sol - Cryptographic Verification

**Location**: `/contracts/BLSVerifier.sol`

Handles BLS signature verification for Drand randomness.

#### Key Features

- **BN254 Pairing**: Efficient pairing-based cryptography
- **BLS Verification**: Industry-standard BLS signatures
- **Gas Optimized**: Precompiled contract usage

#### Core Functions

**`verifySignature(uint256[2] signature, bytes message)`**
- Verifies BLS signature against Drand's public key
- Returns boolean result
- Uses precompiled pairing contracts for efficiency

### 4. Support Libraries

#### LotteryErrors.sol

Defines custom errors for gas-efficient error handling:

```solidity
error AmountMustBePositive();
error InsufficientBalance();
error InvalidTicketAmount();
error InsufficientDeposit();
error RoundNotActive();
error RoundNotEnded();
error NoTickets();
error NoPrize();
// ... more errors
```

#### LotteryViewsV2.sol

Helper functions for state calculations:

```solidity
function getCurrentSupplyBalance(
    IProtocolDataProvider dataProvider,
    address asset,
    address user
) external view returns (uint256);

function getAccruedYield(
    IProtocolDataProvider dataProvider,
    address asset,
    address user,
    uint256 totalDeposits
) external view returns (uint256);

function getStats(...) external view returns (...);
```

## Integration Interfaces

### IPool.sol - HyperLend Pool Interface

```solidity
interface IPool {
    function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
    function withdraw(address asset, uint256 amount, address to) external returns (uint256);
    // ... other Aave V3 compatible functions
}
```

### IProtocolDataProvider.sol - HyperLend Data Provider

```solidity
interface IProtocolDataProvider {
    function getUserReserveData(address asset, address user) 
        external view returns (
            uint256 currentHTokenBalance,
            uint256 currentStableDebt,
            uint256 currentVariableDebt,
            uint256 principalStableDebt,
            uint256 scaledVariableDebt,
            uint256 stableBorrowRate,
            uint256 liquidityRate,
            uint40 stableRateLastUpdated,
            bool usageAsCollateralEnabled
        );
}
```

### IDrandVRF.sol - VRF Interface

```solidity
interface IDrandVRF {
    function requestRandomness(uint256 deadline, bytes32 salt, address consumer)
        external returns (uint256 id);
}
```

## Security Considerations

### Access Control

- **Owner Functions**: Limited to emergency operations and parameter updates
- **User Functions**: Protected by input validation and reentrancy guards
- **VRF Callbacks**: Authenticated by caller address verification

### Reentrancy Protection

All state-changing functions use OpenZeppelin's `ReentrancyGuard`:

```solidity
function depositWHYPE(uint256 amount) external nonReentrant {
    // Function implementation
}
```

### Input Validation

Comprehensive validation on all user inputs:

```solidity
if (amount == 0) revert LotteryErrors.AmountMustBePositive();
if (amount % TICKET_UNIT != 0) revert LotteryErrors.InvalidTicketAmount();
if (depositToken.balanceOf(msg.sender) < amount) revert LotteryErrors.InsufficientBalance();
```

### Safe Token Operations

Uses OpenZeppelin's `SafeERC20` for all token transfers:

```solidity
using SafeERC20 for IERC20;
depositToken.safeTransferFrom(msg.sender, address(this), amount);
```

## Gas Optimization

### Batch Operations

Multiple state updates in single transaction:

```solidity
deposits[msg.sender] += amount;
totalDeposits += amount;
tickets[msg.sender] += newTickets;
totalTickets += newTickets;
```

### Efficient Storage

- Use `immutable` for constants
- Pack structs efficiently
- Use mappings over arrays where possible

### View Function Caching

External view calls cached when possible:

```solidity
uint256 currentBalance = _getCurrentSupplyBalance();
```

## Upgrade Strategy

### Current Architecture

- **Non-upgradeable**: Immutable deployment for security
- **Parameter Updates**: Owner can modify some parameters
- **Emergency Functions**: Pause/unpause and token rescue

### Future Considerations

- **Proxy Pattern**: Could be added for future versions
- **Migration Functions**: For moving to new contract versions
- **Governance**: Community-controlled parameter updates

## Testing Strategy

### Unit Tests

- Individual function testing
- Edge case coverage
- Error condition validation

### Integration Tests

- End-to-end user flows
- HyperLend integration
- VRF randomness integration

### Property-Based Testing

- Invariant checking
- Fuzzing with random inputs
- Long-running simulations

## Deployment Checklist

### Pre-deployment

- [ ] All tests passing
- [ ] Gas usage analysis complete
- [ ] Security review completed
- [ ] Integration testing on testnet

### Deployment Steps

1. Deploy BLS Verifier
2. Deploy Drand VRF contract
3. Deploy main Lottery contract
4. Verify contracts on explorer
5. Initialize with correct parameters
6. Test basic operations

### Post-deployment

- [ ] Verify contract addresses
- [ ] Test deposit/withdraw flows
- [ ] Verify VRF integration
- [ ] Monitor for initial issues

## Maintenance

### Regular Tasks

- Monitor yield harvesting efficiency
- Track gas usage optimization opportunities
- Review participant growth and behavior
- Analyze prize distribution fairness

### Emergency Procedures

- Owner key security
- Emergency pause activation
- Token rescue procedures
- Communication protocols

## Future Enhancements

### Planned Features

- **Multi-asset Support**: Support for multiple tokens
- **Dynamic Intervals**: Adjustable round durations
- **Yield Strategies**: Multiple yield sources
- **Governance**: Community parameter control

### Technical Improvements

- **Gas Optimization**: Further efficiency gains
- **Upgrade Mechanisms**: Safe contract upgrades
- **Advanced VRF**: Multiple randomness sources
- **MEV Protection**: Advanced MEV resistance

## API Integration

### Frontend Integration

The contracts provide a clean interface for frontend applications:

```typescript
// Deposit tokens
await lottery.depositWHYPE(amount);

// Get user info
const [deposits, tickets, allocation] = await lottery.getUserInfo(address);

// Get current round
const [roundId, timeLeft, closeable, finalizable] = await lottery.getCurrentRoundInfo();

// Harvest yield
await lottery.harvestYield();
```

### Event Monitoring

Monitor key events for real-time updates:

```typescript
lottery.on('Deposited', (user, amount, tickets) => {
    // Update UI for new deposit
});

lottery.on('RoundFinalized', (round, winner, prize) => {
    // Display winner announcement
});
```

This comprehensive smart contract documentation provides developers and auditors with complete understanding of the HyperPool protocol's on-chain implementation.