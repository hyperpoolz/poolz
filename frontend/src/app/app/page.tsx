'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardBody, Button, Chip, Divider, Progress, Tabs, Tab } from '@nextui-org/react';
import { 
  Wallet, TrendingUp, Target, Clock, Gift, Plus, Minus, History, 
  Zap, DollarSign, Award, Activity, BarChart3, PieChart, 
  ChevronRight, Sparkles, Shield, TrendingDown
} from 'lucide-react';
import { useAccount } from 'wagmi';
import { Header } from '../../components/layout/Header';
import { PoolStats } from '../../components/lottery/PoolStats';
import { ContractStatus } from '../../components/lottery/ContractStatus';
import { WinnerHistory } from '../../components/lottery/WinnerHistory';
import { DepositForm } from '../../components/lottery/DepositForm';
import { WithdrawForm } from '../../components/lottery/WithdrawForm';
import { useHyperLendData, useUserHyperLendData, formatAPY, formatTokenAmount } from '../../hooks/useHyperLendData';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, AreaChart, Area } from 'recharts';

// Mock user data for demo
const mockUserData = {
  totalDeposited: 125.50,
  activeTickets: 1255,
  prizesWon: 2.45,
  totalWins: 3,
  winRate: 12.5,
  avgReturn: 0.042,
  depositHistory: [
    { date: '2024-01-01', amount: 25.0, yield: 0.05 },
    { date: '2024-01-02', amount: 50.0, yield: 0.08 },
    { date: '2024-01-03', amount: 75.0, yield: 0.12 },
    { date: '2024-01-04', amount: 100.0, yield: 0.18 },
    { date: '2024-01-05', amount: 125.5, yield: 0.25 },
  ],
  recentActivity: [
    { type: 'deposit', amount: 25.5, date: '2024-01-05', status: 'completed' },
    { type: 'win', amount: 1.2, date: '2024-01-04', status: 'completed' },
    { type: 'deposit', amount: 50.0, date: '2024-01-03', status: 'completed' },
    { type: 'win', amount: 0.8, date: '2024-01-02', status: 'completed' },
  ]
};

