# Session 6: Dashboard & Statistics

**Duration**: 2 hours  
**Status**: 🔄 **PENDING**  
**Planned Date**: TBD

## Objectives
Build comprehensive dashboard with pool statistics, user analytics, lottery history, and real-time data visualization to create a professional, engaging user experience.

## Tasks & Checklist

### 🔄 Pool Statistics Dashboard
- [ ] Create global pool statistics component
- [ ] Display total deposits across all users
- [ ] Show current APY from HyperLend integration
- [ ] Add total participants count and growth metrics
- [ ] Implement prize pool tracking and projections
- [ ] Create visual charts for pool growth over time

### 🔄 User Analytics & Dashboard
- [ ] Build comprehensive user dashboard
- [ ] Show user's deposit history and timeline
- [ ] Display projected 24-hour interest earnings
- [ ] Calculate and show win probability percentage
- [ ] Add ticket accumulation tracking
- [ ] Create personal performance metrics

### 🔄 Lottery History & Winners
- [ ] Implement lottery history display
- [ ] Show recent winners and prize amounts
- [ ] Create winner announcement system
- [ ] Add historical lottery statistics
- [ ] Build win distribution analytics
- [ ] Display lottery frequency and timing data

### 🔄 Real-time Data Updates
- [ ] Implement WebSocket or polling for live updates
- [ ] Add real-time balance changes
- [ ] Show live yield accumulation
- [ ] Update lottery countdown timers
- [ ] Refresh statistics automatically
- [ ] Handle connection interruptions gracefully

## Implementation Plan

### Dashboard Architecture
```typescript
// components/dashboard/PoolStatistics.tsx
interface PoolStats {
  totalDeposits: string;
  currentAPY: number;
  participantCount: number;
  prizePool: string;
  nextLotteryTime: number;
  totalTickets: number;
}

export const PoolStatistics: React.FC = () => {
  const [stats, setStats] = useState<PoolStats | null>(null);
  const { contract } = useContract();

  const fetchPoolStats = async () => {
    try {
      const [totalDeposits, participantCount, prizePool, nextLottery] = await Promise.all([
        contract.totalDeposits(),
        contract.getParticipantCount(),
        contract.prizePool(),
        contract.getTimeToNextLottery(),
      ]);

      // Fetch APY from HyperLend
      const apy = await getHyperLendAPY();

      setStats({
        totalDeposits: ethers.formatEther(totalDeposits),
        currentAPY: apy,
        participantCount: participantCount.toNumber(),
        prizePool: ethers.formatEther(prizePool),
        nextLotteryTime: nextLottery.toNumber(),
        totalTickets: await contract.getTotalTickets(),
      });
    } catch (error) {
      console.error('Failed to fetch pool stats:', error);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatCard
        title="Total Deposits"
        value={`${stats?.totalDeposits} wHYPE`}
        icon={<DepositIcon />}
        trend="+12.5%"
      />
      <StatCard
        title="Current APY"
        value={`${stats?.currentAPY}%`}
        icon={<APYIcon />}
        trend="+0.3%"
      />
      <StatCard
        title="Prize Pool"
        value={`${stats?.prizePool} wHYPE`}
        icon={<PrizeIcon />}
        trend="+45.2%"
      />
    </div>
  );
};
```

### Advanced User Dashboard
```typescript
// components/dashboard/UserDashboard.tsx
interface UserDashboardProps {
  address: string;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ address }) => {
  const [userStats, setUserStats] = useState(null);
  const [depositHistory, setDepositHistory] = useState([]);
  const [projectedYield, setProjectedYield] = useState('0');

  return (
    <div className="space-y-6">
      {/* User Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <UserStatCard
          title="Your Deposit"
          value={`${userStats?.depositAmount} wHYPE`}
          subtitle="Principal Protected"
          color="blue"
        />
        <UserStatCard
          title="Lottery Tickets"
          value={userStats?.tickets}
          subtitle="From yield earned"
          color="green"
        />
        <UserStatCard
          title="Win Probability"
          value={`${calculateWinProbability(userStats?.tickets)}%`}
          subtitle="Current round"
          color="yellow"
        />
        <UserStatCard
          title="24h Projection"
          value={`${projectedYield} wHYPE`}
          subtitle="Estimated yield"
          color="purple"
        />
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <YieldChart data={userStats?.yieldHistory} />
        <TicketAccumulation data={userStats?.ticketHistory} />
      </div>

      {/* Transaction History */}
      <TransactionHistory address={address} />
    </div>
  );
};
```

