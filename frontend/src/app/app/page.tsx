"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Address, formatUnits, parseUnits } from "viem";
import { contractAddresses, ERC20_ABI, V2_LOTTERY_ABI, WETH_LIKE_ABI } from "@/lib/contracts";
import { formatToken, publicClient, getWalletClientFromEIP1193 } from "@/lib/wallet";
import Tooltip from "@/components/Tooltip";
import { fetchTokenPriceUsd, cn } from "@/lib/utils";
import { NETWORKS } from "@/lib/chains";
import { ChevronDown, Loader2, Ticket, Coins, Gift, Sparkles } from "lucide-react";
import { usePrivy, useWallets } from "@privy-io/react-auth";

export default function AppPage() {
  const [address, setAddress] = useState<Address | null>(null);
  const [decimals, setDecimals] = useState<number>(18);
  const [symbol, setSymbol] = useState<string>("wHYPE");
  const [tokenBalance, setTokenBalance] = useState<bigint>(BigInt(0));
  const [userDeposit, setUserDeposit] = useState<bigint>(BigInt(0));
  const [userTickets, setUserTickets] = useState<bigint>(BigInt(0));
  const [totalTickets, setTotalTickets] = useState<bigint>(BigInt(0));
  const [prizePool, setPrizePool] = useState<bigint>(BigInt(0));
  const [ticketUnit, setTicketUnit] = useState<bigint>(BigInt("100000000000000000"));
  const [amountInput, setAmountInput] = useState<string>(""); // token amount
  const [usdInput, setUsdInput] = useState<string>("");
  const [amountMode, setAmountMode] = useState<'usd' | 'token'>("usd");
  const [withdrawInput, setWithdrawInput] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [currentRound, setCurrentRound] = useState<bigint>(BigInt(1));
  const [usdPrice, setUsdPrice] = useState<number | null>(null);
  const [lastUpdatedMs, setLastUpdatedMs] = useState<number>(Date.now());
  const [drawOpen, setDrawOpen] = useState<boolean>(false);
  const [claiming, setClaiming] = useState<boolean>(false);
  const [claimed, setClaimed] = useState<boolean>(false);
  const [withdrawOpen, setWithdrawOpen] = useState<boolean>(false);
  const [infoOpen, setInfoOpen] = useState<boolean>(false);
  const [canCloseRound, setCanCloseRound] = useState<boolean>(false);
  const [canFinalizeRound, setCanFinalizeRound] = useState<boolean>(false);
  const [roundState, setRoundState] = useState<number>(0); // 0=Active,1=Closed,2=Finalized
  const [drawBlock, setDrawBlock] = useState<bigint>(BigInt(0));
  const [actionBusy, setActionBusy] = useState<null | 'close' | 'finalize'>(null);
  const [devSimEnd, setDevSimEnd] = useState<boolean>(false);

  const { login, logout, ready, authenticated } = usePrivy() as any;
  const { wallets, ready: walletsReady, connectWallet: privyConnectWallet, disconnectWallet } = useWallets() as any;

  const onConnect = useCallback(async () => {
    if (!ready) return;
    if (!authenticated) {
      await login();
      return;
    }
    if (walletsReady && (!wallets || wallets.length === 0)) {
      await privyConnectWallet();
      return;
    }
  }, [ready, authenticated, login, walletsReady, wallets, privyConnectWallet]);

  const onDisconnect = useCallback(async () => {
    try {
      if (wallets && wallets.length > 0 && disconnectWallet) {
        await disconnectWallet(wallets[0]);
      }
    } catch {}
    try {
      await logout();
    } catch {}
    setAddress(null);
  }, [wallets, disconnectWallet, logout]);

  useEffect(() => {
    if (!walletsReady) return;
    if (!authenticated) {
      setAddress(null);
      return;
    }
    const primary = wallets && wallets.length > 0 ? wallets[0] : null;
    if (!primary) return;
    (async () => {
      try {
        const provider = await primary.getEthereumProvider();
        const client = await getWalletClientFromEIP1193(provider);
        if (!client) return;
        const [addr] = await client.requestAddresses();
        setAddress(addr as Address);
      } catch {}
    })();
  }, [authenticated, walletsReady, wallets]);

  useEffect(() => {
    async function loadToken() {
      try {
        const [d, s] = await Promise.all([
          publicClient.readContract({
            address: contractAddresses.depositToken as Address,
            abi: ERC20_ABI,
            functionName: "decimals",
          }) as Promise<number>,
          publicClient.readContract({
            address: contractAddresses.depositToken as Address,
            abi: ERC20_ABI,
            functionName: "symbol",
          }) as Promise<string>,
        ]);
        setDecimals(d);
        setSymbol(s);
      } catch {}
    }
    loadToken();
  }, []);

  // Fetch USD price once (replace coingecko id if needed)
  useEffect(() => {
    fetchTokenPriceUsd("hyperliquid")
      .then((p) => setUsdPrice(p))
      .catch(() => setUsdPrice(null));
  }, []);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [tUnit, tTickets, pPool, roundInfo] = await Promise.all([
          publicClient.readContract({
            address: contractAddresses.lotteryContract as Address,
            abi: V2_LOTTERY_ABI,
            functionName: "TICKET_UNIT",
          }) as Promise<bigint>,
          publicClient.readContract({
            address: contractAddresses.lotteryContract as Address,
            abi: V2_LOTTERY_ABI,
            functionName: "totalTickets",
          }) as Promise<bigint>,
          publicClient.readContract({
            address: contractAddresses.lotteryContract as Address,
            abi: V2_LOTTERY_ABI,
            functionName: "prizePool",
          }) as Promise<bigint>,
          publicClient.readContract({
            address: contractAddresses.lotteryContract as Address,
            abi: V2_LOTTERY_ABI,
            functionName: "getCurrentRoundInfo",
          }) as Promise<[bigint, bigint, boolean, boolean]>,
        ]);
        if (!active) return;
        const roundId = roundInfo[0];
        const roundData = (await publicClient.readContract({
          address: contractAddresses.lotteryContract as Address,
          abi: V2_LOTTERY_ABI,
          functionName: "rounds",
          args: [roundId],
        })) as any;
        setTicketUnit(tUnit);
        setTotalTickets(tTickets);
        setPrizePool(pPool);
        setCurrentRound(roundId);
        setTimeLeft(Number(roundInfo[1]));
        setCanCloseRound(Boolean(roundInfo[2]));
        setCanFinalizeRound(Boolean(roundInfo[3]));
        try {
          setDrawBlock((roundData?.[1] as bigint) ?? BigInt(0));
          setRoundState(Number(roundData?.[5] ?? 0));
        } catch {}
        setLastUpdatedMs(Date.now());
      } catch {}
    }
    load();
    const t = setInterval(load, 8000);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, []);

  const refreshRound = useCallback(async () => {
    try {
      const roundInfo = (await publicClient.readContract({
        address: contractAddresses.lotteryContract as Address,
        abi: V2_LOTTERY_ABI,
        functionName: "getCurrentRoundInfo",
      })) as [bigint, bigint, boolean, boolean];
      const roundId = roundInfo[0];
      const [tTickets, pPool, roundData] = await Promise.all([
        publicClient.readContract({
          address: contractAddresses.lotteryContract as Address,
          abi: V2_LOTTERY_ABI,
          functionName: "totalTickets",
        }) as Promise<bigint>,
        publicClient.readContract({
          address: contractAddresses.lotteryContract as Address,
          abi: V2_LOTTERY_ABI,
          functionName: "prizePool",
        }) as Promise<bigint>,
        publicClient.readContract({
          address: contractAddresses.lotteryContract as Address,
          abi: V2_LOTTERY_ABI,
          functionName: "rounds",
          args: [roundId],
        }) as Promise<any>,
      ]);
      setCurrentRound(roundId);
      setTimeLeft(Number(roundInfo[1]));
      setCanCloseRound(Boolean(roundInfo[2]));
      setCanFinalizeRound(Boolean(roundInfo[3]));
      setTotalTickets(tTickets);
      setPrizePool(pPool);
      try {
        setDrawBlock((roundData?.[1] as bigint) ?? BigInt(0));
        setRoundState(Number(roundData?.[5] ?? 0));
      } catch {}
      setLastUpdatedMs(Date.now());
    } catch {}
  }, []);

  const refreshUser = useCallback(async () => {
    if (!address) return;
    try {
      const [dep, tix, bal] = await Promise.all([
        publicClient.readContract({
          address: contractAddresses.lotteryContract as Address,
          abi: V2_LOTTERY_ABI,
          functionName: "getUserInfo",
          args: [address as Address],
        }) as Promise<[bigint, bigint]>,
        publicClient.readContract({
          address: contractAddresses.lotteryContract as Address,
          abi: V2_LOTTERY_ABI,
          functionName: "tickets",
          args: [address as Address],
        }) as Promise<bigint>,
        publicClient.readContract({
          address: contractAddresses.depositToken as Address,
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [address as Address],
        }) as Promise<bigint>,
      ]).then(([depTix, userTix, balVal]) => [depTix[0], userTix, balVal] as const);
      setUserDeposit(dep);
      setUserTickets(tix);
      setTokenBalance(bal);
    } catch {}
  }, [address]);

  useEffect(() => {
    if (!address) return;
    let active = true;
    async function loadUser() {
      try {
        const [dep, tix] = (await publicClient.readContract({
          address: contractAddresses.lotteryContract as Address,
          abi: V2_LOTTERY_ABI,
          functionName: "getUserInfo",
          args: [address as Address],
        })) as [bigint, bigint];
        const bal = (await publicClient.readContract({
          address: contractAddresses.depositToken as Address,
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [address as Address],
        })) as bigint;
        if (!active) return;
        setUserDeposit(dep);
        setUserTickets(tix);
        setTokenBalance(bal);
      } catch {}
    }
    loadUser();
    const t = setInterval(loadUser, 8000);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, [address]);

  const parsedAmount = useMemo(() => {
    try {
      if (amountMode === 'token') {
        if (!amountInput) return BigInt(0);
        return parseUnits(amountInput, decimals);
      }
      // USD mode
      if (!usdInput || usdPrice === null || usdPrice <= 0) return BigInt(0);
      const tokens = Number(usdInput) / Number(usdPrice);
      if (!isFinite(tokens) || tokens <= 0) return BigInt(0);
      const precision = Math.min(8, decimals);
      const tokensStr = tokens.toFixed(precision);
      return parseUnits(tokensStr, decimals);
    } catch {
      return BigInt(0);
    }
  }, [amountInput, usdInput, amountMode, usdPrice, decimals]);

  const switchAmountMode = useCallback((next: 'usd' | 'token') => {
    if (next === amountMode) return;
    if (next === 'usd') {
      // convert current token amount to usd
      if (usdPrice && Number(usdPrice) > 0) {
        const tokens = Number(amountInput || '0');
        if (isFinite(tokens) && tokens > 0) {
          const usd = tokens * Number(usdPrice);
          setUsdInput(usd.toFixed(2));
        }
      }
      setAmountMode('usd');
    } else {
      // convert current usd to token
      if (usdPrice && Number(usdPrice) > 0) {
        const usdVal = Number(usdInput || '0');
        if (isFinite(usdVal) && usdVal > 0) {
          const tokens = usdVal / Number(usdPrice);
          const precision = Math.min(6, decimals);
          setAmountInput(tokens.toFixed(precision));
        }
      }
      setAmountMode('token');
    }
  }, [amountMode, amountInput, usdInput, usdPrice, decimals]);

  const parsedWithdraw = useMemo(() => {
    if (!withdrawInput) return BigInt(0);
    try {
      return parseUnits(withdrawInput, decimals);
    } catch {
      return BigInt(0);
    }
  }, [withdrawInput, decimals]);

  const potentialTickets = useMemo(() => {
    if (parsedAmount === BigInt(0)) return BigInt(0);
    return parsedAmount / ticketUnit;
  }, [parsedAmount, ticketUnit]);

  const dynamicOdds = useMemo(() => {
    const total = totalTickets + potentialTickets;
    if (total === BigInt(0)) return "0%";
    const user = userTickets + potentialTickets;
    const pct = Number(user) / Number(total);
    return `${(pct * 100).toFixed(2)}%`;
  }, [totalTickets, userTickets, potentialTickets]);

  const dynamicOddsPct = useMemo(() => {
    const total = totalTickets + potentialTickets;
    if (total === BigInt(0)) return 0;
    const user = userTickets + potentialTickets;
    return (Number(user) / Number(total)) * 100;
  }, [totalTickets, userTickets, potentialTickets]);

  const onDeposit = useCallback(async () => {
    setTxError(null);
    if (!address || parsedAmount === BigInt(0)) return;
    if (ticketUnit !== BigInt(0) && parsedAmount % ticketUnit !== BigInt(0)) return;
    setIsSubmitting(true);
    try {
      const primary = wallets && wallets.length > 0 ? wallets[0] : null;
      const provider = primary ? await primary.getEthereumProvider() : null;
      const walletClient = await getWalletClientFromEIP1193(provider);
      if (!walletClient) throw new Error("No wallet");

      const currentBal = (await publicClient.readContract({
        address: contractAddresses.depositToken as Address,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [address as Address],
      })) as bigint;

      if (currentBal < parsedAmount) {
        const deficit = parsedAmount - currentBal;
        const { request } = await publicClient.simulateContract({
          address: contractAddresses.depositToken as Address,
          abi: WETH_LIKE_ABI,
          functionName: "deposit",
          args: [],
          account: address as Address,
          value: deficit,
        });
        const wrapHash = await walletClient.writeContract(request);
        await publicClient.waitForTransactionReceipt({ hash: wrapHash });
      }

      const allowance = (await publicClient.readContract({
        address: contractAddresses.depositToken as Address,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [address as Address, contractAddresses.lotteryContract as Address],
      })) as bigint;

      if (allowance < parsedAmount) {
        const { request } = await publicClient.simulateContract({
          address: contractAddresses.depositToken as Address,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [contractAddresses.lotteryContract as Address, parsedAmount],
          account: address as Address,
        });
        const approveHash = await walletClient.writeContract(request);
        await publicClient.waitForTransactionReceipt({ hash: approveHash });
      }

      const { request } = await publicClient.simulateContract({
        address: contractAddresses.lotteryContract as Address,
        abi: V2_LOTTERY_ABI,
        functionName: "depositWHYPE",
        args: [parsedAmount],
        account: address as Address,
      });
      const depositHash = await walletClient.writeContract(request);
      await publicClient.waitForTransactionReceipt({ hash: depositHash });
      setAmountInput("");
      setUsdInput("");
      await Promise.all([refreshUser(), refreshRound()]);
      setInfoOpen(true);
    } catch (err: any) {
      setTxError(err?.shortMessage || err?.message || 'Transaction failed');
    } finally {
      setIsSubmitting(false);
    }
  }, [address, parsedAmount, ticketUnit, wallets, refreshUser, refreshRound]);

  const onWithdraw = useCallback(async () => {
    setTxError(null);
    if (!address || parsedWithdraw === BigInt(0)) return;
    if (ticketUnit !== BigInt(0) && parsedWithdraw % ticketUnit !== BigInt(0)) return;
    setIsSubmitting(true);
    try {
      const primary = wallets && wallets.length > 0 ? wallets[0] : null;
      const provider = primary ? await primary.getEthereumProvider() : null;
      const walletClient = await getWalletClientFromEIP1193(provider);
      if (!walletClient) throw new Error("No wallet");
      const { request } = await publicClient.simulateContract({
        address: contractAddresses.lotteryContract as Address,
        abi: V2_LOTTERY_ABI,
        functionName: "withdraw",
        args: [parsedWithdraw],
        account: address as Address,
      });
      const hash = await walletClient.writeContract(request);
      await publicClient.waitForTransactionReceipt({ hash });
      setWithdrawInput("");
      await Promise.all([refreshUser(), refreshRound()]);
    } catch (err: any) {
      setTxError(err?.shortMessage || err?.message || 'Transaction failed');
    } finally {
      setIsSubmitting(false);
    }
  }, [address, parsedWithdraw, wallets, refreshUser, refreshRound, ticketUnit]);

  const onCloseRound = useCallback(async () => {
    if (!address) return;
    setTxError(null);
    setActionBusy('close');
    try {
      const primary = wallets && wallets.length > 0 ? wallets[0] : null;
      const provider = primary ? await primary.getEthereumProvider() : null;
      const walletClient = await getWalletClientFromEIP1193(provider);
      if (!walletClient) throw new Error("No wallet");
      const { request } = await publicClient.simulateContract({
        address: contractAddresses.lotteryContract as Address,
        abi: V2_LOTTERY_ABI,
        functionName: "closeRound",
        args: [],
        account: address as Address,
      });
      const hash = await walletClient.writeContract(request);
      await publicClient.waitForTransactionReceipt({ hash });
      await refreshRound();
    } catch (err: any) {
      setTxError(err?.shortMessage || err?.message || 'Transaction failed');
    } finally {
      setActionBusy(null);
    }
  }, [address, wallets, refreshRound]);

  const onFinalizeRound = useCallback(async () => {
    if (!address) return;
    setTxError(null);
    setActionBusy('finalize');
    try {
      const primary = wallets && wallets.length > 0 ? wallets[0] : null;
      const provider = primary ? await primary.getEthereumProvider() : null;
      const walletClient = await getWalletClientFromEIP1193(provider);
      if (!walletClient) throw new Error("No wallet");
      const { request } = await publicClient.simulateContract({
        address: contractAddresses.lotteryContract as Address,
        abi: V2_LOTTERY_ABI,
        functionName: "finalizeRound",
        args: [],
        account: address as Address,
      });
      const hash = await walletClient.writeContract(request);
      await publicClient.waitForTransactionReceipt({ hash });
      await refreshRound();
    } catch (err: any) {
      setTxError(err?.shortMessage || err?.message || 'Transaction failed');
    } finally {
      setActionBusy(null);
    }
  }, [address, wallets, refreshRound]);

  const currentOdds = useMemo(() => {
    if (totalTickets === BigInt(0)) return "0%";
    const pct = Number(userTickets) / Number(totalTickets);
    return `${(pct * 100).toFixed(2)}%`;
  }, [totalTickets, userTickets]);

  return (
    <div className="min-h-screen w-full font-sans bg-background text-foreground">
      <div className="w-full border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-wide">HyperPool</h1>
          {address ? (
            <div className="flex items-center gap-2">
              <div className="text-sm bg-secondary text-secondary-foreground px-3 py-1 rounded-md">
                {address.slice(0, 6)}...{address.slice(-4)}
              </div>
              <button onClick={() => setDevSimEnd((v) => !v)} className="text-xs px-2 py-1 rounded-md border border-border hover:bg-secondary cursor-pointer">
                {devSimEnd ? 'Reset Sim' : 'Simulate Round End'}
              </button>
              <button onClick={() => { setClaimed(false); setDrawOpen(true); }} className="text-xs px-2 py-1 rounded-md border border-border hover:bg-secondary cursor-pointer">
                Simulate Result
              </button>
              <button onClick={() => setInfoOpen(true)} className="text-xs px-2 py-1 rounded-md border border-border hover:bg-secondary cursor-pointer">
                Show Info
              </button>
              <button onClick={onDisconnect} className="text-xs px-2 py-1 rounded-md border border-border hover:bg-secondary cursor-pointer">
                Disconnect
              </button>
            </div>
          ) : (
            <button onClick={onConnect} className="bg-primary text-primary-foreground hover:opacity-90 transition px-4 py-2 text-sm rounded-md cursor-pointer">
              Connect Wallet
            </button>
          )}
        </div>
      </div>
      <div className="w-full px-6 py-8">
        <div className="max-w-6xl mx-auto grid gap-6 md:grid-cols-3">
          <div className="md:col-span-3 rounded-xl border border-border bg-gradient-to-br from-[#0f2540] via-[#133a63] to-[#0f2540] p-8 text-white text-center">
            <div className="flex items-center justify-center gap-3">
              <h2 className="text-3xl sm:text-4xl font-semibold">Enter the Lottery</h2>
              <Tooltip text="Deposit wHYPE to enter. 1 ticket per 0.1 wHYPE. We auto-wrap HYPE if needed."><span className="text-xs border rounded px-1.5 py-0.5 border-white/20">?</span></Tooltip>
            </div>
            <p className="mt-3 text-white/85 text-base">Boost your odds by depositing more. Withdraw anytime.</p>
            <div className="mt-5 flex flex-col gap-3 items-center">
              <div className="relative w-full max-w-lg mx-auto">
                <input
                  className="w-full border border-white/20 bg-white/10 pl-5 pr-28 py-4 text-lg rounded-lg placeholder:text-white/70"
                  placeholder={amountMode==='usd' ? 'Amount in USD' : 'Amount in HYPE'}
                  value={amountMode==='usd' ? usdInput : amountInput}
                  onChange={(e) => {
                    if (amountMode==='usd') {
                      setUsdInput(e.target.value);
                    } else {
                      setAmountInput(e.target.value);
                    }
                    setIsTyping(true);
                    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
                    typingTimerRef.current = setTimeout(() => setIsTyping(false), 700);
                  }}
                  inputMode="decimal"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <div className="inline-flex items-center bg-white/10 border border-white/20 rounded-md p-1 text-xs">
                    <button onClick={() => switchAmountMode('usd')} className={cn("px-2 py-1 rounded", amountMode==='usd' ? 'bg-white/20' : 'opacity-80')}>USD</button>
                    <button onClick={() => switchAmountMode('token')} className={cn("px-2 py-1 rounded", amountMode==='token' ? 'bg-white/20' : 'opacity-80')}>HYPE</button>
                  </div>
                </div>
              </div>
              {usdPrice !== null && (amountMode==='usd' ? (
                <div className="text-white/85 text-sm">≈ {formatToken(parsedAmount, decimals)} HYPE</div>
              ) : (
                <div className="text-white/85 text-sm">≈ ${((Number(formatToken(parsedAmount, decimals))||0) * (usdPrice||0)).toFixed(2)} USD</div>
              ))}
              <button disabled={!address || isSubmitting || parsedAmount === BigInt(0) || !(roundState === 0 && !(devSimEnd || timeLeft <= 0))} onClick={onDeposit} className="w-full max-w-lg mx-auto px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold text-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                Enter Lottery
              </button>
              {roundState !== 0 || devSimEnd || timeLeft <= 0 ? (
                <div className="text-amber-200/90 text-sm bg-white/10 border border-white/15 rounded px-3 py-1.5">
                  Round ended or closed — deposits are disabled.
                </div>
              ) : null}
            </div>
            {parsedAmount > BigInt(0) && (
              <div className="mt-4 max-w-xl mx-auto">
                <OddsTicker targetPct={dynamicOddsPct} active={isTyping} />
              </div>
            )}
            <div className="flex flex-wrap gap-3 pt-4 justify-center">
              <span className="text-sm bg-white/10 border border-white/15 rounded px-3 py-1.5">Your Deposit: {formatToken(userDeposit, decimals)} {symbol}{usdPrice!==null?` ($${(Number(formatToken(userDeposit, decimals)) * usdPrice).toFixed(2)})`:''}</span>
              <span className="text-sm bg-white/10 border border-white/15 rounded px-3 py-1.5">Your tickets: {String(userTickets)} (0.1 HYPE per ticket)</span>
              <span className="text-sm bg-white/10 border border-white/15 rounded px-3 py-1.5">Updated: {new Date(lastUpdatedMs).toLocaleTimeString()}</span>
            </div>
          </div>
          <div className="md:col-span-3 grid gap-6 md:grid-cols-3">
            <div className="border p-5 bg-card rounded-xl">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-medium">Stats</h3>
                <Tooltip text="Prize pool grows with harvested yield. Time left is until round end."><span className="text-xs text-muted-foreground border border-border rounded px-1.5 py-0.5">?</span></Tooltip>
              </div>
              <div className="mt-3 grid gap-3">
                <Stat label="Round Status" value={`${roundState === 0 ? ((devSimEnd || timeLeft <= 0) ? (canCloseRound ? 'Ended — Ready to Close' : 'Ended') : 'Open') : (roundState === 1 ? (canFinalizeRound ? 'Closed — Ready to Finalize' : 'Closed — Awaiting Draw Block') : 'Finalized')}`} />
                <Stat label="Prize Pool" value={`${formatToken(prizePool, decimals, 4)} ${symbol}${usdPrice!==null?` ($${(Number(formatToken(prizePool, decimals, 4)) * usdPrice).toFixed(2)})`:''}`} />
                <Stat label="Your Deposit" value={`${formatToken(userDeposit, decimals, 4)} ${symbol}${usdPrice!==null?` ($${(Number(formatToken(userDeposit, decimals, 4)) * usdPrice).toFixed(2)})`:''}`} />
                <Stat label="Total Tickets" value={String(totalTickets)} />
                <Stat label="Your Tickets" value={String(userTickets)} />
                <Stat label="Your Odds" value={currentOdds} />
                <Stat label="Time Left" value={(devSimEnd ? 'Ended' : (timeLeft > 0 ? `${Math.floor(timeLeft/3600)}h ${Math.floor((timeLeft%3600)/60)}m` : "Ended"))} />
              </div>
              {(roundState === 0 && (devSimEnd || timeLeft <= 0) && canCloseRound) || (roundState === 1) ? (
                <div className="mt-4 rounded-lg border border-border bg-background/60 p-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="text-sm text-muted-foreground">
                      {roundState === 0 ? 'Round has ended. You can close the round to schedule the draw.' : (canFinalizeRound ? 'Draw block reached. You can finalize to select a winner.' : `Waiting for draw block #${drawBlock.toString()} to be reachable...`)}
                    </div>
                    <div className="flex gap-2">
                      {roundState === 0 && (devSimEnd || timeLeft <= 0) && canCloseRound && (
                        <button onClick={onCloseRound} disabled={actionBusy==='close'} className="px-3 py-2 rounded-md bg-amber-600/80 text-white cursor-pointer disabled:opacity-60">
                          {actionBusy==='close' ? 'Closing…' : 'Close Round'}
                        </button>
                      )}
                      {roundState === 1 && (
                        <button onClick={onFinalizeRound} disabled={!canFinalizeRound || actionBusy==='finalize'} className="px-3 py-2 rounded-md bg-primary text-primary-foreground cursor-pointer disabled:opacity-60">
                          {actionBusy==='finalize' ? 'Finalizing…' : 'Finalize Round'}
                        </button>
                      )}
                    </div>
                  </div>
                  {txError && <div className="mt-2 text-xs text-red-400">{txError}</div>}
                </div>
              ) : null}
            </div>
            <div className="border p-5 bg-card rounded-xl">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-medium">Live Participants</h3>
                <Tooltip text="Live participants and odds."><span className="text-xs text-muted-foreground border border-border rounded px-1.5 py-0.5">?</span></Tooltip>
              </div>
              <CurrentParticipantsLive totalTickets={totalTickets} symbol={symbol} />
            </div>
            <div className="border p-5 bg-card rounded-xl">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-medium">Recent Winners</h3>
                <Tooltip text="Winners from the last few rounds."><span className="text-xs text-muted-foreground border border-border rounded px-1.5 py-0.5">?</span></Tooltip>
              </div>
              <RecentWinners currentRound={currentRound} symbol={symbol} decimals={decimals} />
            </div>
          </div>

          <div className="md:col-span-3 grid gap-6 md:grid-cols-2">
            <div className="border p-5 bg-card rounded-xl">
              <button
                type="button"
                className="w-full flex items-center justify-between text-left"
                onClick={() => setWithdrawOpen((v) => !v)}
                aria-expanded={withdrawOpen}
              >
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-medium">Withdraw</h3>
                  <Tooltip text="Withdraw your wHYPE anytime in multiples of the ticket unit."><span className="text-xs text-muted-foreground border border-border rounded px-1.5 py-0.5">?</span></Tooltip>
                </div>
                <ChevronDown size={16} className={cn("transition-transform", withdrawOpen ? "rotate-180" : "rotate-0")} />
              </button>
              {withdrawOpen && (
                <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
                  <input
                    className="w-full border bg-background px-4 py-3 text-base rounded-lg"
                    placeholder={`Amount in ${symbol}`}
                    value={withdrawInput}
                    onChange={(e) => setWithdrawInput(e.target.value)}
                    inputMode="decimal"
                  />
                  <button disabled={!address || isSubmitting || parsedWithdraw === BigInt(0)} onClick={onWithdraw} className="px-6 py-3 bg-secondary text-secondary-foreground border border-border rounded-md font-medium cursor-pointer hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed">
                    Withdraw
                  </button>
                </div>
              )}
            </div>

            <div className="border p-5 bg-card rounded-xl">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-medium">Contract Details</h3>
                <Tooltip text="Links to explorer for verification."><span className="text-xs text-muted-foreground border border-border rounded px-1.5 py-0.5">?</span></Tooltip>
              </div>
              <div className="mt-3 space-y-2 text-sm">
                <ContractLink label="Lottery" address={contractAddresses.lotteryContract} />
              </div>
            </div>
          </div>
        </div>
      </div>
      {drawOpen && (
        <DrawModal
          onClose={() => setDrawOpen(false)}
          onClaim={async () => { setClaiming(true); await new Promise(r=>setTimeout(r,1200)); setClaiming(false); setClaimed(true); }}
          claiming={claiming}
          claimed={claimed}
          prize={prizePool > BigInt(0) ? prizePool : BigInt(100000000000000000)}
          symbol={symbol}
          decimals={decimals}
          usdPrice={usdPrice}
          yourAddress={address as string}
        />
      )}
      {infoOpen && (
        <InfoModal onClose={() => setInfoOpen(false)} />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border bg-card rounded-xl px-4 py-3">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-lg font-medium mt-1">{value}</div>
    </div>
  );
}

function ContractLink({ label, address }: { label: string; address: string }) {
  const explorer = 'https://hyperevmscan.io';
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <a className="underline underline-offset-2" href={`${explorer}/address/${address}`} target="_blank" rel="noreferrer">
        {address.slice(0,6)}...{address.slice(-4)}
      </a>
    </div>
  );
}

function InfoModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 bg-black/70 flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card">
        <div className="pointer-events-none absolute -top-20 -left-20 h-60 w-60 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-60 w-60 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative bg-gradient-to-r from-primary/30 via-primary/20 to-transparent px-6 py-5 border-b border-border">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="text-2xl font-semibold">You’re in! Here’s what happens next</h3>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Sit back and watch your odds rise as yield grows the prize.</p>
        </div>
        <div className="p-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-background/60 p-4">
            <div className="flex items-center gap-2 text-primary"><Coins className="h-4 w-4"/><span className="text-xs uppercase tracking-wide">Yield</span></div>
            <div className="mt-2 text-sm text-muted-foreground">Your deposit earns yield continuously. We don’t risk principal.</div>
          </div>
          <div className="rounded-lg border border-border bg-background/60 p-4">
            <div className="flex items-center gap-2 text-primary"><Gift className="h-4 w-4"/><span className="text-xs uppercase tracking-wide">Prize Pool</span></div>
            <div className="mt-2 text-sm text-muted-foreground">Yield is harvested into the prize pool at intervals.</div>
          </div>
          <div className="rounded-lg border border-border bg-background/60 p-4">
            <div className="flex items-center gap-2 text-primary"><Ticket className="h-4 w-4"/><span className="text-xs uppercase tracking-wide">Draw</span></div>
            <div className="mt-2 text-sm text-muted-foreground">At round end, a winner is selected proportionally to tickets.</div>
          </div>
        </div>
        
        <div className="p-6 pt-2 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-md border border-border hover:bg-secondary">Got it</button>
        </div>
      </div>
    </div>
  );
}

