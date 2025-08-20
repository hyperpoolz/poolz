# Architecture Documentation

## Overview

HyperPool is a sophisticated no-loss lottery protocol built on Hyperliquid EVM, integrating multiple DeFi components to create a secure, fair, and engaging user experience. This document provides comprehensive architectural details covering system design, component interactions, and technical implementation.

## Table of Contents

- [System Architecture](#system-architecture)
- [Component Breakdown](#component-breakdown)
- [Data Flow](#data-flow)
- [Smart Contract Architecture](#smart-contract-architecture)
- [Frontend Architecture](#frontend-architecture)
- [Integration Architecture](#integration-architecture)
- [Security Architecture](#security-architecture)
- [Scalability Considerations](#scalability-considerations)
- [Future Architecture](#future-architecture)

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                           USER INTERFACE                            │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌────────────────┐ │
│  │     Web App         │  │    Mobile App       │  │   Admin Panel  │ │
│  │   (Next.js 14)      │  │   (Future)          │  │   (Future)     │ │
│  └─────────────────────┘  └─────────────────────┘  └────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        BLOCKCHAIN LAYER                             │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                  HYPERLIQUID EVM                                │ │
│  │  ┌───────────────────┐  ┌──────────────────┐  ┌──────────────┐ │ │
│  │  │   Lottery VRF     │  │   Drand VRF      │  │ BLS Verifier │ │ │
│  │  │  (Main Contract)  │  │   (Randomness)   │  │  (Crypto)    │ │ │
│  │  └───────────────────┘  └──────────────────┘  └──────────────┘ │ │
│  │  ┌───────────────────┐  ┌──────────────────┐  ┌──────────────┐ │ │
│  │  │  Lottery Views    │  │  Lottery Errors  │  │   Libraries  │ │ │
│  │  │   (Helpers)       │  │   (Error Defs)   │  │   (Utils)    │ │ │
│  │  └───────────────────┘  └──────────────────┘  └──────────────┘ │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      EXTERNAL INTEGRATIONS                          │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌────────────────┐ │
│  │    HyperLend        │  │    Drand Beacon     │  │   Monitoring   │ │
│  │  (Yield Farming)    │  │  (External VRF)     │  │   Services     │ │
│  └─────────────────────┘  └─────────────────────┘  └────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### Core Components

#### 1. Frontend Layer
- **Next.js 14 Application**: Modern React framework with SSR/SSG
- **TypeScript**: Type-safe development
- **Tailwind CSS + shadcn/ui**: Modern UI component system
- **Wagmi + Viem**: Ethereum interaction libraries
- **Privy**: Wallet connection and authentication

#### 2. Smart Contract Layer  
- **LotteryVRF**: Main protocol logic
- **DrandVRF_Split**: Verifiable randomness provider
- **BLSVerifier**: Cryptographic verification
- **Helper Libraries**: Views, errors, and utilities

#### 3. Integration Layer
- **HyperLend Protocol**: Yield generation
- **Drand Network**: External randomness beacon
- **Hyperliquid EVM**: L1 blockchain infrastructure

## Component Breakdown

### Smart Contracts

#### LotteryVRF.sol - Main Protocol Contract

**Responsibilities:**
- User deposit/withdrawal management
- Lottery ticket calculation and tracking
- Round lifecycle management
- Yield harvesting coordination
- Winner selection and prize distribution

**Key Features:**
```solidity
contract LotteryVRF is Ownable, ReentrancyGuard, VRFConsumerBase {
    // Core protocol parameters
    uint256 public constant TICKET_UNIT = 1e17;        // 0.1 wHYPE per ticket
    uint256 public constant LOTTERY_INTERVAL = 10 minutes;  // Round duration
    uint256 public constant HARVEST_INTERVAL = 10 minutes;  // Harvest cooldown
    uint256 public constant INCENTIVE_BPS = 100;        // 1% incentive
    
    // State management
    mapping(address => UserData) public users;
    mapping(uint256 => Round) public rounds;
    
    // External dependencies
    IPool public immutable hyperLendPool;
    IDrandVRF public immutable drandVRF;
    IERC20 public immutable depositToken;
}
```

**State Architecture:**
```
UserData {
    uint256 deposits        // Total deposited amount
    uint256 tickets         // Current lottery tickets
    uint256 lastActivity    // Last interaction timestamp
}

Round {
    uint256 startTime       // Round start timestamp
    uint256 endTime         // Round end timestamp  
    RoundState state        // Active/Closed/Finalized
    uint256 totalTickets    // Ticket snapshot
    uint256 prizeAmount     // Prize pool amount
    address winner          // Selected winner
    uint256 requestId       // VRF request identifier
    bool randomnessReady    // VRF fulfillment status
}
```

#### DrandVRF_Split.sol - Randomness Provider

**Responsibilities:**
- Drand beacon integration
- BLS signature verification
- Randomness request management
- Consumer callback execution

**Architecture:**
```solidity
contract DrandVRF_Split {
    struct RandomnessRequest {
        address consumer;       // Callback contract
        uint256 deadline;       // Target Drand round
        bytes32 salt;          // Additional entropy
        bool fulfilled;        // Completion status
    }
    
    mapping(uint256 => RandomnessRequest) public requests;
    BLSVerifier public immutable blsVerifier;
    
    // Drand configuration
    uint256 public constant DRAND_GENESIS = 1595431050;
    uint256 public constant DRAND_PERIOD = 30; // 30 seconds per round
}
```

#### BLSVerifier.sol - Cryptographic Verification

**Responsibilities:**
- BLS signature validation
- BN254 elliptic curve operations
- Pairing verification using precompiled contracts

```solidity
contract BLSVerifier {
    using BN254 for BN254.G1Point;
    using BN254 for BN254.G2Point;
    
    // Drand League of Entropy public key
    BN254.G2Point public constant DRAND_PUBLIC_KEY = BN254.G2Point({
        x: [uint256(0x...), uint256(0x...)],
        y: [uint256(0x...), uint256(0x...)]
    });
    
    function verifySignature(
        uint256[2] memory signature,
        bytes memory message
    ) public view returns (bool) {
        return BN254.pairing(
            BN254.G1Point(signature[0], signature[1]),
            BN254.hashToG2(message),
            BN254.negate(BN254.G1_GENERATOR),
            DRAND_PUBLIC_KEY
        );
    }
}
```

### Frontend Architecture

#### Application Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js 14 app router
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx          # Main lottery interface
│   │   ├── v2/               # Optimized interface
│   │   └── app/              # Alternative interface
│   ├── components/            # Reusable UI components
│   │   ├── ui/               # Base UI components (shadcn)
│   │   ├── lottery/          # Lottery-specific components
│   │   └── layout/           # Layout components
│   ├── lib/                  # Utility libraries
│   │   ├── contracts/        # Contract interfaces
│   │   ├── utils/           # Helper functions
│   │   └── constants/       # App constants
│   ├── hooks/               # Custom React hooks
│   └── types/               # TypeScript definitions
```

#### Component Architecture

**Hierarchical Component Structure:**
```
App
├── PrivyProvider              # Wallet authentication
│   ├── WagmiProvider         # Ethereum interactions
│   │   ├── Layout            # App layout
│   │   │   ├── Header        # Navigation and wallet
│   │   │   ├── Main          # Content area
│   │   │   │   ├── LotteryInterface
│   │   │   │   │   ├── DepositForm
│   │   │   │   │   ├── UserStats
│   │   │   │   │   ├── CurrentRound
│   │   │   │   │   ├── PrizePool
│   │   │   │   │   └── RecentWinners
│   │   │   │   └── ActionButtons
│   │   │   └── Footer        # Links and info
│   │   └── Notifications     # Toast messages
```

#### State Management

**React Hooks Pattern:**
```typescript
// Custom hooks for contract data
const useContractData = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        async function fetchData() {
            try {
                const [userInfo, roundInfo, stats] = await Promise.all([
                    lotteryContract.getUserInfo(address),
                    lotteryContract.getCurrentRoundInfo(),
                    lotteryContract.getStats()
                ]);
                
                setData({ userInfo, roundInfo, stats });
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        }
        
        fetchData();
    }, [address]);
    
    return { data, loading, error, refetch: fetchData };
};
```

## Data Flow

### User Interaction Flow

#### 1. Deposit Flow
```
User Intent → Form Validation → Wallet Approval → Contract Call → State Update
     │              │                │              │              │
     ▼              ▼                ▼              ▼              ▼
[Amount Input] [Client Check] [ERC20 Approve] [depositWHYPE] [UI Refresh]
```

**Detailed Steps:**
1. **User Input**: Amount validation on client side
2. **Allowance Check**: Verify ERC20 approval
3. **Approval Transaction**: If needed, approve token spending
4. **Deposit Transaction**: Call `depositWHYPE(amount)`
5. **Event Listening**: Monitor `Deposited` event
6. **UI Update**: Refresh user stats and ticket count

#### 2. Yield Harvest Flow
```
Harvest Check → VRF Request → Yield Collection → Prize Distribution
      │              │              │                   │
      ▼              ▼              ▼                   ▼
[canHarvest()] [Close Round] [HyperLend Withdraw] [Winner Selection]
```

**Automated Process:**
1. **Harvest Availability**: Check `HARVEST_INTERVAL` cooldown
2. **Yield Calculation**: Query HyperLend for accrued yield
3. **Harvest Execution**: Call `harvestYield()` for incentives
4. **Round Progression**: Automatic round closure when interval expires

#### 3. Round Lifecycle Flow
```
Round Start → Deposits Open → Time Expires → Round Closes → VRF Request → Winner Selected
     │              │               │              │              │              │
     ▼              ▼               ▼              ▼              ▼              ▼
[New Round]  [User Deposits] [LOTTERY_INTERVAL] [closeRound] [Drand VRF] [finalizeRound]
```

### Contract Interaction Patterns

#### Batch Operations
```typescript
// Efficient multi-call pattern
const multicall = [
    lotteryContract.interface.encodeFunctionData("getUserInfo", [address]),
    lotteryContract.interface.encodeFunctionData("getCurrentRoundInfo", []),
    lotteryContract.interface.encodeFunctionData("getStats", [])
];

const results = await multicallContract.aggregate(multicall);
```

#### Event-Driven Updates
```typescript
// Real-time state synchronization
lotteryContract.on('Deposited', (user, amount, tickets) => {
    if (user === currentUser) {
        updateUserStats();
    }
    updateGlobalStats();
});

lotteryContract.on('RoundFinalized', (round, winner, prize) => {
    displayWinnerAnnouncement(round, winner, prize);
    startNewRound();
});
```

## Smart Contract Architecture

### Contract Relationships

```
    ┌─────────────────┐
    │   LotteryVRF    │
    │  (Main Logic)   │
    └─────────────────┘
            │
            │ uses
            ▼
    ┌─────────────────┐       ┌─────────────────┐
    │  DrandVRF_Split │ ◄───► │  BLSVerifier    │
    │  (Randomness)   │ uses  │ (Verification)  │
    └─────────────────┘       └─────────────────┘
            │
            │ integrates
            ▼
    ┌─────────────────┐
    │  Drand Network  │
    │ (External RNG)  │
    └─────────────────┘

    ┌─────────────────┐
    │   HyperLend     │ ◄──── LotteryVRF
    │  (Yield Farm)   │ uses
    └─────────────────┘

    ┌─────────────────┐
    │ Library Helpers │ ◄──── LotteryVRF
    │ Views/Errors    │ uses
    └─────────────────┘
```

### Interface Definitions

#### IPool - HyperLend Integration
```solidity
interface IPool {
    function supply(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16 referralCode
    ) external;
    
    function withdraw(
        address asset,
        uint256 amount,
        address to
    ) external returns (uint256);
}
```

#### IDrandVRF - Randomness Interface
```solidity
interface IDrandVRF {
    function requestRandomness(
        uint256 deadline,
        bytes32 salt,
        address consumer
    ) external returns (uint256 requestId);
}

interface VRFConsumerBase {
    function rawFulfillRandomness(
        uint256 requestId,
        uint256 randomness
    ) external;
}
```

### Library Architecture

#### LotteryViews - Helper Functions
```solidity
library LotteryViews {
    function getCurrentSupplyBalance(
        IProtocolDataProvider dataProvider,
        address asset,
        address user
    ) external view returns (uint256) {
        (uint256 currentHTokenBalance,,,,,,,,) = 
            dataProvider.getUserReserveData(asset, user);
        return currentHTokenBalance;
    }
    
    function getAccruedYield(
        IProtocolDataProvider dataProvider,
        address asset,
        address user,
        uint256 totalDeposits
    ) external view returns (uint256) {
        uint256 currentBalance = getCurrentSupplyBalance(dataProvider, asset, user);
        return currentBalance > totalDeposits ? 
            currentBalance - totalDeposits : 0;
    }
}
```

#### LotteryErrors - Gas-Efficient Errors
```solidity
library LotteryErrors {
    error AmountMustBePositive();
    error InsufficientBalance();
    error InvalidTicketAmount();
    error InsufficientDeposit();
    error RoundNotActive();
    error RoundNotEnded();
    error NoTickets();
    error NoPrize();
    // ... additional error definitions
}
```

## Frontend Architecture

### Technology Stack

#### Core Framework
- **Next.js 14**: React framework with app router
- **TypeScript**: Static type checking
- **React 18**: UI library with concurrent features

#### Styling
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: Component library
- **Lucide Icons**: Icon system

#### Blockchain Integration
- **Wagmi v2**: React hooks for Ethereum
- **Viem**: TypeScript Ethereum library
- **Privy**: Wallet authentication

#### Development Tools
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Husky**: Git hooks

### Component Design System

#### Base Components (shadcn/ui)
```typescript
// Button component with variants
<Button variant="default" size="lg" onClick={handleDeposit}>
    Deposit wHYPE
</Button>

// Input with validation
<Input 
    type="number" 
    placeholder="0.1" 
    value={amount}
    onChange={(e) => setAmount(e.target.value)}
    error={validation.error}
/>

// Card layouts
<Card className="p-6">
    <CardHeader>
        <CardTitle>Your Lottery Tickets</CardTitle>
    </CardHeader>
    <CardContent>
        {/* Content */}
    </CardContent>
</Card>
```

#### Custom Lottery Components
```typescript
// Deposit form with integrated validation
const DepositForm = ({ onDeposit, userBalance, allowance }) => {
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            await onDeposit(parseEther(amount));
        } catch (error) {
            toast.error("Deposit failed: " + error.message);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <form onSubmit={handleSubmit}>
            {/* Form implementation */}
        </form>
    );
};
```

### State Management Patterns

#### Hook-Based Architecture
```typescript
// Contract interaction hooks
const useContracts = () => {
    const { data: walletClient } = useWalletClient();
    const publicClient = usePublicClient();
    
    return useMemo(() => ({
        lottery: getContract({
            address: LOTTERY_ADDRESS,
            abi: LotteryABI,
            client: { public: publicClient, wallet: walletClient }
        }),
        token: getContract({
            address: TOKEN_ADDRESS,
            abi: ERC20ABI,
            client: { public: publicClient, wallet: walletClient }
        })
    }), [publicClient, walletClient]);
};

// Data fetching hooks
const useLotteryData = (address) => {
    const { lottery } = useContracts();
    const [data, setData] = useState(null);
    
    useEffect(() => {
        if (!lottery || !address) return;
        
        const fetchData = async () => {
            const [userInfo, roundInfo] = await Promise.all([
                lottery.read.getUserInfo([address]),
                lottery.read.getCurrentRoundInfo()
            ]);
            
            setData({ userInfo, roundInfo });
        };
        
        fetchData();
    }, [lottery, address]);
    
    return data;
};
```

## Integration Architecture

### HyperLend Protocol Integration

#### Yield Strategy Implementation
```solidity
contract LotteryVRF {
    IPool public immutable hyperLendPool;
    IProtocolDataProvider public immutable dataProvider;
    
    function _supplyToHyperLend(uint256 amount) internal {
        depositToken.safeIncreaseAllowance(address(hyperLendPool), amount);
        hyperLendPool.supply(address(depositToken), amount, address(this), 0);
    }
    
    function _withdrawFromHyperLend(uint256 amount, address to) internal {
        hyperLendPool.withdraw(address(depositToken), amount, to);
    }
    
    function _getCurrentSupplyBalance() internal view returns (uint256) {
        return LotteryViews.getCurrentSupplyBalance(
            dataProvider, 
            address(depositToken), 
            address(this)
        );
    }
    
    function _getAccruedYield() internal view returns (uint256) {
        return LotteryViews.getAccruedYield(
            dataProvider,
            address(depositToken),
            address(this),
            totalDeposits
        );
    }
}
```

#### Risk Management
- **Isolated Position**: Lottery contract has isolated HyperLend position
- **Yield Monitoring**: Continuous yield calculation and validation
- **Emergency Withdrawal**: Owner can withdraw funds in emergencies
- **Supply Balance Verification**: Regular reconciliation of expected vs actual balances

### Drand VRF Integration

#### External Randomness Architecture
```
Lottery Contract → Drand VRF Contract → Drand Network
       │                   │                  │
       ▼                   ▼                  ▼
[Request Random]    [BLS Verification]  [30s Beacon]
       │                   │                  │
       ▼                   ▼                  ▼
[Wait for Fulfill]  [Signature Check]   [Global Rounds]
       │                   │                  │
       ▼                   ▼                  ▼
[Winner Selection]  [Consumer Callback] [Verifiable Output]
```

#### Request Lifecycle
1. **Round Closure**: Lottery requests randomness with future deadline
2. **Drand Monitoring**: VRF contract monitors Drand beacon
3. **Signature Verification**: BLS signature validated on-chain
4. **Consumer Callback**: Randomness delivered to lottery contract
5. **Winner Selection**: Provably fair winner selection using VRF output

## Security Architecture

### Multi-Layer Security Model

#### Layer 1: Smart Contract Security
- **Access Control**: OpenZeppelin Ownable with minimal privileges
- **Reentrancy Protection**: ReentrancyGuard on all state-changing functions
- **Input Validation**: Comprehensive parameter checking
- **Safe Arithmetic**: Solidity 0.8+ overflow protection + SafeERC20

#### Layer 2: Cryptographic Security
- **External Randomness**: Drand beacon eliminates on-chain manipulation
- **BLS Signatures**: Threshold cryptography with distributed trust
- **Verifiable Output**: All randomness requests publicly verifiable

#### Layer 3: Economic Security
- **Incentive Alignment**: Rewards for honest participation
- **Attack Cost Analysis**: Economic unfeasibility of manipulation
- **Yield Integration**: Established protocol reduces smart contract risk

#### Layer 4: Operational Security
- **Monitoring Systems**: Real-time anomaly detection
- **Emergency Procedures**: Pause functionality and fund recovery
- **Upgrade Mechanisms**: Future-proofing with minimal disruption

## Scalability Considerations

### Current Limitations
- **Gas Costs**: Hyperliquid EVM transaction fees
- **Throughput**: Block-time limited operations
- **Storage**: On-chain state for all participants

### Optimization Strategies

#### Gas Optimization
```solidity
// Batch state updates
function depositWHYPE(uint256 amount) external {
    // Single SSTORE operations where possible
    deposits[msg.sender] += amount;
    totalDeposits += amount;
    
    // Use events for historical data
    emit Deposited(msg.sender, amount, newTickets);
}

// Library functions for complex calculations
function getStats() external view returns (...) {
    return LotteryViews.getStats(...);
}
```

#### State Management
```solidity
// Efficient mappings instead of arrays
mapping(address => UserData) public users;
mapping(uint256 => Round) public rounds;

// Pagination for large datasets
function getRecentWinners(uint256 offset, uint256 limit) 
    external view returns (Winner[] memory) {
    // Limited result sets
}
```

### Future Scalability Solutions

#### Layer 2 Integration
- **Optimistic Rollups**: Move computation off-chain
- **State Channels**: Direct participant interactions
- **Sidechains**: Dedicated lottery infrastructure

#### Architecture Evolution
- **Microservice Contracts**: Split functionality across multiple contracts
- **Proxy Patterns**: Upgradeable components
- **Cross-Chain**: Multi-network deployment

## Future Architecture

### Planned Enhancements

#### V2 Protocol Features
- **Multi-Asset Support**: ETH, USDC, and other tokens
- **Dynamic Intervals**: Configurable round durations
- **Yield Strategies**: Multiple DeFi integrations
- **Governance Token**: Community-controlled parameters

#### Technical Roadmap

**Phase 1: Core Enhancement**
- Advanced yield optimization
- Gas usage reduction
- UI/UX improvements
- Mobile application

**Phase 2: Protocol Expansion**
- Multi-chain deployment
- Cross-chain yield aggregation
- NFT integration
- Advanced analytics

**Phase 3: Decentralization**
- Governance token launch
- DAO formation
- Community management
- Protocol owned liquidity

### Architecture Evolution

#### Modular Design
```
┌─────────────────────────────────────────────────────┐
│                    Core Protocol                    │
├─────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │   Lottery   │  │    Yield    │  │ Governance  │  │
│  │   Module    │  │   Module    │  │   Module    │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  │
├─────────────────────────────────────────────────────┤
│                  Integration Layer                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │ HyperLend   │  │    Drand    │  │   Bridge    │  │
│  │Integration  │  │     VRF     │  │  Connectors │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  │
├─────────────────────────────────────────────────────┤
│                    Base Layer                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │   Security  │  │    Utils    │  │   Events    │  │
│  │   Library   │  │   Library   │  │   Library   │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────┘
```

#### Decentralized Architecture
- **DAO Governance**: Community-controlled protocol parameters
- **Multi-Signature**: Distributed control of critical functions
- **Decentralized Frontend**: IPFS-hosted interfaces
- **Protocol Owned Liquidity**: Self-sustaining economic model

## Conclusion

The HyperPool architecture provides a robust, secure, and scalable foundation for no-loss lottery operations. The modular design enables future enhancements while maintaining backward compatibility. The integration of external randomness, yield farming, and modern frontend technologies creates a compelling user experience built on solid technical foundations.

Key architectural strengths:
- **Modular Design**: Clean separation of concerns
- **Security First**: Multiple protection layers
- **External Dependencies**: Battle-tested integrations  
- **User Experience**: Modern web application patterns
- **Future Proof**: Extensible and upgradeable components

The architecture successfully balances security, functionality, and user experience while providing a clear path for future protocol evolution.