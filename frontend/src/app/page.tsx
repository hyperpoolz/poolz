"use client";

import Link from "next/link";
import { memo } from "react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="w-full border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="text-xl font-semibold">HyperPool</div>
          <Link href="/app" className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 text-sm">
            Launch App
          </Link>
        </div>
      </header>

      <main className="px-6 py-12">
        <div className="max-w-6xl mx-auto space-y-12">
        <section className="rounded-2xl bg-gradient-to-br from-[#0f2540] via-[#133a63] to-[#0f2540] text-white p-8 border border-border">
          <h1 className="text-4xl sm:text-5xl font-bold">Win with your yield, never lose your deposit.</h1>
          <p className="mt-4 text-lg text-white/90 max-w-2xl">
            A no-loss lottery on Hyperliquid. Deposit wHYPE, earn yield, and get tickets for a chance to win the prize every round.
          </p>
          <div className="mt-6 flex gap-3">
            <Link href="/app" className="px-5 py-3 rounded-md bg-primary text-primary-foreground font-medium">
              Enter the Pool
            </Link>
            <a href="https://app.hyperliquid.xyz" target="_blank" rel="noreferrer" className="px-5 py-3 rounded-md bg-secondary text-secondary-foreground border border-border">
              Learn about Hyperliquid
            </a>
          </div>
        </section>

        <section className="mt-12 grid gap-6 sm:grid-cols-3">
          <Card title="No Loss" desc="Withdraw anytime. Your principal stays safe while your tickets grow with deposits."/>
          <Card title="Fair Odds" desc="1 ticket per 0.1 wHYPE. The more you deposit, the better your chances."/>
          <Card title="On Hyperliquid" desc="Fast, low fees, and composable DeFi on HyperEVM."/>
        </section>

        <section className="mt-12 rounded-2xl border border-border bg-card p-8">
          <h2 className="text-2xl font-semibold">How it works</h2>
          <ol className="mt-4 grid gap-3 text-sm text-muted-foreground list-decimal list-inside">
            <li>Deposit wHYPE. We auto-wrap HYPE if needed.</li>
            <li>Yield accrues in the background. Periodically, it’s harvested into the prize pool.</li>
            <li>When the round ends, a winner is selected proportional to tickets.</li>
          </ol>
          <Link href="/app" className="mt-6 inline-block px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm">
            Start Now
          </Link>
        </section>
        </div>
      </main>

      <footer className="px-6 py-8 text-xs text-muted-foreground">
        <div className="max-w-6xl mx-auto">Built with ❤️ for Hyperliquid</div>
      </footer>
    </div>
  );
}

const Card = memo(function Card({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="text-lg font-semibold">{title}</div>
      <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
});

