# Frontend Application Documentation

## 📋 Overview

The HyperLoops frontend is a modern, responsive web application built with Next.js 14, React 18, and TypeScript. It provides an intuitive interface for users to interact with the no-loss lottery protocol on Hyperliquid EVM.

## 🏗️ Architecture Overview

```
frontend/
├── src/
│   ├── app/              # Next.js App Router
│   ├── components/       # React components
│   ├── hooks/           # Custom React hooks
│   ├── utils/           # Utility functions
│   ├── config/          # Configuration files
│   ├── contexts/        # React contexts
│   └── types/           # TypeScript definitions
├── public/              # Static assets
└── docs/               # Component documentation
```

## 🎨 Design System & UI Framework

### Core Technologies
- **NextUI**: Modern React component library
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Animation library
- **Lucide React**: Icon library

### Theme Configuration
```typescript
// Dark theme optimized for Hyperliquid ecosystem
const theme = {
  colors: {
    primary: '#00d4aa',           // Hyperliquid accent
    background: '#0a0a0b',        // Dark background
    foreground: '#ffffff',        // Primary text
    secondary: '#1a1a1b',         // Secondary background
    accent: '#00d4aa',           // Accent color
    success: '#00d4aa',          // Success states
    warning: '#ffa726',          // Warning states
    error: '#ef5350',            // Error states
  }
}
```

### Responsive Design
- Mobile-first approach
- Breakpoints: `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`
- Optimized for desktop and mobile usage

## 📱 Application Structure

### App Router Layout (`src/app/`)

#### Root Layout (`layout.tsx`)
```typescript
export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased bg-background text-foreground">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

**Features:**
- SEO optimization with metadata
- Google Fonts integration (Inter, JetBrains Mono)
- Dark theme enforcement
- Global providers wrapper

#### Providers (`providers.tsx`)
Central provider configuration for:
- **Wagmi Config**: Web3 connectivity
- **RainbowKit**: Wallet connection UI
- **TanStack Query**: Data fetching and caching
- **NextUI**: UI component theming
- **Toast Notifications**: User feedback system

### Page Components

#### Landing Page (`page.tsx`)
**Route**: `/`

Main marketing page with:
- Hero section with protocol introduction
- "How It Works" explanatory flow
- Feature highlights and benefits
- External links to documentation
- Call-to-action for app launch

**Key Features:**
- Animated components with Framer Motion
- Responsive grid layouts
- Interactive cards and buttons
- External link handling

#### Application Dashboard (`app/page.tsx`)
**Route**: `/app`

Main application interface for protocol interaction:
- Wallet connection status
- Contract interaction forms
- Real-time protocol statistics
- User dashboard with personal stats

#### Analytics Page (`analytics/page.tsx`)
**Route**: `/analytics`

Comprehensive protocol analytics:
- Historical lottery data
- Yield generation metrics
- Participant statistics
- Prize distribution charts

## 🧩 Component Architecture

### Layout Components (`components/layout/`)

#### Header (`Header.tsx`)
**Responsibilities:**
- Wallet connection management
- Navigation between pages
- Network status display
- User account information

**Features:**
- RainbowKit wallet integration
- Responsive navigation menu
- Chain switching support
- Connection status indicators

```typescript
export const Header: React.FC = () => {
  const { isConnected, address, chain } = useAccount();
  
  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Logo />
        <Navigation />
        <ConnectButton />
      </div>
    </header>
  );
};
```

### Lottery Components (`components/lottery/`)

#### DepositForm (`DepositForm.tsx`)
**Purpose**: Handle user deposits into the protocol

**Key Features:**
- wHYPE token balance display
- Input validation and formatting
- MAX button for full balance deposits
- Transaction status feedback
- Real-time allowance checking

**State Management:**
```typescript
const [amount, setAmount] = useState('');
const [isDepositing, setIsDepositing] = useState(false);
const { deposit, isLoading, refetchAll } = useContract();
```

**User Flow:**
1. User enters deposit amount
2. Form validates balance and input
3. Triggers ERC20 approval transaction
4. Executes deposit transaction
5. Updates UI with success/error feedback

#### WithdrawForm (`WithdrawForm.tsx`)
**Purpose**: Handle user withdrawals from the protocol

**Key Features:**
- User deposit balance display
- Partial and full withdrawal support
- Instant withdrawal processing
- Principal protection guarantee

#### PoolStats (`PoolStats.tsx`)
**Purpose**: Display real-time protocol statistics

**Metrics Displayed:**
- Total deposits across all users
- Current prize pool amount
- Number of active participants
- Next lottery countdown timer
- Current yield APY from HyperLend

#### WinnerHistory (`WinnerHistory.tsx`)
**Purpose**: Show recent lottery winners and results

**Features:**
- Recent winner addresses (truncated)
- Prize amounts won
- Lottery round numbers
- Timestamps with relative formatting
- Link to block explorer for verification

#### ContractStatus (`ContractStatus.tsx`)
**Purpose**: Display contract health and connectivity

**Indicators:**
- Contract deployment status
- HyperLend integration status
- Network connectivity
- Pause/unpause state

### Common Components (`components/common/`)

#### StatCard (`StatCard.tsx`)
**Purpose**: Reusable component for displaying statistics

```typescript
interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  subtitle?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title, value, icon, trend, subtitle
}) => {
  return (
    <Card className="p-6 bg-background-secondary border-border">
      <CardBody className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-foreground-secondary">{title}</span>
          {icon && <div className="text-accent">{icon}</div>}
        </div>
        <div className="space-y-1">
          <div className="text-2xl font-bold text-foreground">{value}</div>
          {subtitle && <div className="text-xs text-foreground-secondary">{subtitle}</div>}
        </div>
      </CardBody>
    </Card>
  );
};
```

## ⚡ Custom Hooks

### useContract (`hooks/useContract.ts`)
**Purpose**: Primary hook for smart contract interaction

**Capabilities:**
- Contract state reading (deposits, prizes, participants)
- User-specific data fetching
- Write operations (deposit, withdraw, harvest)
- Real-time data refetching
- Error handling and user feedback

**Return Object:**
```typescript
interface UseContractReturn {
  // Contract state
  contractState: ContractState;
  userInfo: UserInfo | null;
  accruedYield: bigint;
  isLotteryReady: boolean;
  isPaused: boolean;
  totalTickets: bigint;
  
