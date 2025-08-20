"use client";

import { useEffect, useState, useCallback } from "react";

interface HarvestSequenceState {
  roundId: string;
  harvestCompleted: boolean;
  closeCompleted: boolean;
  finalizeCompleted: boolean;
  timestamp: number;
}

const STORAGE_KEY = "harvest_sequence_state";
const STATE_EXPIRY_HOURS = 24; // State expires after 24 hours

export function useHarvestSequence(currentRound: bigint, roundState: number, timeLeft: number) {
  const [sequenceState, setSequenceState] = useState<HarvestSequenceState | null>(null);
  const [showHarvestLockedPopup, setShowHarvestLockedPopup] = useState(false);

  const roundIdStr = currentRound.toString();

  // Load state from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed: HarvestSequenceState = JSON.parse(stored);
        const hoursAgo = (Date.now() - parsed.timestamp) / (1000 * 60 * 60);
        
        // If state is for current round and not expired, use it
        if (parsed.roundId === roundIdStr && hoursAgo < STATE_EXPIRY_HOURS) {
          setSequenceState(parsed);
        } else {
          // Clear expired or old round state
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, [roundIdStr]);

  // Save state to localStorage whenever it changes
  const updateSequenceState = useCallback((updates: Partial<HarvestSequenceState>) => {
    const newState: HarvestSequenceState = {
      roundId: roundIdStr,
      harvestCompleted: false,
      closeCompleted: false,
      finalizeCompleted: false,
      timestamp: Date.now(),
      ...sequenceState,
      ...updates,
    };
    
    setSequenceState(newState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  }, [sequenceState, roundIdStr]);

  // Mark harvest as completed
  const markHarvestCompleted = useCallback(() => {
    updateSequenceState({ harvestCompleted: true });
  }, [updateSequenceState]);

  // Mark close as completed
  const markCloseCompleted = useCallback(() => {
    updateSequenceState({ closeCompleted: true });
  }, [updateSequenceState]);

  // Mark finalize as completed
  const markFinalizeCompleted = useCallback(() => {
    updateSequenceState({ finalizeCompleted: true });
  }, [updateSequenceState]);

  // Reset sequence state (when round changes or manual reset)
  const resetSequenceState = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setSequenceState(null);
  }, []);

  // Auto-reset when round state changes to finalized (state 2)
  useEffect(() => {
    if (roundState === 2 && sequenceState) {
      resetSequenceState();
    }
  }, [roundState, sequenceState, resetSequenceState]);

  // Check if harvest is allowed (timer must be 0 or less)
  const canHarvest = timeLeft <= 0;

  // Check if close is allowed (harvest must be completed)
  const canClose = sequenceState?.harvestCompleted === true;

  // Check if finalize is allowed (harvest must be completed)
  const canFinalize = sequenceState?.harvestCompleted === true;

  // Handle harvest button click
  const handleHarvestClick = useCallback(() => {
    if (!canHarvest) {
      setShowHarvestLockedPopup(true);
      return false;
    }
    return true;
  }, [canHarvest]);

  // Close popup
  const closeHarvestPopup = useCallback(() => {
    setShowHarvestLockedPopup(false);
  }, []);

  return {
    // State
    sequenceState,
    canHarvest,
    canClose,
    canFinalize,
    showHarvestLockedPopup,
    
    // Actions
    markHarvestCompleted,
    markCloseCompleted,
    markFinalizeCompleted,
    resetSequenceState,
    handleHarvestClick,
    closeHarvestPopup,
  };
}