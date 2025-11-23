"use client";

import { useEffect, useRef, useState } from "react";
import * as Phaser from "phaser";
import { appleCatcherConfig } from "@/lib/phaser/config/apple-catcher-config";
import type { GameResult } from "@/lib/types/game.types";
import { phaserTracker } from "@/lib/phaser/phaser-instance-tracker";

interface GameContainerProps {
  onGameEnd?: (result: GameResult) => void;
  onUIUpdate?: (data: {
    score: number;
    remainingTime: number;
  }) => void;
}

export function FallingBlocksGameContainer({
  onGameEnd,
  onUIUpdate,
}: GameContainerProps) {
  const gameRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);
  const containerIdRef = useRef<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [gameReady, setGameReady] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    if (!gameRef.current || phaserGameRef.current) return;

    // Generate unique container ID
    const containerId = `falling-blocks-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    containerIdRef.current = containerId;

    // Update config with parent element
    const config = {
      ...appleCatcherConfig,
      parent: gameRef.current,
    };

    // Initialize Phaser game
    let game: Phaser.Game;
    try {
      game = new Phaser.Game(config);
      phaserGameRef.current = game;
      
      // Register with tracker
      phaserTracker.register(containerId, game);
    } catch (error) {
      console.error("Failed to initialize Phaser game:", error);
      return;
    }

    // Wait for scene to be created and ready
    const setupSceneListeners = () => {
      const scene = game.scene.getScene("AppleCatcherScene");
      if (scene) {
        scene.events.on("game-end", (result: GameResult) => {
          onGameEnd?.(result);
        });

        scene.events.on(
          "ui-update",
          (data: {
            score: number;
            remainingTime: number;
          }) => {
            onUIUpdate?.(data);
          }
        );

        scene.events.once("game-ready", () => {
          setLoading(false);
          setGameReady(true);
        });

        // If scene is already ready, set ready state
        // Fix: Check if scene.scene exists before calling isActive
        const sceneManager = scene.scene;
        if (sceneManager && (sceneManager.isActive(scene) || sceneManager.isPaused(scene))) {
          setLoading(false);
          setGameReady(true);
        }
      } else {
        // Retry after a short delay if scene isn't ready yet
        setTimeout(setupSceneListeners, 100);
      }
    };

    // Start setting up listeners after a brief delay to ensure scene is created
    setTimeout(setupSceneListeners, 100);

    // Cleanup
    return () => {
      if (phaserGameRef.current && containerIdRef.current) {
        try {
          // Unregister from tracker
          phaserTracker.unregister(containerIdRef.current);
          
          // Destroy game
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if (phaserGameRef.current && !(phaserGameRef.current as any).destroyed) {
            phaserGameRef.current.destroy(true);
          }
        } catch (error) {
          console.error("Error cleaning up Phaser game:", error);
        }
        phaserGameRef.current = null;
        containerIdRef.current = null;
      }
    };
  }, [onGameEnd, onUIUpdate]);

  const startGame = () => {
    const scene = phaserGameRef.current?.scene.getScene(
      "AppleCatcherScene"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) as any;
    if (scene && typeof scene.startGame === "function") {
      scene.startGame();
      setGameStarted(true);
    }
  };

  const restartGame = () => {
    const scene = phaserGameRef.current?.scene.getScene(
      "AppleCatcherScene"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) as any;
    if (scene && typeof scene.restart === "function") {
      scene.restart();
      setGameStarted(false);
    }
  };

  return (
    <div className="relative w-full flex flex-col items-center">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <div className="text-white text-lg">Loading game...</div>
        </div>
      )}
      {gameReady && !gameStarted && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20 p-8">
          <h2 className="text-3xl font-bold text-white mb-4">Apple Catcher</h2>
          <p className="text-white mb-2">You have 30 seconds to catch apples!</p>
          <p className="text-white mb-2">If you catch more than 10 apples you win.</p>
          <p className="text-white mb-2">If you catch less than 10 apples you lose.</p>
          <p className="text-white mb-6">Click the start button to begin</p>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 text-lg font-semibold"
          >
            Start
          </button>
        </div>
      )}
      <div ref={gameRef} className="w-full" style={{ maxWidth: "500px" }} />
      {gameReady && gameStarted && (
        <button
          onClick={restartGame}
          className="absolute top-4 right-4 z-20 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Restart
        </button>
      )}
    </div>
  );
}