### Lottery History Component
```typescript
// components/dashboard/LotteryHistory.tsx
interface LotteryResult {
  round: number;
  winner: string;
  prize: string;
  timestamp: number;
  totalParticipants: number;
  yourTickets?: number;
}

export const LotteryHistory: React.FC = () => {
  const [history, setHistory] = useState<LotteryResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchLotteryHistory = async () => {
    // Fetch from contract events or stored history
    const events = await contract.queryFilter(
      contract.filters.LotteryExecuted(),
      -1000 // Last 1000 blocks
    );
    
    const historyData = events.map(event => ({
      round: event.args.round,
      winner: event.args.winner,
      prize: ethers.formatEther(event.args.prize),
      timestamp: event.args.timestamp.toNumber(),
      totalParticipants: event.args.totalParticipants,
    }));
    
    setHistory(historyData.reverse()); // Most recent first
    setIsLoading(false);
  };

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-700">
      <div className="p-6 border-b border-gray-700">
        <h2 className="text-xl font-semibold text-white">Recent Winners</h2>
      </div>
      
      <div className="divide-y divide-gray-700">
        {history.map((result) => (
          <LotteryResultRow key={result.round} result={result} />
        ))}
      </div>
    </div>
  );
};

const LotteryResultRow: React.FC<{ result: LotteryResult }> = ({ result }) => (
  <div className="p-4 hover:bg-gray-800 transition-colors">
    <div className="flex items-center justify-between">
      <div>
        <div className="text-white font-medium">Round {result.round}</div>
        <div className="text-gray-400 text-sm">
          {formatDistanceToNow(new Date(result.timestamp * 1000))} ago
        </div>
      </div>
      
      <div className="text-right">
        <div className="text-green-400 font-semibold">
          {result.prize} wHYPE
        </div>
        <div className="text-gray-400 text-sm">
          Winner: {truncateAddress(result.winner)}
        </div>
      </div>
    </div>
  </div>
);
```

### Real-time Data Management
```typescript
// hooks/useRealTimeData.ts
export const useRealTimeData = () => {
  const [data, setData] = useState(null);
  const { contract } = useContract();

  useEffect(() => {
    const fetchData = async () => {
      // Fetch all relevant data
      const poolStats = await fetchPoolStatistics();
      const userInfo = await fetchUserInfo();
      const lotteryInfo = await fetchLotteryInfo();
      
      setData({ poolStats, userInfo, lotteryInfo });
    };

    // Initial fetch
    fetchData();

    // Set up polling interval (every 30 seconds)
    const interval = setInterval(fetchData, 30000);

    // Listen for contract events
    const filters = [
      contract.filters.Deposited(),
      contract.filters.Withdrawn(),
      contract.filters.YieldHarvested(),
      contract.filters.LotteryExecuted(),
    ];

    filters.forEach(filter => {
      contract.on(filter, fetchData);
    });

    return () => {
      clearInterval(interval);
      filters.forEach(filter => {
        contract.off(filter, fetchData);
      });
    };
  }, [contract]);

  return data;
};
```

### Data Visualization Components
```typescript
// components/charts/YieldChart.tsx
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export const YieldChart: React.FC<{ data: any[] }> = ({ data }) => (
  <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
    <h3 className="text-lg font-semibold text-white mb-4">Yield Over Time</h3>
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <XAxis dataKey="timestamp" stroke="#a0a0a0" />
        <YAxis stroke="#a0a0a0" />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#1a1a1b', 
            border: '1px solid #2a2a2b',
            borderRadius: '8px'
          }} 
        />
        <Line 
          type="monotone" 
          dataKey="yield" 
          stroke="#00d4aa" 
          strokeWidth={2}
          dot={{ fill: '#00d4aa', strokeWidth: 2, r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
);
```

## Advanced Features

### Interactive Analytics
- Hover tooltips with detailed information
- Clickable chart elements for drill-down data
- Customizable time ranges for historical data
- Export functionality for personal records

### Performance Tracking
- Personal ROI calculations
- Comparison with HyperLend direct lending
- Lottery participation efficiency metrics
- Risk-adjusted return analysis

### Social Features
- Leaderboards for top participants
- Achievement badges for milestones
- Referral tracking and rewards
- Community statistics

## Testing Strategy

### Component Testing
- Test all dashboard components in isolation
- Mock contract data for consistent testing
- Verify responsive design across devices
- Test real-time data update mechanisms

### Integration Testing
- Full data flow from contract to UI
- WebSocket/polling reliability testing
- Error handling for network issues
- Performance testing with large datasets

### User Experience Testing
- Dashboard load times and responsiveness
- Data accuracy and consistency
- Mobile usability and touch interactions
- Accessibility compliance

## Demo Capabilities
After Session 6 completion:

1. **Professional Dashboard**: Clean, informative overview of all metrics
2. **Real-time Updates**: Live data that updates automatically
3. **Historical Analysis**: Rich history and trend visualization
4. **User Analytics**: Detailed personal performance tracking
5. **Mobile Experience**: Fully responsive dashboard on all devices

## Success Criteria
- [ ] Dashboard loads quickly with all statistics
- [ ] Real-time updates work reliably
- [ ] Charts and visualizations are clear and informative
- [ ] Mobile interface is fully functional
- [ ] Historical data displays accurately
- [ ] User analytics provide valuable insights
- [ ] Error states are handled gracefully

## Risk Mitigation
1. **Data Accuracy**: Multiple validation layers for displayed metrics
2. **Performance**: Efficient data fetching and caching strategies
3. **Real-time Reliability**: Fallback polling if WebSocket fails
4. **User Experience**: Loading states and skeleton screens

## Dependencies
- Session 5 completion: functional frontend foundation
- Deployed contract with historical data
- HyperLend integration for APY data
- Multiple users and lottery executions for meaningful statistics

## Files to Create
- `frontend/src/components/dashboard/` - All dashboard components
- `frontend/src/components/charts/` - Data visualization components
- `frontend/src/hooks/useRealTimeData.ts` - Real-time data management
- `frontend/src/utils/analytics.ts` - Data calculation utilities
- `frontend/src/types/dashboard.ts` - TypeScript type definitions

**Session 6 Dependencies**: Requires functional frontend from Session 5 and rich contract data from Sessions 1-4.