  // Functions
  deposit: (amount: string) => Promise<Hash>;
  withdraw: (amount: string) => Promise<Hash>;
  harvest: () => Promise<Hash>;
  executeLottery: () => Promise<Hash>;
  refetchAll: () => void;
  
  // Loading states
  isLoading: boolean;
  
  // Formatted helpers
  formatters: {
    totalDeposits: string;
    prizePool: string;
    accruedYield: string;
    userDeposit: string;
  };
}
```

### useHyperLendData (`hooks/useHyperLendData.ts`)
**Purpose**: Fetch real-time data from HyperLend protocol

**Features:**
- Current lending APY rates
- Available liquidity metrics
- Reserve utilization data
- Historical yield data

## 🔧 Configuration & Utils

### Wagmi Configuration (`config/wagmi.ts`)
```typescript
export const wagmiConfig = getDefaultConfig({
  appName: 'HyperLoops - No-Loss Lottery',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID,
  chains: [hyperEVMTestnet, hyperEVM],
  ssr: true,
});
```

### Network Configurations (`utils/chains.ts`)
```typescript
export const hyperEVM = {
  id: 999,
  name: 'Hyperliquid EVM',
  nativeCurrency: { name: 'HYPE', symbol: 'HYPE', decimals: 18 },
  rpcUrls: { public: { http: ['https://api.hyperliquid.xyz/evm'] } },
  blockExplorers: {
    default: { name: 'Hyperliquid Explorer', url: 'https://explorer.hyperliquid.xyz' },
  },
  testnet: false,
};
```

### Constants (`utils/constants.ts`)
**Contract Addresses:**
```typescript
export const CONTRACT_ADDRESSES: Record<number, ContractAddresses> = {
  999: { // Mainnet
    hyperLendPool: '0x00A89d7a5A02160f20150EbEA7a2b5E4879A1A8b',
    dataProvider: '0x5481bf8d3946E6A3168640c1D7523eB59F055a29',
    wHYPE: '0x5555555555555555555555555555555555555555',
    noLossLottery: process.env.NEXT_PUBLIC_LOTTERY_CONTRACT_MAINNET || '',
  },
  // Testnet and local configurations...
};
```

**UI Configuration:**
```typescript
export const UI_CONFIG = {
  colors: {
    primary: '#00d4aa',
    secondary: '#1a1a1b',
    background: '#0a0a0b',
    // ... more colors
  },
  animations: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
} as const;
```

### Utility Functions

#### `format.ts` - Data Formatting
```typescript
export const formatBalance = (balance: bigint, decimals = 18, precision = 4): string => {
  return Number(formatUnits(balance, decimals)).toFixed(precision);
};

