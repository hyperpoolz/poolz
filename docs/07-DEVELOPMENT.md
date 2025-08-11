# Development Guide

## 📋 Overview

This guide provides developers with everything needed to contribute to HyperLoops, including local development setup, coding standards, testing procedures, and contribution guidelines.

## 🛠️ Development Environment Setup

### Prerequisites

#### Required Software
```bash
# Node.js (v18+ recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# Yarn (optional, but recommended)
npm install -g yarn

# Git
# Download from https://git-scm.com/

# VS Code (recommended IDE)
# Download from https://code.visualstudio.com/
```

#### Recommended VS Code Extensions
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "JuanBlanco.solidity",
    "NomicFoundation.hardhat-solidity",
    "ms-vscode.vscode-json"
  ]
}
```

### Repository Setup

#### 1. Clone and Install
```bash
# Clone the repository
git clone https://github.com/hyperloops/protocol.git
cd protocol

# Install smart contract dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

#### 2. Environment Configuration
```bash
# Copy environment templates
cp .env.example .env
cp frontend/.env.example frontend/.env.local

# Generate a development private key (DO NOT USE IN PRODUCTION)
npx hardhat run scripts/generateDevKey.js
```

#### 3. Local Blockchain Setup
```bash
# Terminal 1: Start local Hardhat node
npx hardhat node

# Terminal 2: Deploy contracts to local network
npx hardhat run scripts/deploy.js --network localhost

# Terminal 3: Start frontend development server
cd frontend && npm run dev
```

### Development Workflow

#### Branch Strategy
```bash
# Main branches
main        # Production-ready code
develop     # Integration branch for features
hotfix/*    # Critical production fixes
feature/*   # New feature development
bugfix/*    # Bug fixes

# Example workflow
git checkout -b feature/yield-optimization
# ... make changes ...
git commit -m "feat: optimize yield distribution algorithm"
git push origin feature/yield-optimization
# ... create pull request ...
```

#### Commit Conventions
We follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Format: <type>[optional scope]: <description>

# Examples:
feat: add user yield allocation preferences
fix: resolve lottery ticket distribution bug  
docs: update API integration guide
test: add comprehensive lottery execution tests
refactor: optimize gas usage in harvest function
chore: update dependencies to latest versions
```

## 🏗️ Project Structure Deep Dive

### Smart Contracts (`/contracts`)
```
contracts/
├── NoLossLottery.sol          # Main protocol contract
├── interfaces/
│   ├── IPool.sol              # HyperLend Pool interface
│   ├── IProtocolDataProvider.sol  # HyperLend data interface
│   └── IWETHLike.sol          # Wrapped token interface
└── mocks/
    ├── MockERC20.sol          # Testing token contract
    └── MockPool.sol           # Testing pool contract
```

### Frontend Application (`/frontend`)
```
frontend/src/
├── app/                       # Next.js app router
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Landing page
│   ├── app/
│   │   └── page.tsx          # Main application
│   └── analytics/
│       └── page.tsx          # Analytics dashboard
├── components/               # React components
│   ├── common/              # Reusable components
│   ├── layout/              # Layout components
│   └── lottery/             # Protocol-specific components
├── hooks/                   # Custom React hooks
├── utils/                   # Utility functions
├── config/                  # Configuration files
├── types/                   # TypeScript type definitions
└── contexts/                # React context providers
```

### Testing Structure (`/test`)
```
test/
├── NoLossLottery.test.js         # Core contract tests
├── NoLossLottery.allocation.test.js  # Yield allocation tests
├── fixtures/
│   └── deployFixture.js         # Test deployment setup
└── helpers/
    └── testUtils.js             # Testing utilities
```

## 🧪 Testing Framework

### Smart Contract Testing

#### Running Tests
```bash
# Run all tests
npx hardhat test

# Run specific test file
npx hardhat test test/NoLossLottery.test.js

# Run with gas reporting
npx hardhat test --gas-reporter

