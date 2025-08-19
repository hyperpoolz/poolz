"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Address, formatUnits, parseUnits } from "viem";
import { contractAddresses, ERC20_ABI, V2_LOTTERY_ABI, WETH_LIKE_ABI } from "@/lib/contracts";
import { formatToken, publicClient, getWalletClientFromEIP1193 } from "@/lib/wallet";
import { usePrivy, useWallets } from "@privy-io/react-auth";

type RoundState = 0 | 1 | 2; // Active, Closed, Finalized

export default function Home() {
  const [address, setAddress] = useState<Address | null>(null);
  const [decimals, setDecimals] = useState<number>(18);
  const [symbol, setSymbol] = useState<string>("wHYPE");
  const [tokenBalance, setTokenBalance] = useState<bigint>(BigInt(0));
  const [userDeposit, setUserDeposit] = useState<bigint>(BigInt(0));
  const [userTickets, setUserTickets] = useState<bigint>(BigInt(0));
  const [totalTickets, setTotalTickets] = useState<bigint>(BigInt(0));
  const [prizePool, setPrizePool] = useState<bigint>(BigInt(0));
  const [ticketUnit, setTicketUnit] = useState<bigint>(BigInt("100000000000000000")); // 1e17
  const [amountInput, setAmountInput] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [canClose, setCanClose] = useState<boolean>(false);
  const [canFinalize, setCanFinalize] = useState<boolean>(false);
  const [currentRound, setCurrentRound] = useState<bigint>(BigInt(1));
  const [lastWinner, setLastWinner] = useState<Address | null>(null);
  const youWon = useMemo(() => {
    if (!address || !lastWinner) return false;
    return address.toLowerCase() === lastWinner.toLowerCase();
  }, [address, lastWinner]);
  const { login, logout, ready, authenticated } = usePrivy() as any;
  const { wallets, ready: walletsReady, connectWallet: privyConnectWallet, disconnectWallet } = useWallets() as any;

  // Connect
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

  // Load token meta
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

  // Load lottery data periodically
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
        console.log("pPool", pPool);
        setPrizePool(pPool);
        setCurrentRound(roundInfo[0]);
        setTimeLeft(Number(roundInfo[1]));
        setCanClose(roundInfo[2]);
        setCanFinalize(roundInfo[3]);

        if (roundInfo[0] > BigInt(1)) {
          const prev = (roundInfo[0] - BigInt(1)) as bigint;
          const info = (await publicClient.readContract({
            address: contractAddresses.lotteryContract as Address,
            abi: V2_LOTTERY_ABI,
            functionName: "getRoundInfo",
            args: [prev],
          })) as [bigint, bigint, bigint, bigint, Address, number];
          const winner = info[4];
          if (winner && winner !== "0x0000000000000000000000000000000000000000") setLastWinner(winner);
        }
      } catch {}
    }
    load();
    const t = setInterval(load, 8000);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, []);

  // Load user data
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

  const currentOdds = useMemo(() => {
    if (totalTickets === BigInt(0)) return "0%";
    const pct = Number(userTickets) / Number(totalTickets);
    return `${(pct * 100).toFixed(2)}%`;
  }, [totalTickets, userTickets]);

  const onDeposit = useCallback(async () => {
    setTxError(null);
    if (!address || parsedAmount === BigInt(0)) return;
    if (ticketUnit !== BigInt(0) && parsedAmount % ticketUnit !== BigInt(0)) {
      setTxError(`Amount must be a multiple of ${formatUnits(ticketUnit, decimals)} ${symbol}`);
      return;
    }
    setIsSubmitting(true);
    try {
      const primary = wallets && wallets.length > 0 ? wallets[0] : null;
      const provider = primary ? await primary.getEthereumProvider() : null;
      const walletClient = await getWalletClientFromEIP1193(provider);
      if (!walletClient) throw new Error("No wallet");

      // Read current wHYPE balance
      const currentBal = (await publicClient.readContract({
        address: contractAddresses.depositToken as Address,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [address as Address],
      })) as bigint;

      // If wHYPE balance is insufficient, try to wrap the deficit from native HYPE
      if (currentBal < parsedAmount) {
        const deficit = parsedAmount - currentBal;
        try {
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
        } catch (wrapErr: any) {
          console.error(wrapErr);
          setTxError("Not enough wHYPE and failed to wrap from HYPE. Ensure you have sufficient native HYPE.");
          return;
        }
      }

      // Approve token to lottery if needed
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
      // Refresh user + global state immediately
      try {
        const [[dep, tix], tixTotal, pPool, bal] = await Promise.all([
          publicClient.readContract({
            address: contractAddresses.lotteryContract as Address,
            abi: V2_LOTTERY_ABI,
            functionName: "getUserInfo",
            args: [address as Address],
          }) as Promise<[bigint, bigint]>,
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
            address: contractAddresses.depositToken as Address,
            abi: ERC20_ABI,
            functionName: "balanceOf",
            args: [address as Address],
          }) as Promise<bigint>,
        ]);
        setUserDeposit(dep);
        setUserTickets(tix);
        setTotalTickets(tixTotal);
        setPrizePool(pPool);
        setTokenBalance(bal);
      } catch {}
    } catch (e: any) {
      console.error(e);
      setTxError(e?.shortMessage || e?.message || "Transaction failed");
    } finally {
      setIsSubmitting(false);
    }
  }, [address, parsedAmount]);

  const onWithdraw = useCallback(async () => {
    setTxError(null);
    if (!address || parsedAmount === BigInt(0)) return;
    if (ticketUnit !== BigInt(0) && parsedAmount % ticketUnit !== BigInt(0)) {
      setTxError(`Amount must be a multiple of ${formatUnits(ticketUnit, decimals)} ${symbol}`);
      return;
    }
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
      // Refresh user + global state immediately
      try {
        const [[dep, tix], tixTotal, pPool, bal] = await Promise.all([
          publicClient.readContract({
            address: contractAddresses.lotteryContract as Address,
            abi: V2_LOTTERY_ABI,
            functionName: "getUserInfo",
            args: [address as Address],
          }) as Promise<[bigint, bigint]>,
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
            address: contractAddresses.depositToken as Address,
            abi: ERC20_ABI,
            functionName: "balanceOf",
            args: [address as Address],
          }) as Promise<bigint>,
        ]);
        setUserDeposit(dep);
        setUserTickets(tix);
        setTotalTickets(tixTotal);
        setPrizePool(pPool);
        setTokenBalance(bal);
      } catch {}
    } catch (e: any) {
      console.error(e);
      setTxError(e?.shortMessage || e?.message || "Transaction failed");
    } finally {
      setIsSubmitting(false);
    }
  }, [address, parsedAmount]);

  const heroGradient = "from-[#0a0e1a] via-[#0f2540] to-[#0a0e1a]"; // friendlier gradient

  return (
    <div className="min-h-screen w-full font-sans bg-background text-foreground">
      <div className={`w-full bg-gradient-to-r ${heroGradient} text-white`}>
        <div className="w-full px-6 py-5 border-b border-border">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold tracking-wide">HyperPool</h1>
            {address ? (
              <div className="flex items-center gap-2">
                <div className="text-sm bg-secondary text-secondary-foreground px-3 py-1 rounded-md">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </div>
                <button onClick={onDisconnect} className="text-xs px-2 py-1 rounded-md border border-border hover:bg-secondary">
                  Disconnect
                </button>
              </div>
            ) : (
              <button onClick={onConnect} className="bg-primary text-primary-foreground hover:opacity-90 transition px-4 py-2 text-sm rounded-md">
                Connect Wallet
              </button>
            )}
          </div>
        </div>
        <div className="w-full px-6 py-6">
          <div className="text-base text-muted-foreground mb-3">No-Loss Lottery on Hyperliquid</div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <StatCard label="Prize Pool" value={`${formatToken(prizePool, decimals, 4)} ${symbol}`} />
            <StatCard label="Total Tickets" value={String(totalTickets)} />
            <StatCard label="Time Left" value={timeLeft > 0 ? `${Math.floor(timeLeft/3600)}h ${Math.floor((timeLeft%3600)/60)}m` : "Ended"} />
            <StatCard label="Your Odds" value={currentOdds} />
          </div>
          {youWon && (
            <div className="mt-4 bg-secondary text-secondary-foreground px-4 py-3 border border-border rounded-lg">
              🎉 You won the last round! The prize was automatically sent to your wallet.
            </div>
          )}
        </div>
      </div>

      <div className="w-full px-6 py-8 grid gap-6 md:grid-cols-2">
        <div className="border p-5 bg-card rounded-xl">
          <h3 className="text-base font-medium">Deposit / Withdraw</h3>
          <div className="mt-3 space-y-4">
            <input
              className="w-full border bg-background px-4 py-3 text-base rounded-lg"
              placeholder={`Amount in ${symbol}`}
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              inputMode="decimal"
            />
            <div className="text-sm text-muted-foreground">
              You’ll get approximately {String(potentialTickets)} tickets. New odds after deposit: {dynamicOdds}
            </div>
            {address && (
              <div className="text-sm text-muted-foreground">
                Balance: {formatToken(tokenBalance, decimals)} {symbol}
              </div>
            )}
            {txError && (
              <div className="text-sm text-red-400">{txError}</div>
            )}
            <div className="flex gap-3">
              <button disabled={!address || isSubmitting || parsedAmount === BigInt(0)} onClick={onDeposit} className="px-4 py-2 bg-primary text-primary-foreground disabled:opacity-50 text-sm rounded-md">
                Deposit
              </button>
              <button disabled={!address || isSubmitting || parsedAmount === BigInt(0)} onClick={onWithdraw} className="px-4 py-2 bg-destructive text-white disabled:opacity-50 text-sm rounded-md">
                Withdraw
              </button>
            </div>
            <WrapHint />
            {address && (
              <div className="text-sm mt-2 text-muted-foreground">
                Your deposit: {formatToken(userDeposit, decimals)} {symbol} · Your tickets: {String(userTickets)}
              </div>
            )}
          </div>
        </div>

        <div className="border p-5 bg-card rounded-xl">
          <h3 className="text-base font-medium">Round Status</h3>
          <div className="mt-3 space-y-2 text-sm text-muted-foreground">
            <div>Round: {String(currentRound)}</div>
            <div>Can Close: {canClose ? "Yes" : "No"} · Can Finalize: {canFinalize ? "Yes" : "No"}</div>
            {lastWinner && (
              <div className="mt-2 bg-secondary text-secondary-foreground px-3 py-2 border border-border rounded-md">
                Last winner: {lastWinner.slice(0, 6)}...{lastWinner.slice(-4)}
              </div>
            )}
          </div>
          <p className="mt-4 text-muted-foreground text-sm">
            Note: Anyone can call harvest/close/finalize and receive a small incentive. This demo omits those admin-like buttons for now.
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border bg-card rounded-xl px-4 py-3">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-lg font-medium mt-1">{value}</div>
    </div>
  );
}

function WrapHint() {
  return (
    <div className="text-sm text-muted-foreground">
      Have HYPE but not wHYPE? We’ll auto-wrap what you need when depositing. You can also wrap via your wallet.
    </div>
  );
}

