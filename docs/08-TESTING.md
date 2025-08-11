# Testing Guide

## 📋 Overview

This comprehensive testing guide covers all aspects of testing the HyperLoops protocol, from smart contract unit tests to frontend integration testing and end-to-end user flows.

## 🏗️ Testing Architecture

### Test Structure Overview
```
test/
├── smart-contracts/
│   ├── unit/                    # Unit tests for individual functions
│   ├── integration/             # Cross-contract integration tests  
│   ├── fixtures/                # Shared test setup and fixtures
│   └── helpers/                 # Testing utilities and helpers
├── frontend/
│   ├── components/              # Component unit tests
│   ├── hooks/                   # Custom hook tests
│   ├── integration/             # Integration tests
│   └── e2e/                     # End-to-end tests
└── shared/
    ├── constants.js             # Test constants
    └── utils.js                 # Cross-platform utilities
```

### Testing Philosophy

#### Test Pyramid
```
    /\     E2E Tests (Few)
   /  \    - User journey flows
  /____\   - Critical path validation
 /      \  
/________\  Integration Tests (Some)
|        |  - Contract interactions
|        |  - Component integration
|________|  
|        |  Unit Tests (Many)
|        |  - Function-level testing
|        |  - Edge case coverage
|________|  - Fast feedback loop
```

## 🧪 Smart Contract Testing

### Test Environment Setup

#### Hardhat Configuration (`hardhat.config.js`)
```javascript
require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
      allowUnlimitedContractSize: true,
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: 'USD',
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
  mocha: {
    timeout: 60000, // 60 seconds
  },
};
```

#### Test Dependencies
```json
{
  "devDependencies": {
    "@nomicfoundation/hardhat-toolbox": "^6.1.0",
    "@nomicfoundation/hardhat-network-helpers": "^1.0.0",
    "chai": "^4.3.0",
    "ethers": "^6.0.0",
    "hardhat-gas-reporter": "^1.0.0",
    "solidity-coverage": "^0.8.0"
  }
}
```

### Core Contract Tests

#### Deployment & Initialization Tests
```javascript
// test/NoLossLottery.deployment.test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("NoLossLottery - Deployment", function () {
  async function deployLotteryFixture() {
    const [owner, user1, user2] = await ethers.getSigners();
    
    // Mock contract addresses (HyperLend integration)
    const hyperLendPool = "0x00A89d7a5A02160f20150EbEA7a2b5E4879A1A8b";
    const dataProvider = "0x5481bf8d3946E6A3168640c1D7523eB59F055a29";
    const depositToken = "0x5555555555555555555555555555555555555555";
    
    // Deploy main contract
    const NoLossLottery = await ethers.getContractFactory("NoLossLottery");
    const lottery = await NoLossLottery.deploy(
      hyperLendPool,
      dataProvider,
      depositToken
    );
    
    return { lottery, owner, user1, user2, hyperLendPool, dataProvider, depositToken };
  }

  describe("Constructor", function () {
    it("Should set correct contract addresses", async function () {
      const { lottery, hyperLendPool, dataProvider, depositToken } = await loadFixture(deployLotteryFixture);
      
      expect(await lottery.hyperLendPool()).to.equal(hyperLendPool);
      expect(await lottery.dataProvider()).to.equal(dataProvider);
      expect(await lottery.depositToken()).to.equal(depositToken);
    });

    it("Should set correct initial state", async function () {
      const { lottery } = await loadFixture(deployLotteryFixture);
      
      expect(await lottery.totalDeposits()).to.equal(0);
      expect(await lottery.prizePool()).to.equal(0);
      expect(await lottery.currentRound()).to.equal(1);
      expect(await lottery.totalTickets()).to.equal(0);
      expect(await lottery.getParticipantCount()).to.equal(0);
    });

    it("Should set correct owner", async function () {
      const { lottery, owner } = await loadFixture(deployLotteryFixture);
      
      expect(await lottery.owner()).to.equal(owner.address);
    });

    it("Should not be paused initially", async function () {
      const { lottery } = await loadFixture(deployLotteryFixture);
      
      expect(await lottery.paused()).to.be.false;
    });
  });

  describe("Constructor Validation", function () {
    it("Should revert with invalid pool address", async function () {
      const NoLossLottery = await ethers.getContractFactory("NoLossLottery");
      
      await expect(NoLossLottery.deploy(
        ethers.ZeroAddress,
        "0x5481bf8d3946E6A3168640c1D7523eB59F055a29",
        "0x5555555555555555555555555555555555555555"
      )).to.be.revertedWith("Invalid pool address");
    });

    it("Should revert with invalid data provider", async function () {
      const NoLossLottery = await ethers.getContractFactory("NoLossLottery");
      
      await expect(NoLossLottery.deploy(
        "0x00A89d7a5A02160f20150EbEA7a2b5E4879A1A8b",
        ethers.ZeroAddress,
        "0x5555555555555555555555555555555555555555"
      )).to.be.revertedWith("Invalid data provider address");
    });
  });
});
```

