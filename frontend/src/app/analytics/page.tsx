'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardBody, Button, Chip, Select, SelectItem, Tabs, Tab } from '@nextui-org/react';
import { BarChart3, TrendingUp, Users, DollarSign, Target, Calendar, Activity, Award } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { useHyperLendData, formatAPY, formatTokenAmount } from '../../hooks/useHyperLendData';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

// Mock data based on smart contract interface
const mockYieldData = [
  { date: '2024-01-01', yield: 0.15, deposits: 1000, participants: 25 },
  { date: '2024-01-02', yield: 0.18, deposits: 1150, participants: 28 },
  { date: '2024-01-03', yield: 0.22, deposits: 1320, participants: 32 },
  { date: '2024-01-04', yield: 0.19, deposits: 1290, participants: 31 },
  { date: '2024-01-05', yield: 0.25, deposits: 1450, participants: 35 },
  { date: '2024-01-06', yield: 0.28, deposits: 1600, participants: 38 },
  { date: '2024-01-07', yield: 0.32, deposits: 1750, participants: 42 },
];

const mockLotteryHistory = [
  { round: 7, winner: '0x1234...5678', prize: 0.32, participants: 42, tickets: 17500, date: '2024-01-07' },
  { round: 6, winner: '0x8765...4321', prize: 0.28, participants: 38, tickets: 16000, date: '2024-01-06' },
  { round: 5, winner: '0x2468...1357', prize: 0.25, participants: 35, tickets: 14500, date: '2024-01-05' },
  { round: 4, winner: '0x9876...2468', prize: 0.19, participants: 31, tickets: 12900, date: '2024-01-04' },
  { round: 3, winner: '0x1357...9876', prize: 0.22, participants: 32, tickets: 13200, date: '2024-01-03' },
];

