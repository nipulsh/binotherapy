"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { RoundCompleteModal } from "@/components/game/round-complete-modal";
import { useRoundComplete } from "@/hooks/useRoundComplete";

type Tile = {
  id: number;
  column: number;
  y: number;
  hit: boolean;
};

type Difficulty = "easy" | "medium" | "hard";
type GameState = "start" | "playing" | "gameOver";

const GAME_WIDTH = 400;
const GAME_HEIGHT = 600;
const TILE_HEIGHT = 150;
const COLUMNS = 4;
const TILE_WIDTH = GAME_WIDTH / COLUMNS;
const MAX_MISSED = 5;
const HIT_ZONE_START = GAME_HEIGHT - 200;
const HIT_ZONE_END = GAME_HEIGHT;

// Key mappings
const keyToColumn: Record<string, number> = {
  d: 0,
  D: 0,
  "1": 0,
  f: 1,
  F: 1,
  "2": 1,
  j: 2,
  J: 2,
  "3": 2,
  k: 3,
  K: 3,
  "4": 3,
};

const difficultySettings = {
  easy: { spawnInterval: 1500, baseSpeed: 1.5 },
  medium: { spawnInterval: 1100, baseSpeed: 2.2 },
  hard: { spawnInterval: 800, baseSpeed: 3 },
};

