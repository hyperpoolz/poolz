# Deployment Guide

## 📋 Overview

This guide covers the complete deployment process for HyperLoops protocol, including smart contract deployment, frontend setup, and production configuration.

## 🛠️ Prerequisites

### System Requirements
- **Node.js**: v18+ (v20 recommended, v23 has warnings)
- **npm**: v9+ or yarn v3+
- **Git**: Latest version
- **MetaMask**: Or compatible Web3 wallet

### Development Tools
- **Hardhat**: Smart contract development framework
- **Next.js 14**: Frontend framework
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling

### Network Access
- **Hyperliquid EVM Testnet**: For testing
- **Hyperliquid EVM Mainnet**: For production
- **HyperLend Protocol**: Yield generation

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/hyperloops/protocol.git
cd protocol
```

### 2. Install Dependencies

#### Smart Contracts
```bash
# Install contract dependencies
npm install

# Install additional tools (optional)
npm install -g hardhat-shorthand
```

#### Frontend Application
```bash
cd frontend
npm install

# Or using yarn
yarn install
```

### 3. Environment Configuration

#### Root Directory (Smart Contracts)
```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
vim .env
```

**Environment Variables:**
```bash
# Deployment Private Keys (KEEP SECURE!)
PRIVATE_KEY=your_private_key_here
TESTNET_PRIVATE_KEY=your_testnet_private_key_here
MAINNET_PRIVATE_KEY=your_mainnet_private_key_here

# Network RPC URLs (optional overrides)
HYPEREVM_TESTNET_RPC=https://api.hyperliquid-testnet.xyz/evm
HYPEREVM_MAINNET_RPC=https://api.hyperliquid.xyz/evm

# Optional: Etherscan API keys (if supported)
ETHERSCAN_API_KEY=your_etherscan_api_key
```

#### Frontend Directory
```bash
cd frontend
cp .env.example .env.local

# Edit frontend environment
vim .env.local
```

**Frontend Environment:**
```bash
# Wallet Connect Project ID
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_wallet_connect_project_id

# Contract Addresses (populated after deployment)
NEXT_PUBLIC_LOTTERY_CONTRACT_MAINNET=
NEXT_PUBLIC_LOTTERY_CONTRACT_TESTNET=

# Optional: Analytics and monitoring
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_SENTRY_DSN=
```

## 🔐 Smart Contract Deployment

### Local Development

#### 1. Start Local Hardhat Network
```bash
npx hardhat node
```
This starts a local blockchain on `http://localhost:8545` with 20 pre-funded accounts.

#### 2. Compile Contracts
```bash
npx hardhat compile
```

#### 3. Deploy to Local Network
```bash
npx hardhat run scripts/deploy.js --network localhost
```

**Expected Output:**
```
Deploying NoLossLottery...
NoLossLottery deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
HyperLend Pool: 0x00A89d7a5A02160f20150EbEA7a2b5E4879A1A8b
Data Provider: 0x5481bf8d3946E6A3168640c1D7523eB59F055a29
wHYPE Token: 0x5555555555555555555555555555555555555555
Gas used: 720,529
```

### Testnet Deployment

#### 1. Get Testnet HYPE
- Request testnet tokens from Hyperliquid faucet
- Ensure sufficient balance for deployment (~0.1 HYPE)

#### 2. Deploy to Testnet
```bash
npx hardhat run scripts/deploy.js --network hyperevm_testnet
```

#### 3. Verify Deployment
```bash
# Check contract on explorer
open https://explorer.hyperliquid-testnet.xyz/address/YOUR_CONTRACT_ADDRESS

# Verify contract interaction
npx hardhat verify --network hyperevm_testnet YOUR_CONTRACT_ADDRESS \
  "0x00A89d7a5A02160f20150EbEA7a2b5E4879A1A8b" \
  "0x5481bf8d3946E6A3168640c1D7523eB59F055a29" \
  "0x5555555555555555555555555555555555555555"
```

### Mainnet Deployment

#### 1. Final Security Check
```bash
# Run comprehensive tests
npx hardhat test

# Analyze gas usage
npx hardhat test --gas-reporter

# Security audit (recommended)
npm run audit
```

#### 2. Deploy to Mainnet
```bash
# CAUTION: This deploys to production
npx hardhat run scripts/deploy.js --network hyperevm_mainnet
```

#### 3. Production Verification
```bash
# Verify on mainnet explorer
open https://explorer.hyperliquid.xyz/address/YOUR_CONTRACT_ADDRESS

# Contract verification
npx hardhat verify --network hyperevm_mainnet YOUR_CONTRACT_ADDRESS \
  "0x00A89d7a5A02160f20150EbEA7a2b5E4879A1A8b" \
  "0x5481bf8d3946E6A3168640c1D7523eB59F055a29" \
  "0x5555555555555555555555555555555555555555"
```

