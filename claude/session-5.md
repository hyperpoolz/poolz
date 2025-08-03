# Session 5: Frontend Foundation

**Duration**: 2 hours  
**Status**: 🔄 **PENDING**  
**Planned Date**: TBD

## Objectives
Build the foundational React/Next.js frontend with Hyperliquid EVM wallet integration and core user interface for deposits, withdrawals, and lottery participation.

## Tasks & Checklist

### 🔄 Project Setup & Configuration
- [ ] Initialize Next.js 14+ project with TypeScript
- [ ] Install and configure Tailwind CSS with custom theme
- [ ] Set up ethers.js v6 for blockchain interactions
- [ ] Configure HyperLiquid EVM network settings
- [ ] Create environment configuration for contract addresses
- [ ] Set up project structure following architecture standards

### 🔄 Wallet Integration
- [ ] Implement MetaMask connection functionality
- [ ] Add HyperLiquid EVM network auto-addition
- [ ] Create wallet context for state management
- [ ] Handle wallet connection states (connecting, connected, error)
- [ ] Add wallet disconnection handling
- [ ] Implement balance fetching for wHYPE and native tokens

### 🔄 Core UI Components
- [ ] Build responsive layout with header and navigation
- [ ] Create wallet connection button with status display
- [ ] Implement deposit form with input validation
- [ ] Build withdrawal form with balance checks
- [ ] Add loading states and transaction feedback
- [ ] Create error handling and user notifications

### 🔄 Contract Integration
- [ ] Set up contract interaction utilities
- [ ] Implement deposit transaction flow
- [ ] Add withdrawal transaction handling
- [ ] Create view functions for user data fetching
- [ ] Add real-time balance updates
- [ ] Implement transaction status tracking

## Implementation Plan

### Project Structure
```
frontend/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Navigation.tsx
│   │   │   └── Footer.tsx
│   │   ├── lottery/
│   │   │   ├── DepositForm.tsx
│   │   │   ├── WithdrawForm.tsx
│   │   │   └── UserStats.tsx
│   │   ├── wallet/
│   │   │   ├── WalletConnector.tsx
│   │   │   ├── NetworkSwitcher.tsx
│   │   │   └── BalanceDisplay.tsx
│   │   └── common/
│   │       ├── LoadingSpinner.tsx
│   │       ├── ErrorMessage.tsx
│   │       └── TransactionModal.tsx
│   ├── hooks/
│   │   ├── useWallet.ts
│   │   ├── useContract.ts
│   │   └── useBalance.ts
│   ├── utils/
│   │   ├── contracts.ts
│   │   ├── networks.ts
│   │   └── formatters.ts
│   └── types/
│       ├── wallet.ts
│       └── lottery.ts
├── public/
└── package.json
```

### Wallet Integration Core
```typescript
// hooks/useWallet.ts
export const useWallet = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const [chainId, setChainId] = useState<number | null>(null);

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        });
        
        // Check if on HyperLiquid EVM
        await switchToHyperEVM();
        
        setAddress(accounts[0]);
        setIsConnected(true);
      } catch (error) {
        console.error('Failed to connect wallet:', error);
      }
    }
  };

  const switchToHyperEVM = async () => {
    const chainId = '0x3e7'; // 999 in hex
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }],
      });
    } catch (switchError) {
      // Add network if not exists
      await addHyperEVMNetwork();
    }
  };

  return { isConnected, address, balance, connectWallet, switchToHyperEVM };
};
```

### Contract Integration
```typescript
// utils/contracts.ts
import { ethers } from 'ethers';
import NoLossLotteryABI from '../abis/NoLossLottery.json';

export const getContract = (address: string, signer: ethers.Signer) => {
  return new ethers.Contract(address, NoLossLotteryABI, signer);
};

export const contractAddresses = {
  hyperLendPool: '0x00A89d7a5A02160f20150EbEA7a2b5E4879A1A8b',
  wHYPE: '0x5555555555555555555555555555555555555555',
  noLossLottery: process.env.NEXT_PUBLIC_LOTTERY_CONTRACT_ADDRESS,
};

// hooks/useContract.ts
export const useContract = () => {
  const { signer } = useWallet();
  
  const deposit = async (amount: string) => {
    if (!signer) throw new Error('Wallet not connected');
    
    const contract = getContract(contractAddresses.noLossLottery, signer);
    const amountWei = ethers.parseEther(amount);
    
    // First approve wHYPE spending
    const wHYPEContract = getContract(contractAddresses.wHYPE, signer);
    const approveTx = await wHYPEContract.approve(
      contractAddresses.noLossLottery, 
      amountWei
    );
    await approveTx.wait();
    
    // Then deposit
    const depositTx = await contract.deposit(amountWei);
    return await depositTx.wait();
  };

  const withdraw = async (amount: string) => {
    if (!signer) throw new Error('Wallet not connected');
    
    const contract = getContract(contractAddresses.noLossLottery, signer);
    const amountWei = ethers.parseEther(amount);
    
    const tx = await contract.withdraw(amountWei);
    return await tx.wait();
  };

  const getUserInfo = async (address: string) => {
    const contract = getContract(contractAddresses.noLossLottery, provider);
    return await contract.getUserInfo(address);
  };

  return { deposit, withdraw, getUserInfo };
};
```

