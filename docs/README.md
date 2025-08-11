# HyperLoops Protocol Documentation

Welcome to the comprehensive documentation for HyperLoops - a revolutionary no-loss lottery protocol built on Hyperliquid EVM.

## 📋 Documentation Structure

This documentation is organized into several sections to help you understand, deploy, and contribute to the HyperLoops protocol:

### Core Documentation
- **[Project Overview](./01-PROJECT-OVERVIEW.md)** - High-level introduction and architecture
- **[Smart Contracts](./02-SMART-CONTRACTS.md)** - Complete smart contract documentation
- **[Frontend Application](./03-FRONTEND.md)** - Frontend structure and components
- **[API Integration](./04-API-INTEGRATION.md)** - HyperLend and blockchain integration
- **[Deployment Guide](./05-DEPLOYMENT.md)** - Complete deployment instructions
- **[Technical Specifications](./06-TECHNICAL-SPECS.md)** - Detailed technical documentation

### Development Resources
- **[Development Guide](./07-DEVELOPMENT.md)** - Setup and development workflow
- **[Testing Guide](./08-TESTING.md)** - Testing strategies and implementation
- **[Contributing](./09-CONTRIBUTING.md)** - Guidelines for contributors
- **[FAQ](./10-FAQ.md)** - Frequently asked questions

### Reference Materials
- **[API Reference](./reference/API-REFERENCE.md)** - Complete API documentation
- **[Contract ABI](./reference/CONTRACT-ABI.md)** - Smart contract ABIs
- **[Network Configuration](./reference/NETWORKS.md)** - Network and contract addresses
- **[Changelog](./reference/CHANGELOG.md)** - Version history and updates

## 🚀 Quick Start

If you're new to HyperLoops, start with:

1. **[Project Overview](./01-PROJECT-OVERVIEW.md)** - Understand what HyperLoops is and how it works
2. **[Deployment Guide](./05-DEPLOYMENT.md)** - Get the protocol running locally
3. **[Development Guide](./07-DEVELOPMENT.md)** - Start contributing to the protocol

## 🎯 What is HyperLoops?

HyperLoops is a no-loss lottery protocol built on Hyperliquid EVM that allows users to:

- **Deposit wHYPE tokens** and earn 5-20% APY through HyperLend
- **Participate in daily lotteries** without risking their principal
- **Win prizes** funded by the collective yield generated
- **Withdraw their deposits** at any time with full principal protection

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│                 │    │                  │    │                 │
│  Frontend App   │◄──►│  Smart Contract  │◄──►│   HyperLend     │
│   (Next.js)     │    │ (NoLossLottery)  │    │   Protocol      │
│                 │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │                  │
                       │  Lottery System  │
                       │ (Daily Drawings) │
                       │                  │
                       └──────────────────┘
```

## 📊 Protocol Statistics

- **Total Value Locked**: Dynamic based on deposits
- **Yield Source**: HyperLend (5-20% APY)
- **Lottery Frequency**: Daily drawings
- **Principal Risk**: Zero (no-loss guarantee)
- **Supported Asset**: wHYPE token

## 🔗 Important Links

- **Mainnet Contract**: [View on Explorer](https://explorer.hyperliquid.xyz)
- **Testnet Contract**: [View on Testnet Explorer](https://explorer.hyperliquid-testnet.xyz)
- **HyperLend Documentation**: [docs.hyperlend.finance](https://docs.hyperlend.finance)
- **Hyperliquid EVM Docs**: [Hyperliquid Gitbook](https://hyperliquid.gitbook.io/hyperliquid-docs/hyperevm)

## 🛠️ Built With

- **Blockchain**: Hyperliquid EVM (Chain ID: 999 mainnet, 998 testnet)
- **Smart Contracts**: Solidity 0.8.20, OpenZeppelin
- **Frontend**: Next.js 14, React 18, TypeScript
- **Web3 Integration**: Wagmi, Viem, RainbowKit
- **Yield Source**: HyperLend (Aave V3 compatible)
- **UI Components**: NextUI, Tailwind CSS, Framer Motion

## 📞 Support & Community

- **GitHub Issues**: [Report bugs or request features](https://github.com/hyperloops/protocol/issues)
- **Discord**: [Join our community](https://discord.gg/hyperloops)
- **Twitter**: [@hyperloops](https://twitter.com/hyperloops)

---

**Built for Hyperliquid Hackathon 🚀**

*This documentation is continuously updated. Last updated: January 2025*