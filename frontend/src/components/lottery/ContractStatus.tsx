'use client';

import React from 'react';
import { Card, CardBody, Chip, Button } from '@nextui-org/react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Pause, 
  Play, 
  AlertTriangle, 
  CheckCircle, 
  ExternalLink,
  Code,
  Zap
} from 'lucide-react';
import { useAccount } from 'wagmi';
import { useContract } from '../../hooks/useContract';
import { formatAddress } from '../../utils/format';
import { CONTRACT_ADDRESSES, NETWORKS } from '../../utils/constants';

export const ContractStatus: React.FC = () => {
  const { chainId } = useAccount();
  const { contractAddress, contractState, isLoading } = useContract();

  const currentNetwork = chainId === 999 ? NETWORKS.hyperEVM : NETWORKS.hyperEVMTestnet;
  const contractAddresses = chainId ? CONTRACT_ADDRESSES[chainId] : null;

  const getStatusColor = () => {
    if (contractAddress && contractState.currentRound > 0n) return 'success';
    return 'default';
  };

  const getStatusText = () => {
    if (contractAddress && contractState.currentRound > 0n) return 'Active';
    return 'Initializing';
  };

  const getStatusIcon = () => {
    if (contractAddress && contractState.currentRound > 0n) return <CheckCircle className="w-4 h-4" />;
    return <AlertTriangle className="w-4 h-4" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      {/* Main Status Card */}
      <Card className="hyperlend-card">
        <CardBody className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-background-secondary border border-border">
                <Shield className="w-5 h-5 text-accent" />
              </div>
              <div>
               <h3 className="text-lg font-semibold">Contract Status</h3>
               <p className="text-sm text-foreground-secondary">HyperLend-style UI</p>
              </div>
            </div>
            
            <Chip
              color={getStatusColor()}
              variant="flat"
              startContent={getStatusIcon()}
              className="px-3 py-1"
            >
              {getStatusText()}
            </Chip>
          </div>

          <div className="space-y-4">
            {/* Contract Address */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-background-secondary border border-border">
              <div className="flex items-center gap-3">
                <Code className="w-4 h-4 text-foreground-secondary" />
                <div>
                  <p className="text-sm font-medium text-foreground">Contract Address</p>
                  <p className="text-xs text-foreground-secondary font-mono">
                    {contractAddress ? formatAddress(contractAddress) : 'Not deployed'}
                  </p>
                </div>
              </div>
               {contractAddress && (
                <Button
                  size="sm"
                  variant="ghost"
                  isIconOnly
                  onPress={() => window.open(`${currentNetwork.blockExplorer}/address/${contractAddress}`, '_blank')}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Network Info */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-background-secondary border border-border">
              <div className="flex items-center gap-3">
                <Zap className="w-4 h-4 text-accent" />
                <div>
                  <p className="text-sm font-medium text-foreground">Network</p>
                  <p className="text-xs text-foreground-secondary">
                    {currentNetwork.name} (Chain ID: {chainId})
                  </p>
                </div>
              </div>
              <Chip size="sm" color="primary" variant="flat">
                Connected
              </Chip>
            </div>

            {/* Current Round */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-background-secondary border border-border">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-success animate-pulse" />
                <div>
                  <p className="text-sm font-medium text-foreground">Current Round</p>
                  <p className="text-xs text-foreground-secondary">
                    {contractState.currentRound.toString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* HyperLend Integration Status */}
      <Card className="hyperlend-card">
        <CardBody className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-background-secondary border border-border">
              <Shield className="w-5 h-5 text-success" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">HyperLend Integration</h3>
              <p className="text-sm text-foreground-secondary">Yield generation infrastructure</p>
            </div>
          </div>

          <div className="space-y-3">
            {contractAddresses && (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground-secondary">Pool Contract:</span>
                  <span className="font-mono text-foreground">
                    {formatAddress(contractAddresses.hyperLendPool)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground-secondary">Data Provider:</span>
                  <span className="font-mono text-foreground">
                    {formatAddress(contractAddresses.dataProvider)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground-secondary">wHYPE Token:</span>
                  <span className="font-mono text-foreground">
                    {formatAddress(contractAddresses.wHYPE)}
                  </span>
                </div>
              </>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Session 1 Demo Features */}
      <Card className="border border-accent/20 bg-accent/5">
        <CardBody className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-accent/20">
              <CheckCircle className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Session 1 Features ✅</h3>
              <p className="text-sm text-foreground-secondary">Currently implemented and demoable</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-success" />
              <span className="text-sm text-foreground">Contract Deployment</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-success" />
              <span className="text-sm text-foreground">HyperLend Interfaces</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-success" />
              <span className="text-sm text-foreground">Wallet Integration</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-success" />
              <span className="text-sm text-foreground">Real-time Data</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-success" />
              <span className="text-sm text-foreground">Emergency Controls</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-success" />
              <span className="text-sm text-foreground">Professional UI</span>
            </div>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
};