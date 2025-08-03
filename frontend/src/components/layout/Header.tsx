'use client';

import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Navbar, NavbarBrand, NavbarContent, NavbarItem, Button } from '@nextui-org/react';
import { motion } from 'framer-motion';
import { Zap, TrendingUp, Trophy } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <Navbar
      maxWidth="xl"
      className="border-b border-border bg-background/80 backdrop-blur-md"
      height="72px"
    >
      <NavbarBrand>
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center">
              <Zap className="w-6 h-6 text-black" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-success rounded-full animate-pulse" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-foreground">HyperLoops</h1>
            <p className="text-xs text-foreground-secondary">No-Loss Lottery</p>
          </div>
        </motion.div>
      </NavbarBrand>

      <NavbarContent className="hidden sm:flex gap-6" justify="center">
        <NavbarItem>
          <motion.div
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background-secondary border border-border"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <TrendingUp className="w-4 h-4 text-success" />
            <span className="text-sm font-medium text-foreground">5-20% APY</span>
          </motion.div>
        </NavbarItem>
        
        <NavbarItem>
          <motion.div
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background-secondary border border-border"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Trophy className="w-4 h-4 text-warning" />
            <span className="text-sm font-medium text-foreground">Daily Prizes</span>
          </motion.div>
        </NavbarItem>
      </NavbarContent>

      <NavbarContent justify="end">
        <NavbarItem>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <ConnectButton.Custom>
              {({
                account,
                chain,
                openAccountModal,
                openChainModal,
                openConnectModal,
                authenticationStatus,
                mounted,
              }) => {
                const ready = mounted && authenticationStatus !== 'loading';
                const connected =
                  ready &&
                  account &&
                  chain &&
                  (!authenticationStatus || authenticationStatus === 'authenticated');

                return (
                  <div
                    {...(!ready && {
                      'aria-hidden': true,
                      style: {
                        opacity: 0,
                        pointerEvents: 'none',
                        userSelect: 'none',
                      },
                    })}
                  >
                    {(() => {
                      if (!connected) {
                        return (
                          <Button
                            onClick={openConnectModal}
                            color="primary"
                            variant="solid"
                            className="font-semibold"
                            size="md"
                          >
                            Connect Wallet
                          </Button>
                        );
                      }

                      if (chain.unsupported) {
                        return (
                          <Button
                            onClick={openChainModal}
                            color="danger"
                            variant="solid"
                            className="font-semibold"
                            size="md"
                          >
                            Wrong network
                          </Button>
                        );
                      }

                      return (
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={openChainModal}
                            variant="bordered"
                            size="sm"
                            className="border-border hover:border-border-hover"
                          >
                            {chain?.hasIcon && (
                              <div
                                style={{
                                  background: chain.iconBackground,
                                  width: 12,
                                  height: 12,
                                  borderRadius: 999,
                                  overflow: 'hidden',
                                  marginRight: 4,
                                }}
                              >
                                {chain.iconUrl && (
                                  <img
                                    alt={chain.name ?? 'Chain icon'}
                                    src={chain.iconUrl}
                                    style={{ width: 12, height: 12 }}
                                  />
                                )}
                              </div>
                            )}
                            {chain.name}
                          </Button>

                          <Button
                            onClick={openAccountModal}
                            variant="solid"
                            color="primary"
                            className="font-mono font-semibold"
                            size="md"
                          >
                            {account.displayName}
                          </Button>
                        </div>
                      );
                    })()}
                  </div>
                );
              }}
            </ConnectButton.Custom>
          </motion.div>
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
};