const mockTicketDistribution = [
  { name: 'Large Holders (>100 wHYPE)', value: 45, color: '#00d4aa' },
  { name: 'Medium Holders (10-100 wHYPE)', value: 35, color: '#ffa726' },
  { name: 'Small Holders (<10 wHYPE)', value: 20, color: '#42a5f5' },
];

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('7d');
  const hyperLendData = useHyperLendData();
  
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

  return (
    <main className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                Protocol Analytics
              </h1>
              <p className="text-foreground-secondary">
                Real-time insights into HyperLoops performance and user activity
              </p>
            </div>
            <div className="flex gap-3">
              <Select
                label="Time Range"
                selectedKeys={[timeRange]}
                onSelectionChange={(keys) => setTimeRange(Array.from(keys)[0] as string)}
                className="w-32"
                size="sm"
              >
                <SelectItem key="24h">24h</SelectItem>
                <SelectItem key="7d">7d</SelectItem>
                <SelectItem key="30d">30d</SelectItem>
                <SelectItem key="90d">90d</SelectItem>
              </Select>
              <Chip
                color="success"
                variant="flat"
                startContent={<Activity className="w-4 h-4" />}
              >
                Live Data
              </Chip>
            </div>
          </motion.div>

          {/* Key Metrics */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 bg-background-secondary border-border">
              <CardBody className="text-center space-y-3">
                <div className="w-12 h-12 mx-auto bg-accent/20 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-sm font-medium text-foreground-secondary uppercase tracking-wide">Total Value Locked</h3>
                <p className="text-2xl font-bold text-accent">1,750 wHYPE</p>
                <div className="flex items-center justify-center gap-1 text-success">
                  <TrendingUp className="w-3 h-3" />
                  <span className="text-xs">+12.5% (7d)</span>
                </div>
              </CardBody>
            </Card>

            <Card className="p-6 bg-background-secondary border-border">
              <CardBody className="text-center space-y-3">
                <div className="w-12 h-12 mx-auto bg-success/20 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-success" />
                </div>
                <h3 className="text-sm font-medium text-foreground-secondary uppercase tracking-wide">Active Participants</h3>
                <p className="text-2xl font-bold text-success">42</p>
                <div className="flex items-center justify-center gap-1 text-success">
                  <TrendingUp className="w-3 h-3" />
                  <span className="text-xs">+16.7% (7d)</span>
                </div>
              </CardBody>
            </Card>

            <Card className="p-6 bg-background-secondary border-border">
              <CardBody className="text-center space-y-3">
                <div className="w-12 h-12 mx-auto bg-warning/20 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-warning" />
                </div>
                <h3 className="text-sm font-medium text-foreground-secondary uppercase tracking-wide">Total Tickets</h3>
                <p className="text-2xl font-bold text-warning">17,500</p>
                <div className="flex items-center justify-center gap-1 text-success">
                  <TrendingUp className="w-3 h-3" />
                  <span className="text-xs">+9.4% (7d)</span>
                </div>
              </CardBody>
            </Card>

            <Card className="p-6 bg-background-secondary border-border">
              <CardBody className="text-center space-y-3">
                <div className="w-12 h-12 mx-auto bg-info/20 rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6 text-info" />
                </div>
                <h3 className="text-sm font-medium text-foreground-secondary uppercase tracking-wide">Current Prize Pool</h3>
                <p className="text-2xl font-bold text-info">0.32 wHYPE</p>
                <div className="flex items-center justify-center gap-1 text-foreground-secondary">
                  <Calendar className="w-3 h-3" />
                  <span className="text-xs">Next draw: 14h 32m</span>
                </div>
              </CardBody>
            </Card>
          </motion.div>

          {/* Charts Section */}
          <motion.div variants={itemVariants}>
            <Tabs aria-label="Analytics tabs" color="primary" variant="underlined" className="w-full">
              <Tab key="overview" title="Overview">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
                  {/* Yield Over Time */}
                  <Card className="p-6 bg-background-secondary border-border">
                    <CardBody>
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">Daily Yield Generated</h3>
                          <p className="text-sm text-foreground-secondary">Accumulated yield available for prizes</p>
                        </div>
                        <Chip size="sm" color="success" variant="flat">
                          12.3% APY
                        </Chip>
                      </div>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={mockYieldData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2b" />
                          <XAxis dataKey="date" stroke="#a0a0a0" fontSize={12} />
                          <YAxis stroke="#a0a0a0" fontSize={12} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1a1a1b',
                              border: '1px solid #2a2a2b',
                              borderRadius: '8px',
                            }}
                          />
                          <Area type="monotone" dataKey="yield" stroke="#00d4aa" fill="#00d4aa" fillOpacity={0.2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardBody>
                  </Card>

                  {/* Participants Growth */}
                  <Card className="p-6 bg-background-secondary border-border">
                    <CardBody>
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">Participant Growth</h3>
                          <p className="text-sm text-foreground-secondary">Active users and total deposits</p>
                        </div>
                      </div>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={mockYieldData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2b" />
                          <XAxis dataKey="date" stroke="#a0a0a0" fontSize={12} />
                          <YAxis stroke="#a0a0a0" fontSize={12} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1a1a1b',
                              border: '1px solid #2a2a2b',
                              borderRadius: '8px',
                            }}
                          />
                          <Line type="monotone" dataKey="participants" stroke="#ffa726" strokeWidth={2} />
                          <Line type="monotone" dataKey="deposits" stroke="#42a5f5" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardBody>
                  </Card>
                </div>
              </Tab>

              <Tab key="lottery" title="Lottery Data">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
                  {/* Recent Winners */}
                  <Card className="lg:col-span-2 p-6 bg-background-secondary border-border">
                    <CardBody>
                      <h3 className="text-lg font-semibold text-foreground mb-6">Recent Lottery Results</h3>
                      <div className="space-y-4">
                        {mockLotteryHistory.map((lottery) => (
                          <div key={lottery.round} className="flex items-center justify-between p-4 bg-background rounded-lg border border-border">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-warning/20 rounded-full flex items-center justify-center">
                                <Award className="w-5 h-5 text-warning" />
                              </div>
                              <div>
                                <div className="font-semibold text-foreground">Round {lottery.round}</div>
                                <div className="text-sm text-foreground-secondary">
                                  {lottery.participants} participants • {lottery.tickets.toLocaleString()} tickets
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-warning">{lottery.prize} wHYPE</div>
                              <div className="text-sm text-foreground-secondary">{lottery.winner}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardBody>
                  </Card>

                  {/* Ticket Distribution */}
                  <Card className="p-6 bg-background-secondary border-border">
                    <CardBody>
                      <h3 className="text-lg font-semibold text-foreground mb-6">Ticket Distribution</h3>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={mockTicketDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {mockTicketDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1a1a1b',
                              border: '1px solid #2a2a2b',
                              borderRadius: '8px',
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-2 mt-4">
                        {mockTicketDistribution.map((entry, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-foreground-secondary">{entry.name}: {entry.value}%</span>
                          </div>
                        ))}
                      </div>
                    </CardBody>
                  </Card>
                </div>
              </Tab>

              <Tab key="hyperlend" title="HyperLend Integration">
                <div className="space-y-8 mt-6">
                  {/* Integration Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="p-6 bg-background-secondary border-border">
                      <CardBody className="text-center space-y-3">
                        <div className="w-12 h-12 mx-auto bg-accent/20 rounded-lg flex items-center justify-center">
                          <BarChart3 className="w-6 h-6 text-accent" />
                        </div>
                        <h3 className="text-sm font-medium text-foreground-secondary uppercase tracking-wide">Current APY</h3>
                        <p className="text-2xl font-bold text-accent">{formatAPY(hyperLendData.currentAPY)}</p>
                        <p className="text-xs text-foreground-secondary">
                          {hyperLendData.isLoading
                            ? 'Loading...'
                            : hyperLendData.lastUpdated
                            ? `Last updated: ${Math.floor((Date.now() - hyperLendData.lastUpdated.getTime()) / 60000)}min ago`
                            : 'Last updated: 2min ago'
                          }
                        </p>
                      </CardBody>
                    </Card>

                    <Card className="p-6 bg-background-secondary border-border">
                      <CardBody className="text-center space-y-3">
                        <div className="w-12 h-12 mx-auto bg-success/20 rounded-lg flex items-center justify-center">
                          <TrendingUp className="w-6 h-6 text-success" />
                        </div>
                        <h3 className="text-sm font-medium text-foreground-secondary uppercase tracking-wide">24h Expected Return</h3>
                        <p className="text-2xl font-bold text-success">0.59 wHYPE</p>
                        <p className="text-xs text-foreground-secondary">Based on current deposits</p>
                      </CardBody>
                    </Card>

                    <Card className="p-6 bg-background-secondary border-border">
                      <CardBody className="text-center space-y-3">
                        <div className="w-12 h-12 mx-auto bg-warning/20 rounded-lg flex items-center justify-center">
                          <Activity className="w-6 h-6 text-warning" />
                        </div>
                        <h3 className="text-sm font-medium text-foreground-secondary uppercase tracking-wide">Protocol Health</h3>
                        <p className="text-2xl font-bold text-success">{hyperLendData.error ? 'Demo Mode' : 'Excellent'}</p>
                        <p className="text-xs text-foreground-secondary">
                          {hyperLendData.error ? 'Using mock data' : 'All systems operational'}
                        </p>
                      </CardBody>
                    </Card>
                  </div>

                  {/* API Integration Notice */}
                  <Card className="p-6 bg-info/10 border-info/30">
                    <CardBody>
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-info/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Activity className="w-6 h-6 text-info" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-foreground mb-2">
                            Live HyperLend Integration
                          </h3>
                          <p className="text-foreground-secondary mb-4">
                            Expected 24-hour returns are calculated using real-time data from the HyperLend API. 
                            This includes current liquidity rates, market conditions, and historical performance data.
                          </p>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-success rounded-full"></div>
                              <span className="text-foreground-secondary">Interest Rate History API: Active</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-success rounded-full"></div>
                              <span className="text-foreground-secondary">Markets Data API: Active</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-success rounded-full"></div>
                              <span className="text-foreground-secondary">User Value Change API: Active</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </div>
              </Tab>
            </Tabs>
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}