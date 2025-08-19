'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardBody, Button, Chip, Link } from '@nextui-org/react';
import { ArrowRight, Shield, TrendingUp, Gift, ExternalLink, Zap, Target, DollarSign, Layers } from 'lucide-react';
import { Header } from '../components/layout/Header';

export default function HomePage() {

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <main className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-12"
        >
          {/* Hero Section */}
          <motion.div variants={itemVariants} className="text-center space-y-8">
            <div className="space-y-6">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                <Chip
                  color="primary"
                  variant="flat"
                  className="mb-6 text-lg px-6 py-3"
                  startContent={<Zap className="w-5 h-5" />}
                >
                  No-Loss Lottery Protocol
                </Chip>
              </motion.div>
              
              <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6">
                <span className="gradient-text">HyperLoops</span>
              </h1>
              
              <p className="text-2xl md:text-3xl text-foreground-secondary max-w-4xl mx-auto leading-relaxed">
                Revolutionary <span className="text-accent font-semibold">no-loss lottery</span> protocol built on Hyperliquid EVM.
                <br className="hidden md:block" />
                Deposit wHYPE, earn yield through HyperLend, win prizes - 
                <span className="text-success font-semibold">your principal stays safe</span>.
              </p>
            </div>

            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-2xl mx-auto"
            >
              <Button
                as={Link}
                href="/v2"
                size="lg"
                color="secondary"
                className="font-semibold px-8 py-4 text-lg w-full sm:w-auto shadow-lg"
                startContent={<Zap className="w-5 h-5" />}
                endContent={<ArrowRight className="w-5 h-5" />}
              >
                Launch V2 (Latest)
              </Button>
              <Button
                as={Link}
                href="/app"
                size="lg"
                color="primary"
                variant="bordered"
                className="font-semibold px-8 py-4 text-lg w-full sm:w-auto"
                endContent={<ArrowRight className="w-5 h-5" />}
              >
                V1 Classic
              </Button>
              <Button
                as={Link}
                href="/analytics"
                size="lg"
                variant="bordered"
                className="font-semibold px-8 py-4 text-lg w-full sm:w-auto border-accent text-accent hover:bg-accent/10"
                endContent={<Target className="w-5 h-5" />}
              >
                View Analytics
              </Button>
            </motion.div>

          </motion.div>

          {/* V2 Features Banner */}
          <motion.div variants={itemVariants} className="space-y-6">
            <Card className="p-6 bg-gradient-to-r from-secondary/20 via-primary/10 to-accent/20 border-secondary/30">
              <CardBody className="space-y-4">
                <div className="flex items-center justify-center gap-3">
                  <Chip color="secondary" variant="shadow" size="lg" startContent={<Zap className="w-4 h-4" />}>
                    Now Live: V2 Protocol
                  </Chip>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground">
                  Enhanced Features in V2
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 mx-auto bg-secondary/20 rounded-full flex items-center justify-center">
                      <Target className="w-6 h-6 text-secondary" />
                    </div>
                    <h3 className="font-semibold">Fixed Ticketing</h3>
                    <p className="text-sm text-foreground-secondary">0.1 wHYPE = 1 ticket • Fair and predictable system</p>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 mx-auto bg-warning/20 rounded-full flex items-center justify-center">
                      <Shield className="w-6 h-6 text-warning" />
                    </div>
                    <h3 className="font-semibold">Secure Randomness</h3>
                    <p className="text-sm text-foreground-secondary">Two-phase lottery with blockhash randomness</p>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 mx-auto bg-success/20 rounded-full flex items-center justify-center">
                      <Layers className="w-6 h-6 text-success" />
                    </div>
                    <h3 className="font-semibold">Gas Optimized</h3>
                    <p className="text-sm text-foreground-secondary">35% smaller contract • Built for scale</p>
                  </div>
                </div>
                <div className="flex justify-center">
                  <Button
                    as={Link}
                    href="/v2"
                    color="secondary"
                    size="lg"
                    className="font-semibold px-8"
                    endContent={<ArrowRight className="w-5 h-5" />}
                  >
                    Try V2 Now
                  </Button>
                </div>
              </CardBody>
            </Card>
          </motion.div>

          {/* How It Works Section */}
          <motion.div variants={itemVariants} className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                How It Works
              </h2>
              <p className="text-lg text-foreground-secondary max-w-2xl mx-auto">
                HyperLoops combines DeFi yield generation with fair lottery mechanics to create a win-win system for all participants.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="p-6 bg-background-secondary border-border hover:border-accent/50 transition-colors">
                <CardBody className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-accent/20 rounded-full flex items-center justify-center">
                    <DollarSign className="w-8 h-8 text-accent" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">1. Deposit wHYPE</h3>
                  <p className="text-foreground-secondary">
                    Deposit your wHYPE tokens into the protocol. Your principal remains safe and fully withdrawable.
                  </p>
                </CardBody>
              </Card>

              <Card className="p-6 bg-background-secondary border-border hover:border-accent/50 transition-colors">
                <CardBody className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-success/20 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-8 h-8 text-success" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">2. Earn Yield</h3>
                  <p className="text-foreground-secondary">
                    Deposits are automatically supplied to HyperLend, generating 5-20% APY through lending markets.
                  </p>
                </CardBody>
              </Card>

              <Card className="p-6 bg-background-secondary border-border hover:border-accent/50 transition-colors">
                <CardBody className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-warning/20 rounded-full flex items-center justify-center">
                    <Gift className="w-8 h-8 text-warning" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">3. Win Prizes</h3>
                  <p className="text-foreground-secondary">
                    Accumulated yield forms prize pools. Fair lottery system distributes prizes daily to lucky winners.
                  </p>
                </CardBody>
              </Card>
            </div>
          </motion.div>

          {/* Key Features */}
          <motion.div variants={itemVariants} className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Why Choose HyperLoops?
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="p-8 bg-gradient-to-br from-background-secondary to-background-tertiary border-border">
                <CardBody className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-success/20 rounded-lg flex items-center justify-center">
                      <Shield className="w-6 h-6 text-success" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground">Zero Principal Risk</h3>
                  </div>
                  <p className="text-foreground-secondary text-lg">
                    Your deposited funds are always safe. Only the yield generated goes toward prize pools, ensuring you can withdraw your principal anytime.
                  </p>
                </CardBody>
              </Card>

              <Card className="p-8 bg-gradient-to-br from-background-secondary to-background-tertiary border-border">
                <CardBody className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center">
                      <Layers className="w-6 h-6 text-accent" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground">Built on HyperLend</h3>
                  </div>
                  <p className="text-foreground-secondary text-lg">
                    Leverages HyperLend's battle-tested lending protocol for reliable yield generation with deep liquidity and competitive rates.
                  </p>
                </CardBody>
              </Card>

              <Card className="p-8 bg-gradient-to-br from-background-secondary to-background-tertiary border-border">
                <CardBody className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-warning/20 rounded-lg flex items-center justify-center">
                      <Target className="w-6 h-6 text-warning" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground">Fair & Transparent</h3>
                  </div>
                  <p className="text-foreground-secondary text-lg">
                    Time-weighted lottery system ensures fairness. Larger deposits and longer holding periods increase your winning chances proportionally.
                  </p>
                </CardBody>
              </Card>

              <Card className="p-8 bg-gradient-to-br from-background-secondary to-background-tertiary border-border">
                <CardBody className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-info/20 rounded-lg flex items-center justify-center">
                      <Zap className="w-6 h-6 text-info" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground">Hyperliquid Native</h3>
                  </div>
                  <p className="text-foreground-secondary text-lg">
                    First-of-its-kind protocol on Hyperliquid EVM, designed for the high-performance, low-cost environment traders love.
                  </p>
                </CardBody>
              </Card>
            </div>
          </motion.div>

          {/* External Links Section */}
          <motion.div variants={itemVariants} className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Learn More
              </h2>
              <p className="text-lg text-foreground-secondary max-w-2xl mx-auto">
                Dive deeper into the ecosystem powering HyperLoops.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <Card className="p-6 bg-background-secondary border-border hover:border-accent/50 transition-colors">
                <CardBody className="flex flex-row items-center justify-between">
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-foreground">Hyperliquid Documentation</h3>
                    <p className="text-foreground-secondary">
                      Learn about Hyperliquid EVM, the high-performance blockchain powering HyperLoops.
                    </p>
                  </div>
                  <Button
                    as={Link}
                    href="https://hyperliquid.gitbook.io/hyperliquid-docs/hyperevm"
                    isExternal
                    variant="flat"
                    color="primary"
                    size="lg"
                    className="ml-4"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </Button>
                </CardBody>
              </Card>

              <Card className="p-6 bg-background-secondary border-border hover:border-accent/50 transition-colors">
                <CardBody className="flex flex-row items-center justify-between">
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-foreground">HyperLend Documentation</h3>
                    <p className="text-foreground-secondary">
                      Explore HyperLend's lending protocol that generates yield for our prize pools.
                    </p>
                  </div>
                  <Button
                    as={Link}
                    href="https://docs.hyperlend.finance/"
                    isExternal
                    variant="flat"
                    color="primary"
                    size="lg"
                    className="ml-4"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </Button>
                </CardBody>
              </Card>
            </div>
          </motion.div>

          {/* Call to Action */}
          <motion.div variants={itemVariants} className="text-center space-y-6">
            <Card className="p-8 bg-gradient-to-r from-accent/10 via-success/10 to-warning/10 border-accent/30">
              <CardBody className="space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                  Ready to Start Winning?
                </h2>
                <p className="text-xl text-foreground-secondary max-w-2xl mx-auto">
                  Join the no-loss lottery revolution. Earn yield, win prizes, keep your principal safe.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Button
                    as={Link}
                    href="/v2"
                    size="lg"
                    color="secondary"
                    className="font-semibold px-10 py-4 text-lg shadow-lg"
                    startContent={<Zap className="w-5 h-5" />}
                    endContent={<ArrowRight className="w-5 h-5" />}
                  >
                    Launch V2 Protocol
                  </Button>
                  <Button
                    as={Link}
                    href="/app"
                    size="lg"
                    variant="bordered"
                    color="primary"
                    className="font-semibold px-10 py-4 text-lg"
                  >
                    V1 Classic
                  </Button>
                  <Button
                    as={Link}
                    href="/analytics"
                    size="lg"
                    variant="bordered"
                    className="font-semibold px-10 py-4 text-lg border-accent text-accent hover:bg-accent/10"
                  >
                    View Live Data
                  </Button>
                </div>
              </CardBody>
            </Card>
          </motion.div>

          {/* Footer */}
          <motion.div variants={itemVariants} className="text-center py-12 border-t border-border">
            <div className="space-y-4">
              <div className="flex justify-center items-center gap-8 text-foreground-secondary">
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Built on Hyperliquid EVM
                </span>
                <span className="flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Powered by HyperLend
                </span>
                <span className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  No-Loss Guarantee
                </span>
              </div>
              <p className="text-sm text-foreground-secondary">
                © 2024 HyperLoops Protocol. Built for the Hyperliquid ecosystem.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}