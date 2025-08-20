"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { parseUnits, formatUnits } from "viem";
import { formatToken } from "@/lib/wallet";
import { fetchTokenPriceUsd, cn } from "@/lib/utils";
import { NETWORKS } from "@/lib/chains";
import { 
  Ticket, 
  Coins, 
  Trophy, 
  TrendingUp, 
  Clock, 
  Users, 
  Zap, 
  AlertCircle,
  Loader2,
  Sparkles,
  Gift,
  ExternalLink
} from "lucide-react";
import { useContractData } from "./hooks/useContractData";
import { useUserData } from "./hooks/useUserData";
import { useWallet } from "./hooks/useWallet";
import { useLotteryActions } from "./hooks/useLotteryActions";
import { useHarvestSequence } from "./hooks/useHarvestSequence";
import { HarvestLockedPopup } from "./components/HarvestLockedPopup";
import { HyperPoolLogo } from "../components/HyperPoolLogo";

// Types for cleaner code organization
interface RoundInfo {
  id: bigint;
  timeLeft: number;
  state: number;
  canClose: boolean;
  canFinalize: boolean;
}

interface UserPosition {
  deposit: bigint;
  tickets: bigint;
  odds: number;
}

interface LotteryStats {
  prizePool: bigint;
  totalTickets: bigint;
  ticketUnit: bigint;
}

