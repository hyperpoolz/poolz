'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Coins, Users, Trophy, Clock, TrendingUp, Zap } from 'lucide-react';
import { StatCard } from '../common/StatCard';
import { useContract } from '../../hooks/useContract';
import { formatCurrency, formatTimeRemaining, formatNumber, formatPercentage } from '../../utils/format';
import { DEMO_DATA, FEATURE_FLAGS } from '../../utils/constants';

export const PoolStats: React.FC = () => {
  const { contractState, isLoading } = useContract();

  // Use demo data in development or when contract data is not available
  const useDemoData = FEATURE_FLAGS.showDemoData && (
    !contractState.totalDeposits || 
    contractState.totalDeposits === 0n
  );

  const stats = useDemoData ? {
    totalDeposits: DEMO_DATA.poolStats.totalDeposits,
    prizePool: DEMO_DATA.poolStats.prizePool,
    participantCount: DEMO_DATA.poolStats.participantCount,
    currentAPY: DEMO_DATA.poolStats.currentAPY,
    nextLotteryTime: DEMO_DATA.poolStats.nextLotteryTime,
    totalTickets: DEMO_DATA.poolStats.totalTickets,
  } : {
    totalDeposits: formatNumber(Number(contractState.totalDeposits) / 1e18, 1),
    prizePool: formatNumber(Number(contractState.prizePool) / 1e18, 1),
    participantCount: contractState.participantCount,
    currentAPY: 12.5, // Mock APY - will be fetched from HyperLend in Session 3
    nextLotteryTime: Date.now() + (Number(contractState.nextLotteryTime) * 1000),
    totalTickets: 0, // Will be implemented in Session 3
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: "easeOut"
      }
    })
  };

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div
          custom={0}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <div className="hyperlend-card p-4">
            <StatCard
            title="Total Deposits"
            value={formatCurrency(stats.totalDeposits)}
            subtitle="Principal protected"
            icon={Coins}
            color="primary"
            trend="+12.5%"
            isLoading={isLoading}
            />
          </div>
        </motion.div>

        <motion.div
          custom={1}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <div className="hyperlend-card p-4">
            <StatCard
            title="Current Prize Pool"
            value={formatCurrency(stats.prizePool)}
            subtitle="From accumulated yield"
            icon={Trophy}
            color="success"
            trend="+45.2%"
            isLoading={isLoading}
            />
          </div>
        </motion.div>

        <motion.div
          custom={2}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <div className="hyperlend-card p-4">
            <StatCard
            title="Active Participants"
            value={formatNumber(stats.participantCount)}
            subtitle="Earning yield daily"
            icon={Users}
            color="default"
            trend="+8"
            isLoading={isLoading}
            />
          </div>
        </motion.div>
      </div>

      {/* Secondary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          custom={3}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <div className="hyperlend-card p-4">
            <StatCard
            title="Current APY"
            value={formatPercentage(stats.currentAPY)}
            subtitle="From HyperLend"
            icon={TrendingUp}
            color="success"
            trend="↗️ +0.3%"
            isLoading={isLoading}
            />
          </div>
        </motion.div>

        <motion.div
          custom={4}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <div className="hyperlend-card p-4">
            <StatCard
            title="Next Lottery"
            value={formatTimeRemaining(stats.nextLotteryTime)}
            subtitle="Daily draws"
            icon={Clock}
            color="warning"
            isLoading={isLoading}
            />
          </div>
        </motion.div>

        <motion.div
          custom={5}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <div className="hyperlend-card p-4">
            <StatCard
            title="Total Tickets"
            value={formatNumber(stats.totalTickets)}
            subtitle="Active lottery entries"
            icon={Zap}
            color="primary"
            isLoading={isLoading}
            />
          </div>
        </motion.div>
      </div>

      {/* Protocol Status Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="flex items-center justify-center gap-3 p-4 rounded-lg glass-morphism"
      >
        <div className="w-3 h-3 bg-success rounded-full animate-pulse" />
        <span className="text-sm font-medium text-success">
          Protocol Active • HyperLend Integration Operational
        </span>
      </motion.div>
    </div>
  );
};