#### Deposit Functionality Tests
```javascript
// test/NoLossLottery.deposits.test.js
describe("NoLossLottery - Deposits", function () {
  async function deployWithMocksFixture() {
    const { lottery, owner, user1, user2 } = await loadFixture(deployLotteryFixture);
    
    // Deploy mock wHYPE token for testing
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const mockToken = await MockERC20.deploy("Mock wHYPE", "wHYPE", 18);
    
    // Mint tokens to users for testing
    await mockToken.mint(user1.address, ethers.parseEther("1000"));
    await mockToken.mint(user2.address, ethers.parseEther("1000"));
    
    return { lottery, mockToken, owner, user1, user2 };
  }

  describe("depositWHYPE", function () {
    it("Should accept valid deposits", async function () {
      const { lottery, mockToken, user1 } = await loadFixture(deployWithMocksFixture);
      const amount = ethers.parseEther("100");
      
      // Approve and deposit
      await mockToken.connect(user1).approve(lottery.address, amount);
      
      await expect(lottery.connect(user1).depositWHYPE(amount))
        .to.emit(lottery, "Deposited")
        .withArgs(user1.address, amount, anyValue);
      
      // Verify state updates
      const userInfo = await lottery.getUserInfo(user1.address);
      expect(userInfo.depositAmount).to.equal(amount);
      expect(await lottery.totalDeposits()).to.equal(amount);
      expect(await lottery.getParticipantCount()).to.equal(1);
    });

    it("Should reject zero amount deposits", async function () {
      const { lottery, user1 } = await loadFixture(deployWithMocksFixture);
      
      await expect(lottery.connect(user1).depositWHYPE(0))
        .to.be.revertedWith("Amount must be greater than 0");
    });

    it("Should reject deposits when paused", async function () {
      const { lottery, mockToken, owner, user1 } = await loadFixture(deployWithMocksFixture);
      const amount = ethers.parseEther("100");
      
      // Pause contract
      await lottery.connect(owner).pause();
      
      await mockToken.connect(user1).approve(lottery.address, amount);
      await expect(lottery.connect(user1).depositWHYPE(amount))
        .to.be.revertedWith("Pausable: paused");
    });

    it("Should handle multiple deposits from same user", async function () {
      const { lottery, mockToken, user1 } = await loadFixture(deployWithMocksFixture);
      const amount1 = ethers.parseEther("100");
      const amount2 = ethers.parseEther("50");
      
      // First deposit
      await mockToken.connect(user1).approve(lottery.address, amount1);
      await lottery.connect(user1).depositWHYPE(amount1);
      
      // Second deposit
      await mockToken.connect(user1).approve(lottery.address, amount2);
      await lottery.connect(user1).depositWHYPE(amount2);
      
      // Verify cumulative amounts
      const userInfo = await lottery.getUserInfo(user1.address);
      expect(userInfo.depositAmount).to.equal(amount1 + amount2);
      expect(await lottery.totalDeposits()).to.equal(amount1 + amount2);
      expect(await lottery.getParticipantCount()).to.equal(1); // Still one participant
    });
  });
});
```

