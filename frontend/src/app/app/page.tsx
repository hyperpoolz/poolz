'use client';

import React, { useState } from 'react';
import { Tabs, Tab, Card, CardBody, Input, Button } from '@nextui-org/react';
import { Header } from '../../components/layout/Header';
import { useContract } from '../../hooks/useContract';

function formatSecondsToCountdown(seconds: number): string {
  if (seconds <= 0) return 'Now';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function AppPage() {
  const {
    deposit,
    withdraw,
    isLoading,
    contractState,
    userInfo,
    accruedYield,
    liquidityRate,
    formatters,
  } = useContract();

  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  const nextLotteryInSec = Math.max(0, Number(contractState.nextLotteryTime || 0n) - Math.floor(Date.now() / 1000));
  const apyPercent = Number(liquidityRate) > 0 ? (Number(liquidityRate) / 1e16).toFixed(2) : '—';
  const avgDeposit = contractState.participantCount > 0
    ? (Number(contractState.totalDeposits) / 1e18) / contractState.participantCount
    : 0;

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="text-2xl md:text-3xl font-bold mb-4">HyperLoops</h1>
        <p className="text-sm text-foreground-secondary mb-6">Simple web3 interface. Deposit, withdraw, and track stats.</p>

        <Tabs aria-label="HyperLoops views" variant="underlined" color="primary">
          <Tab key="deposit" title="Deposit">
            <Card className="border border-border">
              <CardBody className="p-6 space-y-4">
                <div className="text-sm text-foreground-secondary">Available token: wHYPE</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input
                    label="Amount (HYPE)"
                    placeholder="0.00"
                    type="number"
                    inputMode="decimal"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                  />
                  <div className="md:col-span-2 grid grid-cols-2 gap-3">
                    <Button color="primary" onPress={() => deposit(depositAmount)} isLoading={isLoading}>
                      Deposit
                    </Button>
                    <Button variant="bordered" onPress={() => setDepositAmount('')}>Clear</Button>
                  </div>
                </div>
                <div className="text-xs text-foreground-secondary">
                  Current APY (from HyperLend): <span className="text-foreground">{apyPercent}%</span>
                </div>
              </CardBody>
            </Card>
          </Tab>

          <Tab key="withdraw" title="Withdraw">
            <Card className="border border-border">
              <CardBody className="p-6 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground-secondary">Your deposit</span>
                  <span className="font-mono">{formatters.userDeposit} HYPE</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input
                    label="Amount (HYPE)"
                    placeholder="0.00"
                    type="number"
                    inputMode="decimal"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                  />
                  <div className="md:col-span-2 grid grid-cols-2 gap-3">
                    <Button color="danger" onPress={() => withdraw(withdrawAmount)} isLoading={isLoading}>
                      Withdraw
                    </Button>
                    <Button variant="bordered" onPress={() => setWithdrawAmount('')}>Clear</Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Tab>

          <Tab key="my-stats" title="My Stats">
            <Card className="border border-border">
              <CardBody className="p-6 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Stat label="Deposit" value={`${formatters.userDeposit} HYPE`} />
                  <Stat label="Tickets" value={userInfo ? userInfo.tickets.toString() : '0'} />
                  <Stat label="Expected 24h Return" value={`${formatters.expected24hReturn} HYPE`} />
                  <Stat label="Win Probability" value={`${formatters.winProbabilityPercent}%`} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <Stat label="Accrued Yield (pool-wide)" value={`${formatters.accruedYield} HYPE`} />
                  <Stat label="APY (live)" value={`${apyPercent}%`} />
                </div>
              </CardBody>
            </Card>
          </Tab>

          <Tab key="protocol" title="Protocol Stats">
            <Card className="border border-border">
              <CardBody className="p-6 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Stat label="Total Deposits" value={`${formatters.totalDeposits} HYPE`} />
                  <Stat label="Current Prize Pool" value={`${formatters.prizePool} HYPE`} />
                  <Stat label="Participants" value={String(contractState.participantCount)} />
                  <Stat label="Total Tickets" value={formatters.totalTickets} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <Stat label="Average Deposit" value={`${avgDeposit.toFixed(4)} HYPE`} />
                  <Stat label="Next Lottery" value={formatSecondsToCountdown(nextLotteryInSec)} />
                </div>
              </CardBody>
            </Card>
          </Tab>

          <Tab key="tickets" title="Tickets">
            <Card className="border border-border">
              <CardBody className="p-6 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Stat label="Your Tickets" value={userInfo ? userInfo.tickets.toString() : '0'} />
                  <Stat label="Total Tickets" value={formatters.totalTickets} />
                  <Stat label="Win Probability" value={`${formatters.winProbabilityPercent}%`} />
                </div>
                <div className="text-xs text-foreground-secondary mt-2">
                  Tickets are minted from harvested yield. More yield contributed → more tickets → higher win odds.
                </div>
              </CardBody>
            </Card>
          </Tab>
        </Tabs>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-lg bg-background-secondary border border-border">
      <div className="text-xs text-foreground-secondary">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}
