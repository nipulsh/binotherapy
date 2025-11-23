"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as Phaser from "phaser";
import { shadowPursuitConfig } from "@/lib/phaser/config/shadow-pursuit-config";
import type { GameResult } from "@/lib/types/game.types";
import { phaserTracker } from "@/lib/phaser/phaser-instance-tracker";
import { VirtualJoystick } from "./VirtualJoystick";

interface GameContainerProps {
  onGameEnd?: (result: GameResult) => void;
  onUIUpdate?: (data: {
    survivalTime: number;
    chaserSpeed: number;
    distance: number;
    stars: number;
  }) => void;
}

export function ShadowPursuitGameContainer({
  onGameEnd,
  onUIUpdate,
}: GameContainerProps) {
  const gameRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);
  // Use state for container ID to ensure it persists across renders but resets on remount
  const [containerId] = useState(() => `shadow-pursuit-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`);
  
  const [loading, setLoading] = useState(true);
  const [gameReady, setGameReady] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const joystickDirectionRef = useRef({ x: 0, y: 0 });

  // Store callbacks in refs to avoid re-initialization when they change
  const onGameEndRef = useRef(onGameEnd);
  const onUIUpdateRef = useRef(onUIUpdate);

  // Update refs when callbacks change
  useEffect(() => {
    onGameEndRef.current = onGameEnd;
    onUIUpdateRef.current = onUIUpdate;
  }, [onGameEnd, onUIUpdate]);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || "ontouchstart" in window);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Joystick handlers
  const handleJoystickMove = useCallback(
    (direction: { x: number; y: number }) => {
      joystickDirectionRef.current = direction;
      const scene = phaserGameRef.current?.scene.getScene(
        "ShadowPursuitScene"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ) as any;
      if (scene && typeof scene.setJoystickDirection === "function") {
        scene.setJoystickDirection(direction);
      }
    },
    []
  );

  const handleJoystickStop = useCallback(() => {
    joystickDirectionRef.current = { x: 0, y: 0 };
    const scene = phaserGameRef.current?.scene.getScene(
      "ShadowPursuitScene"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) as any;
    if (scene && typeof scene.setJoystickDirection === "function") {
      scene.setJoystickDirection({ x: 0, y: 0 });
    }
  }, []);

  useEffect(() => {
    // Prevent multiple initializations
    if (!gameRef.current) return;

    // Cleanup any existing game instance first (Singleton enforcement)
    if (phaserGameRef.current) {
      console.log("Cleaning up existing Phaser instance before re-init");
      phaserGameRef.current.destroy(true);
      phaserGameRef.current = null;
    }

    // Check tracker for stray instances and clean them
    const existingGames = phaserTracker.getActiveInstances();
    existingGames.forEach(instance => {
      if (instance.containerId?.startsWith("shadow-pursuit-")) {
        console.warn("Found stray Shadow Pursuit instance, cleaning up:", instance.containerId);
        try {
          instance.game.destroy(true);
          phaserTracker.unregister(instance.containerId);
        } catch (e) {
          console.error("Error destroying stray instance:", e);
        }
      }
    });

    // Update config with parent element
    const config = {
      ...shadowPursuitConfig,
      parent: gameRef.current,
      callbacks: {
        postBoot: () => {
          console.log("Phaser game booted");
        }
      }
    };

    // Initialize Phaser game
    let game: Phaser.Game;
    try {
      console.log("Initializing Shadow Pursuit game...");
      game = new Phaser.Game(config);
      phaserGameRef.current = game;

      // Register with tracker
      phaserTracker.register(containerId, game);
    } catch (error) {
      console.error("Failed to initialize Phaser game:", error);
      return;
    }

    // Setup event listeners when game is ready
    const setupListeners = () => {
      const scene = game.scene.getScene("ShadowPursuitScene");
      if (!scene) {
        // Retry if scene not ready (should be rare with 'ready' event)
        setTimeout(setupListeners, 100);
        return;
      }

      // Clean up old listeners
      scene.events.off("game-end");
      scene.events.off("ui-update");
      scene.events.off("scene-ready");
      scene.events.off("game-ready");

      // Bind new listeners
      scene.events.on("game-end", (result: GameResult) => {
        onGameEndRef.current?.(result);
      });

      scene.events.on("ui-update", (data: { survivalTime?: number; chaserSpeed?: number; distance?: number; level?: number }) => {
        // Map level to stars for compatibility and provide defaults for required fields
        onUIUpdateRef.current?.({
          survivalTime: data.survivalTime ?? 0,
          chaserSpeed: data.chaserSpeed ?? 0,
          distance: data.distance ?? 0,
          stars: data.level ?? 0,
        });
      });

      // Handle scene ready event
      const onReady = () => {
        setLoading(false);
        setGameReady(true);
      };

      scene.events.once("scene-ready", onReady);
      scene.events.once("game-ready", onReady); // Fallback

      // Check if already ready
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((scene as any).gameState === "READY" || (scene as any).gameState === "PLAYING") {
        onReady();
      }
    };

    // Wait for game to be ready before setting up scene listeners
    game.events.once("ready", setupListeners);

    // Cleanup function
    return () => {
      console.log("Unmounting Shadow Pursuit game...");
      if (phaserGameRef.current) {
        try {
          // Remove listeners
          const scene = phaserGameRef.current.scene.getScene("ShadowPursuitScene");
          if (scene) {
            scene.events.off("game-end");
            scene.events.off("ui-update");
            scene.events.off("scene-ready");
            scene.events.off("game-ready");
          }
          
          // Destroy game
          phaserGameRef.current.destroy(true);
          phaserTracker.unregister(containerId);
        } catch (error) {
          console.error("Error cleaning up Phaser game:", error);
        }
        phaserGameRef.current = null;
      }
    };
  }, [containerId]); // Re-run only if containerId changes (which shouldn't happen)

  const startGame = () => {
    if (!phaserGameRef.current) return;
    const scene = phaserGameRef.current.scene.getScene("ShadowPursuitScene");
    if (scene) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (scene as any).startGame();
      setGameStarted(true);
    }
  };

  const restartGame = () => {
    if (!phaserGameRef.current) return;
    const scene = phaserGameRef.current.scene.getScene("ShadowPursuitScene");
    if (scene) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (typeof (scene as any).restart === "function") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (scene as any).restart();
        setGameStarted(false);
      } else {
        scene.scene.restart();
        setGameStarted(false);
      }
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
        <div
          className="absolute inset-0 flex flex-col items-center justify-center z-20 p-8"
          style={{
            backgroundColor: "rgba(10, 10, 26, 0.95)",
            backdropFilter: "blur(10px)",
          }}
        >
          <h2
            className="text-4xl md:text-5xl font-bold mb-6 tracking-tight"
            style={{ color: "var(--galaxy-primary)" }}
          >
            Shadow Pursuit
          </h2>
          <div className="text-white text-center space-y-3 mb-8 max-w-md">
            <p className="text-lg">You are the Runner.</p>
            <p className="text-lg">
              A dark shadow awakens and will follow you.
            </p>
            <p className="text-lg">Survive as long as you can.</p>
            <p className="text-sm text-gray-300 mt-4">
              {isMobile
                ? "Use the joystick to move"
                : "Use WASD or Arrow Keys to move"}
            </p>
          </div>
          <button
            onClick={startGame}
            className="px-8 py-4 text-white rounded-lg text-xl font-semibold transition-all hover:scale-105"
            style={{
              background:
                "linear-gradient(to right, var(--galaxy-primary), var(--galaxy-secondary))",
              boxShadow: "0 8px 24px rgba(107, 76, 255, 0.4)",
            }}
          >
            Start Chase
          </button>
        </div>
      )}
      <div ref={gameRef} className="w-full" style={{ maxWidth: "800px" }} />
      {gameReady && gameStarted && (
        <button
          onClick={restartGame}
          className="absolute top-4 right-4 z-20 px-4 py-2 rounded-lg transition-all hover:scale-105"
          style={{
            backgroundColor: "var(--galaxy-primary)",
            color: "white",
            boxShadow: "0 4px 12px rgba(107, 76, 255, 0.4)",
          }}
        >
          Restart
        </button>
      )}
      {isMobile && gameReady && gameStarted && (
        <VirtualJoystick
          onMove={handleJoystickMove}
          onStop={handleJoystickStop}
          disabled={!gameStarted}
        />
      )}
    </div>
  );
}