### Core UI Components

#### Deposit Form
```typescript
// components/lottery/DepositForm.tsx
export const DepositForm: React.FC = () => {
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { deposit } = useContract();
  const { address, balance } = useWallet();

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    setIsLoading(true);
    try {
      const tx = await deposit(amount);
      // Show success notification
      setAmount('');
    } catch (error) {
      // Show error notification
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
      <h2 className="text-xl font-semibold text-white mb-4">Deposit wHYPE</h2>
      <form onSubmit={handleDeposit}>
        <div className="mb-4">
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Amount
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white"
            placeholder="0.0"
            step="0.000001"
            min="0"
          />
          <div className="text-sm text-gray-400 mt-1">
            Balance: {balance} wHYPE
          </div>
        </div>
        
        <button
          type="submit"
          disabled={isLoading || !amount}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          {isLoading ? 'Depositing...' : 'Deposit'}
        </button>
      </form>
    </div>
  );
};
```

#### User Statistics Display
```typescript
// components/lottery/UserStats.tsx
export const UserStats: React.FC = () => {
  const { address } = useWallet();
  const [userInfo, setUserInfo] = useState(null);
  const { getUserInfo } = useContract();

  useEffect(() => {
    if (address) {
      fetchUserInfo();
    }
  }, [address]);

  const fetchUserInfo = async () => {
    try {
      const info = await getUserInfo(address);
      setUserInfo(info);
    } catch (error) {
      console.error('Failed to fetch user info:', error);
    }
  };

  if (!userInfo) return <LoadingSpinner />;

  return (
    <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
      <h2 className="text-xl font-semibold text-white mb-4">Your Position</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-gray-400 text-sm">Deposited</div>
          <div className="text-white text-lg font-semibold">
            {ethers.formatEther(userInfo.depositAmount)} wHYPE
          </div>
        </div>
        
        <div>
          <div className="text-gray-400 text-sm">Tickets</div>
          <div className="text-green-400 text-lg font-semibold">
            {userInfo.tickets.toString()}
          </div>
        </div>
        
        <div>
          <div className="text-gray-400 text-sm">Time Held</div>
          <div className="text-white text-lg font-semibold">
            {formatTimeHeld(userInfo.depositTime)}
          </div>
        </div>
        
        <div>
          <div className="text-gray-400 text-sm">Win Probability</div>
          <div className="text-yellow-400 text-lg font-semibold">
            {calculateWinProbability(userInfo.tickets)}%
          </div>
        </div>
      </div>
    </div>
  );
};
```

## Testing Strategy

### Component Testing
- Unit tests for all UI components
- Integration tests for wallet connection
- Contract interaction testing with mocks
- Responsive design testing across devices

### User Flow Testing
- Complete deposit flow from wallet connection to confirmation
- Withdrawal flow with balance validation
- Error handling for various failure scenarios
- Network switching and connection recovery

## Design System Implementation

### Tailwind Configuration
```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          bg: '#0a0a0b',
          secondary: '#1a1a1b',
          accent: '#00d4aa',
          'accent-hover': '#00b896',
        },
        text: {
          primary: '#ffffff',
          secondary: '#a0a0a0',
        },
        border: '#2a2a2b',
        success: '#00d4aa',
        warning: '#ffa726',
        error: '#ef5350',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
```

## Demo Capabilities
After Session 5 completion:

1. **Wallet Connection**: MetaMask integration with HyperLiquid EVM
2. **Deposit Interface**: Clean form for depositing wHYPE tokens
3. **Real-time Updates**: Live balance and position updates
4. **Withdrawal Function**: Users can withdraw their deposits
5. **Responsive Design**: Works on desktop and mobile devices

## Success Criteria
- [ ] Users can connect MetaMask wallet successfully
- [ ] HyperLiquid EVM network auto-addition works
- [ ] Deposit form accepts wHYPE and sends to contract
- [ ] Withdrawal form validates balances and executes
- [ ] Real-time balance updates work correctly
- [ ] Responsive design works on all screen sizes
- [ ] Error handling provides clear user feedback

## Risk Mitigation
1. **Wallet Compatibility**: Test with multiple wallet providers
2. **Network Issues**: Robust error handling for connection problems
3. **Transaction Failures**: Clear feedback and retry mechanisms
4. **User Experience**: Intuitive design with helpful tooltips

## Dependencies
- Sessions 1-4 completion: fully functional smart contract
- Contract deployment to testnet for frontend integration
- wHYPE token acquisition for testing deposits

## Files to Create
- `frontend/package.json` - Project dependencies
- `frontend/next.config.js` - Next.js configuration
- `frontend/tailwind.config.js` - Styling configuration
- `frontend/src/pages/_app.tsx` - App root with providers
- `frontend/src/pages/index.tsx` - Main lottery interface
- `frontend/src/components/` - All UI components
- `frontend/src/hooks/` - Custom React hooks
- `frontend/src/utils/` - Utility functions

**Session 5 Dependencies**: Requires deployed contract from Sessions 1-4 for full integration testing.