#### Yield Management Tests
```javascript
// test/NoLossLottery.yield.test.js
describe("NoLossLottery - Yield Management", function () {
  describe("harvestYield", function () {
    it("Should distribute yield according to allocation", async function () {
      const { lottery, mockPool, mockToken, user1, user2 } = await loadFixture(deployWithYieldFixture);
      
      // Setup: Users deposit with different allocations
      await setupDepositsWithAllocations(lottery, mockToken, user1, user2);
      
      // Simulate yield generation
      await mockPool.setSupplyBalance(ethers.parseEther("1100")); // 100 wHYPE yield
      
      const tx = await lottery.harvestYield();
      
      // Verify yield distribution
      await expect(tx).to.emit(lottery, "YieldHarvested");
      
      // Check ticket distribution based on allocations
      const user1Tickets = await lottery.getUserTickets(user1.address);
      const user2Tickets = await lottery.getUserTickets(user2.address);
      
      expect(user1Tickets).to.be.gt(0);
      expect(user2Tickets).to.be.gt(0);
    });

    it("Should handle zero yield gracefully", async function () {
      const { lottery, user1 } = await loadFixture(deployWithYieldFixture);
      
      // No yield generated
      const tx = await lottery.harvestYield();
      
      // Should not revert, but no tickets awarded
      expect(await lottery.getTotalTickets()).to.equal(0);
    });
  });

  describe("Yield Allocation", function () {
    it("Should respect user allocation settings", async function () {
      const { lottery, mockToken, user1 } = await loadFixture(deployWithYieldFixture);
      
      // Set 50% allocation to lottery
      await lottery.connect(user1).setUserAllocationBps(5000);
      
      // Verify allocation setting
      expect(await lottery.userAllocationBps(user1.address)).to.equal(5000);
    });

    it("Should reject invalid allocation values", async function () {
      const { lottery, user1 } = await loadFixture(deployWithYieldFixture);
      
      // Try to set allocation > 100%
      await expect(lottery.connect(user1).setUserAllocationBps(10001))
        .to.be.revertedWith("bps>10000");
    });
  });
});
```

#### Lottery Execution Tests
```javascript
// test/NoLossLottery.lottery.test.js
describe("NoLossLottery - Lottery Execution", function () {
  describe("executeLottery", function () {
    it("Should execute lottery when conditions are met", async function () {
      const { lottery, users } = await loadFixture(deployReadyLotteryFixture);
      
      // Fast forward time to lottery execution
      await time.increase(86400); // 1 day
      
      const prizePoolBefore = await lottery.prizePool();
      const currentRound = await lottery.currentRound();
      
      const tx = await lottery.executeLottery();
      
      // Verify lottery execution
      await expect(tx).to.emit(lottery, "LotteryExecuted");
      
      // Verify state changes
      expect(await lottery.prizePool()).to.equal(0); // Prize distributed
      expect(await lottery.currentRound()).to.equal(currentRound + 1n);
      expect(await lottery.getTotalTickets()).to.equal(0); // Tickets reset
    });

    it("Should reject execution before time", async function () {
      const { lottery } = await loadFixture(deployReadyLotteryFixture);
      
      // Try to execute before 24 hours
      await expect(lottery.executeLottery())
        .to.be.revertedWith("Lottery not ready by time");
    });

    it("Should reject execution with no participants", async function () {
      const { lottery } = await loadFixture(deployLotteryFixture);
      
      await time.increase(86400);
      
      await expect(lottery.executeLottery())
        .to.be.revertedWith("No participants");
    });

    it("Should select winner proportional to tickets", async function () {
      const { lottery, users } = await loadFixture(deployReadyLotteryFixture);
      
      // Record ticket distribution before lottery
      const ticketsBefore = [];
      for (const user of users) {
        ticketsBefore.push(await lottery.getUserTickets(user.address));
      }
      
      await time.increase(86400);
      const tx = await lottery.executeLottery();
      
      // Get winner from events
      const receipt = await tx.wait();
      const lotteryEvent = receipt.events?.find(e => e.event === "LotteryExecuted");
      const winner = lotteryEvent?.args?.winner;
      
      expect(winner).to.be.properAddress;
      expect(users.map(u => u.address)).to.include(winner);
    });
  });
});
```