export default function AppPage() {
  const { isConnected, address } = useAccount();
  const hyperLendData = useHyperLendData();
  const userHyperLendData = useUserHyperLendData(address, mockUserData.totalDeposited);
  const [selectedTab, setSelectedTab] = useState('overview');

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

  if (!isConnected) {
    return (
      <main className="min-h-screen mesh-gradient">
        <Header />
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-8"
          >
            <motion.div 
              className="relative"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="w-32 h-32 mx-auto glass-morphism rounded-3xl flex items-center justify-center floating-element">
                <div className="w-16 h-16 bg-gradient-to-br from-accent to-accent-light rounded-2xl flex items-center justify-center shadow-glow-lg">
                  <Wallet className="w-8 h-8 text-background" />
                </div>
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-accent rounded-full animate-pulse shadow-glow-md"></div>
            </motion.div>
            
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-4">
                Connect Your Wallet
              </h1>
              <p className="text-xl text-foreground-secondary max-w-2xl mx-auto leading-relaxed">
                Access the HyperLoops protocol to deposit wHYPE, earn yield, and participate in 
                <span className="hyperlend-text-accent font-semibold"> no-loss lotteries</span>.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-8">
              {[
                { icon: Shield, title: 'Secure', desc: 'Your funds are always safe' },
                { icon: TrendingUp, title: 'Earn Yield', desc: '5-20% APY through HyperLend' },
                { icon: Gift, title: 'Win Prizes', desc: 'Daily lottery distributions' }
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="hyperlend-card p-6 text-center"
                >
                  <div className="w-12 h-12 mx-auto mb-4 bg-accent/20 rounded-xl flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-foreground-secondary">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                size="lg"
                className="hyperlend-button text-lg px-12 py-4 font-bold"
                endContent={<ChevronRight className="w-5 h-5" />}
              >
                Connect Wallet
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen mesh-gradient">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Enhanced User Header */}
          <motion.div variants={itemVariants} className="relative overflow-hidden">
            <div className="hyperlend-card p-8">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-accent to-accent-light rounded-2xl flex items-center justify-center shadow-glow-md">
                      <Sparkles className="w-8 h-8 text-background" />
                    </div>
                    <div>
                      <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-2">
                        Welcome Back
                      </h1>
                      <p className="text-foreground-secondary text-lg">
                        Your HyperLoops portfolio is performing well
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Chip
                    size="lg"
                    className="glass-morphism text-accent font-semibold px-4 py-2"
                    startContent={<Wallet className="w-4 h-4" />}
                  >
                    {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connected'}
                  </Chip>
                  <Chip
                    size="lg"
                    className="bg-success/20 text-success font-semibold px-4 py-2"
                    startContent={<Activity className="w-4 h-4" />}
                  >
                    Active
                  </Chip>
                </div>
              </div>
              
              {/* Quick stats bar */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-border">
                <div className="text-center">
                  <p className="text-2xl font-bold text-accent">{mockUserData.totalDeposited} wHYPE</p>
                  <p className="text-sm text-foreground-secondary">Total Deposited</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-warning">{mockUserData.activeTickets}</p>
                  <p className="text-sm text-foreground-secondary">Active Tickets</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-success">{mockUserData.totalWins}</p>
                  <p className="text-sm text-foreground-secondary">Total Wins</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-info">{formatAPY(hyperLendData.currentAPY)}</p>
                  <p className="text-sm text-foreground-secondary">Current APY</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Enhanced Stats Cards */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: DollarSign,
                label: "Portfolio Value",
                value: `${mockUserData.totalDeposited} wHYPE`,
                subtitle: "~$1,255.00",
                color: "accent",
                trend: "+5.2%",
                trendUp: true
              },
              {
                icon: Target,
                label: "Active Tickets",
                value: mockUserData.activeTickets.toLocaleString(),
                subtitle: `${mockUserData.winRate}% of pool`,
                color: "success",
                trend: "+125",
                trendUp: true
              },
              {
                icon: Award,
                label: "Total Winnings",
                value: `${mockUserData.prizesWon} wHYPE`,
                subtitle: `${mockUserData.totalWins} wins`,
                color: "warning",
                trend: "+0.8 wHYPE",
                trendUp: true
              },
              {
                icon: TrendingUp,
                label: "Expected Daily Return",
                value: userHyperLendData.expectedReturn
                  ? `${formatTokenAmount(userHyperLendData.expectedReturn.expectedReturn, 3)} wHYPE`
                  : '0.042 wHYPE',
                subtitle: `${formatAPY(hyperLendData.currentAPY)} APY`,
                color: "info",
                trend: formatAPY(hyperLendData.currentAPY),
                trendUp: true
              }
            ].map((stat, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="hyperlend-card p-6 h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 bg-${stat.color}/20 rounded-xl flex items-center justify-center`}>
                      <stat.icon className={`w-6 h-6 text-${stat.color}`} />
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full
                      ${stat.trendUp 
                        ? 'bg-success/20 text-success' 
                        : 'bg-error/20 text-error'
                      }`}>
                      {stat.trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {stat.trend}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground-secondary">{stat.label}</p>
                    <p className={`text-2xl font-bold text-${stat.color}`}>{stat.value}</p>
                    <p className="text-xs text-foreground-tertiary">{stat.subtitle}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Main Dashboard Content */}
          <motion.div variants={itemVariants}>
            <Tabs 
              selectedKey={selectedTab} 
              onSelectionChange={(key) => setSelectedTab(key as string)}
              color="primary"
              variant="underlined"
              classNames={{
                tabList: "gap-6 w-full relative rounded-none p-0 border-b border-border",
                cursor: "w-full bg-accent",
                tab: "max-w-fit px-0 h-12",
                tabContent: "group-data-[selected=true]:text-accent"
              }}
            >
              <Tab key="overview" title="Overview">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                  {/* Left Column - Charts and Analytics */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Performance Chart */}
                    <div className="hyperlend-card p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-xl font-bold text-foreground mb-2">Portfolio Performance</h3>
                          <p className="text-foreground-secondary">Your deposit growth over time</p>
                        </div>
                        <Chip size="sm" className="bg-success/20 text-success">
                          +24.5% This Week
                        </Chip>
                      </div>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={mockUserData.depositHistory}>
                            <defs>
                              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#caeae5" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#caeae5" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9db3ae', fontSize: 12 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9db3ae', fontSize: 12 }} />
                            <Area 
                              type="monotone" 
                              dataKey="amount" 
                              stroke="#caeae5" 
                              strokeWidth={2}
                              fill="url(#colorGradient)" 
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    
                    {/* Pool Stats */}
                    <PoolStats />
                  </div>
                  
                  {/* Right Column - Actions and Status */}
                  <div className="space-y-6">
                    {/* Quick Actions */}
                    <div className="hyperlend-card p-6">
                      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-accent" />
                        Quick Actions
                      </h3>
                      <div className="space-y-3">
                        <Button
                          className="hyperlend-button w-full justify-start"
                          startContent={<Plus className="w-4 h-4" />}
                          size="lg"
                          onPress={() => setSelectedTab('deposit')}
                        >
                          Deposit wHYPE
                        </Button>
                        <Button
                          variant="bordered"
                          className="w-full justify-start border-accent/30 text-accent hover:bg-accent/10"
                          startContent={<Minus className="w-4 h-4" />}
                          size="lg"
                          onPress={() => setSelectedTab('withdraw')}
                        >
                          Withdraw
                        </Button>
                        <Button
                          variant="light"
                          className="w-full justify-start text-foreground-secondary hover:bg-background-secondary"
                          startContent={<History className="w-4 h-4" />}
                          size="lg"
                        >
                          View History
                        </Button>
                      </div>
                    </div>
                    
                    {/* Ticket Status */}
                    <div className="hyperlend-card p-6">
                      <h3 className="text-lg font-semibold text-foreground mb-4">Lottery Tickets</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-foreground-secondary">Current Round</span>
                          <span className="font-bold text-accent">{mockUserData.activeTickets}</span>
                        </div>
                        <Progress 
                          value={mockUserData.winRate} 
                          className="h-2" 
                          classNames={{
                            indicator: "bg-gradient-to-r from-accent to-accent-light",
                            track: "bg-background-secondary"
                          }}
                        />
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-foreground-secondary">Win Probability</span>
                          <span className="font-semibold text-accent">{mockUserData.winRate}%</span>
                        </div>
                        
                        <Divider className="my-4" />
                        
                        <div className="text-center p-4 glass-morphism rounded-xl">
                          <Clock className="w-8 h-8 text-accent mx-auto mb-2" />
                          <p className="text-sm text-foreground-secondary mb-1">Next Draw In</p>
                          <p className="text-xl font-bold text-foreground">14h 32m</p>
                        </div>
                      </div>
                    </div>
                    
                    <ContractStatus />
                  </div>
                </div>
              </Tab>
              
              <Tab key="deposit" title="Deposit">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                  <DepositForm />
                  <div className="space-y-6">
                    <ContractStatus />
                    <div className="hyperlend-card p-6">
                      <h3 className="text-lg font-semibold text-foreground mb-4">Deposit Benefits</h3>
                      <div className="space-y-4">
                        {[
                          { icon: Shield, text: "Principal protected" },
                          { icon: TrendingUp, text: `Earn ${formatAPY(hyperLendData.currentAPY)} APY` },
                          { icon: Target, text: "Get lottery tickets" },
                          { icon: Gift, text: "Eligible for daily prizes" }
                        ].map((benefit, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center">
                              <benefit.icon className="w-4 h-4 text-accent" />
                            </div>
                            <span className="text-foreground-secondary">{benefit.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Tab>
              
              <Tab key="withdraw" title="Withdraw">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                  <WithdrawForm />
                  <div className="space-y-6">
                    <div className="hyperlend-card p-6">
                      <h3 className="text-lg font-semibold text-foreground mb-4">Available to Withdraw</h3>
                      <div className="text-center py-6">
                        <p className="text-3xl font-bold text-accent mb-2">{mockUserData.totalDeposited} wHYPE</p>
                        <p className="text-foreground-secondary">~$1,255.00</p>
                      </div>
                      <div className="text-xs text-foreground-tertiary text-center">
                        Your principal is always available for withdrawal
                      </div>
                    </div>
                    <ContractStatus />
                  </div>
                </div>
              </Tab>
              
              <Tab key="history" title="History">
                <div className="mt-8">
                  <WinnerHistory />
                  
                  <div className="hyperlend-card p-6 mt-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
                    <div className="space-y-3">
                      {mockUserData.recentActivity.map((activity, i) => (
                        <div key={i} className="flex items-center justify-between p-3 glass-morphism rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              activity.type === 'deposit' ? 'bg-info/20' : 'bg-success/20'
                            }`}>
                              {activity.type === 'deposit' 
                                ? <Plus className="w-4 h-4 text-info" />
                                : <Gift className="w-4 h-4 text-success" />
                              }
                            </div>
                            <div>
                              <p className="font-medium text-foreground capitalize">{activity.type}</p>
                              <p className="text-sm text-foreground-secondary">{activity.date}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-semibold ${
                              activity.type === 'deposit' ? 'text-info' : 'text-success'
                            }`}>
                              {activity.type === 'deposit' ? '-' : '+'}{activity.amount} wHYPE
                            </p>
                            <Chip size="sm" color="success" variant="flat">
                              {activity.status}
                            </Chip>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Tab>
            </Tabs>
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}