### Deployment Script Details

**`scripts/deploy.js`**:
```javascript
const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying NoLossLottery...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Contract constructor arguments
  const hyperLendPool = "0x00A89d7a5A02160f20150EbEA7a2b5E4879A1A8b";
  const dataProvider = "0x5481bf8d3946E6A3168640c1D7523eB59F055a29"; 
  const depositToken = "0x5555555555555555555555555555555555555555";

  // Deploy contract
  const NoLossLottery = await ethers.getContractFactory("NoLossLottery");
  const lottery = await NoLossLottery.deploy(
    hyperLendPool,
    dataProvider, 
    depositToken
  );

  await lottery.deployed();

  console.log("NoLossLottery deployed to:", lottery.address);
  console.log("HyperLend Pool:", hyperLendPool);
  console.log("Data Provider:", dataProvider);
  console.log("wHYPE Token:", depositToken);
  
  // Estimate gas usage
  const deploymentReceipt = await lottery.deployTransaction.wait();
  console.log("Gas used:", deploymentReceipt.gasUsed.toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

## 🌐 Frontend Deployment

### Development Server

```bash
cd frontend

# Start development server
npm run dev

# Open browser
open http://localhost:3000
```

### Production Build

#### 1. Update Contract Addresses
```bash
# Edit environment variables
vim .env.local
```

```bash
# Add deployed contract addresses
NEXT_PUBLIC_LOTTERY_CONTRACT_MAINNET=0xYourMainnetContractAddress
NEXT_PUBLIC_LOTTERY_CONTRACT_TESTNET=0xYourTestnetContractAddress
```

#### 2. Build Application
```bash
# Create production build
npm run build

# Start production server (optional)
npm start
```

### Deployment Platforms

#### Vercel (Recommended)

1. **Connect Repository:**
   ```bash
   npm i -g vercel
   vercel login
   vercel
   ```

2. **Configure Environment Variables:**
   - Go to Vercel Dashboard
   - Add environment variables:
     - `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID`
     - `NEXT_PUBLIC_LOTTERY_CONTRACT_MAINNET`
     - `NEXT_PUBLIC_LOTTERY_CONTRACT_TESTNET`

3. **Deploy:**
   ```bash
   vercel --prod
   ```

#### Netlify

1. **Build Configuration:**
   ```toml
   # netlify.toml
   [build]
     command = "cd frontend && npm run build"
     publish = "frontend/.next"
   
   [build.environment]
     NODE_VERSION = "18"
   ```

2. **Deploy:**
   ```bash
   npm install -g netlify-cli
   netlify login
   netlify deploy --prod --dir=frontend/.next
   ```

#### Self-Hosted (Docker)

1. **Create Dockerfile:**
   ```dockerfile
   # frontend/Dockerfile
   FROM node:18-alpine AS deps
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   
   FROM node:18-alpine AS builder
   WORKDIR /app
   COPY --from=deps /app/node_modules ./node_modules
   COPY . .
   RUN npm run build
   
   FROM node:18-alpine AS runner
   WORKDIR /app
   ENV NODE_ENV production
   COPY --from=builder /app/.next ./.next
   COPY --from=builder /app/public ./public
   COPY --from=builder /app/package.json ./package.json
   
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

2. **Build and Deploy:**
   ```bash
   docker build -t hyperloops-frontend ./frontend
   docker run -p 3000:3000 -e NEXT_PUBLIC_LOTTERY_CONTRACT_MAINNET=0x... hyperloops-frontend
   ```

## 🧪 Testing Deployment

### Smart Contract Testing

#### Comprehensive Test Suite
```bash
# Run all tests
npx hardhat test

# Run specific test files
npx hardhat test test/NoLossLottery.test.js
npx hardhat test test/NoLossLottery.allocation.test.js

# Generate gas report
npx hardhat test --gas-reporter

# Coverage report
npx hardhat coverage
```

#### Integration Testing
```bash
# Test against deployed contracts
npx hardhat test --network hyperevm_testnet
```

### Frontend Testing

#### Unit Tests
```bash
cd frontend

# Run Jest tests
npm run test

# Run tests with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

#### E2E Testing (Future)
```bash
# Install Cypress
npm install -D cypress

# Run E2E tests
npm run e2e