function DrawModal({ onClose, onClaim, claiming, claimed, prize, symbol, decimals, usdPrice, yourAddress }:
  { onClose: () => void; onClaim: () => void | Promise<void>; claiming: boolean; claimed: boolean; prize: bigint; symbol: string; decimals: number; usdPrice: number | null; yourAddress: string }) {
  const [phase, setPhase] = useState<'spinning' | 'reveal' | 'won'>("spinning");
  const [displayAddr, setDisplayAddr] = useState<string>("0x????????????????????????????????????????");
  useEffect(() => {
    // Spin: rapidly shuffle addresses, then reveal user's address
    let stop = false;
    const candidates = [
      "0x2F3A...B1C2",
      "0x8B4C...9A77",
      "0xDEAD...BEEF",
      "0xCAFE...BABE",
      `${yourAddress?.slice(0,6)}...${yourAddress?.slice(-4)}`,
    ];
    let i = 0;
    const spin = () => {
      if (stop) return;
      setDisplayAddr(candidates[i % candidates.length]);
      i++;
      requestAnimationFrame(spin);
    };
    const id = requestAnimationFrame(spin);
    const t = setTimeout(() => {
      stop = true;
      cancelAnimationFrame(id);
      setPhase("reveal");
      setTimeout(() => setPhase("won"), 900);
    }, 1800);
    return () => {
      cancelAnimationFrame(id);
      clearTimeout(t);
    };
  }, [yourAddress]);

  return (
    <div className="fixed inset-0 z-40 bg-black/70 flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-card p-6 overflow-hidden">
        {phase === 'won' && <ConfettiBurst />}
        <h3 className="text-xl font-semibold">Lottery draw in progress…</h3>
        <p className="mt-2 text-sm text-muted-foreground">Selecting a winner fairly from all tickets.</p>
        <div className="mt-5">
          <SpinnerStrip active={phase === 'spinning'} />
          <div className="mt-3 text-center text-2xl font-mono tracking-wider">{displayAddr}</div>
        </div>
        {phase !== 'won' ? (
          <div className="mt-5 flex justify-center">
            <button onClick={onClose} className="px-4 py-2 rounded-md border border-border hover:bg-secondary">Cancel</button>
          </div>
        ) : (
          <div className="mt-6">
            <h4 className="text-lg font-semibold">🎉 You won!</h4>
            <div className="mt-3 rounded-lg border border-border bg-background/60 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Prize</span>
                <span className="font-medium">{formatToken(prize, decimals)} {symbol}{usdPrice!==null?` ($${(Number(formatToken(prize, decimals)) * usdPrice).toFixed(2)})`:''}</span>
              </div>
            </div>
            <div className="mt-5 flex gap-3 justify-center">
              {!claimed ? (
                <button onClick={onClaim} disabled={claiming} className="px-4 py-2 bg-primary text-primary-foreground rounded-md cursor-pointer disabled:opacity-60">
                  {claiming ? 'Claiming…' : 'Claim Prize'}
                </button>
              ) : (
                <div className="px-4 py-2 rounded-md bg-green-600/80 text-white">Claimed! 🎊</div>
              )}
              <button onClick={onClose} className="px-4 py-2 rounded-md border border-border hover:bg-secondary">Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SpinnerStrip({ active }: { active: boolean }) {
  const bars = new Array(24).fill(0);
  return (
    <div className="relative h-14 w-full overflow-hidden rounded bg-background/60 border border-border">
      <div className="absolute inset-0 grid grid-cols-24 gap-1 px-2 py-2 opacity-80">
        {bars.map((_, i) => (
          <span
            key={i}
            className="block w-full bg-primary/60"
            style={{ height: `${active ? (Math.sin((Date.now()/120 + i) * 0.6) * 35 + 45) : 45}%` }}
          />
        ))}
      </div>
    </div>
  );
}

function ConfettiBurst() {
  const [go, setGo] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setGo(true), 50);
    return () => clearTimeout(t);
  }, []);
  const pieces = Array.from({ length: 24 });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 300;
        const size = 6 + Math.random() * 8;
        const hue = Math.floor(Math.random() * 360);
        return (
          <span
            key={i}
            className="absolute rounded-sm"
            style={{
              left: `${left}%`,
              top: '-10px',
              width: `${size}px`,
              height: `${size}px`,
              backgroundColor: `hsl(${hue} 90% 60%)`,
              transform: `translateY(${go ? '140%' : '-20%'}) rotate(${go ? 360 : 0}deg)`,
              transition: `transform 1200ms cubic-bezier(.2,.8,.2,1) ${delay}ms`,
            }}
          />
        );
      })}
    </div>
  );
}