const MagicTileGame = () => {
  const [gameState, setGameState] = useState<GameState>("start");
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [speed, setSpeed] = useState(1.0);
  const [missed, setMissed] = useState(0);
  const [tilesHit, setTilesHit] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [pressedKeys, setPressedKeys] = useState<Record<number, boolean>>({});
  const [gameStartTime, setGameStartTime] = useState<number | null>(null);
  
  const {
    isOpen: isRoundCompleteOpen,
    roundData,
    showRoundComplete,
    handleClose: handleRoundClose,
    handleRestart: handleRoundRestart,
  } = useRoundComplete({
    onRestart: () => {
      startGame(difficulty);
    },
  });

  const animationRef = useRef<number | null>(null);
  const nextTileIdRef = useRef(0);
  const tilesRef = useRef<Tile[]>([]);
  const gameStateRef = useRef<GameState>("start");
  const comboRef = useRef(0);
  const speedRef = useRef(1.0);

  // Sync refs with state
  useEffect(() => {
    tilesRef.current = tiles;
  }, [tiles]);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    comboRef.current = combo;
  }, [combo]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  const startGame = (selectedDifficulty: Difficulty) => {
    setDifficulty(selectedDifficulty);
    setGameState("playing");
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setSpeed(1.0);
    setMissed(0);
    setTilesHit(0);
    setTiles([]);
    nextTileIdRef.current = 0;
    setPressedKeys({});
    setGameStartTime(Date.now());
  };

  const endGame = () => {
    setGameState("gameOver");
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    // Show round complete modal with auto-save
    if (gameStartTime) {
      const gameDuration = Math.floor((Date.now() - gameStartTime) / 1000);
      const calculatedAccuracy =
        tilesHit + missed > 0
          ? Math.round((tilesHit / (tilesHit + missed)) * 100)
          : 0;

      showRoundComplete({
        score: Math.round(score),
        accuracy: calculatedAccuracy,
        duration: gameDuration,
        metadata: {
          difficulty: difficulty,
          tiles_hit: tilesHit,
          missed: missed,
          max_combo: maxCombo,
          final_speed: speed,
          total_tiles: tilesHit + missed,
        },
      });
    }
  };

  const spawnTile = () => {
    const column = Math.floor(Math.random() * COLUMNS);
    const newTile: Tile = {
      id: nextTileIdRef.current,
      column,
      y: -TILE_HEIGHT,
      hit: false,
    };

    setTiles((prev) => [...prev, newTile]);
    nextTileIdRef.current += 1;
  };

  // Keyboard handler
  useEffect(() => {
    if (gameState !== "playing") {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      const column = keyToColumn[key];

      if (column === undefined) return;

      // Prevent default only for game keys
      if (
        key === "d" ||
        key === "D" ||
        key === "f" ||
        key === "F" ||
        key === "j" ||
        key === "J" ||
        key === "k" ||
        key === "K" ||
        key === "1" ||
        key === "2" ||
        key === "3" ||
        key === "4"
      ) {
        e.preventDefault();
      }

      // Show visual feedback
      setPressedKeys((prev) => {
        if (prev[column]) return prev; // Already pressed
        return { ...prev, [column]: true };
      });

      // Get current tiles from ref (most up-to-date)
      const currentTiles = tilesRef.current;

      // Find tile in hit zone - check if any part of tile is in zone
      const tileInZone = currentTiles.find((tile) => {
        if (tile.column !== column || tile.hit) return false;
        // Check if tile overlaps with hit zone
        const tileTop = tile.y;
        const tileBottom = tile.y + TILE_HEIGHT;
        return (
          (tileTop >= HIT_ZONE_START && tileTop <= HIT_ZONE_END) ||
          (tileBottom >= HIT_ZONE_START && tileBottom <= HIT_ZONE_END) ||
          (tileTop <= HIT_ZONE_START && tileBottom >= HIT_ZONE_END)
        );
      });

      if (tileInZone) {
        // HIT!
        // Mark tile as hit immediately
        setTiles((prev) =>
          prev.map((t) => (t.id === tileInZone.id ? { ...t, hit: true } : t))
        );

        // Update score with combo
        const currentCombo = comboRef.current;
        const points = Math.round(10 * (1 + currentCombo * 0.1));
        setScore((s) => s + points);

        // Update combo
        const newCombo = currentCombo + 1;
        setCombo(newCombo);
        setMaxCombo((max) => Math.max(max, newCombo));

        // Update tiles hit
        setTilesHit((t) => {
          const newHits = t + 1;
          if (newHits % 10 === 0) {
            setSpeed((s) => {
              const newSpeed = Math.min(s + 0.2, 2.5);
              return newSpeed;
            });
          }
          return newHits;
        });
      } else {
        // MISS! - only count as miss if there are tiles in that column
        const hasTilesInColumn = currentTiles.some(
          (t) => t.column === column && !t.hit
        );

        if (hasTilesInColumn) {
          setCombo(0);
          setMissed((m) => {
            const newMissed = m + 1;
            if (newMissed >= MAX_MISSED) {
              endGame();
            }
            return newMissed;
          });
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key;
      const column = keyToColumn[key];

      if (column !== undefined) {
        setPressedKeys((prev) => {
          const newKeys = { ...prev };
          delete newKeys[column];
          return newKeys;
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameState, endGame]);

  // Game loop
  useEffect(() => {
    if (gameState !== "playing") return;

    const settings = difficultySettings[difficulty];
    let lastTime = performance.now();
    let accumulatedTime = 0;

    const gameLoop = (currentTime: number) => {
      if (gameStateRef.current !== "playing") return;

      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;
      accumulatedTime += deltaTime;

      // Spawn new tiles
      const currentSpeed = speedRef.current;
      const spawnInterval = settings.spawnInterval / currentSpeed;

      if (accumulatedTime >= spawnInterval) {
        spawnTile();
        accumulatedTime = 0;
      }

      // Update tile positions - use consistent frame rate
      const speedMultiplier =
        (settings.baseSpeed * currentSpeed * deltaTime) / 16.67;

      setTiles((prev) => {
        const updated = prev.map((tile) => ({
          ...tile,
          y: tile.y + speedMultiplier,
        }));

        // Check for missed tiles (passed bottom without being hit)
        const missedTiles = updated.filter((t) => !t.hit && t.y > GAME_HEIGHT);
        if (missedTiles.length > 0) {
          setCombo(0);
          setMissed((m) => {
            const newMissed = m + missedTiles.length;
            if (newMissed >= MAX_MISSED) {
              endGame();
            }
            return newMissed;
          });
        }

        // Remove off-screen tiles or hit tiles after a delay
        return updated.filter((t) => {
          if (t.hit) {
            // Remove hit tiles after they fade
            return t.y <= GAME_HEIGHT + 50;
          }
          return t.y <= GAME_HEIGHT + TILE_HEIGHT;
        });
      });

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState, difficulty, endGame]);

  const columnKeys = ["D", "F", "J", "K"];
  const altKeys = ["1", "2", "3", "4"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-fuchsia-600 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="mb-4">
          <Link
            href="/games"
            className="inline-block px-4 py-2 bg-white/90 hover:bg-white text-purple-600 rounded-lg font-bold shadow-lg transition-all hover:scale-105"
          >
            ← Back to Games
          </Link>
        </div>
        {gameState === "playing" && (
          <>
            <div className="bg-black/50 backdrop-blur-md p-4 rounded-t-xl text-white mb-0">
              <h1 className="text-2xl md:text-3xl font-bold text-center mb-4">
                🎹 MAGIC TILE 🎹
              </h1>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-sm opacity-80">Score</div>
                  <div className="text-xl font-bold text-yellow-300">
                    {Math.round(score)}
                  </div>
                </div>
                <div>
                  <div className="text-sm opacity-80">Combo</div>
                  <div className="text-xl font-bold text-yellow-300">
                    {combo}x
                  </div>
                </div>
                <div>
                  <div className="text-sm opacity-80">Speed</div>
                  <div className="text-xl font-bold text-yellow-300">
                    {speed.toFixed(1)}x
                  </div>
                </div>
                <div>
                  <div className="text-sm opacity-80">Missed</div>
                  <div className="text-xl font-bold text-red-300">
                    {missed}/{MAX_MISSED}
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div
                className="bg-white relative overflow-hidden rounded-b-xl shadow-2xl mx-auto focus:outline-none"
                style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
                tabIndex={0}
                onFocus={(e) => e.target.blur()}
              >
                {/* Grid lines */}
                {[...Array(COLUMNS - 1)].map((_, i) => (
                  <div
                    key={`grid-${i}`}
                    className="absolute top-0 bottom-0 w-px bg-gray-300 z-5"
                    style={{ left: (i + 1) * TILE_WIDTH }}
                  />
                ))}

                {/* Hit zone indicator */}
                <div
                  className="absolute left-0 right-0 border-t-4 border-green-500 opacity-50 pointer-events-none z-20"
                  style={{ top: HIT_ZONE_START }}
                />
                <div
                  className="absolute left-0 right-0 bg-green-200 opacity-20 pointer-events-none z-5"
                  style={{
                    top: HIT_ZONE_START,
                    height: HIT_ZONE_END - HIT_ZONE_START,
                  }}
                />

                {/* Black tiles */}
                {tiles.map((tile) => (
                  <div
                    key={tile.id}
                    className="absolute"
                    style={{
                      left: tile.column * TILE_WIDTH + 2,
                      top: tile.y,
                      width: TILE_WIDTH - 4,
                      height: TILE_HEIGHT,
                      background: tile.hit
                        ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                        : "linear-gradient(135deg, #1f2937 0%, #111827 100%)",
                      border: "2px solid #374151",
                      boxShadow: tile.hit
                        ? "0 0 20px rgba(16, 185, 129, 0.5)"
                        : "0 4px 6px rgba(0,0,0,0.3)",
                      zIndex: 10,
                      opacity: tile.hit ? 0.5 : 1,
                      transform: tile.hit ? "scale(0.95)" : "scale(1)",
                      transition: tile.hit
                        ? "opacity 0.3s ease, transform 0.3s ease"
                        : "none",
                      willChange: "transform",
                    }}
                  />
                ))}

                {/* Key indicators at bottom */}
                <div className="absolute bottom-0 left-0 right-0 flex z-30">
                  {columnKeys.map((key, idx) => (
                    <div
                      key={idx}
                      className={`flex-1 h-20 flex flex-col items-center justify-center font-bold transition-all duration-100 ${
                        pressedKeys[idx]
                          ? "bg-purple-500 text-white scale-95"
                          : "bg-gray-100/90 text-gray-700"
                      }`}
                      style={{
                        borderLeft: idx > 0 ? "2px solid #999" : "none",
                        boxShadow: pressedKeys[idx]
                          ? "inset 0 4px 8px rgba(0,0,0,0.3)"
                          : "none",
                      }}
                    >
                      <div className="text-2xl">{key}</div>
                      <div className="text-xs opacity-60">{altKeys[idx]}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 text-center text-white bg-black/40 backdrop-blur-sm p-3 rounded-lg">
                <p className="text-sm font-semibold mb-1">
                  ⌨️ Press keys when tiles enter the GREEN ZONE
                </p>
                <p className="text-xs opacity-90">
                  Keys: <span className="font-bold">D F J K</span> or{" "}
                  <span className="font-bold">1 2 3 4</span>
                </p>
              </div>
            </div>
          </>
        )}

        {gameState === "start" && (
          <div className="bg-white p-8 rounded-2xl text-center">
            <h2 className="text-3xl font-bold mb-4 text-purple-600">
              🎹 Magic Tile Challenge!
            </h2>
            <p className="text-gray-600 mb-6">
              Press the correct keys when black tiles reach the green zone!
            </p>
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Select Difficulty:</h3>
              <div className="flex gap-3 justify-center">
                {(["easy", "medium", "hard"] as Difficulty[]).map((diff) => (
                  <button
                    key={diff}
                    className={`px-6 py-2 rounded-lg font-bold transition-all ${
                      difficulty === diff
                        ? "bg-purple-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                    onClick={() => setDifficulty(diff)}
                  >
                    {diff.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg mb-6 text-left space-y-2">
              <p className="text-sm">
                ⌨️ <strong>Keys: D, F, J, K</strong> (recommended) or{" "}
                <strong>1, 2, 3, 4</strong>
              </p>
              <p className="text-sm">
                🎯 Press the key for each column when tiles reach the green zone
              </p>
              <p className="text-sm">⚡ Build combos for bonus points</p>
              <p className="text-sm">🚀 Speed increases every 10 hits</p>
              <p className="text-sm">
                ❌ Game ends after {MAX_MISSED} mistakes
              </p>
            </div>
            <button
              onClick={() => startGame(difficulty)}
              className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white py-3 rounded-lg font-bold text-lg hover:from-purple-700 hover:to-fuchsia-700 transition-all"
            >
              START GAME
            </button>
          </div>
        )}

        {/* Round Complete Modal */}
        {roundData && (
          <RoundCompleteModal
            open={isRoundCompleteOpen}
            gameType="saccadic-movement"
            gameName="magic-tile"
            data={roundData}
            onRestart={handleRoundRestart}
            onClose={handleRoundClose}
          />
        )}
      </div>
    </div>
  );
};

export default MagicTileGame;
