'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardBody, Button, Input, Divider, Progress } from '@nextui-org/react';
import { ArrowUpCircle, TrendingDown, AlertTriangle } from 'lucide-react';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { useContract } from '../../hooks/useContract';
import toast from 'react-hot-toast';

export const WithdrawForm: React.FC = () => {
  const [amount, setAmount] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const { address, isConnected } = useAccount();
  const { withdraw, isLoading, userInfo, refetchAll, formatters } = useContract();

  const handleWithdraw = async () => {
    if (!amount || !address) {
      toast.error('Please enter an amount');
      return;
    }

    if (!userInfo || Number(amount) > Number(formatters.userDeposit)) {
      toast.error('Insufficient deposit balance');
      return;
    }

    try {
      setIsWithdrawing(true);
      const result = await withdraw(amount);
      
      if (result !== undefined) {
        toast.success(`Withdrawal of ${amount} HYPE submitted!`);
        setAmount('');
        // Refetch contract data after withdrawal
        setTimeout(() => refetchAll(), 2000);
      }
    } catch (error) {
      console.error('Withdrawal failed:', error);
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleMaxClick = () => {
    if (userInfo) {
      setAmount(formatters.userDeposit);
    }
  };

  if (!isConnected) {
    return null; // Don't show withdraw form if not connected
  }

  const hasDeposit = userInfo && Number(formatters.userDeposit) > 0;

  if (!hasDeposit) {
    return (
      <Card className="hyperlend-card">
        <CardBody className="p-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <TrendingDown className="h-12 w-12 text-gray-500" />
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">No Deposits</h3>
              <p className="text-gray-400">
                You need to deposit HYPE first before you can withdraw
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border border-red-500/20 bg-hyperliquid-dark/50">
        <CardBody className="p-6">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center space-x-3">
              <ArrowUpCircle className="h-6 w-6 text-accent" />
              <h3 className="text-xl font-bold">Withdraw HYPE</h3>
            </div>

            {/* Current Deposit */}
            <div className="p-4 glass-morphism rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-foreground-secondary">Your Deposit</span>
                  <span className="font-mono">
                    {formatters.userDeposit} HYPE
                  </span>
                </div>
                <Progress 
                  value={100} 
                  color="primary"
                  className="h-2"
                  classNames={{
                    track: "",
                    indicator: "bg-accent"
                  }}
                />
              </div>
            </div>

            {/* Withdraw Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Amount to Withdraw (HYPE)
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    max={formatters.userDeposit}
                    className="pr-16"
                    classNames={{
                      input: "text-right font-mono text-lg",
                      inputWrapper: "glass-morphism",
                    }}
                  />
                  <Button
                    size="sm"
                    className="hyperlend-button absolute right-2 top-1/2 -translate-y-1/2 h-8"
                    onPress={handleMaxClick}
                  >
                    MAX
                  </Button>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full hyperlend-button"
                onPress={handleWithdraw}
                isLoading={isWithdrawing || isLoading}
                isDisabled={!amount || Number(amount) <= 0 || Number(amount) > Number(formatters.userDeposit)}
              >
                {isWithdrawing ? 'Withdrawing...' : 'Withdraw Tokens'}
              </Button>
            </div>

            <Divider className="bg-red-500/20" />

            {/* Warning */}
            <div className="space-y-3">
              <div className="flex items-start space-x-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-red-200">
                  <strong>Important:</strong> Withdrawing removes your lottery tickets and stops yield generation. 
                  You'll miss future prize draws until you deposit again.
                </div>
              </div>
            </div>

            {/* Process Steps */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-300">Withdrawal Process:</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-red-400 rounded-full flex-shrink-0"></div>
                  <span className="text-sm text-gray-400">
                    Tokens withdrawn from HyperLend lending pool
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-orange-400 rounded-full flex-shrink-0"></div>
                  <span className="text-sm text-gray-400">
                    Your lottery participation ends (if full withdrawal)
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-blue-400 rounded-full flex-shrink-0"></div>
                  <span className="text-sm text-gray-400">
                    Tokens returned directly to your wallet
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
};