# Headless mode
npm run e2e:headless
```

### Manual Testing Checklist

#### Smart Contract
- [ ] Contract deploys successfully
- [ ] Constructor parameters set correctly
- [ ] Owner functions work (pause/unpause)
- [ ] View functions return expected data
- [ ] Integration with HyperLend working

#### Frontend
- [ ] Application loads without errors
- [ ] Wallet connection works
- [ ] Contract interaction successful
- [ ] UI responsive on mobile/desktop
- [ ] Error handling works properly

## 🔧 Configuration Management

### Network Configurations

#### Hardhat Config (`hardhat.config.js`)
```javascript
require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    hyperevm_testnet: {
      url: "https://api.hyperliquid-testnet.xyz/evm",
      chainId: 998,
      accounts: process.env.TESTNET_PRIVATE_KEY ? [process.env.TESTNET_PRIVATE_KEY] : [],
    },
    hyperevm_mainnet: {
      url: "https://api.hyperliquid.xyz/evm", 
      chainId: 999,
      accounts: process.env.MAINNET_PRIVATE_KEY ? [process.env.MAINNET_PRIVATE_KEY] : [],
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: 'USD',
  },
};
```

#### Frontend Config (`next.config.js`)
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    appDir: true,
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    return config;
  },
};

module.exports = nextConfig;
```

### Environment Management

#### Development
```bash
# .env.development
NODE_ENV=development
NEXT_PUBLIC_LOTTERY_CONTRACT_TESTNET=0xTestnetAddress
NEXT_PUBLIC_LOTTERY_CONTRACT_MAINNET=
```

#### Production
```bash
# .env.production
NODE_ENV=production
NEXT_PUBLIC_LOTTERY_CONTRACT_MAINNET=0xMainnetAddress
NEXT_PUBLIC_LOTTERY_CONTRACT_TESTNET=0xTestnetAddress
```

## 🚨 Security Considerations

### Private Key Management
```bash
# NEVER commit private keys to version control
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore

# Use hardware wallets for mainnet deployments
# Consider using multi-sig contracts for ownership
```

### Smart Contract Security
```bash
# Run static analysis
npx hardhat check

# Audit with Slither (if available)
slither contracts/NoLossLottery.sol

# Gas optimization
npx hardhat size-contracts
```

### Frontend Security
```bash
# Check for vulnerabilities
npm audit

# Fix critical vulnerabilities
npm audit fix

# Update dependencies
npm update
```

## 📊 Monitoring & Analytics

### Contract Monitoring
```bash
# Monitor contract events
npx hardhat console --network hyperevm_mainnet
```

```javascript
// In Hardhat console
const contract = await ethers.getContractAt("NoLossLottery", "0xYourContractAddress");
const filter = contract.filters.LotteryExecuted();
const events = await contract.queryFilter(filter, -100); // Last 100 blocks
console.log(events);
```

### Frontend Analytics

#### PostHog Integration
```typescript
// utils/analytics.ts
import posthog from 'posthog-js';

if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: 'https://app.posthog.com',
  });
}

export { posthog };
```

#### Error Monitoring (Sentry)
```typescript
// next.config.js
const { withSentryConfig } = require('@sentry/nextjs');

const nextConfig = {
  // ... other config
};

module.exports = withSentryConfig(
  nextConfig,
  {
    silent: true,
    org: 'hyperloops',
    project: 'frontend',
  },
  {
    hideSourceMaps: true,
  }
);
```

## 🔄 Updates & Maintenance

### Smart Contract Updates
```bash
# Deploy new version (contracts are immutable)
npx hardhat run scripts/deployV2.js --network hyperevm_mainnet

# Update frontend to use new contract
vim frontend/.env.production
```

### Frontend Updates
```bash
# Update dependencies
npm update

# Deploy updated frontend
vercel --prod
```

### Database Migrations (Future)
```bash
# When adding off-chain data storage
npx prisma migrate deploy
npx prisma generate
```

## 📚 Troubleshooting

### Common Issues

#### Contract Deployment Fails
```bash
# Check account balance
npx hardhat console --network hyperevm_testnet
await ethers.provider.getBalance("YOUR_ADDRESS")

# Verify network configuration
npx hardhat verify-network --network hyperevm_testnet
```

#### Frontend Build Errors
```bash
# Clear cache
rm -rf frontend/.next
rm -rf frontend/node_modules
cd frontend && npm install

# Check TypeScript
npm run type-check
```

#### Transaction Failures
```bash
# Increase gas limit
const tx = await contract.deposit({ gasLimit: 500000 });

# Check network congestion
npx hardhat console --network hyperevm_mainnet
await ethers.provider.getGasPrice()
```

### Support Resources
- **GitHub Issues**: [Report deployment issues](https://github.com/hyperloops/protocol/issues)
- **Discord**: [Community support](https://discord.gg/hyperloops)
- **Documentation**: [Complete docs](https://docs.hyperloops.com)

---

**Next**: Explore [Technical Specifications](./06-TECHNICAL-SPECS.md) for detailed protocol mechanics.