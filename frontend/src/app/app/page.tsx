"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Address, formatUnits, parseUnits } from "viem";
import { contractAddresses, ERC20_ABI, V2_LOTTERY_ABI, WETH_LIKE_ABI } from "@/lib/contracts";
import { formatToken, publicClient, getWalletClientFromEIP1193 } from "@/lib/wallet";
import Tooltip from "@/components/Tooltip";
import { fetchTokenPriceUsd } from "@/lib/utils";
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
  const [amountInput, setAmountInput] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [currentRound, setCurrentRound] = useState<bigint>(BigInt(1));
  const [usdPrice, setUsdPrice] = useState<number | null>(null);
  const [lastUpdatedMs, setLastUpdatedMs] = useState<number>(Date.now());

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
        setTicketUnit(tUnit);
        setTotalTickets(tTickets);
        setPrizePool(pPool);
        setCurrentRound(roundInfo[0]);
        setTimeLeft(Number(roundInfo[1]));
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
    if (!amountInput) return BigInt(0);
    try {
      return parseUnits(amountInput, decimals);
    } catch {
      return BigInt(0);
    }
  }, [amountInput, decimals]);

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
    } finally {
      setIsSubmitting(false);
    }
  }, [address, parsedAmount]);

  const onWithdraw = useCallback(async () => {
    setTxError(null);
    if (!address || parsedAmount === BigInt(0)) return;
    if (ticketUnit !== BigInt(0) && parsedAmount % ticketUnit !== BigInt(0)) return;
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
        args: [parsedAmount],
        account: address as Address,
      });
      const hash = await walletClient.writeContract(request);
      await publicClient.waitForTransactionReceipt({ hash });
      setAmountInput("");
    } finally {
      setIsSubmitting(false);
    }
  }, [address, parsedAmount]);

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
          <div className="md:col-span-2 border p-5 bg-card rounded-xl">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-medium">Deposit / Withdraw</h3>
              <Tooltip text="Deposit wHYPE to earn tickets. 1 ticket per 0.1 wHYPE. We auto-wrap HYPE if needed."><span className="text-xs text-muted-foreground border border-border rounded px-1.5 py-0.5">?</span></Tooltip>
            </div>
            <div className="mt-3 space-y-4">
              <input
                className="w-full border bg-background px-4 py-3 text-base rounded-lg"
                placeholder={`Amount in ${symbol}`}
                value={amountInput}
                onChange={(e) => {
                  setAmountInput(e.target.value);
                  setIsTyping(true);
                  if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
                  typingTimerRef.current = setTimeout(() => setIsTyping(false), 700);
                }}
                inputMode="decimal"
              />
              {txError && <div className="text-sm text-red-400">{txError}</div>}
              <div className="flex gap-3">
                <button disabled={!address || isSubmitting || parsedAmount === BigInt(0)} onClick={onDeposit} className="px-4 py-2 bg-primary text-primary-foreground disabled:opacity-50 text-sm rounded-md cursor-pointer disabled:cursor-not-allowed">Deposit</button>
                <button disabled={!address || isSubmitting || parsedAmount === BigInt(0)} onClick={onWithdraw} className="px-4 py-2 bg-destructive text-white disabled:opacity-50 text-sm rounded-md cursor-pointer disabled:cursor-not-allowed">Withdraw</button>
              </div>
              <OddsTicker targetPct={dynamicOddsPct} active={isTyping} />
              <div className="flex flex-wrap gap-3 pt-2">
                <Badge label="Balance" value={`${formatToken(tokenBalance, decimals)} ${symbol}${usdPrice!==null?` ($${(Number(formatToken(tokenBalance, decimals)) * usdPrice).toFixed(2)})`:''}`} />
                <Badge label="Your Deposit" value={`${formatToken(userDeposit, decimals)} ${symbol}${usdPrice!==null?` ($${(Number(formatToken(userDeposit, decimals)) * usdPrice).toFixed(2)})`:''}`} />
                <Badge label="Ticket Unit" value={`${formatUnits(ticketUnit, decimals)} ${symbol}`} />
                <Badge label="Updated" value={`${new Date(lastUpdatedMs).toLocaleTimeString()}`} />
              </div>
            </div>
          </div>
          <div className="border p-5 bg-card rounded-xl">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-medium">Stats</h3>
              <Tooltip text="Prize pool grows with harvested yield. Time left is until round end."><span className="text-xs text-muted-foreground border border-border rounded px-1.5 py-0.5">?</span></Tooltip>
            </div>
            <div className="mt-3 grid gap-3">
              <Stat label="Prize Pool" value={`${formatToken(prizePool, decimals, 4)} ${symbol}${usdPrice!==null?` ($${(Number(formatToken(prizePool, decimals, 4)) * usdPrice).toFixed(2)})`:''}`} />
              <Stat label="Total Tickets" value={String(totalTickets)} />
              <Stat label="Your Tickets" value={String(userTickets)} />
              <Stat label="Your Odds" value={currentOdds} />
              <Stat label="Time Left" value={timeLeft > 0 ? `${Math.floor(timeLeft/3600)}h ${Math.floor((timeLeft%3600)/60)}m` : "Ended"} />
            </div>
          </div>
          <div className="md:col-span-3 border p-5 bg-card rounded-xl">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-medium">Current Round Participants</h3>
              <Tooltip text="Live participants and odds."><span className="text-xs text-muted-foreground border border-border rounded px-1.5 py-0.5">?</span></Tooltip>
            </div>
            <CurrentParticipantsLive totalTickets={totalTickets} symbol={symbol} />
          </div>

          <div className="md:col-span-3 border p-5 bg-card rounded-xl">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-medium">Recent Winners</h3>
              <Tooltip text="Winners from the last few rounds."><span className="text-xs text-muted-foreground border border-border rounded px-1.5 py-0.5">?</span></Tooltip>
            </div>
            <RecentWinners currentRound={currentRound} symbol={symbol} decimals={decimals} />
          </div>
        </div>
      </div>
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