### Advanced Testing Patterns

#### Fuzzing Tests
```javascript
// test/NoLossLottery.fuzz.test.js
const { FuzzTestRunner } = require('./helpers/fuzzRunner');

describe("NoLossLottery - Fuzz Tests", function () {
  it("Should handle random deposit amounts", async function () {
    const runner = new FuzzTestRunner();
    
    for (let i = 0; i < 100; i++) {
      const amount = runner.randomBigInt(1, ethers.parseEther("10000"));
      const { lottery, mockToken, user } = await loadFixture(deployWithMocksFixture);
      
      await mockToken.mint(user.address, amount);
      await mockToken.connect(user).approve(lottery.address, amount);
      
      // Should not revert with any valid amount
      await expect(lottery.connect(user).depositWHYPE(amount))
        .to.not.be.reverted;
      
      // Verify invariants
      expect(await lottery.totalDeposits()).to.equal(amount);
    }
  });
});
```

#### Gas Optimization Tests
```javascript
describe("Gas Optimization", function () {
  it("Should use reasonable gas for deposits", async function () {
    const { lottery, mockToken, user1 } = await loadFixture(deployWithMocksFixture);
    const amount = ethers.parseEther("100");
    
    await mockToken.connect(user1).approve(lottery.address, amount);
    
    const tx = await lottery.connect(user1).depositWHYPE(amount);
    const receipt = await tx.wait();
    
    expect(receipt.gasUsed).to.be.lt(200000); // Should use less than 200k gas
  });

  it("Should optimize gas for multiple participants", async function () {
    const { lottery } = await loadFixture(deployMultiUserFixture);
    
    const tx = await lottery.executeLottery();
    const receipt = await tx.wait();
    
    const participantCount = await lottery.getParticipantCount();
    const gasPerParticipant = receipt.gasUsed / participantCount;
    
    expect(gasPerParticipant).to.be.lt(5000); // Should use less than 5k gas per participant
  });
});
```

### Testing Utilities

#### Custom Matchers
```javascript
// test/helpers/matchers.js
const chai = require("chai");

chai.use(function (chai, utils) {
  chai.Assertion.addProperty('properAddress', function () {
    const obj = this._obj;
    
    this.assert(
      ethers.isAddress(obj),
      'expected #{this} to be a proper Ethereum address',
      'expected #{this} not to be a proper Ethereum address'
    );
  });
});
```

#### Test Fixtures
```javascript
// test/fixtures/deployFixture.js
async function deployCompleteFixture() {
  const [owner, user1, user2, user3] = await ethers.getSigners();
  
  // Deploy mock contracts
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const mockToken = await MockERC20.deploy("Mock wHYPE", "wHYPE", 18);
  
  const MockPool = await ethers.getContractFactory("MockPool");  
  const mockPool = await MockPool.deploy();
  
  // Deploy main contract
  const NoLossLottery = await ethers.getContractFactory("NoLossLottery");
  const lottery = await NoLossLottery.deploy(
    mockPool.address,
    "0x5481bf8d3946E6A3168640c1D7523eB59F055a29",
    mockToken.address
  );
  
  // Setup initial state
  await mockToken.mint(user1.address, ethers.parseEther("1000"));
  await mockToken.mint(user2.address, ethers.parseEther("1000"));
  await mockToken.mint(user3.address, ethers.parseEther("1000"));
  
  return {
    lottery,
    mockToken,
    mockPool,
    owner,
    users: [user1, user2, user3],
  };
}

module.exports = { deployCompleteFixture };
```

