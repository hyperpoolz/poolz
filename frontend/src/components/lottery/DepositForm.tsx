'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardBody, Button, Input, Divider, Chip } from '@nextui-org/react';
import { ArrowDownCircle, Wallet, TrendingUp, AlertCircle } from 'lucide-react';
import { useAccount, useReadContract } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import { useContract } from '../../hooks/useContract';
import toast from 'react-hot-toast';
import { CONTRACT_ADDRESSES } from '../../utils/constants';

const ERC20_ABI = [
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'decimals', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] },
  { name: 'symbol', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
] as const;

export const DepositForm: React.FC = () => {
  const [amount, setAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);
  const { address, isConnected, chainId } = useAccount();
  const { deposit, isLoading, refetchAll } = useContract();

  const tokenAddress = chainId ? CONTRACT_ADDRESSES[chainId!]?.wHYPE : undefined;

  // ERC20 metadata and balance
  const { data: decimals = 18 } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'decimals',
    query: { enabled: !!tokenAddress },
  });
  const { data: symbol = 'wHYPE' } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'symbol',
    query: { enabled: !!tokenAddress },
  });
  const { data: balanceRaw } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!tokenAddress && !!address },
  });

  const handleDeposit = async () => {
    if (!amount || !address) {
      toast.error('Please enter an amount');
      return;
    }

    try {
      setIsDepositing(true);
      const result = await deposit(amount);
      
      if (result !== undefined) {
        toast.success(`Deposit of ${amount} ${symbol} submitted!`);
        setAmount('');
        // Refetch contract data after deposit
        setTimeout(() => refetchAll(), 2000);
      }
    } catch (error) {
      console.error('Deposit failed:', error);
    } finally {
      setIsDepositing(false);
    }
  };

  const handleMaxClick = () => {
    if (balanceRaw !== undefined) {
      const formatted = Number(formatUnits(balanceRaw as bigint, Number(decimals)));
      setAmount(formatted.toString());
    }
  };

  if (!isConnected) {
    return (
      <Card className="hyperlend-card">
        <CardBody className="p-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <Wallet className="h-12 w-12 text-hyperliquid-accent/60" />
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Connect Wallet</h3>
              <p className="text-gray-400">
                Connect your wallet to start earning yield and winning prizes
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
      <Card className="border border-hyperliquid-accent/20 bg-hyperliquid-dark/50">
        <CardBody className="p-6">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center space-x-3">
              <ArrowDownCircle className="h-6 w-6 text-accent" />
              <h3 className="text-xl font-bold">Deposit {symbol}</h3>
            </div>

            {/* Contract Status */}
            <div className="flex items-center justify-between p-4 glass-morphism rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Contract Connected</span>
              </div>
              <Chip size="sm" color="success" variant="flat">
                Live
              </Chip>
            </div>

            {/* Balance Display */}
            {balanceRaw !== undefined && (
              <div className="p-4 glass-morphism rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-foreground-secondary">Available Balance</span>
                  <span className="font-mono">
                    {Number(formatUnits(balanceRaw as bigint, Number(decimals))).toFixed(4)} {symbol}
                  </span>
                </div>
              </div>
            )}

            {/* Deposit Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Amount ({symbol})
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
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
                onPress={handleDeposit}
                isLoading={isDepositing || isLoading}
                isDisabled={!amount || Number(amount) <= 0}
              >
                {isDepositing ? 'Depositing...' : 'Deposit & Earn'}
              </Button>
            </div>

            <Divider className="bg-hyperliquid-accent/20" />

            {/* Benefits */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-300">What happens next?</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="h-4 w-4 text-hyperliquid-accent flex-shrink-0" />
                  <span className="text-sm text-gray-400">
                    Your wHYPE earns 5-20% APY through HyperLend
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-gradient-to-r from-hyperliquid-accent to-purple-500 rounded-full flex-shrink-0"></div>
                  <span className="text-sm text-gray-400">
                    Earn lottery tickets based on yield generated
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full flex-shrink-0"></div>
                  <span className="text-sm text-gray-400">
                    Win daily prizes while keeping your principal
                  </span>
                </div>
              </div>
            </div>

            {/* Demo Notice */}
            <div className="flex items-start space-x-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-200">
                <strong>Demo Mode:</strong> This is a development version. Deposits will interact with the deployed contract but use test tokens.
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
};