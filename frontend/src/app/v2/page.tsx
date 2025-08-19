'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardBody, 
  Input, 
  Button, 
  Chip, 
  Progress, 
  Table, 
  TableHeader, 
  TableColumn, 
  TableBody, 
  TableRow, 
  TableCell,
  Divider,
  Badge,
  Avatar,
  Alert
} from '@nextui-org/react';
import { 
  Coins, 
  TrendingUp, 
  Crown, 
  Timer, 
  Users, 
  Wallet, 
  Zap,
  Trophy,
  Target,
  DollarSign,
  RefreshCw,
  Star,
  Sparkles,
  Clock,
  Shield,
  CheckCircle
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { useContractV2 } from '../../hooks/useContractV2';
import { useAccount } from 'wagmi';

function formatSecondsToCountdown(seconds: number): string {
  if (seconds <= 0) return 'Ready';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function LotteryV2Page() {
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const { isConnected } = useAccount();
  
  const {
    contractData,
    isLoading,
    deposit,
    withdraw,
    harvestYield,
    closeCurrentRound,
    finalizeRound,
    formatters,
    refetchAll,
    depositTokenAddress,
  } = useContractV2();

  // Auto-refresh contract data every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetchAll();
    }, 10000);

    return () => clearInterval(interval);
  }, [refetchAll]);

  // Mock data for recent winners - this would come from events in a real implementation
  const recentWinners = [
    { round: Number(contractData.currentRound) - 1, winner: '0x1a2b...c3d4', prize: '89.3', timeAgo: '2 hours ago' },
    { round: Number(contractData.currentRound) - 2, winner: '0x5e6f...g7h8', prize: '156.8', timeAgo: '1 day ago' },
    { round: Number(contractData.currentRound) - 3, winner: '0x9i0j...k1l2', prize: '203.4', timeAgo: '2 days ago' }
  ];

  // Mock participants data - in reality this would be fetched from the participants array on the contract
  const mockParticipants = [
    { address: '0x1a2b...c3d4', tickets: 156, winProbability: contractData.totalTickets > 0n ? (156 / Number(contractData.totalTickets)) * 100 : 0 },
    { address: '0x5e6f...g7h8', tickets: 89, winProbability: contractData.totalTickets > 0n ? (89 / Number(contractData.totalTickets)) * 100 : 0 },
    { address: '0x9i0j...k1l2', tickets: 67, winProbability: contractData.totalTickets > 0n ? (67 / Number(contractData.totalTickets)) * 100 : 0 },
    { address: '0xm3n4...o5p6', tickets: 45, winProbability: contractData.totalTickets > 0n ? (45 / Number(contractData.totalTickets)) * 100 : 0 }
  ];

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header with V2 Badge */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">HyperLoops V2</h1>
            <Chip 
              color="secondary" 
              variant="shadow" 
              startContent={<Sparkles className="w-4 h-4" />}
              className="font-semibold"
            >
              Latest
            </Chip>
            <Chip 
              color="success" 
              variant="flat" 
              startContent={<CheckCircle className="w-3 h-3" />}
              size="sm"
            >
              Deployed: 0x79A8...F7d
            </Chip>
          </div>
          <p className="text-foreground-secondary">
            Enhanced no-loss lottery with advanced features, secure randomness, and improved gas optimization
          </p>
        </div>

        {/* Connection Status */}
        {!isConnected && (
          <Alert 
            color="warning" 
            variant="flat" 
            className="mb-6"
            startContent={<Wallet className="w-5 h-5" />}
            title="Wallet Not Connected"
            description="Please connect your wallet to interact with HyperLoops V2."
          />
        )}


        {/* V2 Features Alert */}
        <Alert 
          color="primary" 
          variant="flat" 
          className="mb-6"
          startContent={<Star className="w-5 h-5" />}
          title="New in V2"
          description="Fixed ticketing system (0.1 wHYPE = 1 ticket), two-phase secure randomness, 24-hour intervals, comprehensive analytics, and gas-optimized for thousands of users."
        />

        {/* Top Stats Banner */}
        <Card className="mb-6 border border-border bg-gradient-to-r from-secondary/10 to-primary/10">
          <CardBody className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{formatters.prizePool} HYPE</div>
                <div className="text-sm text-foreground-secondary">Current Prize</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-warning">{formatSecondsToCountdown(contractData.timeToNextDraw)}</div>
                <div className="text-sm text-foreground-secondary">Next Draw</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-success">{contractData.participantCount}</div>
                <div className="text-sm text-foreground-secondary">Players</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary">{formatters.totalTickets}</div>
                <div className="text-sm text-foreground-secondary">Total Tickets</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-info">#{contractData.currentRound.toString()}</div>
                <div className="text-sm text-foreground-secondary">Round</div>
              </div>
            </div>
          </CardBody>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Actions */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Deposit & Withdraw Section */}
            <Card className="border border-border">
              <CardBody className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Wallet className="w-6 h-6 text-primary" />
                  <h2 className="text-xl font-semibold">Manage Deposits</h2>
                  <Chip size="sm" variant="flat" color="primary">wHYPE</Chip>
                  <Chip size="sm" variant="flat" color="secondary">V2</Chip>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Deposit */}
                  <div className="space-y-3">
                    <h3 className="font-medium text-success">Deposit (Fixed Tickets)</h3>
                    <Input
                      label="Amount (HYPE)"
                      placeholder="0.10"
                      type="number"
                      step="0.1"
                      inputMode="decimal"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      startContent={<DollarSign className="w-4 h-4 text-foreground-secondary" />}
                      description="Must be multiple of 0.1 HYPE"
                    />
                    <Button 
                      color="success" 
                      onPress={async () => {
                        if (depositAmount) {
                          try {
                            await deposit(depositAmount);
                            setDepositAmount('');
                          } catch (error) {
                            console.error('Deposit failed:', error);
                          }
                        }
                      }} 
                      isLoading={isLoading}
                      className="w-full"
                      startContent={<Coins className="w-4 h-4" />}
                      isDisabled={!depositAmount || Number(depositAmount) <= 0 || !isConnected}
                    >
                      Deposit to Pool
                    </Button>
                    <div className="text-xs text-foreground-secondary">
                      {formatters.ticketUnit} HYPE = 1 ticket • Current tickets: {formatters.userTickets}
                    </div>
                  </div>

                  {/* Withdraw */}
                  <div className="space-y-3">
                    <h3 className="font-medium text-danger">Withdraw</h3>
                    <Input
                      label="Amount (HYPE)"
                      placeholder="0.10"
                      type="number"
                      step="0.1"
                      inputMode="decimal"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      startContent={<DollarSign className="w-4 h-4 text-foreground-secondary" />}
                    />
                    <Button 
                      color="danger" 
                      onPress={async () => {
                        if (withdrawAmount) {
                          try {
                            await withdraw(withdrawAmount);
                            setWithdrawAmount('');
                          } catch (error) {
                            console.error('Withdraw failed:', error);
                          }
                        }
                      }}
                      isLoading={isLoading}
                      className="w-full"
                      startContent={<Wallet className="w-4 h-4" />}
                      isDisabled={!withdrawAmount || Number(withdrawAmount) <= 0 || !isConnected}
                    >
                      Withdraw Funds
                    </Button>
                    <div className="text-xs text-foreground-secondary">
                      Your balance: <span className="font-medium">{formatters.userDeposit} HYPE</span>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* V2 Yield Harvesting */}
            <Card className="border border-border">
              <CardBody className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="w-6 h-6 text-warning" />
                  <h2 className="text-xl font-semibold">V2 Yield System</h2>
                  <Badge content="24h" color="warning" size="sm">
                    <Clock className="w-5 h-5" />
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-foreground-secondary">Prize Pool</span>
                      <span className="font-medium">{formatters.prizePool} HYPE</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-foreground-secondary">Your Tickets</span>
                      <span className="font-medium text-warning">{formatters.userTickets}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-foreground-secondary">Win Probability</span>
                      <span className="font-medium text-success">{formatters.userWinProbability}%</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Button 
                      color="warning" 
                      variant="solid"
                      onPress={async () => {
                        try {
                          await harvestYield();
                        } catch (error) {
                          console.error('Harvest failed:', error);
                        }
                      }}
                      isLoading={isLoading}
                      className="w-full"
                      startContent={<Zap className="w-4 h-4" />}
                      isDisabled={!contractData.canHarvest || !isConnected}
                    >
                      {contractData.canHarvest ? "Harvest Yield" : "Harvesting Locked"}
                    </Button>
                    <div className="text-xs text-foreground-secondary">
                      <div className="flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        24-hour harvest interval for security
                      </div>
                      <div>1% caller incentive for harvesters</div>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* V2 Two-Phase Lottery */}
            <Card className="border border-border bg-gradient-to-br from-warning/5 to-primary/5">
              <CardBody className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Crown className="w-6 h-6 text-warning" />
                  <h2 className="text-xl font-semibold">V2 Two-Phase Lottery</h2>
                  <Chip 
                    color={contractData.canCloseRound ? "success" : "default"} 
                    variant="flat"
                    startContent={contractData.canCloseRound ? <Trophy className="w-3 h-3" /> : <Timer className="w-3 h-3" />}
                  >
                    {contractData.currentRoundData.state === 0 ? 'Active' : contractData.currentRoundData.state === 1 ? 'Closed' : 'Finalized'}
                  </Chip>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="p-3 rounded-lg bg-background-secondary">
                      <div className="text-lg font-bold text-warning">{formatters.prizePool} HYPE</div>
                      <div className="text-xs text-foreground-secondary">Prize Pool</div>
                    </div>
                    <div className="p-3 rounded-lg bg-background-secondary">
                      <div className="text-lg font-bold">{formatSecondsToCountdown(contractData.timeToNextDraw)}</div>
                      <div className="text-xs text-foreground-secondary">Time Remaining</div>
                    </div>
                    <div className="p-3 rounded-lg bg-background-secondary">
                      <div className="text-lg font-bold text-primary">#{contractData.currentRound.toString()}</div>
                      <div className="text-xs text-foreground-secondary">Round</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button 
                      color="secondary" 
                      variant="solid"
                      onPress={async () => {
                        try {
                          await closeCurrentRound();
                        } catch (error) {
                          console.error('Close round failed:', error);
                        }
                      }}
                      isDisabled={!contractData.canCloseRound || !isConnected}
                      isLoading={isLoading}
                      className="w-full font-semibold"
                      startContent={<Timer className="w-5 h-5" />}
                    >
                      {contractData.canCloseRound ? "Close Round" : `Wait ${formatSecondsToCountdown(contractData.timeToNextDraw)}`}
                    </Button>

                    <Button 
                      color="warning" 
                      variant="solid"
                      onPress={async () => {
                        try {
                          await finalizeRound();
                        } catch (error) {
                          console.error('Finalize round failed:', error);
                        }
                      }}
                      isDisabled={!contractData.canFinalizeRound || !isConnected}
                      isLoading={isLoading}
                      className="w-full font-semibold"
                      startContent={<Crown className="w-5 h-5" />}
                    >
                      {contractData.canFinalizeRound ? "Finalize & Draw Winner" : "Round Not Closed"}
                    </Button>
                  </div>

                  <div className="p-3 rounded-lg bg-info/10 border border-info/20">
                    <div className="flex items-start gap-2 text-sm">
                      <Shield className="w-4 h-4 text-info mt-0.5" />
                      <div>
                        <div className="text-info font-medium">Secure Two-Phase System</div>
                        <div className="text-foreground-secondary text-xs mt-1">
                          Phase 1: Close round & snapshot participants • Phase 2: Generate secure randomness using future blockhash (5-block delay)
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Right Column - Analytics & Recent Winners */}
          <div className="space-y-6">
            
            {/* Personal Stats */}
            <Card className="border border-border">
              <CardBody className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Your V2 Stats</h3>
                  <Avatar name="You" size="sm" className="bg-secondary/20 text-secondary" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground-secondary">Deposit</span>
                    <span className="font-medium">{formatters.userDeposit} HYPE</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground-secondary">Tickets</span>
                    <span className="font-medium text-warning">{formatters.userTickets}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground-secondary">Win Chance</span>
                    <span className="font-medium text-success">{formatters.userWinProbability}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground-secondary">Ticket Rate</span>
                    <span className="font-medium">1 per {formatters.ticketUnit} HYPE</span>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Recent Winners */}
            <Card className="border border-border">
              <CardBody className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Recent Winners</h3>
                  <Trophy className="w-4 h-4 text-warning" />
                </div>
                <div className="space-y-3">
                  {recentWinners.map((winner) => (
                    <div key={winner.round} className="p-3 rounded-lg bg-success/10 border border-success/20">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-mono text-xs text-foreground-secondary">#{winner.round}</div>
                          <div className="font-mono text-sm">{winner.winner}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-success font-bold">{winner.prize} HYPE</div>
                          <div className="text-xs text-foreground-secondary">{winner.timeAgo}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>

            {/* V2 Participants */}
            <Card className="border border-border">
              <CardBody className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Current Participants</h3>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-foreground-secondary" />
                    <span className="text-sm text-foreground-secondary">{contractData.participantCount}</span>
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <Table aria-label="Participants" removeWrapper>
                    <TableHeader>
                      <TableColumn>Player</TableColumn>
                      <TableColumn>Tickets</TableColumn>
                      <TableColumn>Odds</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {mockParticipants.map((participant, index) => (
                        <TableRow key={participant.address}>
                          <TableCell>
                            <div className="font-mono text-xs">
                              {participant.address}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Chip size="sm" variant="flat" color="warning">
                              {participant.tickets}
                            </Chip>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-success">
                              {participant.winProbability.toFixed(1)}%
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardBody>
            </Card>

            {/* V2 Protocol Stats */}
            <Card className="border border-border">
              <CardBody className="p-4">
                <h3 className="font-semibold mb-3">V2 Protocol Stats</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground-secondary">Contract</span>
                    <span className="font-mono text-xs">0x79A8...F7d</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground-secondary">Token</span>
                    <span className="font-mono text-xs">{depositTokenAddress ? `${depositTokenAddress.slice(0, 6)}...${depositTokenAddress.slice(-4)}` : 'Loading...'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground-secondary">Version</span>
                    <span className="font-medium">V2 Micro</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground-secondary">Current Round</span>
                    <span className="font-medium">#{contractData.currentRound.toString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground-secondary">Active Players</span>
                    <span className="font-medium">{contractData.participantCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground-secondary">Ticket System</span>
                    <span className="font-medium text-secondary">Fixed ({formatters.ticketUnit} HYPE)</span>
                  </div>
                </div>
              </CardBody>
            </Card>

          </div>
        </div>
      </div>
    </main>
  );
}