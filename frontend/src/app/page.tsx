'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardBody, Button, Chip } from '@nextui-org/react';
import { ArrowRight, Shield, TrendingUp, Gift, AlertCircle } from 'lucide-react';
import { useAccount } from 'wagmi';
import { Header } from '../components/layout/Header';
import { PoolStats } from '../components/lottery/PoolStats';
import { ContractStatus } from '../components/lottery/ContractStatus';
import { WinnerHistory } from '../components/lottery/WinnerHistory';
import { DepositForm } from '../components/lottery/DepositForm';
import { WithdrawForm } from '../components/lottery/WithdrawForm';

export default function HomePage() {
  const { isConnected } = useAccount();

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
          {/* Hero Section */}
          <motion.div variants={itemVariants} className="text-center space-y-6">
            <div className="space-y-4">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                <Chip
                  color="success"
                  variant="flat"
                  className="mb-4"
                  startContent={<Shield className="w-4 h-4" />}
                >
                  Session 1 Demo - Foundation Layer ✅
                </Chip>
              </motion.div>
              
              <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4">
                <span className="gradient-text">HyperLoops</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-foreground-secondary max-w-3xl mx-auto">
                The first <span className="text-accent font-semibold">no-loss lottery</span> on Hyperliquid EVM.
                Deposit wHYPE, earn yield through HyperLend, win prizes - 
                <span className="text-success font-semibold"> your principal is always safe</span>.
              </p>
            </div>

            {/* Key Features */}
            <motion.div
              variants={itemVariants}
              className="flex flex-wrap justify-center gap-4 max-w-2xl mx-auto"
            >
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/20">
                <Shield className="w-4 h-4 text-success" />
                <span className="text-sm font-medium text-success">0% Principal Risk</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20">
                <TrendingUp className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium text-accent">5-20% APY</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-warning/10 border border-warning/20">
                <Gift className="w-4 h-4 text-warning" />
                <span className="text-sm font-medium text-warning">Daily Prizes</span>
              </div>
            </motion.div>

            {/* CTA Button */}
            {!isConnected && (
              <motion.div variants={itemVariants}>
                <Button
                  size="lg"
                  color="primary"
                  className="font-semibold px-8 py-3 text-lg"
                  endContent={<ArrowRight className="w-5 h-5" />}
                  disabled // Will be functional in Session 2
                >
                  Connect Wallet to Start
                </Button>
                <p className="text-sm text-foreground-secondary mt-2">
                  Connect your wallet to view pool statistics and contract status
                </p>
              </motion.div>
            )}
          </motion.div>

          {/* Session 1 Demo Notice */}
          <motion.div variants={itemVariants}>
            <Card className="border border-info/20 bg-info/5">
              <CardBody className="p-6">
                <div className="flex items-start gap-4">
                  <AlertCircle className="w-6 h-6 text-info mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Session 2 - New Features Available!
                    </h3>
                    <div className="space-y-2 text-sm text-foreground-secondary">
                      <p>
                        ✅ <strong>Smart Contract:</strong> Deployed with working deposit() function and HyperLend integration
                      </p>
                      <p>
                        ✅ <strong>Deposit Functionality:</strong> Real deposit form that interacts with the live contract
                      </p>
                      <p>
                        ✅ <strong>Real-time Updates:</strong> Contract state updates after transactions
                      </p>
                      <p>
                        ✅ <strong>Professional UI:</strong> NextUI components with deposit form and balance tracking
                      </p>
                      <p className="text-warning">
                        🔄 <strong>Coming Next:</strong> Withdraw functionality, yield harvesting, and lottery execution
                      </p>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </motion.div>

          {/* Main Content Grid */}
          {isConnected ? (
            <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Pool Stats */}
              <div className="lg:col-span-2 space-y-8">
                <PoolStats />
              </div>

              {/* Right Column - Deposit/Withdraw Forms, Contract Status & Winners */}
              <div className="space-y-8">
                <DepositForm />
                <WithdrawForm />
                <ContractStatus />
                <WinnerHistory />
              </div>
            </motion.div>
          ) : (
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Preview Cards for Non-Connected Users */}
              <Card className="border border-border hover:border-border-hover transition-colors">
                <CardBody className="p-6 text-center">
                  <TrendingUp className="w-12 h-12 text-accent mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">High Yield</h3>
                  <p className="text-sm text-foreground-secondary">
                    Earn 5-20% APY through HyperLend integration while participating in daily lotteries
                  </p>
                </CardBody>
              </Card>

              <Card className="border border-border hover:border-border-hover transition-colors">
                <CardBody className="p-6 text-center">
                  <Shield className="w-12 h-12 text-success mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Zero Risk</h3>
                  <p className="text-sm text-foreground-secondary">
                    Your principal deposit is always safe - only the earned yield goes to prize pools
                  </p>
                </CardBody>
              </Card>

              <Card className="border border-border hover:border-border-hover transition-colors">
                <CardBody className="p-6 text-center">
                  <Gift className="w-12 h-12 text-warning mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Daily Prizes</h3>
                  <p className="text-sm text-foreground-secondary">
                    Fair, time-weighted lottery system distributes accumulated yield to winners daily
                  </p>
                </CardBody>
              </Card>
            </motion.div>
          )}

          {/* Footer */}
          <motion.div variants={itemVariants} className="text-center py-8">
            <p className="text-sm text-foreground-secondary">
              Built on Hyperliquid EVM • Powered by HyperLend • Session 1 Foundation Demo
            </p>
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}