# HyperLoops - No-Loss Lottery on HyperLend

A no-loss lottery protocol built on top of HyperLend (Hyperliquid EVM), where users deposit tokens to earn yield while participating in daily lotteries for prizes.

## 🎯 Project Overview

Users deposit wHYPE tokens into our protocol, which automatically supplies them to HyperLend lending pools to earn interest. The accumulated yield is pooled and distributed to winners selected through daily lotteries, ensuring users never lose their principal while having a chance to win prizes.

## 🏗️ Architecture

- **Smart Contracts**: Solidity contracts interfacing with HyperLend (Aave V3 compatible)
- **Yield Source**: HyperLend lending pools (5-20%+ APY)
- **Randomness**: Chainlink VRF (or fallback commit-reveal scheme)
- **Frontend**: Next.js with Hyperliquid EVM wallet integration

## 📦 Current Status - Session 1 Complete ✅

### ✅ Session 1 Achievements (Foundation & Environment Setup)

1. **Hardhat Project Setup**
   - Configured for HyperLiquid EVM (Chain ID: 999 mainnet, 998 testnet)
   - OpenZeppelin contracts integration
   - Proper Solidity 0.8.20 configuration

2. **Smart Contract Foundation**
   - Basic `NoLossLottery` contract with HyperLend interfaces
   - `IPool` interface for HyperLend Pool contract (Aave V3 compatible)
   - `IProtocolDataProvider` interface for reserve data
   - Initial state management and view functions

3. **Contract Features Implemented**
   - ✅ Constructor with HyperLend contract addresses
   - ✅ User tracking structure (deposits, time, tickets)
   - ✅ View functions for supply balance and accrued yield
   - ✅ Participant management system
   - ✅ Emergency pause/unpause functionality
   - ✅ Time-based lottery scheduling

4. **Testing & Deployment**
   - ✅ Comprehensive test suite (12 passing tests)
   - ✅ Local deployment script with contract verification
   - ✅ Gas usage analysis and optimization

### 🔧 HyperLend Integration

**Contract Addresses (Mainnet)**:
- Pool: `0x00A89d7a5A02160f20150EbEA7a2b5E4879A1A8b`
- Data Provider: `0x5481bf8d3946E6A3168640c1D7523eB59F055a29`
- wHYPE Token: `0x5555555555555555555555555555555555555555`

**Key Integration Points**:
- `getCurrentSupplyBalance()` - Gets hToken balance from HyperLend
- `getAccruedYield()` - Calculates yield = supply balance - deposits
- Ready for `supply()` and `withdraw()` calls to HyperLend Pool

### 📋 Next Steps - Session 2 (Deposit/Withdraw Logic)

**Planned Implementation**:
1. `deposit(uint256 amount)` - Transfer wHYPE from user and supply to HyperLend
2. `withdraw(uint256 amount)` - Withdraw from HyperLend and transfer to user
3. User share calculation and time-weighted participation tracking
4. Participant list management and balance updates

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+ recommended, v23 has warnings)
- npm or yarn
- MetaMask or compatible wallet

### Setup
```bash
# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy locally
npx hardhat run scripts/deploy.js

# Deploy to HyperEVM testnet (requires PRIVATE_KEY in .env)
npx hardhat run scripts/deploy.js --network hyperevm_testnet
```

### Environment Configuration
```bash
# Copy and configure environment
cp .env.example .env
# Add your PRIVATE_KEY for testnet/mainnet deployment
```

## 📊 Contract Gas Usage

| Function | Gas Used | Notes |
|----------|----------|-------|
| Deploy | 720,529 | Initial deployment cost |
| pause() | 27,784 | Emergency pause |
| unpause() | 27,743 | Resume operations |

## 🧪 Testing

The contract includes comprehensive tests covering:
- ✅ Deployment and initialization
- ✅ Contract state management
- ✅ Owner permissions and access control
- ✅ Emergency pause functionality
- ✅ Placeholder function reverts (Session 2+ features)

```bash
npx hardhat test
# Output: 12 passing tests
```

## 🎮 Demo Progress

**Session 1 Demo**: ✅ **COMPLETE**
- Contract compiles successfully
- Deploys to local/testnet without errors
- All view functions work correctly
- HyperLend integration interfaces ready
- Emergency controls functional

**What we can demonstrate**:
1. Deploy contract to HyperEVM testnet
2. Verify contract addresses and configuration
3. Show initial state (0 deposits, 0 participants, Round 1)
4. Display time until next lottery
5. Test pause/unpause emergency controls

## 🏛️ HyperLend Protocol Details

- **Based on**: Aave V3.0.2
- **TVL**: $280M+
- **APY Range**: 5-20%+
- **Fees**: Zero deposit/withdrawal fees
- **Flash Loans**: Available at 0.05% fee
- **Supported Assets**: HYPE, wstHYPE, USDC, USDT, USDe, sUSDe

## 📝 Development Roadmap

- [x] **Session 1**: Foundation & Environment Setup
- [ ] **Session 2**: Core Deposit/Withdraw Logic
- [ ] **Session 3**: Yield Harvesting System  
- [ ] **Session 4**: Random Winner Selection
- [ ] **Session 5**: Frontend Foundation
- [ ] **Session 6**: Dashboard & Statistics
- [ ] **Session 7**: Polish & Advanced Features
- [ ] **Session 8**: Final Demo Preparation

---

**Built for Hyperliquid Hackathon** 🚀