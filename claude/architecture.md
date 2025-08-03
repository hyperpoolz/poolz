# Architecture Standards & Technical Guidelines

## System Architecture Overview

### Core Components
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend UI   │───▶│ NoLossLottery   │───▶│   HyperLend     │
│   (Next.js)     │    │   Contract      │    │   Protocol      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └─────────────▶│  Wallet Layer   │◀─────────────┘
                        │  (MetaMask)     │
                        └─────────────────┘
```

### Data Flow
1. **User Deposit**: Frontend → Wallet → NoLossLottery → HyperLend Pool
2. **Yield Generation**: HyperLend → Interest Accrual → Available for Harvest
3. **Lottery Process**: Harvest Yield → Prize Pool → Random Selection → Winner Payout
4. **User Withdrawal**: NoLossLottery → HyperLend → User Wallet

## Smart Contract Architecture

### Core Contract Structure
```solidity
contract NoLossLottery {
    // State Management
    mapping(address => UserInfo) public users;
    address[] public participants;
    uint256 public totalDeposits;
    uint256 public prizePool;
    
    // HyperLend Integration
    IPool public hyperLendPool;
    IProtocolDataProvider public dataProvider;
    IERC20 public depositToken;
    
    // Core Functions
    function deposit(uint256 amount) external;
    function withdraw(uint256 amount) external;
    function harvestYield() external;
    function executeLottery() external;
}
```

### Interface Standards
- **IPool**: HyperLend Pool interface (Aave V3 compatible)
- **IProtocolDataProvider**: For querying reserve data and user balances
- **IERC20**: Standard token interface for wHYPE interactions

### Security Patterns
- **ReentrancyGuard**: Prevent reentrancy attacks
- **Pausable**: Emergency pause functionality
- **Ownable**: Admin controls for critical functions
- **SafeERC20**: Safe token transfers

## Frontend Architecture

### Technology Stack
- **Framework**: Next.js 14+ with TypeScript
- **Styling**: Tailwind CSS with custom Hyperliquid theme
- **Web3**: ethers.js v6 for blockchain interactions
- **State**: React hooks + Context for simple state management
- **UI Components**: Custom components following Hyperliquid design system

### Component Structure
```
/components
├── layout/
│   ├── Header.tsx
│   ├── Footer.tsx
│   └── Navigation.tsx
├── lottery/
│   ├── DepositForm.tsx
│   ├── WithdrawForm.tsx
│   ├── LotteryStatus.tsx
│   └── WinnerAnnouncement.tsx
├── dashboard/
│   ├── UserStats.tsx
│   ├── PoolStats.tsx
│   └── TransactionHistory.tsx
└── common/
    ├── WalletConnector.tsx
    ├── LoadingSpinner.tsx
    └── ErrorBoundary.tsx
```

### Design System Standards

#### Color Palette (Hyperliquid Inspired)
```css
:root {
  --primary-bg: #0a0a0b;
  --secondary-bg: #1a1a1b;
  --accent: #00d4aa;
  --accent-hover: #00b896;
  --text-primary: #ffffff;
  --text-secondary: #a0a0a0;
  --border: #2a2a2b;
  --success: #00d4aa;
  --warning: #ffa726;
  --error: #ef5350;
}
```

#### Typography
- **Headers**: Inter, 600 weight
- **Body**: Inter, 400 weight
- **Monospace**: JetBrains Mono for addresses and numbers

#### Component Standards
- **Buttons**: Rounded corners (8px), consistent padding
- **Cards**: Dark background, subtle borders, shadow effects
- **Forms**: Clear labels, validation states, loading indicators
- **Tables**: Zebra striping, sortable headers, responsive design

## Network Configuration

### HyperLiquid EVM Networks
```javascript
const networks = {
  hyperevm_testnet: {
    chainId: 998,
    rpcUrl: "https://api.hyperliquid-testnet.xyz/evm",
    blockExplorer: "https://hyperliquid-testnet.explorer.com"
  },
  hyperevm_mainnet: {
    chainId: 999,
    rpcUrl: "https://api.hyperliquid.xyz/evm",
    blockExplorer: "https://hyperliquid.explorer.com"
  }
};
```

### Contract Addresses
```javascript
const contracts = {
  // HyperLend Protocol
  hyperLendPool: "0x00A89d7a5A02160f20150EbEA7a2b5E4879A1A8b",
  dataProvider: "0x5481bf8d3946E6A3168640c1D7523eB59F055a29",
  
  // Tokens
  wHYPE: "0x5555555555555555555555555555555555555555",
  
  // Our Contracts (deployed per session)
  noLossLottery: "TBD_AFTER_DEPLOYMENT"
};
```

## Testing Strategy

### Test Categories
1. **Unit Tests**: Individual function testing
2. **Integration Tests**: Contract interaction testing  
3. **E2E Tests**: Full user flow testing (Session 7+)
4. **Gas Tests**: Optimization and cost analysis

### Test Structure
```javascript
describe("NoLossLottery", () => {
  describe("Deployment", () => {
    // Constructor, initial state
  });
  
  describe("Deposit Functionality", () => {
    // deposit(), balance updates, HyperLend integration
  });
  
  describe("Withdrawal Functionality", () => {
    // withdraw(), balance validation, participant removal
  });
  
  describe("Lottery System", () => {
    // harvestYield(), executeLottery(), winner selection
  });
});
```

## Performance Standards

### Smart Contract Metrics
- **Gas Limit**: < 300k gas per transaction
- **Deploy Cost**: < 1M gas
- **Storage Optimization**: Pack structs efficiently

### Frontend Performance
- **Load Time**: < 2 seconds initial load
- **Wallet Connection**: < 1 second
- **Transaction Feedback**: Immediate UI updates
- **Real-time Updates**: WebSocket or polling every 10s

## Security Requirements

### Smart Contract Security
- **Access Control**: Proper role-based permissions
- **Input Validation**: Validate all user inputs
- **Overflow Protection**: Use SafeMath or Solidity 0.8+
- **External Calls**: Checks-Effects-Interactions pattern

### Frontend Security
- **Environment Variables**: Never expose private keys
- **RPC Endpoints**: Use secure, rate-limited endpoints
- **User Input**: Sanitize and validate all inputs
- **Wallet Integration**: Handle disconnections gracefully

## Development Workflow

### Session-Based Development
1. **Planning**: Update session plan file
2. **Implementation**: Code following architecture standards
3. **Testing**: Write and run tests
4. **Documentation**: Update README and session status
5. **Demo Prep**: Ensure deployable and demonstrable

### Code Quality Checks
- **Linting**: ESLint for TypeScript, Solhint for Solidity
- **Testing**: 90%+ coverage requirement
- **Gas Analysis**: Monitor and optimize gas usage
- **Documentation**: Comment complex logic

This architecture serves as the foundation for all development decisions throughout the 8 sessions.