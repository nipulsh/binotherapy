"use client";

import { useEffect } from "react";
import type { GameResult } from "@/lib/types/game.types";
import { RoundCompleteModal } from "@/components/game/round-complete-modal";
import { useRoundComplete } from "@/hooks/useRoundComplete";
import type { GameType } from "@/lib/types/game.types";

interface GameWrapperProps {
  gameType: GameType;
  gameName: string;
  title?: string;
  children: React.ReactNode;
  onGameEnd?: (result: GameResult) => void;
}

export function GameWrapper({
  gameType,
  gameName,
  children,
  onGameEnd,
}: GameWrapperProps) {
  const {
    isOpen: isRoundCompleteOpen,
    roundData,
    showRoundComplete,
    handleClose: handleRoundClose,
    handleRestart: handleRoundRestart,
  } = useRoundComplete({
    onRestart: () => {
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    },
  });

  useEffect(() => {
    // Set up global game end handler
    const handleGameEnd = (result: GameResult) => {
      // Convert GameResult to RoundCompleteData format
      const roundData = {
        score: result.score,
        accuracy: result.accuracy,
        level: result.level,
        duration: result.duration,
        metadata: result.metadata || {},
      };

      // Show the unified modal (which will auto-save)
      showRoundComplete(roundData);

      // Call custom handler if provided
      if (onGameEnd) {
        onGameEnd(result);
      }
    };

    // Expose handler globally for game scripts
    if (typeof window !== "undefined") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).handleGameEnd = handleGameEnd;
    }

    return () => {
      if (typeof window !== "undefined") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (window as any).handleGameEnd;
      }
    };
  }, [gameType, gameName, showRoundComplete, onGameEnd]);

  return (
    <>
      {children}
      {/* Round Complete Modal */}
      {roundData && (
        <RoundCompleteModal
          open={isRoundCompleteOpen}
          gameType={gameType}
          gameName={gameName}
          data={roundData}
          onRestart={handleRoundRestart}
          onClose={handleRoundClose}
        />
      )}
    </>
  );
}