# Run with coverage
npx hardhat coverage
```

#### Test Structure Example
```javascript
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("NoLossLottery", function () {
  async function deployFixture() {
    const [owner, user1, user2] = await ethers.getSigners();
    
    // Deploy contract with test parameters
    const NoLossLottery = await ethers.getContractFactory("NoLossLottery");
    const lottery = await NoLossLottery.deploy(
      "0x00A89d7a5A02160f20150EbEA7a2b5E4879A1A8b", // HyperLend Pool
      "0x5481bf8d3946E6A3168640c1D7523eB59F055a29", // Data Provider
      "0x5555555555555555555555555555555555555555"  // wHYPE token
    );
    
    return { lottery, owner, user1, user2 };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { lottery, owner } = await loadFixture(deployFixture);
      expect(await lottery.owner()).to.equal(owner.address);
    });
  });

  describe("Deposits", function () {
    it("Should accept valid deposits", async function () {
      const { lottery, user1 } = await loadFixture(deployFixture);
      const amount = ethers.parseEther("100");
      
      await expect(lottery.connect(user1).depositWHYPE(amount))
        .to.emit(lottery, "Deposited")
        .withArgs(user1.address, amount, anyValue);
    });
  });
});
```

### Frontend Testing

#### Component Testing Setup
```bash
cd frontend

# Install testing dependencies
npm install --save-dev jest @testing-library/react @testing-library/jest-dom

# Run tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

#### Example Component Test
```typescript
// __tests__/DepositForm.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { DepositForm } from '../src/components/lottery/DepositForm';

// Mock wagmi hooks
jest.mock('wagmi', () => ({
  useAccount: () => ({ isConnected: true, address: '0x123...' }),
  useReadContract: () => ({ data: BigInt('1000000000000000000') }),
}));

describe('DepositForm', () => {
  it('renders deposit form when wallet connected', () => {
    render(<DepositForm />);
    
    expect(screen.getByText('Deposit wHYPE')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument();
    expect(screen.getByText('MAX')).toBeInTheDocument();
  });

  it('handles amount input changes', () => {
    render(<DepositForm />);
    
    const input = screen.getByPlaceholderText('0.00');
    fireEvent.change(input, { target: { value: '100' } });
    
    expect(input.value).toBe('100');
  });
});
```

## 🎨 Code Style & Standards

### Solidity Style Guide

#### Contract Structure
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IPool.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ContractName
 * @notice Brief description of what this contract does
 * @dev Detailed implementation notes
 */
contract ContractName is Ownable {
    // State variables
    uint256 public constant MAX_VALUE = 1000;
    mapping(address => uint256) public balances;
    
    // Events
    event BalanceUpdated(address indexed user, uint256 newBalance);
    
    // Modifiers
    modifier validAmount(uint256 amount) {
        require(amount > 0, "Amount must be positive");
        _;
    }
    
    // Constructor
    constructor(address initialOwner) Ownable(initialOwner) {}
    
    // External functions
    function updateBalance(uint256 amount) external validAmount(amount) {
        balances[msg.sender] = amount;
        emit BalanceUpdated(msg.sender, amount);
    }
    
    // Internal functions
    function _internalFunction() internal pure returns (uint256) {
        return 42;
    }
}
```

#### Naming Conventions
```solidity
// Variables: camelCase
uint256 public totalDeposits;
mapping(address => UserInfo) public userInfo;

// Functions: camelCase
function calculateYield() external view returns (uint256) {}

// Constants: UPPER_SNAKE_CASE
uint256 public constant LOTTERY_INTERVAL = 1 days;

// Events: PascalCase
event YieldHarvested(uint256 amount);

// Modifiers: camelCase
modifier onlyParticipant() { _; }
```

### TypeScript Style Guide

#### Component Structure
```typescript
// components/ExampleComponent.tsx
import React, { useState, useCallback } from 'react';
import { Card, Button } from '@nextui-org/react';
import { useContract } from '../hooks/useContract';

interface ExampleComponentProps {
  title: string;
  amount?: bigint;
  onAction?: (result: boolean) => void;
}