## 🌐 Frontend Testing

### React Component Testing

#### Setup (Jest + Testing Library)
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "devDependencies": {
    "@testing-library/react": "^13.4.0",
    "@testing-library/jest-dom": "^5.16.5",
    "@testing-library/user-event": "^14.4.3",
    "jest": "^29.0.0",
    "jest-environment-jsdom": "^29.0.0"
  }
}
```

#### Component Test Example
```typescript
// __tests__/components/DepositForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DepositForm } from '../../src/components/lottery/DepositForm';
import { TestWrapper } from '../helpers/TestWrapper';

// Mock wagmi hooks
jest.mock('wagmi', () => ({
  useAccount: jest.fn(),
  useReadContract: jest.fn(),
  useWriteContract: jest.fn(),
}));

describe('DepositForm', () => {
  const mockUseAccount = require('wagmi').useAccount as jest.Mock;
  const mockUseReadContract = require('wagmi').useReadContract as jest.Mock;
  const mockWriteContract = jest.fn();

  beforeEach(() => {
    mockUseAccount.mockReturnValue({
      isConnected: true,
      address: '0x1234567890123456789012345678901234567890',
      chainId: 999,
    });
    
    mockUseReadContract.mockReturnValue({
      data: BigInt('1000000000000000000'), // 1 wHYPE
    });

    require('wagmi').useWriteContract.mockReturnValue({
      writeContract: mockWriteContract,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly when wallet is connected', () => {
    render(
      <TestWrapper>
        <DepositForm />
      </TestWrapper>
    );

    expect(screen.getByText('Deposit wHYPE')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument();
    expect(screen.getByText('MAX')).toBeInTheDocument();
    expect(screen.getByText('Deposit & Earn')).toBeInTheDocument();
  });

  it('shows wallet connection prompt when not connected', () => {
    mockUseAccount.mockReturnValue({
      isConnected: false,
      address: undefined,
    });

    render(
      <TestWrapper>
        <DepositForm />
      </TestWrapper>
    );

    expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
    expect(screen.getByText('Connect your wallet to start earning yield and winning prizes')).toBeInTheDocument();
  });

  it('handles amount input correctly', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <DepositForm />
      </TestWrapper>
    );

    const input = screen.getByPlaceholderText('0.00');
    
    await user.type(input, '100');
    expect(input).toHaveValue(100);
  });

  it('handles MAX button click', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <DepositForm />
      </TestWrapper>
    );

    const maxButton = screen.getByText('MAX');
    const input = screen.getByPlaceholderText('0.00');

    await user.click(maxButton);
    
    expect(input).toHaveValue(1); // 1 wHYPE from mock
  });

  it('disables deposit button when amount is invalid', () => {
    render(
      <TestWrapper>
        <DepositForm />
      </TestWrapper>
    );

    const depositButton = screen.getByText('Deposit & Earn');
    
    expect(depositButton).toBeDisabled();
  });

  it('calls deposit function when form is submitted', async () => {
    const user = userEvent.setup();
    const mockDeposit = jest.fn().mockResolvedValue('0xtxhash');
    
    // Mock the useContract hook
    jest.doMock('../../src/hooks/useContract', () => ({
      useContract: () => ({
        deposit: mockDeposit,
        isLoading: false,
        refetchAll: jest.fn(),
      }),
    }));

    render(
      <TestWrapper>
        <DepositForm />
      </TestWrapper>
    );

    const input = screen.getByPlaceholderText('0.00');
    const depositButton = screen.getByText('Deposit & Earn');

    await user.type(input, '100');
    await user.click(depositButton);

    await waitFor(() => {
      expect(mockDeposit).toHaveBeenCalledWith('100');
    });
  });
});
```

#### Hook Testing
```typescript
// __tests__/hooks/useContract.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useContract } from '../../src/hooks/useContract';
import { TestWrapper } from '../helpers/TestWrapper';

