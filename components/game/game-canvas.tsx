"use client";

import { useEffect, useRef, useCallback } from "react";
import * as Phaser from "phaser";
import type { GameResult } from "@/lib/types/game.types";

interface GameCanvasProps {
  gameConfig: Phaser.Types.Core.GameConfig;
  onGameEnd: (result: GameResult) => void;
}

export function GameCanvas({ gameConfig, onGameEnd }: GameCanvasProps) {
  const gameRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);
  const gameEndCalledRef = useRef(false);

  const handleGameEnd = useCallback(
    (result: GameResult) => {
      // Prevent multiple calls
      if (gameEndCalledRef.current) return;
      gameEndCalledRef.current = true;
      onGameEnd(result);
    },
    [onGameEnd]
  );

  useEffect(() => {
    if (!gameRef.current || phaserGameRef.current) return;

    // Reset game end flag
    gameEndCalledRef.current = false;

    // Create Phaser game instance with improved config
    const config: Phaser.Types.Core.GameConfig = {
      ...gameConfig,
      parent: gameRef.current,
      // Ensure proper scaling
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: gameConfig.scale?.width || 800,
        height: gameConfig.scale?.height || 600,
      },
      // Better physics defaults
      physics: {
        default: "arcade",
        arcade: {
          gravity: { y: 300, x: 0 },
          debug: false,
          ...gameConfig.physics?.arcade,
        },
      },
    };

    try {
      const game = new Phaser.Game(config);
      phaserGameRef.current = game;

      // Single unified event listener
      const gameEndListener = (result: GameResult) => {
        handleGameEnd(result);
      };

      // Wait for game ready
      game.events.once("ready", () => {
        // Listen on each scene
        game.scene.scenes.forEach((scene) => {
          scene.events.off("game-end", gameEndListener);
          scene.events.on("game-end", gameEndListener);
        });
      });

      // Fallback: listen on game events
      game.events.off("game-end", gameEndListener);
      game.events.on("game-end", gameEndListener);
    } catch (error) {
      console.error("Failed to initialize Phaser game:", error);
    }

    return () => {
      if (phaserGameRef.current) {
        try {
          // Proper cleanup
          phaserGameRef.current.events.removeAllListeners();
          phaserGameRef.current.destroy(true, false);
        } catch (error) {
          console.error("Error destroying game:", error);
        }
        phaserGameRef.current = null;
      }
    };
  }, [gameConfig, handleGameEnd]);

  return (
    <div
      ref={gameRef}
      className="w-full flex items-center justify-center bg-black rounded-lg overflow-hidden shadow-2xl"
      style={{ minHeight: "600px" }}
      id="phaser-game-container"
    />
  );
}
