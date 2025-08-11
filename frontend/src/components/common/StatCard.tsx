'use client';

import React from 'react';
import { Card, CardBody, Skeleton } from '@nextui-org/react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: string;
  color?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  isLoading?: boolean;
  className?: string;
}

const colorClasses = {
  default: {
    card: 'border-border hover:border-border-hover',
    icon: 'text-foreground-secondary',
    value: 'text-foreground',
    trend: 'text-foreground-secondary',
  },
  primary: {
    card: 'border-accent/20 hover:border-accent/40 bg-accent/5',
    icon: 'text-accent',
    value: 'text-foreground',
    trend: 'text-accent',
  },
  success: {
    card: 'border-success/20 hover:border-success/40 bg-success/5',
    icon: 'text-success',
    value: 'text-foreground',
    trend: 'text-success',
  },
  warning: {
    card: 'border-warning/20 hover:border-warning/40 bg-warning/5',
    icon: 'text-warning',
    value: 'text-foreground',
    trend: 'text-warning',
  },
  danger: {
    card: 'border-error/20 hover:border-error/40 bg-error/5',
    icon: 'text-error',
    value: 'text-foreground',
    trend: 'text-error',
  },
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'default',
  isLoading = false,
  className,
}) => {
  const colors = colorClasses[color];

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={className}
    >
      <Card className={cn(
        "hyperlend-card glow-on-hover",
        colors.card
      )}>
        <CardBody className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground-secondary mb-2">
                {title}
              </p>
              
              {isLoading ? (
                <Skeleton className="h-8 w-32 rounded-lg mb-2" />
              ) : (
                <p className={cn(
                  "text-2xl font-bold mb-1",
                  colors.value
                )}>
                  {value}
                </p>
              )}

              {subtitle && (
                <div className="flex items-center gap-2">
                  <p className="text-xs text-foreground-tertiary">
                    {subtitle}
                  </p>
                  {trend && (
                    <span className={cn(
                      "text-xs font-medium",
                      colors.trend
                    )}>
                      {trend}
                    </span>
                  )}
                </div>
              )}
            </div>

            {Icon && (
              <div className={cn(
                "p-2 rounded-lg bg-background-secondary border border-border",
                colors.icon
              )}>
                <Icon className="w-5 h-5" />
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
};