function Badge({ label, value }: { label: string; value: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-md border border-border bg-background/60 px-2.5 py-1.5 text-xs">
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function OddsTicker({ targetPct, active }: { targetPct: number; active: boolean }) {
  const [displayPct, setDisplayPct] = useState<number>(0);
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    let start: number | null = null;
    const from = displayPct;
    const to = Math.max(0, Math.min(99.99, targetPct));
    const duration = 500; // ms
    function tick(ts: number) {
      if (start === null) start = ts;
      const p = Math.min(1, (ts - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplayPct(from + (to - from) * eased);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    }
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [targetPct]);

  // Wiggle effect when typing to feel “alive”
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      setDisplayPct((prev) => Math.max(0, Math.min(99.99, prev + (Math.random() - 0.5) * 0.6)));
    }, 120);
    return () => clearInterval(id);
  }, [active]);

  const pctStr = `${displayPct.toFixed(2)}%`;
  return (
    <div className="mt-2 p-3 rounded-lg border border-border bg-background/60">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Your odds if you deposit:</span>
        <span className="font-semibold">{pctStr}</span>
      </div>
      <div className="mt-2 h-2 w-full rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full bg-primary transition-[width] duration-300"
          style={{ width: `${Math.min(100, Math.max(0, displayPct))}%` }}
        />
      </div>
    </div>
  );
}