export default function V2Page() {
  // Hooks
  const { address, connecting, connect, disconnect } = useWallet();
  const { data: contractData, loading: contractLoading } = useContractData();
  const { data: userData } = useUserData(address);
  const { loading: actionLoading, error: actionError, clearError, actions } = useLotteryActions();
  
  // Extract contract data first for harvest sequence hook
  const {
    decimals, symbol, ticketUnit, totalTickets, prizePool, currentRound, 
    timeLeft, roundState, lastWinner, lastPrize
  } = contractData;
  
  const {
    canHarvest,
    canClose,
    canFinalize,
    showHarvestLockedPopup,
    markHarvestCompleted,
    markCloseCompleted,
    markFinalizeCompleted,
    handleHarvestClick,
    closeHarvestPopup,
  } = useHarvestSequence(currentRound, roundState, timeLeft);
  
  // Extract user data
  const { userDeposit, userTickets } = userData;

  // Local state for form inputs
  const [amount, setAmount] = useState<string>("");
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [usdPrice, setUsdPrice] = useState<number | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);

  // Load USD price
  useEffect(() => {
    fetchTokenPriceUsd("hyperliquid")
      .then(setUsdPrice)
      .catch(() => setUsdPrice(null));
  }, []);

  // Detect network (wallet) and subscribe to changes
  useEffect(() => {
    const eth = (typeof window !== 'undefined' && (window as any).ethereum) || null;
    if (!eth) return;
    (async () => {
      try {
        const cid = await eth.request({ method: 'eth_chainId' });
        const n = typeof cid === 'string' ? parseInt(cid, 16) : Number(cid);
        if (!Number.isNaN(n)) setChainId(n);
      } catch {}
    })();
    const onChanged = (cid: string) => {
      try { setChainId(parseInt(cid, 16)); } catch {}
    };
    try { eth.on && eth.on('chainChanged', onChanged); } catch {}
    return () => {
      try { eth.removeListener && eth.removeListener('chainChanged', onChanged); } catch {}
    };
  }, []);

  // Clear action errors automatically
  useEffect(() => {
    if (actionError && !actionLoading) {
      const timer = setTimeout(clearError, 8000);
      return () => clearTimeout(timer);
    }
  }, [actionError, actionLoading, clearError]);

  // Calculate parsed amounts and potential values
  const parsedAmount = useMemo(() => {
    if (!amount) return BigInt(0);
    try {
      return parseUnits(amount, decimals);
    } catch {
      return BigInt(0);
    }
  }, [amount, decimals]);

  const parsedWithdrawAmount = useMemo(() => {
    if (!withdrawAmount) return BigInt(0);
    try {
      return parseUnits(withdrawAmount, decimals);
    } catch {
      return BigInt(0);
    }
  }, [withdrawAmount, decimals]);

  const potentialTickets = useMemo(() => {
    if (parsedAmount === BigInt(0)) return BigInt(0);
    return parsedAmount / ticketUnit;
  }, [parsedAmount, ticketUnit]);

  const currentOdds = useMemo(() => {
    if (totalTickets === BigInt(0)) return 0;
    return (Number(userTickets) / Number(totalTickets)) * 100;
  }, [userTickets, totalTickets]);

  const newOdds = useMemo(() => {
    const total = totalTickets + potentialTickets;
    if (total === BigInt(0)) return 0;
    return (Number(userTickets + potentialTickets) / Number(total)) * 100;
  }, [userTickets, totalTickets, potentialTickets]);

  // Action handlers
  const handleDeposit = useCallback(async () => {
    if (!address || parsedAmount === BigInt(0)) return;
    try {
      await actions.deposit(parsedAmount, decimals, ticketUnit);
      setAmount("");
    } catch {
      // Error handled by useLotteryActions hook
    }
  }, [address, parsedAmount, decimals, ticketUnit, actions]);

  const handleWithdraw = useCallback(async () => {
    if (!address || parsedWithdrawAmount === BigInt(0)) return;
    try {
      await actions.withdraw(parsedWithdrawAmount, ticketUnit);
      setWithdrawAmount("");
      setShowWithdraw(false);
    } catch {
      // Error handled by useLotteryActions hook
    }
  }, [address, parsedWithdrawAmount, ticketUnit, actions]);

  // Enhanced action handlers with state tracking
  const handleHarvest = useCallback(async () => {
    if (!handleHarvestClick()) return;
    
    try {
      await actions.harvestYield();
      markHarvestCompleted();
    } catch {
      // Error handled by useLotteryActions hook
    }
  }, [handleHarvestClick, actions, markHarvestCompleted]);

  const handleClose = useCallback(async () => {
    if (!canClose) return;
    
    try {
      await actions.closeRound();
      markCloseCompleted();
    } catch {
      // Error handled by useLotteryActions hook
    }
  }, [canClose, actions, markCloseCompleted]);

  const handleFinalize = useCallback(async () => {
    if (!canFinalize) return;
    
    try {
      await actions.finalizeRound(currentRound);
      markFinalizeCompleted();
    } catch {
      // Error handled by useLotteryActions hook
    }
  }, [canFinalize, actions, currentRound, markFinalizeCompleted]);

  // Switch/Add HyperEVM convenience
  const ensureHyperEvm = useCallback(async () => {
    const eth = (typeof window !== 'undefined' && (window as any).ethereum) || null;
    if (!eth) return;
    const chainIdHex = '0x' + NETWORKS.hyperEVM.chainId.toString(16);
    try {
      await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: chainIdHex }] });
    } catch (err: any) {
      const code = typeof err?.code === 'number' ? err.code : undefined;
      const msg = String(err?.message || '').toLowerCase();
      if (code === 4902 || msg.includes('unrecognized chain') || msg.includes('add ethereum chain')) {
        try {
          await eth.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: chainIdHex,
              chainName: NETWORKS.hyperEVM.name,
              nativeCurrency: NETWORKS.hyperEVM.nativeCurrency,
              rpcUrls: [NETWORKS.hyperEVM.rpcUrl],
              blockExplorerUrls: NETWORKS.hyperEVM.blockExplorer ? [NETWORKS.hyperEVM.blockExplorer] : [],
            }]
          });
          await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: chainIdHex }] });
        } catch {}
      }
    }
  }, []);

  // Utility functions
  const formatUsd = (amount: bigint) => {
    if (!usdPrice) return null;
    return (Number(formatUnits(amount, decimals)) * usdPrice).toFixed(2);
  };

  const formatSmartValue = (amount: bigint, showAllDecimals = false) => {
    const value = Number(formatToken(amount, decimals, showAllDecimals ? 18 : 8));
    if (value === 0) return "0";
    if (showAllDecimals) {
      // Show ALL decimal places for very small amounts
      return formatToken(amount, decimals, 18);
    }
    if (value < 0.0001) return "~0.0001";
    if (value < 1) return formatToken(amount, decimals, 6);
    return formatToken(amount, decimals, 4);
  };

  // Check if user has enough WHYPE
  const hasInsufficientBalance = useMemo(() => {
    return userDeposit < parseUnits("0.1", decimals);
  }, [userDeposit, decimals]);

  // Organize data for display
  const roundInfo: RoundInfo = {
    id: currentRound,
    timeLeft,
    state: roundState,
    canClose: timeLeft <= 0 && roundState === 0,
    canFinalize: roundState === 1
  };

  const userPosition: UserPosition = {
    deposit: userDeposit,
    tickets: userTickets,
    odds: currentOdds
  };

  const lotteryStats: LotteryStats = {
    prizePool,
    totalTickets,
    ticketUnit
  };

  // Determine round status for display
  const getRoundStatus = () => {
    if (roundState === 0 && timeLeft > 0) return "Active";
    if (roundState === 0 && timeLeft <= 0) return "Ready";
    if (roundState === 1) return "Closed"; 
    return "Finalized";
  };

  const getRoundTimer = () => {
    if (timeLeft <= 0) return "Ready";
    return `${Math.floor(timeLeft / 3600)}h ${Math.floor((timeLeft % 3600) / 60)}m`;
  };

  if (contractLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <div>Loading lottery data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="w-full border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <HyperPoolLogo size={36} />
                <h1 className="text-2xl font-bold text-primary">
                  HyperPool
                </h1>
              </div>
              <span className="text-sm text-muted-foreground bg-secondary px-3 py-1 rounded-full">
                No-Loss Lottery
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              {address ? (
                <div className="flex items-center space-x-3">
                  <div className="text-sm bg-secondary px-3 py-2 rounded-lg">
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </div>
                  {chainId !== NETWORKS.hyperEVM.chainId && (
                    <button
                      onClick={ensureHyperEvm}
                      className="text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-3 py-2 rounded-lg transition-colors"
                    >
                      Switch to {NETWORKS.hyperEVM.name}
                    </button>
                  )}
                  <button
                    onClick={disconnect}
                    className="text-sm bg-destructive/20 hover:bg-destructive/30 text-destructive px-3 py-2 rounded-lg transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={connect}
                  disabled={connecting}
                  className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 font-medium transition-all"
                >
                  {connecting ? 'Connecting...' : 'Connect Wallet'}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Winner Announcement */}
        {lastWinner && lastPrize > BigInt(0) && (
          <div className="mb-8 rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Trophy className="w-6 h-6 text-primary" />
                  <span className="text-lg font-semibold">Latest Winner</span>
                </div>
                <div className="font-mono text-primary">
                  {lastWinner.slice(0, 10)}...{lastWinner.slice(-8)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Won {formatSmartValue(lastPrize, true)} {symbol}
                  {formatUsd(lastPrize) && ` ($${formatUsd(lastPrize)})`}
                </div>
              </div>
              {address && lastWinner.toLowerCase() === address.toLowerCase() && (
                <div className="text-primary font-semibold">🎉 You won!</div>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                icon={<Coins className="w-4 h-4 text-primary" />}
                label="Prize Pool"
                value={`${formatSmartValue(lotteryStats.prizePool, true)} ${symbol}`}
                subValue={formatUsd(lotteryStats.prizePool) ? `$${formatUsd(lotteryStats.prizePool)}` : undefined}
              />
              <StatCard
                icon={<Users className="w-4 h-4 text-primary" />}
                label="Total Entries"
                value={String(lotteryStats.totalTickets)}
                subValue="tickets"
              />
              <StatCard
                icon={<Clock className="w-4 h-4 text-primary" />}
                label="Round Timer"
                value={getRoundTimer()}
                subValue={`Round ${String(roundInfo.id)} • ${getRoundStatus()}`}
              />
              <StatCard
                icon={<TrendingUp className="w-4 h-4 text-primary" />}
                label="Your Odds"
                value={`${userPosition.odds.toFixed(3)}%`}
                subValue={`${String(userPosition.tickets)} tickets`}
              />
            </div>

            {/* Deposit/Withdraw Card */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Enter Lottery</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowWithdraw(!showWithdraw)}
                    className="text-sm bg-secondary text-secondary-foreground border border-border px-3 py-1 rounded-md hover:bg-secondary/80 transition-colors"
                  >
                    Withdraw
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Amount to deposit
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.0"
                      className="w-full bg-background border border-border rounded-md px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground flex items-center gap-2">
                      <span>{symbol}</span>
                      <div className="w-5 h-5 bg-primary rounded flex items-center justify-center text-primary-foreground text-xs font-bold">
                        ₩
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    ≈ {formatSmartValue(parsedAmount)} {symbol} = {potentialTickets.toString()} tickets
                    {newOdds > 0 && ` → ${newOdds.toFixed(3)}% odds`}
                  </div>
                </div>

                {hasInsufficientBalance && (
                  <div className="p-4 rounded-md border border-border bg-secondary/20">
                    <p className="text-sm text-muted-foreground mb-3">
                      Need wHYPE to participate? Get some on HyperSwap:
                    </p>
                    <a
                      href="https://app.hyperswap.exchange/#/swap"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm font-medium"
                    >
                      Get wHYPE on HyperSwap
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                )}

                <button
                  onClick={handleDeposit}
                  disabled={!address || actionLoading === 'deposit' || parsedAmount === BigInt(0) || (roundState !== 0 || timeLeft <= 0)}
                  className="w-full px-6 py-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors"
                >
                  {actionLoading === 'deposit' ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Depositing...
                    </span>
                  ) : (roundState !== 0 || timeLeft <= 0) ? (
                    "Round Ended - Entries Locked"
                  ) : (
                    "Enter Lottery"
                  )}
                </button>

                {showWithdraw && (
                  <div className="border-t border-border pt-4">
                    <label className="block text-sm font-medium mb-2">
                      Amount to withdraw
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder="0.0"
                        className="flex-1 bg-background border border-border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      <button
                        onClick={handleWithdraw}
                        disabled={!address || actionLoading === 'withdraw' || parsedWithdrawAmount === BigInt(0)}
                        className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground border border-border hover:bg-secondary/80 disabled:opacity-50 transition-colors"
                      >
                        {actionLoading === 'withdraw' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Withdraw"
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Your Position */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="text-xl font-bold mb-4">Your Position</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-md border border-border bg-background p-4">
                  <div className="text-sm text-muted-foreground mb-1">Deposited</div>
                  <div className="text-lg font-semibold">
                    {formatSmartValue(userPosition.deposit)} {symbol}
                  </div>
                  {formatUsd(userPosition.deposit) && (
                    <div className="text-sm text-muted-foreground">${formatUsd(userPosition.deposit)}</div>
                  )}
                </div>
                <div className="rounded-md border border-border bg-background p-4">
                  <div className="text-sm text-muted-foreground mb-1">Win Probability</div>
                  <div className="text-lg font-semibold">
                    {userPosition.odds.toFixed(3)}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {String(userPosition.tickets)} entries
                  </div>
                </div>
              </div>
            </div>

            {/* Management Actions */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Round Management</h3>
                <div className="text-sm bg-primary/10 text-primary px-3 py-1 rounded-full">
                  💰 Earn 1% per action
                </div>
              </div>
              <div className="mb-4 p-3 rounded-lg bg-secondary/20 border border-border">
                <p className="text-sm text-muted-foreground">
                  <strong>Incentivized Actions:</strong> Anyone can call these management functions and earn 1% of the action's value as a reward for helping maintain the lottery system.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <ManagementButton 
                  onClick={handleHarvest}
                  disabled={actionLoading === 'harvest' || !canHarvest}
                  icon={<Coins className="w-4 h-4" />}
                  label={actionLoading === 'harvest' ? 'Harvesting...' : 'Harvest Yield (+1%)'}
                  variant="secondary"
                />
                <ManagementButton 
                  onClick={handleClose}
                  disabled={actionLoading === 'close' || !canClose}
                  icon={<Clock className="w-4 h-4" />}
                  label={actionLoading === 'close' ? 'Closing...' : canClose ? 'Close Round (+1%)' : 'Harvest Required'}
                  variant="warning"
                />
                <ManagementButton 
                  onClick={handleFinalize}
                  disabled={actionLoading === 'finalize' || !canFinalize}
                  icon={<Zap className="w-4 h-4" />}
                  label={actionLoading === 'finalize' ? 'Drawing...' : canFinalize ? 'Draw Winner (+1%)' : 'Harvest Required'}
                  variant="primary"
                />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Winners */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <Trophy className="w-5 h-5 mr-2 text-primary" />
                Recent Winners
              </h3>
              <RecentWinnersList decimals={decimals} symbol={symbol} />
            </div>

            {/* How it Works */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-primary" />
                How it Works
              </h3>
              <div className="space-y-3 text-sm text-muted-foreground">
                <HowItWorksStep number={1} text="Deposit wHYPE tokens to enter the lottery. We auto-wrap HYPE if needed." />
                <HowItWorksStep number={2} text="Your deposit is safely stored and earns yield continuously from DeFi protocols." />
                <HowItWorksStep number={3} text="Yield is periodically harvested and accumulated into the prize pool for winners." />
                <HowItWorksStep number={4} text="Anyone can call management functions (Harvest, Close, Draw) and earn 1% rewards." />
                <HowItWorksStep number={5} text="When rounds end, winners are selected proportionally using verifiable randomness." />
                <HowItWorksStep number={6} text="Withdraw your original deposit anytime - you never lose your principal." />
                <HowItWorksStep number={7} text="The more you deposit, the higher your odds of winning the accumulated yield." />
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {actionError && (
          <div className="mt-6 rounded-md border border-destructive bg-destructive/10 p-4 text-destructive">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span>{actionError}</span>
            </div>
          </div>
        )}

        {/* Harvest Locked Popup */}
        <HarvestLockedPopup 
          isOpen={showHarvestLockedPopup}
          onClose={closeHarvestPopup}
          timeLeft={timeLeft}
        />
      </main>
    </div>
  );
}

// Component: Stat Card
function StatCard({ icon, label, value, subValue }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        {icon}
      </div>
      <div className="text-xl font-bold">{value}</div>
      {subValue && (
        <div className="text-sm text-muted-foreground">{subValue}</div>
      )}
    </div>
  );
}

// Component: Management Button
function ManagementButton({ onClick, disabled, icon, label, variant }: {
  onClick: () => void;
  disabled?: boolean;
  icon: React.ReactNode;
  label: string;
  variant: 'primary' | 'secondary' | 'warning';
}) {
  const variants = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-secondary text-secondary-foreground border border-border hover:bg-secondary/80",
    warning: "bg-destructive text-destructive-foreground hover:bg-destructive/90"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant]
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

// Component: How It Works Step
function HowItWorksStep({ number, text }: { number: number; text: string }) {
  return (
    <div className="flex items-start space-x-2">
      <span className="font-bold text-primary text-sm">{number}.</span>
      <span>{text}</span>
    </div>
  );
}

// Component: Recent Winners List
function RecentWinnersList({ decimals, symbol }: { decimals: number; symbol: string }) {
  const [winners, setWinners] = useState<Array<{ round: bigint; winner: string; prize: bigint }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWinners() {
      try {
        setLoading(true);
        const { contractAddresses, V2_LOTTERY_ABI } = await import("@/lib/contracts");
        const { publicClient } = await import("@/lib/wallet");
        
        const currentRound = (await publicClient.readContract({
          address: contractAddresses.lotteryContract as `0x${string}`,
          abi: V2_LOTTERY_ABI,
          functionName: "getCurrentRoundInfo",
        })) as [bigint, bigint, boolean, boolean];

        const winners: Array<{ round: bigint; winner: string; prize: bigint }> = [];
        const startRound = Math.max(1, Number(currentRound[0]) - 5);
        
        for (let i = startRound; i < Number(currentRound[0]); i++) {
          try {
            const roundInfo = (await publicClient.readContract({
              address: contractAddresses.lotteryContract as `0x${string}`,
              abi: V2_LOTTERY_ABI,
              functionName: "getRoundInfo",
              args: [BigInt(i)],
            })) as readonly [bigint, bigint, bigint, bigint, bigint, string, number, bigint];
            
            if (roundInfo[6] === 2 && roundInfo[5] !== "0x0000000000000000000000000000000000000000") {
              winners.push({
                round: BigInt(i),
                winner: roundInfo[5],
                prize: roundInfo[4],
              });
            }
          } catch {}
        }
        
        setWinners(winners.reverse());
      } catch {}
      finally {
        setLoading(false);
      }
    }
    
    loadWinners();
  }, []);

  const formatSmartValue = (amount: bigint) => {
    return formatToken(amount, decimals, 18); // Show all decimals for winners
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (winners.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <Gift className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <div>No winners yet</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {winners.slice(0, 5).map((winner) => (
        <div key={String(winner.round)} className="rounded-md border border-border bg-background p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-mono text-sm">
                {winner.winner.slice(0, 6)}...{winner.winner.slice(-4)}
              </div>
              <div className="text-xs text-muted-foreground">Round {String(winner.round)}</div>
            </div>
            <div className="text-right">
              <div className="text-primary font-semibold">
                {formatSmartValue(winner.prize)}
              </div>
              <div className="text-xs text-muted-foreground">{symbol}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}