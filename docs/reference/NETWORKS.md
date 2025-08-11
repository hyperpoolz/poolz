# Network Configuration Reference

## 📋 Overview

This document provides comprehensive network configuration details for deploying and interacting with HyperLoops across different Hyperliquid EVM environments.

## 🌐 Supported Networks

### Hyperliquid EVM Mainnet

**Network Details:**
```typescript
{
  chainId: 999,
  name: 'Hyperliquid EVM',
  rpcUrl: 'https://api.hyperliquid.xyz/evm',
  blockExplorer: 'https://explorer.hyperliquid.xyz',
  nativeCurrency: {
    name: 'HYPE',
    symbol: 'HYPE',
    decimals: 18,
  },
}
```

**Key Characteristics:**
- **Block Time**: ~1 second
- **Finality**: ~2-3 seconds
- **Gas Price**: Variable, typically very low
- **TPS**: 1000+ transactions per second
- **Status**: Production ready

**Contract Addresses:**
```typescript
{
  hyperLendPool: '0x00A89d7a5A02160f20150EbEA7a2b5E4879A1A8b',
  dataProvider: '0x5481bf8d3946E6A3168640c1D7523eB59F055a29',
  wHYPE: '0x5555555555555555555555555555555555555555',
  noLossLottery: process.env.NEXT_PUBLIC_LOTTERY_CONTRACT_MAINNET,
}
```

### Hyperliquid EVM Testnet

**Network Details:**
```typescript
{
  chainId: 998,
  name: 'Hyperliquid EVM Testnet',
  rpcUrl: 'https://api.hyperliquid-testnet.xyz/evm',
  blockExplorer: 'https://explorer.hyperliquid-testnet.xyz',
  nativeCurrency: {
    name: 'HYPE',
    symbol: 'HYPE',
    decimals: 18,
  },
}
```

**Key Characteristics:**
- **Block Time**: ~1 second
- **Finality**: ~2-3 seconds  
- **Gas Price**: Very low (testnet)
- **TPS**: 1000+ transactions per second
- **Status**: Development and testing

**Contract Addresses:**
```typescript
{
  hyperLendPool: '0x00A89d7a5A02160f20150EbEA7a2b5E4879A1A8b',
  dataProvider: '0x5481bf8d3946E6A3168640c1D7523eB59F055a29',
  wHYPE: '0x5555555555555555555555555555555555555555',
  noLossLottery: process.env.NEXT_PUBLIC_LOTTERY_CONTRACT_TESTNET,
}
```

### Local Development (Hardhat)

**Network Details:**
```typescript
{
  chainId: 31337,
  name: 'Hardhat Local',
  rpcUrl: 'http://localhost:8545',
  blockExplorer: null,
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18,
  },
}
```

**Contract Addresses:**
```typescript
{
  hyperLendPool: '0x00A89d7a5A02160f20150EbEA7a2b5E4879A1A8b', // Mock
  dataProvider: '0x5481bf8d3946E6A3168640c1D7523eB59F055a29', // Mock
  wHYPE: '0x5555555555555555555555555555555555555555', // Mock
  noLossLottery: '0x5FbDB2315678afecb367f032d93F642f64180aa3', // Local deployment
}
```

## 🔧 Wallet Configuration

### MetaMask Setup

#### Adding Hyperliquid EVM Mainnet
```javascript
// Manual addition through MetaMask
const networkConfig = {
  chainId: '0x3E7', // 999 in hex
  chainName: 'Hyperliquid EVM',
  nativeCurrency: {
    name: 'HYPE',
    symbol: 'HYPE',
    decimals: 18
  },
  rpcUrls: ['https://api.hyperliquid.xyz/evm'],
  blockExplorerUrls: ['https://explorer.hyperliquid.xyz']
};

await window.ethereum.request({
  method: 'wallet_addEthereumChain',
  params: [networkConfig]
});
```

#### Adding Hyperliquid EVM Testnet
```javascript
const testnetConfig = {
  chainId: '0x3E6', // 998 in hex
  chainName: 'Hyperliquid EVM Testnet',
  nativeCurrency: {
    name: 'HYPE',
    symbol: 'HYPE',
    decimals: 18
  },
  rpcUrls: ['https://api.hyperliquid-testnet.xyz/evm'],
  blockExplorerUrls: ['https://explorer.hyperliquid-testnet.xyz']
};

await window.ethereum.request({
  method: 'wallet_addEthereumChain',
  params: [testnetConfig]
});
```

#### Programmatic Network Switching
```typescript
const switchToHyperliquid = async (isMainnet: boolean = true) => {
  const chainId = isMainnet ? '0x3E7' : '0x3E6';
  
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId }],
    });
  } catch (switchError) {
    // Network not added, add it first
    if (switchError.code === 4902) {
      const config = isMainnet ? networkConfig : testnetConfig;
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [config],
      });
    }
  }
};
```