export const ExampleComponent: React.FC<ExampleComponentProps> = ({
  title,
  amount = 0n,
  onAction,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { deposit } = useContract();

  const handleDeposit = useCallback(async () => {
    if (!amount) return;
    
    try {
      setIsLoading(true);
      const result = await deposit(amount.toString());
      onAction?.(true);
    } catch (error) {
      console.error('Deposit failed:', error);
      onAction?.(false);
    } finally {
      setIsLoading(false);
    }
  }, [amount, deposit, onAction]);

  return (
    <Card className="p-6">
      <h3 className="text-xl font-bold mb-4">{title}</h3>
      <Button 
        onPress={handleDeposit}
        isLoading={isLoading}
        isDisabled={amount === 0n}
      >
        Deposit {formatEther(amount)} wHYPE
      </Button>
    </Card>
  );
};
```

#### Hook Patterns
```typescript
// hooks/useExample.ts
import { useState, useEffect, useCallback } from 'react';
import { useContract } from './useContract';

interface UseExampleReturn {
  data: ExampleData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useExample = (): UseExampleReturn => {
  const [data, setData] = useState<ExampleData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { contractState } = useContract();

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch logic here
      const result = await someAsyncOperation();
      setData(result);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [contractState]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
};
```

### Prettier Configuration
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

### ESLint Configuration
```json
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

## 🔧 Debugging & Development Tools

### Smart Contract Debugging

#### Hardhat Console
```bash
# Start interactive console
npx hardhat console --network localhost

# Example usage
const contract = await ethers.getContractAt("NoLossLottery", "0x5FbDB...");
const totalDeposits = await contract.totalDeposits();
console.log("Total deposits:", ethers.formatEther(totalDeposits));
```

#### Gas Profiling
```javascript
// In test files
const tx = await contract.depositWHYPE(amount);
const receipt = await tx.wait();
console.log("Gas used:", receipt.gasUsed.toString());
```

### Frontend Debugging

#### React Developer Tools
```bash
# Install browser extension
# Chrome: React Developer Tools
# Firefox: React Developer Tools

# Enable profiler for performance debugging
# Components tab -> Profiler tab
```

#### Web3 Debugging
```typescript
// Debug contract calls
import { useReadContract } from 'wagmi';

const { data, error, isError } = useReadContract({
  address: contractAddress,
  abi: CONTRACT_ABI,
  functionName: 'totalDeposits',
  query: { 
    enabled: !!contractAddress,
    onError: (err) => console.error('Contract call failed:', err)
  },
});

if (isError) {
  console.error('Read contract error:', error);
}
```

### Performance Monitoring

#### Bundle Analysis
```bash
cd frontend

# Analyze bundle size
npm run build
npm run analyze

# Monitor build size
npm install -g bundlesize
bundlesize
```

#### Performance Testing
```typescript
// Performance monitoring hook
const usePerformanceMonitor = () => {
  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        console.log('Performance entry:', entry);
      });
    });
    
    observer.observe({ entryTypes: ['measure', 'navigation'] });
    
    return () => observer.disconnect();
  }, []);
};
```

## 🚀 Deployment & CI/CD

### GitHub Actions Workflow
```yaml
# .github/workflows/ci.yml
name: CI/CD

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test-contracts:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run contract tests
        run: npx hardhat test
      
      - name: Generate coverage report
        run: npx hardhat coverage

  test-frontend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./frontend
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test
      
      - name: Build application
        run: npm run build

  deploy:
    if: github.ref == 'refs/heads/main'
    needs: [test-contracts, test-frontend]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to production
        run: echo "Deploy to production"
```

### Pre-commit Hooks
```bash
# Install husky for git hooks
npm install -D husky lint-staged

# Configure package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{js,ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.sol": ["prettier --write"]
  }
}
```

## 📚 Resources & References

### Documentation
- [Hardhat Documentation](https://hardhat.org/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Wagmi Documentation](https://wagmi.sh/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)

### Community
- **Discord**: [Join our developer community](https://discord.gg/hyperloops)
- **GitHub Discussions**: [Technical discussions](https://github.com/hyperloops/protocol/discussions)
- **Stack Overflow**: Tag questions with `hyperloops`

### Learning Resources
- [Ethereum Development Course](https://ethereum.org/developers)
- [React Documentation](https://react.dev/)
- [Solidity by Example](https://solidity-by-example.org/)
- [Web3 Development Guide](https://web3.career/)

---

**Ready to contribute? Check out our [Contributing Guidelines](./09-CONTRIBUTING.md) to get started!**