describe('useContract', () => {
  it('returns correct initial state', () => {
    const { result } = renderHook(() => useContract(), {
      wrapper: TestWrapper,
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.contractState.totalDeposits).toBe(0n);
    expect(result.current.contractState.prizePool).toBe(0n);
  });

  it('handles deposit function correctly', async () => {
    const { result } = renderHook(() => useContract(), {
      wrapper: TestWrapper,
    });

    const depositPromise = result.current.deposit('100');

    // Should set loading state
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });
});
```

### Integration Testing

#### Multi-Component Integration
```typescript
// __tests__/integration/LotteryDashboard.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LotteryDashboard } from '../../src/components/dashboard/LotteryDashboard';
import { TestWrapper } from '../helpers/TestWrapper';

describe('LotteryDashboard Integration', () => {
  it('displays correct information flow', async () => {
    render(
      <TestWrapper>
        <LotteryDashboard />
      </TestWrapper>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/Total Deposits/)).toBeInTheDocument();
      expect(screen.getByText(/Prize Pool/)).toBeInTheDocument();
      expect(screen.getByText(/Your Tickets/)).toBeInTheDocument();
    });

    // Verify interactive elements work
    const depositForm = screen.getByTestId('deposit-form');
    expect(depositForm).toBeInTheDocument();
  });

  it('handles user interactions correctly', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <LotteryDashboard />
      </TestWrapper>
    );

    // Test deposit flow
    const amountInput = screen.getByPlaceholderText('0.00');
    const depositButton = screen.getByText('Deposit & Earn');

    await user.type(amountInput, '100');
    await user.click(depositButton);

    // Verify loading state
    await waitFor(() => {
      expect(screen.getByText(/Depositing.../)).toBeInTheDocument();
    });
  });
});
```

## 🎭 End-to-End Testing

### Cypress Setup

#### Configuration (`cypress.config.js`)
```javascript
const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    video: false,
    screenshot: false,
  },
  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
  },
});
```

#### E2E Test Example
```typescript
// cypress/e2e/lottery-flow.cy.ts
describe('Lottery User Journey', () => {
  beforeEach(() => {
    // Setup test environment
    cy.visit('/');
    cy.connectWallet();
  });

  it('completes full user journey', () => {
    // Navigate to app
    cy.get('[data-testid="launch-app"]').click();
    cy.url().should('include', '/app');

    // Connect wallet and switch network
    cy.get('[data-testid="connect-wallet"]').click();
    cy.switchToHyperliquidTestnet();

    // Make deposit
    cy.get('[data-testid="deposit-amount"]').type('100');
    cy.get('[data-testid="max-button"]').click();
    cy.get('[data-testid="deposit-button"]').click();

    // Confirm transaction
    cy.confirmMetaMaskTransaction();

    // Verify deposit success
    cy.get('[data-testid="success-message"]')
      .should('contain', 'Deposit successful');

    // Check updated balance
    cy.get('[data-testid="user-deposit"]')
      .should('contain', '100');

    // Verify participation
    cy.get('[data-testid="participant-count"]')
      .should('contain', '1');
  });

  it('handles withdrawal flow', () => {
    // Assume user already has deposit
    cy.seedUserDeposit('500');

    cy.visit('/app');
    cy.connectWallet();

    // Navigate to withdraw
    cy.get('[data-testid="withdraw-tab"]').click();

    // Partial withdrawal
    cy.get('[data-testid="withdraw-amount"]').type('100');
    cy.get('[data-testid="withdraw-button"]').click();

    cy.confirmMetaMaskTransaction();

    // Verify withdrawal success
    cy.get('[data-testid="success-message"]')
      .should('contain', 'Withdrawal successful');

    // Check updated balance
    cy.get('[data-testid="user-deposit"]')
      .should('contain', '400');
  });
});
```

#### Custom Cypress Commands
```typescript
// cypress/support/commands.ts
declare global {
  namespace Cypress {
    interface Chainable {
      connectWallet(): Chainable<void>;
      switchToHyperliquidTestnet(): Chainable<void>;
      confirmMetaMaskTransaction(): Chainable<void>;
      seedUserDeposit(amount: string): Chainable<void>;
    }
  }
}