## 🛠️ Development Configuration

### Hardhat Configuration

```javascript
// hardhat.config.js
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
      url: "https://rpc.hyperliquid-testnet.xyz/evm",
      chainId: 998,
      accounts: process.env.TESTNET_PRIVATE_KEY ? [process.env.TESTNET_PRIVATE_KEY] : [],
      gasPrice: 1000000000, // 1 gwei
      timeout: 60000,
    },
    hyperevm_mainnet: {
      url: "https://hyperliquid.drpc.org",
      chainId: 999,
      accounts: process.env.MAINNET_PRIVATE_KEY ? [process.env.MAINNET_PRIVATE_KEY] : [],
      gasPrice: 1000000000, // 1 gwei
      timeout: 60000,
    },
  },
  etherscan: {
    apiKey: {
      hyperevm_testnet: "your-api-key",
      hyperevm_mainnet: "your-api-key",
    },
    customChains: [
      {
        network: "hyperevm_testnet",
        chainId: 998,
        urls: {
          apiURL: "https://api.hyperliquid-testnet.xyz/evm",
          browserURL: "https://explorer.hyperliquid-testnet.xyz"
        }
      },
      {
        network: "hyperevm_mainnet", 
        chainId: 999,
        urls: {
          apiURL: "https://api.hyperliquid.xyz/evm",
          browserURL: "https://explorer.hyperliquid.xyz"
        }
      }
    ]
  },
};
```

### Next.js Configuration

```typescript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    appDir: true,
  },
  env: {
    // Network-specific environment variables
    NEXT_PUBLIC_MAINNET_RPC_URL: process.env.NEXT_PUBLIC_MAINNET_RPC_URL,
    NEXT_PUBLIC_TESTNET_RPC_URL: process.env.NEXT_PUBLIC_TESTNET_RPC_URL,
  },
  webpack: (config) => {
    config.resolve.fallback = { 
      fs: false, 
      net: false, 
      tls: false 
    };
    return config;
  },
};

module.exports = nextConfig;
```

### Wagmi Configuration

```typescript
// config/wagmi.ts
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { defineChain } from 'viem';

const hyperEVM = defineChain({
  id: 999,
  name: 'Hyperliquid EVM',
  network: 'hyperliquid',
  nativeCurrency: {
    decimals: 18,
    name: 'HYPE',
    symbol: 'HYPE',
  },
  rpcUrls: {
    default: {
      http: ['https://api.hyperliquid.xyz/evm'],
    },
    public: {
      http: ['https://api.hyperliquid.xyz/evm'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Hyperliquid Explorer',
      url: 'https://explorer.hyperliquid.xyz',
    },
  },
});

const hyperEVMTestnet = defineChain({
  id: 998,
  name: 'Hyperliquid EVM Testnet',
  network: 'hyperliquid-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'HYPE',
    symbol: 'HYPE',
  },
  rpcUrls: {
    default: {
      http: ['https://api.hyperliquid-testnet.xyz/evm'],
    },
    public: {
      http: ['https://api.hyperliquid-testnet.xyz/evm'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Hyperliquid Testnet Explorer',
      url: 'https://explorer.hyperliquid-testnet.xyz',
    },
  },
  testnet: true,
});

export const wagmiConfig = getDefaultConfig({
  appName: 'HyperLoops',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID!,
  chains: [hyperEVMTestnet, hyperEVM],
  ssr: true,
});
```

## 🔗 RPC Endpoints

### Primary Endpoints

**Mainnet:**
```
Primary: https://api.hyperliquid.xyz/evm
Backup: https://hyperliquid.drpc.org
```

**Testnet:**
```
Primary: https://api.hyperliquid-testnet.xyz/evm
Backup: https://rpc.hyperliquid-testnet.xyz/evm
```

### Endpoint Features

**Standard JSON-RPC Methods:**
- `eth_getBalance`
- `eth_sendTransaction`
- `eth_call`
- `eth_getTransactionReceipt`
- `eth_getLogs`
- `eth_getCode`

**Extended Methods:**
- `debug_traceTransaction` (debugging)
- `eth_subscribe` (WebSocket subscriptions)
- `net_version` (network identification)

### Rate Limits

**Public Endpoints:**
- **Requests per second**: 100
- **Daily requests**: 100,000
- **WebSocket connections**: 10 concurrent

**Private/Paid Endpoints:**
- **Requests per second**: 1000+
- **Daily requests**: Unlimited
- **WebSocket connections**: 100+ concurrent

## 📊 Network Monitoring

### Health Check Endpoints

