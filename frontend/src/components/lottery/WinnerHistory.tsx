'use client';

import React from 'react';
import { Card, CardHeader, CardBody, Avatar, Chip, Button } from '@nextui-org/react';
import { motion } from 'framer-motion';
import { Trophy, ExternalLink, Clock, Users } from 'lucide-react';
import { formatAddress, formatCurrency, formatTimeDistance } from '../../utils/format';
import { DEMO_DATA } from '../../utils/constants';

export const WinnerHistory: React.FC = () => {
  // Using demo data for Session 1
  const recentWinners = DEMO_DATA.recentWinners;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <Card className="border border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/20 border border-warning/30">
              <Trophy className="w-5 h-5 text-warning" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Recent Winners</h3>
              <p className="text-sm text-foreground-secondary">Latest lottery results</p>
            </div>
          </div>
          <Chip color="success" variant="flat" size="sm">
            {recentWinners.length} Recent
          </Chip>
        </div>
      </CardHeader>

      <CardBody className="pt-0">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          {recentWinners.map((winner, index) => (
            <motion.div
              key={winner.round}
              variants={itemVariants}
              className="flex items-center gap-4 p-4 rounded-lg bg-background-secondary border border-border hover:border-border-hover transition-colors"
            >
              {/* Winner Avatar */}
              <Avatar
                name={winner.winner.slice(2, 4).toUpperCase()}
                className="bg-gradient-to-br from-accent to-accent-hover text-black font-bold"
                size="md"
              />

              {/* Winner Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-foreground">
                    Round {winner.round}
                  </span>
                  <Chip size="sm" color="warning" variant="flat">
                    Winner
                  </Chip>
                </div>
                
                <div className="flex items-center gap-4 text-xs text-foreground-secondary">
                  <span className="font-mono">{formatAddress(winner.winner)}</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTimeDistance(winner.timestamp)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {winner.totalParticipants} participants
                  </div>
                </div>
              </div>

              {/* Prize Amount */}
              <div className="text-right">
                <div className="text-lg font-bold text-success">
                  {formatCurrency(winner.prize)}
                </div>
                <div className="text-xs text-foreground-secondary">
                  Prize Won
                </div>
              </div>

              {/* View on Explorer */}
              <Button
                size="sm"
                variant="ghost"
                isIconOnly
                className="opacity-50 hover:opacity-100"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </motion.div>
          ))}
        </motion.div>

        {/* View All Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-center"
        >
          <Button
            variant="bordered"
            className="border-border hover:border-border-hover"
            disabled // Will be functional in later sessions
          >
            View All Winners
          </Button>
        </motion.div>
      </CardBody>
    </Card>
  );
};