Cypress.Commands.add('connectWallet', () => {
  cy.window().then((win) => {
    // Mock wallet connection for testing
    win.ethereum = {
      request: cy.stub().resolves('0x1234567890123456789012345678901234567890'),
      on: cy.stub(),
    };
  });
});

Cypress.Commands.add('switchToHyperliquidTestnet', () => {
  cy.window().then((win) => {
    win.ethereum.request = cy.stub().resolves({
      chainId: '0x3e6', // 998 in hex
    });
  });
});

Cypress.Commands.add('confirmMetaMaskTransaction', () => {
  // Mock MetaMask transaction confirmation
  cy.window().then((win) => {
    win.ethereum.request = cy.stub().resolves('0xtxhash123');
  });
});
```

## 📊 Test Coverage & Reporting

### Coverage Configuration
```json
{
  "jest": {
    "collectCoverageFrom": [
      "src/**/*.{js,jsx,ts,tsx}",
      "!src/**/*.d.ts",
      "!src/**/index.{js,ts}"
    ],
    "coverageThreshold": {
      "global": {
        "branches": 80,
        "functions": 80,
        "lines": 80,
        "statements": 80
      }
    }
  }
}
```

### Hardhat Coverage
```bash
# Generate smart contract coverage
npx hardhat coverage

# Output: coverage/index.html
```

### Test Reporting
```javascript
// Generate test reports
const reporter = require('jest-html-reporter');

module.exports = {
  testResultsProcessor: './node_modules/jest-html-reporter',
  reporters: [
    'default',
    ['jest-html-reporter', {
      pageTitle: 'HyperLoops Test Report',
      outputPath: 'test-report.html',
    }]
  ],
};
```

## 🚀 Continuous Integration Testing

### GitHub Actions Workflow
```yaml
# .github/workflows/test.yml
name: Test Suite

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
      
      - name: Cache dependencies
        uses: actions/cache@v3
        with:
          path: node_modules
          key: ${{ runner.os }}-node-${{ hashFiles('package-lock.json') }}
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run contract tests
        run: npx hardhat test
      
      - name: Generate coverage
        run: npx hardhat coverage
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3

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
        run: npm test -- --coverage
      
      - name: Run E2E tests
        run: npm run e2e:ci

  security-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run security audit
        run: npm audit --audit-level high
      
      - name: Run Slither analysis
        uses: crytic/slither-action@v0.3.0
        with:
          sarif: results.sarif
```

## 🐛 Debugging Tests

### Common Issues & Solutions

#### Gas Estimation Failures
```javascript
// Increase gas limit for complex operations
await contract.executeLottery({ gasLimit: 1000000 });

// Use gas estimation helper
const estimatedGas = await contract.estimateGas.executeLottery();
await contract.executeLottery({ gasLimit: estimatedGas.mul(110).div(100) }); // 10% buffer
```

#### Time-based Test Issues
```javascript
// Use hardhat time helpers
const { time } = require("@nomicfoundation/hardhat-network-helpers");

// Fast forward time
await time.increase(86400); // 1 day

// Set specific timestamp
await time.increaseTo(1234567890);
```

#### Mock Contract Issues
```javascript
// Proper mock setup
beforeEach(async () => {
  mockPool.setSupplyBalance.returns(ethers.parseEther("1000"));
  mockPool.withdraw.returns(ethers.parseEther("100"));
});
```

### Test Debugging Tools
```javascript
// Debug failing tests
it.only('should debug this specific test', async () => {
  console.log('Debug info:', await contract.debug());
  await expect(contract.someFunction()).to.not.be.reverted;
});

// Skip problematic tests temporarily
it.skip('will fix this test later', async () => {
  // Test implementation
});
```

---

**Remember**: Good tests are the foundation of a reliable protocol. Write tests first, code second, and maintain high coverage to ensure HyperLoops remains secure and functional for all users.**