```typescript
// Network health monitoring
const checkNetworkHealth = async (rpcUrl: string) => {
  try {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 1,
      }),
    });
    
    const data = await response.json();
    return {
      healthy: !!data.result,
      blockNumber: parseInt(data.result, 16),
      latency: Date.now() - start,
    };
  } catch (error) {
    return { healthy: false, error: error.message };
  }
};
```

### Performance Metrics

**Typical Performance:**
- **Block Time**: ~1 second
- **Transaction Confirmation**: 2-3 blocks
- **Gas Price**: 1-10 gwei
- **Transaction Throughput**: 1000+ TPS

**Monitoring Tools:**
- [Hyperliquid Network Stats](https://stats.hyperliquid.xyz)
- [Block Explorer](https://explorer.hyperliquid.xyz)
- Custom monitoring dashboards

## 🔐 Security Considerations

### RPC Security

**Best Practices:**
```typescript
// Use environment variables for sensitive data
const rpcUrl = process.env.NEXT_PUBLIC_MAINNET_RPC_URL;

// Implement retry logic for failed requests
const withRetry = async (fn: () => Promise<any>, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
};

// Validate responses
const validateRpcResponse = (response: any) => {
  if (response.error) {
    throw new Error(`RPC Error: ${response.error.message}`);
  }
  return response.result;
};
```

### Private Key Management

**Development:**
```bash
# Use separate keys for different environments
TESTNET_PRIVATE_KEY=0x...
MAINNET_PRIVATE_KEY=0x...

# Never commit private keys to version control
echo ".env" >> .gitignore
```

**Production:**
```bash
# Use environment variables in production
export MAINNET_PRIVATE_KEY=$SECURE_PRIVATE_KEY

# Consider using hardware wallets for high-value operations
# Implement multi-sig for protocol ownership
```

## 🚀 Deployment Scripts

### Environment-Specific Deployment

```bash
# Deploy to testnet
npx hardhat run scripts/deploy.js --network hyperevm_testnet

# Deploy to mainnet (requires confirmation)
npx hardhat run scripts/deploy.js --network hyperevm_mainnet

# Verify contracts
npx hardhat verify --network hyperevm_mainnet CONTRACT_ADDRESS "constructor_arg1" "constructor_arg2"
```

### Multi-Network Deployment Script

```javascript
// scripts/deploy-multi.js
const { ethers, network } = require("hardhat");

const NETWORK_CONFIG = {
  hyperevm_testnet: {
    hyperLendPool: '0x00A89d7a5A02160f20150EbEA7a2b5E4879A1A8b',
    dataProvider: '0x5481bf8d3946E6A3168640c1D7523eB59F055a29',
    depositToken: '0x5555555555555555555555555555555555555555',
  },
  hyperevm_mainnet: {
    hyperLendPool: '0x00A89d7a5A02160f20150EbEA7a2b5E4879A1A8b',
    dataProvider: '0x5481bf8d3946E6A3168640c1D7523eB59F055a29',
    depositToken: '0x5555555555555555555555555555555555555555',
  },
};

async function main() {
  const networkName = network.name;
  const config = NETWORK_CONFIG[networkName];
  
  if (!config) {
    throw new Error(`No configuration found for network: ${networkName}`);
  }
  
  console.log(`Deploying to ${networkName}...`);
  
  const NoLossLottery = await ethers.getContractFactory("NoLossLottery");
  const lottery = await NoLossLottery.deploy(
    config.hyperLendPool,
    config.dataProvider,
    config.depositToken
  );
  
  await lottery.deployed();
  
  console.log(`NoLossLottery deployed to: ${lottery.address}`);
  console.log(`Network: ${networkName} (${network.config.chainId})`);
  console.log(`Block Explorer: ${network.config.blockExplorer || 'N/A'}`);
}

main().catch(console.error);
```

## 📋 Troubleshooting

### Common Network Issues

**Connection Timeouts:**
```typescript
// Increase timeout in provider configuration
const provider = new ethers.JsonRpcProvider(rpcUrl, {
  timeout: 60000, // 60 seconds
});
```

**Gas Estimation Failures:**
```typescript
// Override gas settings
const tx = await contract.someFunction({
  gasLimit: 500000,
  gasPrice: ethers.parseUnits('2', 'gwei'),
});
```

**RPC Errors:**
```typescript
// Implement fallback RPC endpoints
const RPC_ENDPOINTS = [
  'https://api.hyperliquid.xyz/evm',
  'https://hyperliquid.drpc.org',
];

const getWorkingProvider = async () => {
  for (const endpoint of RPC_ENDPOINTS) {
    try {
      const provider = new ethers.JsonRpcProvider(endpoint);
      await provider.getBlockNumber(); // Test connection
      return provider;
    } catch (error) {
      continue;
    }
  }
  throw new Error('No working RPC endpoint found');
};
```

---

**This network configuration reference provides everything needed to deploy and interact with HyperLoops across all supported Hyperliquid EVM environments.**