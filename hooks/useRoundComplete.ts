"use client";

import { useState, useCallback } from "react";
import type { GameType } from "@/lib/types/game.types";
import type { RoundCompleteData } from "@/components/game/round-complete-modal";

interface UseRoundCompleteOptions {
  onContinue?: () => void;
  onRestart?: () => void;
}

/**
 * Hook for managing round completion modal
 * Handles auto-saving and modal state
 */
export function useRoundComplete({
  onContinue,
  onRestart,
}: UseRoundCompleteOptions) {
  const [isOpen, setIsOpen] = useState(false);
  const [roundData, setRoundData] = useState<RoundCompleteData | null>(null);

  const showRoundComplete = useCallback(
    (data: RoundCompleteData) => {
      setRoundData(data);
      setIsOpen(true);
    },
    []
  );

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setRoundData(null);
  }, []);

  const handleContinue = useCallback(() => {
    if (onContinue) {
      onContinue();
    }
    handleClose();
  }, [onContinue, handleClose]);

  const handleRestart = useCallback(() => {
    if (onRestart) {
      onRestart();
    }
    handleClose();
  }, [onRestart, handleClose]);

  return {
    isOpen,
    roundData,
    showRoundComplete,
    handleClose,
    handleContinue,
    handleRestart,
  };
}

