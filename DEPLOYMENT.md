# Deployment Guide

This comprehensive guide covers deploying HyperPool smart contracts to Hyperliquid networks, from local development to mainnet production.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)  
- [Network Configuration](#network-configuration)
- [Deployment Scripts](#deployment-scripts)
- [Step-by-Step Deployment](#step-by-step-deployment)
- [Verification](#verification)
- [Post-Deployment](#post-deployment)
- [Troubleshooting](#troubleshooting)
- [Security Checklist](#security-checklist)

## Overview

HyperPool uses a multi-contract architecture requiring careful deployment sequencing:

1. **Libraries**: Helper contracts (LotteryViews, etc.)
2. **VRF System**: BLS Verifier + Drand VRF contracts  
3. **Main Contract**: LotteryVRF with all dependencies
4. **Verification**: Contract source code verification
5. **Initialization**: Setting up initial parameters

## Prerequisites

### Development Environment

```bash
# Required software
node.js >= 18
npm or yarn
git

# Install dependencies
npm install

# Environment setup
cp .env.example .env
```

### Environment Variables

```bash
# Network RPC
RPC_URL=https://api.hyperliquid-testnet.xyz/evm  # testnet
# RPC_URL=https://api.hyperliquid.xyz/evm        # mainnet

# Deployment wallet
PRIVATE_KEY=your_private_key_here

# HyperLend Protocol Addresses
HYPERLEND_POOL=0x00A89d7a5A02160f20150EbEA7a2b5E4879A1A8b
HYPERLEND_DATA_PROVIDER=0x5481bf8d3946E6A3168640c1D7523eB59F055a29
WHYPE_TOKEN=0x5555555555555555555555555555555555555555

# Optional: Etherscan API for verification
ETHERSCAN_API_KEY=your_api_key
```

### Funding Requirements

Ensure deployment wallet has sufficient HYPE for gas:

| Network | Estimated Cost | Recommended Balance |
|---------|---------------|-------------------|
| Testnet | 0.5 HYPE     | 2 HYPE           |
| Mainnet | 1.0 HYPE     | 5 HYPE           |

## Network Configuration

### Hardhat Configuration

The project includes pre-configured networks in `hardhat.config.js`:

```javascript
networks: {
  hyperevm_testnet: {
    url: process.env.RPC_URL || "https://api.hyperliquid-testnet.xyz/evm",
    accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    chainId: 998,
    gasPrice: 1000000000,
  },
  hyperevm_mainnet: {
    url: process.env.RPC_URL || "https://api.hyperliquid.xyz/evm", 
    accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    chainId: 999,
    gasPrice: 1000000000,
  }
}
```

### Network Details

| Network | Chain ID | RPC Endpoint | Explorer |
|---------|----------|-------------|----------|
| Testnet | 998 | https://api.hyperliquid-testnet.xyz/evm | https://testnet.hyperevmscan.io |
| Mainnet | 999 | https://api.hyperliquid.xyz/evm | https://hyperevmscan.io |

## Deployment Scripts

The project includes multiple deployment scripts optimized for different scenarios:

### Core Deployment Scripts

#### `deploy-final.js` - Production Ready
**Recommended for mainnet deployment**

- Deploys optimized contract versions
- Uses pre-deployed libraries for gas efficiency
- Includes comprehensive validation
- Saves deployment metadata
- Provides verification commands

**Usage:**
```bash
# Mainnet deployment
HYPERLEND_POOL="0x00A89d7a5A02160f20150EbEA7a2b5E4879A1A8b" \
HYPERLEND_DATA_PROVIDER="0x5481bf8d3946E6A3168640c1D7523eB59F055a29" \
WHYPE_TOKEN="0x5555555555555555555555555555555555555555" \
npx hardhat run scripts/deploy-final.js --network hyperevm_mainnet
```

#### `deploy-simple.js` - Development
**Recommended for testing and development**

- Minimal deployment for local testing
- Includes mock contracts for development
- Quick deployment without optimization
- Useful for rapid iteration

**Usage:**
```bash
# Local development
npx hardhat run scripts/deploy-simple.js --network localhost

# Testnet testing
npx hardhat run scripts/deploy-simple.js --network hyperevm_testnet
```

#### `deploy-v2-optimized.js` - Gas Optimized
**Production deployment with maximum optimization**

- Library pattern for reduced contract size
- Optimized for thousands of users
- VRF integration with Drand
- Advanced gas optimizations

**Usage:**
```bash
HYPERLEND_POOL="0x00A89d7a5A02160f20150EbEA7a2b5E4879A1A8b" \
HYPERLEND_DATA_PROVIDER="0x5481bf8d3946E6A3168640c1D7523eB59F055a29" \
WHYPE_TOKEN="0x5555555555555555555555555555555555555555" \
npx hardhat run scripts/deploy-v2-optimized.js --network hyperevm_mainnet
```

### Specialized Scripts

#### `deploy-v2-micro.js` - Minimal Version
- Stripped-down version for size constraints
- Essential features only
- Fastest deployment

#### `deploy-v2-bigblocks.js` - Large Block Support
- Optimized for networks with large block gas limits
- Single-transaction deployment
- Maximum feature set

#### Helper Scripts

- **`addresses.js`**: Contract address management
- **`drand-helper.js`**: VRF utilities and testing
- **`fulfill-vrf.js`**: Manual VRF fulfillment for testing
- **`enable-big-blocks.js`**: Network optimization utilities

## Step-by-Step Deployment

### 1. Pre-Deployment Preparation

```bash
# 1. Compile contracts
npx hardhat compile

# 2. Run tests
npx hardhat test

# 3. Check network connection
npx hardhat run scripts/addresses.js --network hyperevm_testnet

# 4. Verify environment variables
node -e "
console.log('Pool:', process.env.HYPERLEND_POOL);
console.log('Provider:', process.env.HYPERLEND_DATA_PROVIDER);  
console.log('Token:', process.env.WHYPE_TOKEN);
console.log('Key set:', !!process.env.PRIVATE_KEY);
"
```

### 2. Testnet Deployment (Recommended First)

```bash
# Deploy to testnet first
HYPERLEND_POOL="0x00A89d7a5A02160f20150EbEA7a2b5E4879A1A8b" \
HYPERLEND_DATA_PROVIDER="0x5481bf8d3946E6A3168640c1D7523eB59F055a29" \
WHYPE_TOKEN="0x5555555555555555555555555555555555555555" \
npx hardhat run scripts/deploy-final.js --network hyperevm_testnet
```

**Expected Output:**
```
Final deployment of NoLossLotteryV2Slim on HyperEVM Testnet...

Using deployed LotteryViews library: 0x9102Be4967859b4b01d46DEc95A55d2746C1D13C
HyperLend addresses:
- Pool: 0x00A89d7a5A02160f20150EbEA7a2b5E4879A1A8b
- Data Provider: 0x5481bf8d3946E6A3168640c1D7523eB59F055a29
- wHYPE Token: 0x5555555555555555555555555555555555555555

Deployer: 0x1234567890123456789012345678901234567890
Balance: 5.0 HYPE

Deploying NoLossLotteryV2Slim with library...
Gas estimate for main contract: 2847291
Gas with buffer: 3416749
✅ NoLossLotteryV2Slim deployed to: 0xabcdefabcdefabcdefabcdefabcdefabcdefabcd

=== DEPLOYMENT SUCCESS ===
NoLossLotteryV2Slim: 0xabcdefabcdefabcdefabcdefabcdefabcdefabcd
LotteryViews Library: 0x9102Be4967859b4b01d46Dec95A55d2746C1D13C

Contract Configuration:
- TICKET_UNIT: 100000000000000000 wei (0.1 wHYPE)
- LOTTERY_INTERVAL: 600 seconds (10 minutes)  
- HARVEST_INTERVAL: 600 seconds (10 minutes)
- INCENTIVE_BPS: 100 bps (1%)
- Current Round: 1
- Owner: 0x1234567890123456789012345678901234567890

💾 Deployment info saved to: hyperevm_testnet_v2_slim_final_1699123456789.json

🎉 DEPLOYMENT COMPLETE!
```

### 3. Testing Deployed Contract

```bash
# Verify deployment worked
npx hardhat console --network hyperevm_testnet

# In console:
const lottery = await ethers.getContractAt("LotteryVRF", "DEPLOYED_ADDRESS");
console.log("Current round:", await lottery.currentRound());
console.log("Total tickets:", await lottery.totalTickets());
```

### 4. Mainnet Deployment

⚠️ **CRITICAL**: Only proceed after thorough testnet validation

```bash
# Final mainnet deployment
HYPERLEND_POOL="0x00A89d7a5A02160f20150EbEA7a2b5E4879A1A8b" \
HYPERLEND_DATA_PROVIDER="0x5481bf8d3946E6A3168640c1D7523eB59F055a29" \
WHYPE_TOKEN="0x5555555555555555555555555555555555555555" \
npx hardhat run scripts/deploy-final.js --network hyperevm_mainnet
```

## Verification

### Automatic Verification

The deployment script provides verification commands:

```bash
# Verify main contract (example from script output)
npx hardhat verify --network hyperevm_mainnet 0xYOUR_CONTRACT_ADDRESS \
  "0x00A89d7a5A02160f20150EbEA7a2b5E4879A1A8b" \
  "0x5481bf8d3946E6A3168640c1D7523eB59F055a29" \
  "0x5555555555555555555555555555555555555555" \
  --libraries contracts/libraries/LotteryViews.sol:LotteryViews:0xLIBRARY_ADDRESS
```

### Manual Verification

If automatic verification fails:

```bash
# Create flattened source file
npx hardhat flatten contracts/LotteryVRF.sol > flattened.sol

# Remove duplicate SPDX licenses and pragma statements
# Submit flattened.sol to block explorer manually
```

### Verification Checklist

- [ ] Contract source matches deployed bytecode
- [ ] Constructor parameters correct
- [ ] Library addresses properly linked
- [ ] All external interfaces verified
- [ ] Contract ownership confirmed

## Post-Deployment

### 1. Contract Initialization

```javascript
// Connect to deployed contract
const lottery = await ethers.getContractAt("LotteryVRF", DEPLOYED_ADDRESS);

// Verify initial state
console.log("Owner:", await lottery.owner());
console.log("Current round:", await lottery.currentRound());
console.log("Ticket unit:", await lottery.TICKET_UNIT());

// Optional: Set custom parameters (owner only)
// await lottery.setUserAllocationBps(5000); // 50% allocation example
```

### 2. Integration Testing

Create comprehensive integration tests:

```bash
# Test basic functionality
node scripts/integration-test.js --network hyperevm_testnet --contract 0xYOUR_ADDRESS

# Test with small deposit
npx hardhat run scripts/test-deposit.js --network hyperevm_testnet

# Test yield harvesting
npx hardhat run scripts/test-harvest.js --network hyperevm_testnet
```

### 3. Frontend Configuration

Update frontend configuration with deployed addresses:

```javascript
// frontend/src/lib/contracts.ts
export const contractAddresses = {
  lotteryContract: "0xYOUR_LOTTERY_ADDRESS",
  vrfContract: "0xYOUR_VRF_ADDRESS", 
  blsVerifier: "0xYOUR_BLS_ADDRESS",
  depositToken: "0x5555555555555555555555555555555555555555",
  hyperLendPool: "0x00A89d7a5A02160f20150EbEA7a2b5E4879A1A8b",
  dataProvider: "0x5481bf8d3946E6A3168640c1D7523eB59F055a29"
};
```

### 4. Monitoring Setup

Set up monitoring for key metrics:

```javascript
// Monitor deposits
lottery.on('Deposited', (user, amount, tickets) => {
  console.log(`Deposit: ${user} deposited ${amount} for ${tickets} tickets`);
});

// Monitor winners
lottery.on('RoundFinalized', (round, winner, prize) => {
  console.log(`Winner: Round ${round} won by ${winner} for ${prize}`);
});

// Monitor errors
lottery.on('error', (error) => {
  console.error('Contract error:', error);
  // Alert system integration
});
```

## Troubleshooting

### Common Deployment Issues

#### 1. Gas Limit Exceeded

**Error**: `Transaction reverted without a reason string`

**Solutions**:
```bash
# Use optimized deployment script
npx hardhat run scripts/deploy-v2-micro.js --network hyperevm_mainnet

# Or increase gas limit manually
const contract = await Contract.deploy(...args, { gasLimit: 5000000 });
```

#### 2. Library Linking Failed

**Error**: `Missing library: LotteryViews`

**Solutions**:
```bash
# Deploy library first
npx hardhat run scripts/test-deploy-library.js --network hyperevm_mainnet

# Use correct library address in main deployment
```

#### 3. Constructor Parameters Wrong

**Error**: `Invalid constructor parameters`

**Check**:
```bash
# Verify addresses are valid
node -e "console.log('Valid address:', /^0x[a-fA-F0-9]{40}$/.test('0x...'))"

# Verify contracts exist at addresses
npx hardhat run scripts/verify-addresses.js --network hyperevm_mainnet
```

#### 4. Insufficient Balance

**Error**: `insufficient funds for gas * price + value`

**Solutions**:
```bash
# Check balance
npx hardhat run --network hyperevm_mainnet -e "
  console.log('Balance:', await ethers.provider.getBalance('0xYOUR_ADDRESS'));
"

# Fund wallet with more HYPE
```

### Verification Issues

#### 1. Library Not Found

**Error**: `Contract library not found`

**Solution**:
```bash
# Verify library first
npx hardhat verify --network hyperevm_mainnet 0xLIBRARY_ADDRESS

# Then verify main contract with library parameter
```

#### 2. Source Mismatch  

**Error**: `Source code does not match bytecode`

**Solutions**:
- Ensure exact Solidity version match
- Check optimizer settings match deployment
- Verify all imports are identical

### Runtime Issues

#### 1. Contract Not Responding

```bash
# Test contract is deployed
npx hardhat run --network hyperevm_mainnet -e "
  const code = await ethers.provider.getCode('0xYOUR_ADDRESS');
  console.log('Contract exists:', code !== '0x');
"

# Test basic function
const lottery = await ethers.getContractAt('LotteryVRF', '0xYOUR_ADDRESS');
console.log('Current round:', await lottery.currentRound());
```

#### 2. Transaction Reverts

```bash
# Use debugging to understand reverts
const tx = await lottery.depositWHYPE(amount, { gasLimit: 500000 });
const receipt = await tx.wait();
console.log('Transaction receipt:', receipt);
```

## Security Checklist

### Pre-Deployment Security

- [ ] **Code Review**: Complete security audit of all contracts
- [ ] **Test Coverage**: >95% test coverage achieved
- [ ] **Dependency Audit**: All dependencies security-reviewed
- [ ] **Access Control**: Owner functions properly restricted
- [ ] **Reentrancy**: All functions protected against reentrancy
- [ ] **Integer Overflow**: SafeMath or Solidity 0.8+ used
- [ ] **External Calls**: All external calls handled safely

### Deployment Security

- [ ] **Private Key**: Secure key management (hardware wallet recommended)
- [ ] **Network**: Correct network selected (testnet vs mainnet)
- [ ] **Parameters**: All constructor parameters validated
- [ ] **Gas Price**: Reasonable gas price set
- [ ] **Verification**: Contract source code verified on explorer

### Post-Deployment Security

- [ ] **Owner Transfer**: Owner transferred to secure multisig (if applicable)
- [ ] **Emergency Functions**: Emergency pause tested and accessible
- [ ] **Monitoring**: Real-time monitoring for suspicious activity
- [ ] **Incident Response**: Response plan for security incidents
- [ ] **Backup Access**: Backup access methods secured
- [ ] **Documentation**: Incident response procedures documented

### Operational Security

- [ ] **Key Management**: Production keys stored in hardware wallets
- [ ] **Access Control**: Limited team access to production systems  
- [ ] **Monitoring**: 24/7 monitoring of contract activity
- [ ] **Alerting**: Automated alerts for unusual activity
- [ ] **Backup Plans**: Contingency plans for various scenarios

## Advanced Deployment Scenarios

### Multi-Signature Deployment

For enhanced security, deploy through a multisig wallet:

```bash
# Deploy to multisig first, then execute
# Requires coordination between multiple signers
```

### Upgradeable Deployment

Using OpenZeppelin's proxy pattern:

```bash
# Deploy implementation
# Deploy proxy
# Initialize through proxy
```

### Cross-Chain Deployment

For multi-chain deployment:

```bash
# Deploy on each supported chain
# Ensure consistent addresses where possible
# Update frontend for multi-chain support
```

This comprehensive deployment guide ensures secure, successful deployment of HyperPool contracts across all Hyperliquid network environments.