export const formatTimeRemaining = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

export const truncateAddress = (address: string): string => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};
```

#### `cn.ts` - Class Name Utility
```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

## 🎭 Animation System

### Framer Motion Integration
```typescript
// Stagger animation for card grids
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};
```

### Animation Patterns
- **Page Transitions**: Smooth fade-in animations
- **Card Grids**: Staggered appearance animations  
- **Form Interactions**: Micro-animations for feedback
- **Loading States**: Skeleton loaders and spinners

## 📊 State Management

### Client-Side State
- **React State**: Component-local state management
- **Custom Hooks**: Shared state logic encapsulation
- **Context API**: Global application state (minimal usage)

### Server State
- **TanStack Query**: Server state caching and synchronization
- **Wagmi**: Blockchain state management
- **Real-time Updates**: Automatic background refetching

### Data Flow
```
User Interaction → Component → Custom Hook → Wagmi → Smart Contract
                             ↓
Component ← Formatted Data ← TanStack Query ← Blockchain Response
```

## 🔄 Real-time Updates

### Auto-refresh Strategy
- **Contract State**: 30-second intervals
- **User Data**: On wallet connection/disconnection
- **Transaction Results**: Immediate refetch after operations
- **Background Sync**: Automatic data synchronization

### WebSocket Integration (Future)
- Real-time lottery results
- Live yield accumulation
- Instant winner notifications
- Participant count updates

## 📱 Responsive Design

### Mobile Optimization
```typescript
// Responsive grid system
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Cards automatically adjust to screen size */}
</div>

// Mobile navigation
<div className="flex flex-col sm:flex-row gap-4 justify-center">
  {/* Buttons stack on mobile, inline on desktop */}
</div>
```

### Desktop Features
- Multi-column layouts
- Hover interactions
- Advanced tooltips
- Keyboard navigation support

### Touch Interactions
- Optimized button sizes (44px minimum)
- Swipe gestures for mobile navigation
- Touch-friendly form inputs
- Pull-to-refresh functionality

## 🧪 Testing Strategy

### Component Testing
```bash
# Run component tests
npm run test

# Component coverage
npm run test:coverage
```

### E2E Testing (Future)
- Cypress integration planned
- User journey testing
- Cross-browser compatibility
- Mobile device testing

## 🚀 Performance Optimization

### Bundle Optimization
- **Next.js**: Automatic code splitting
- **Tree Shaking**: Unused code elimination
- **Image Optimization**: Next.js Image component
- **Font Loading**: Optimized Google Fonts loading

### Runtime Performance
- **React.memo**: Prevent unnecessary re-renders
- **useMemo/useCallback**: Expensive computation caching
- **Lazy Loading**: Component-level code splitting
- **Virtual Scrolling**: Large list optimization

### Web3 Performance
- **Request Batching**: Multiple contract calls in single request
- **Caching Strategy**: Aggressive caching of contract data
- **Background Updates**: Non-blocking data synchronization

## 🔐 Security Considerations

### Client-Side Security
- **Input Validation**: All user inputs validated
- **XSS Protection**: Sanitized user content
- **CSRF Protection**: Next.js built-in protection
- **Environment Variables**: Secure configuration management

### Web3 Security
- **Transaction Simulation**: Preview transaction effects
- **Allowance Management**: Minimal token approvals
- **Network Validation**: Ensure correct network connection
- **Address Validation**: Verify contract addresses

---

**Next**: Learn about [API Integration](./04-API-INTEGRATION.md) and blockchain connectivity.