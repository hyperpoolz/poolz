"use client";

import { Clock, X } from "lucide-react";

interface HarvestLockedPopupProps {
  isOpen: boolean;
  onClose: () => void;
  timeLeft: number;
}

export function HarvestLockedPopup({ isOpen, onClose, timeLeft }: HarvestLockedPopupProps) {
  if (!isOpen) return null;

  const formatTimeLeft = (seconds: number) => {
    if (seconds <= 0) return "0m";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-6 h-6 text-amber-500" />
            <h3 className="text-lg font-semibold">Harvest Locked</h3>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <p className="text-muted-foreground">
            You can only harvest yield once the round timer reaches zero. This ensures all participants have equal opportunity to enter before yield is collected.
          </p>
          
          <div className="bg-secondary/50 rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-1">Time remaining:</div>
            <div className="text-xl font-bold text-amber-500">
              {formatTimeLeft(timeLeft)}
            </div>
          </div>
          
          <div className="bg-primary/10 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-primary font-semibold">💰 Earn 1% Reward!</span>
            </div>
            <p className="text-sm text-muted-foreground">
              The caller of each management function (Harvest, Close, Draw) receives 1% of the action's value as a reward for helping maintain the lottery.
            </p>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <strong>Required sequence:</strong>
            <ol className="list-decimal list-inside mt-2 space-y-1 ml-2">
              <li>Wait for round timer to reach 0</li>
              <li>Harvest yield first (earn 1% of harvested yield)</li>
              <li>Close round (earn 1% closing reward)</li>
              <li>Draw winner (earn 1% draw reward)</li>
            </ol>
          </div>
          
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}