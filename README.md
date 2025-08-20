# HyperPool - No-Loss Lottery Protocol

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Hardhat](https://img.shields.io/badge/Built%20with-Hardhat-yellow)](https://hardhat.org/)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js-blue)](https://nextjs.org/)

> A decentralized no-loss lottery protocol built on Hyperliquid, where players never lose their principal investment and compete to win yield generated from DeFi strategies.

## 🎯 Overview

HyperPool is an innovative lottery system where participants deposit wHYPE tokens to earn tickets for periodic draws. Unlike traditional lotteries, users can withdraw their deposits anytime while remaining eligible to win prizes generated from yield farming strategies. The protocol uses verifiable randomness (VRF) for fair winner selection and automatically compounds yield through HyperLend integration.

### Key Features

- **🔒 No Principal Loss**: Withdraw your deposit anytime
- **💰 Yield Farming**: Deposits automatically earn yield through HyperLend
- **🎲 Fair Randomness**: Uses Drand VRF for provably fair winner selection
- **⚡ Auto-Compounding**: Continuous yield harvesting into prize pools
- **🎟️ Proportional Tickets**: More deposits = better odds
- **💎 Incentivized Actions**: Earn rewards for calling harvest/close/finalize

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Smart          │    │   HyperLend     │
│   (Next.js)     │◄──►│   Contracts      │◄──►│   Protocol      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                               │
                               ▼
                       ┌──────────────────┐
                       │   Drand VRF      │
                       │   (Randomness)   │
                       └──────────────────┘
```

### Smart Contracts

- **`LotteryVRF.sol`**: Main lottery logic with VRF integration
- **`DrandVRF_Split.sol`**: Drand-based verifiable randomness
- **`BLSVerifier.sol`**: BLS signature verification for Drand
- **Libraries**: Helper contracts for views, errors, and calculations

### Frontend

- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components  
- **Web3**: Wagmi + Viem for blockchain interactions
- **Auth**: Privy for wallet connection and authentication

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Yarn or npm
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/hyperpoolz/hyperloops.git
cd hyperloops

# Install dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration
```

### Development

```bash
# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy locally
npx hardhat node
npx hardhat run scripts/deploy-simple.js --network localhost

# Start frontend development server
cd frontend
npm run dev
```

Visit `http://localhost:3000` to see the application.

### Production Deployment

```bash
# Deploy to Hyperliquid mainnet
HYPERLEND_POOL="0x00A89d7a5A02160f20150EbEA7a2b5E4879A1A8b" \
HYPERLEND_DATA_PROVIDER="0x5481bf8d3946E6A3168640c1D7523eB59F055a29" \
WHYPE_TOKEN="0x5555555555555555555555555555555555555555" \
npx hardhat run scripts/deploy-final.js --network hyperevm_mainnet
```

## 💡 How It Works

### For Users

1. **Deposit**: Add wHYPE tokens to enter the lottery
2. **Earn Tickets**: Receive lottery tickets proportional to deposit (1 ticket per 0.1 wHYPE)
3. **Wait**: Deposits automatically earn yield through HyperLend
4. **Win**: Be selected in periodic draws to win accumulated yield
5. **Withdraw**: Remove deposits anytime without penalty

### Protocol Flow

1. **Yield Generation**: User deposits supply liquidity to HyperLend
2. **Harvesting**: Anyone can call `harvestYield()` to collect yield into prize pool
3. **Round Closure**: When rounds end, `closeRound()` requests randomness from Drand VRF
4. **Winner Selection**: VRF provides random number for proportional winner selection
5. **Prize Distribution**: Winner receives yield minus small incentive fee

### Randomness & Security

- **Drand VRF**: Uses BLS signatures from Drand beacon for verifiable randomness
- **BN254 Curve**: Optimized elliptic curve cryptography for efficient verification
- **No Blockhash**: Eliminates miner manipulation through external randomness source
- **Transparent Process**: All randomness requests and fulfillments are on-chain

## 🔧 Configuration

### Environment Variables

```bash
# Blockchain Configuration
RPC_URL=https://api.hyperliquid-testnet.xyz/evm
PRIVATE_KEY=your_private_key_here

# Contract Addresses
HYPERLEND_POOL=0x00A89d7a5A02160f20150EbEA7a2b5E4879A1A8b
HYPERLEND_DATA_PROVIDER=0x5481bf8d3946E6A3168640c1D7523eB59F055a29
WHYPE_TOKEN=0x5555555555555555555555555555555555555555

# Frontend Configuration
NEXT_PUBLIC_CHAIN_ID=998
NEXT_PUBLIC_PROJECT_ID=your_walletconnect_project_id
```

### Contract Parameters

```solidity
uint256 public constant TICKET_UNIT = 1e17;        // 0.1 wHYPE per ticket
uint256 public constant LOTTERY_INTERVAL = 10 minutes;  // Round duration
uint256 public constant HARVEST_INTERVAL = 10 minutes;  // Min harvest delay
uint256 public constant INCENTIVE_BPS = 100;        // 1% incentive fee
```

## 📚 Documentation

Detailed documentation is available in the `/docs` folder:

- [📋 Project Overview](docs/01-PROJECT-OVERVIEW.md)
- [📜 Smart Contracts](docs/02-SMART-CONTRACTS.md) 
- [🖥️ Frontend Guide](docs/03-FRONTEND.md)
- [🔌 API Integration](docs/04-API-INTEGRATION.md)
- [🚀 Deployment Guide](docs/05-DEPLOYMENT.md)
- [⚙️ Technical Specifications](docs/06-TECHNICAL-SPECS.md)
- [👩‍💻 Development Guide](docs/07-DEVELOPMENT.md)
- [🧪 Testing Guide](docs/08-TESTING.md)

## 🧪 Testing

```bash
# Run all tests
npx hardhat test

# Run specific test suites
npx hardhat test test/NoLossLotteryV2.test.js
npx hardhat test test/integration.test.js

# Generate coverage report
npx hardhat coverage

# Gas usage analysis
npx hardhat test --gas-reporter
```

## 🛡️ Security

### Auditing Status

- ⏳ **Pending**: Professional security audit in progress
- ✅ **Completed**: Comprehensive internal testing
- ✅ **Completed**: Formal verification of critical functions
- ✅ **Completed**: Extensive integration testing

### Security Features

- **ReentrancyGuard**: Prevents reentrancy attacks
- **Access Controls**: Owner-only functions for emergency operations
- **Input Validation**: Comprehensive parameter checking
- **Safe Math**: OpenZeppelin SafeERC20 for token operations
- **External Randomness**: Eliminates on-chain manipulation vectors

### Bug Bounty

We welcome security researchers to review our code. Please report vulnerabilities responsibly to security@hyperpool.xyz.

## 🤝 Contributing

We welcome contributions from the community! Please see our [Contributing Guide](docs/09-CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes with tests
4. Run the test suite: `npm test`
5. Commit with conventional commits: `git commit -m 'feat: add amazing feature'`
6. Push to your branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 🌐 Deployment Addresses

### Hyperliquid Mainnet

```
Lottery Contract: [Deployed Address]
VRF Contract: [Deployed Address]  
BLS Verifier: [Deployed Address]
```

### Hyperliquid Testnet

```
Lottery Contract: [Deployed Address]
VRF Contract: [Deployed Address]
BLS Verifier: [Deployed Address]
```

## 📊 Statistics

- **Total Value Locked**: $X.XX
- **Active Participants**: XXX users  
- **Rounds Completed**: XX rounds
- **Total Prizes Distributed**: $X.XX
- **Average APY**: XX.X%

## 🗓️ Roadmap

### Q1 2024
- [x] Core protocol development
- [x] VRF integration with Drand
- [x] Frontend implementation
- [ ] Security audit completion
- [ ] Mainnet launch

### Q2 2024  
- [ ] Multi-asset support
- [ ] Advanced yield strategies
- [ ] Mobile app release
- [ ] Governance token launch

### Q3 2024
- [ ] Cross-chain expansion
- [ ] Automated yield optimization
- [ ] NFT integration
- [ ] Advanced analytics dashboard

## 📞 Support & Community

- **Discord**: [Join our community](https://discord.gg/hyperpool)
- **Telegram**: [Official channel](https://t.me/hyperpool)  
- **Twitter**: [@HyperPoolXYZ](https://twitter.com/hyperpoolxyz)
- **Email**: support@hyperpool.xyz

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This protocol is experimental software. Users should understand the risks involved with DeFi protocols including but not limited to smart contract bugs, economic attacks, and regulatory changes. Never invest more than you can afford to lose.

---

**Built with ❤️ for the Hyperliquid ecosystem**

For questions, suggestions, or support, please reach out to our community channels or create an issue in this repository.