function RecentWinners({ currentRound, symbol, decimals }: { currentRound: bigint; symbol: string; decimals: number }) {
  // Dummy data for now
  const [rows] = useState<Array<{ round: bigint; winner: string; prize: bigint }>>([
    { round: currentRound - BigInt(1), winner: "0x8ba1f109551bD432803012645Ac136ddd64DBA72", prize: BigInt("250000000000000000") },
    { round: currentRound - BigInt(2), winner: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e", prize: BigInt("180000000000000000") },
    { round: currentRound - BigInt(3), winner: "0x66f820a414680B5bcda5eECA5dea238543F42054", prize: BigInt("120000000000000000") },
  ].filter(r => r.round > BigInt(0)));
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-xs text-muted-foreground">
          <tr>
            <th className="text-left font-normal py-2">Round</th>
            <th className="text-left font-normal py-2">Winner</th>
            <th className="text-left font-normal py-2">Prize</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td className="py-3 text-muted-foreground" colSpan={3}>No winners yet.</td></tr>
          ) : (
            rows.map((r) => (
              <tr key={String(r.round)} className="border-t border-border/60">
                <td className="py-2">{String(r.round)}</td>
                <td className="py-2">{r.winner.slice(0,6)}...{r.winner.slice(-4)}</td>
                <td className="py-2">{formatToken(r.prize, decimals)} {symbol}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function CurrentParticipantsLive({ totalTickets, symbol }: { totalTickets: bigint; symbol: string }) {
  const [rows, setRows] = useState<Array<{ addr: string; tickets: bigint }>>([]);
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const acc: Array<{ addr: string; tickets: bigint }> = [];
        // Iterate known participants array until it runs out (bounded loop)
        for (let i = 0; i < 200; i++) {
          try {
            const addr = (await publicClient.readContract({
              address: contractAddresses.lotteryContract as Address,
              abi: V2_LOTTERY_ABI,
              functionName: "participants",
              args: [BigInt(i)],
            })) as Address;
            if (!addr || addr === "0x0000000000000000000000000000000000000000") break;
            const tix = (await publicClient.readContract({
              address: contractAddresses.lotteryContract as Address,
              abi: V2_LOTTERY_ABI,
              functionName: "tickets",
              args: [addr],
            })) as bigint;
            if (tix > BigInt(0)) acc.push({ addr, tickets: tix });
          } catch {
            break;
          }
        }
        if (active) setRows(acc);
      } catch {}
    }
    load();
    const t = setInterval(load, 12000);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, []);
  const denom = totalTickets;
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-xs text-muted-foreground">
          <tr>
            <th className="text-left font-normal py-2">Address</th>
            <th className="text-left font-normal py-2">Tickets</th>
            <th className="text-left font-normal py-2">Odds</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td className="py-3 text-muted-foreground" colSpan={3}>No participants yet.</td></tr>
          ) : (
            rows.map((p) => {
              const pct = denom === BigInt(0) ? 0 : (Number(p.tickets) / Number(denom)) * 100;
              return (
                <tr key={p.addr} className="border-t border-border/60">
                  <td className="py-2">{p.addr.slice(0,6)}...{p.addr.slice(-4)}</td>
                  <td className="py-2">{String(p.tickets)}</td>
                  <td className="py-2">{pct.toFixed(2)}%</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}