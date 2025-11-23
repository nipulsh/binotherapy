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

const COLUMNS = 4;
const MAX_MISSED = 5;

// Calculate responsive dimensions
const getGameDimensions = () => {
  if (typeof window === "undefined") {
    return {
      GAME_WIDTH: 400,
      GAME_HEIGHT: 600,
      TILE_HEIGHT: 150,
      TILE_WIDTH: 100,
      HIT_ZONE_START: 400,
      HIT_ZONE_END: 600,
    };
  }

  const isMobile = window.innerWidth < 640;
  const availableWidth = Math.min(window.innerWidth - 32, 400);
  const GAME_WIDTH = isMobile ? availableWidth : 400;
  const GAME_HEIGHT = isMobile ? Math.min(window.innerHeight * 0.7, 600) : 600;
  const TILE_HEIGHT = Math.floor(GAME_HEIGHT / 4);
  const TILE_WIDTH = GAME_WIDTH / COLUMNS;
  const HIT_ZONE_START = GAME_HEIGHT - TILE_HEIGHT - 50;
  const HIT_ZONE_END = GAME_HEIGHT;

  return {
    GAME_WIDTH,
    GAME_HEIGHT,
    TILE_HEIGHT,
    TILE_WIDTH,
    HIT_ZONE_START,
    HIT_ZONE_END,
  };
};

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
  const [dimensions, setDimensions] = useState(getGameDimensions());
  
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
  const dimensionsRef = useRef(dimensions);

  // Update dimensions on resize
  useEffect(() => {
    const handleResize = () => {
      const newDimensions = getGameDimensions();
      setDimensions(newDimensions);
      dimensionsRef.current = newDimensions;
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  useEffect(() => {
    dimensionsRef.current = dimensions;
  }, [dimensions]);

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

  const endGame = React.useCallback(() => {
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
  }, [gameStartTime, tilesHit, missed, score, difficulty, maxCombo, speed, showRoundComplete]);

  const spawnTile = () => {
    const column = Math.floor(Math.random() * COLUMNS);
    const { TILE_HEIGHT } = dimensionsRef.current;
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

      // Get current tiles and dimensions from ref (most up-to-date)
      const currentTiles = tilesRef.current;
      const { TILE_HEIGHT, HIT_ZONE_START, HIT_ZONE_END } = dimensionsRef.current;

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
        const { GAME_HEIGHT, TILE_HEIGHT } = dimensionsRef.current;
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

  // Touch handler for mobile
  const handleColumnTouch = React.useCallback((column: number) => {
    if (gameStateRef.current !== "playing") return;

    // Show visual feedback
    setPressedKeys((prev) => ({ ...prev, [column]: true }));
    setTimeout(() => {
      setPressedKeys((prev) => {
        const newKeys = { ...prev };
        delete newKeys[column];
        return newKeys;
      });
    }, 150);

    // Get current tiles and dimensions from ref
    const currentTiles = tilesRef.current;
    const { TILE_HEIGHT, HIT_ZONE_START, HIT_ZONE_END } = dimensionsRef.current;

    // Find tile in hit zone
    const tileInZone = currentTiles.find((tile) => {
      if (tile.column !== column || tile.hit) return false;
      const tileTop = tile.y;
      const tileBottom = tile.y + TILE_HEIGHT;
      return (
        (tileTop >= HIT_ZONE_START && tileTop <= HIT_ZONE_END) ||
        (tileBottom >= HIT_ZONE_START && tileBottom <= HIT_ZONE_END) ||
        (tileTop <= HIT_ZONE_START && tileBottom >= HIT_ZONE_END)
      );
    });

    if (tileInZone) {
      // HIT! - Haptic feedback for success
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(10); // Short vibration for hit
      }

      setTiles((prev) =>
        prev.map((t) => (t.id === tileInZone.id ? { ...t, hit: true } : t))
      );

      const currentCombo = comboRef.current;
      const points = Math.round(10 * (1 + currentCombo * 0.1));
      setScore((s) => s + points);

      const newCombo = currentCombo + 1;
      setCombo(newCombo);
      setMaxCombo((max) => Math.max(max, newCombo));

      setTilesHit((t) => {
        const newHits = t + 1;
        if (newHits % 10 === 0) {
          setSpeed((s) => Math.min(s + 0.2, 2.5));
        }
        return newHits;
      });
    } else {
      // MISS! - Haptic feedback for miss
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(50); // Longer vibration for miss
      }

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
  }, [endGame]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-fuchsia-600 flex items-center justify-center p-2 sm:p-4">
      <div className="max-w-4xl w-full">
        <div className="mb-2 sm:mb-4">
          <Link
            href="/games"
            className="inline-block px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base bg-white/90 hover:bg-white text-purple-600 rounded-lg font-bold shadow-lg transition-all hover:scale-105"
          >
            ← Back to Games
          </Link>
        </div>
        {gameState === "playing" && (
          <>
            <div className="bg-black/50 backdrop-blur-md p-3 sm:p-4 rounded-t-xl text-white mb-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-3 sm:mb-4">
                🎹 MAGIC TILE 🎹
              </h1>
              <div className="flex justify-around sm:grid sm:grid-cols-4 gap-2 sm:gap-4 text-center">
                <div>
                  <div className="text-xs sm:text-sm opacity-80">Score</div>
                  <div className="text-base sm:text-xl font-bold text-yellow-300">
                    {Math.round(score)}
                  </div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm opacity-80">Combo</div>
                  <div className="text-base sm:text-xl font-bold text-yellow-300">
                    {combo}x
                  </div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm opacity-80">Speed</div>
                  <div className="text-base sm:text-xl font-bold text-yellow-300">
                    {speed.toFixed(1)}x
                  </div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm opacity-80">Missed</div>
                  <div className="text-base sm:text-xl font-bold text-red-300">
                    {missed}/{MAX_MISSED}
                  </div>
                </div>
              </div>
            </div>

            <div className="relative flex flex-col items-center">
              <div
                className="bg-white relative overflow-hidden rounded-b-xl shadow-2xl focus:outline-none"
                style={{ 
                  width: dimensions.GAME_WIDTH, 
                  height: dimensions.GAME_HEIGHT,
                  maxWidth: '100%',
                }}
                tabIndex={0}
                onFocus={(e) => e.target.blur()}
                onTouchStart={(e) => {
                  // Allow tapping on the game area itself (for mobile)
                  if (typeof window !== 'undefined' && window.innerWidth < 640) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const touch = e.touches[0];
                    const x = touch.clientX - rect.left;
                    const column = Math.floor((x / rect.width) * COLUMNS);
                    if (column >= 0 && column < COLUMNS) {
                      e.preventDefault();
                      handleColumnTouch(column);
                    }
                  }
                }}
              >
                {/* Grid lines */}
                {[...Array(COLUMNS - 1)].map((_, i) => (
                  <div
                    key={`grid-${i}`}
                    className="absolute top-0 bottom-0 w-px bg-gray-300 z-5"
                    style={{ left: (i + 1) * dimensions.TILE_WIDTH }}
                  />
                ))}

                {/* Hit zone indicator */}
                <div
                  className="absolute left-0 right-0 border-t-4 border-green-500 opacity-50 pointer-events-none z-20"
                  style={{ top: dimensions.HIT_ZONE_START }}
                />
                <div
                  className="absolute left-0 right-0 bg-green-200 opacity-20 pointer-events-none z-5"
                  style={{
                    top: dimensions.HIT_ZONE_START,
                    height: dimensions.HIT_ZONE_END - dimensions.HIT_ZONE_START,
                  }}
                />

                {/* Black tiles */}
                {tiles.map((tile) => (
                  <div
                    key={tile.id}
                    className="absolute pointer-events-none"
                    style={{
                      left: tile.column * dimensions.TILE_WIDTH + 2,
                      top: tile.y,
                      width: dimensions.TILE_WIDTH - 4,
                      height: dimensions.TILE_HEIGHT,
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

                {/* Touch/Key indicators at bottom */}
                <div className="absolute bottom-0 left-0 right-0 flex z-30">
                  {columnKeys.map((key, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleColumnTouch(idx)}
                      onTouchStart={(e) => {
                        e.preventDefault();
                        handleColumnTouch(idx);
                      }}
                      className={`flex-1 flex flex-col items-center justify-center font-bold transition-all duration-100 touch-manipulation ${
                        pressedKeys[idx]
                          ? "bg-purple-500 text-white scale-95"
                          : "bg-gray-100/90 text-gray-700 active:bg-purple-400"
                      }`}
                      style={{
                        height: Math.max(60, dimensions.TILE_HEIGHT * 0.4),
                        borderLeft: idx > 0 ? "2px solid #999" : "none",
                        boxShadow: pressedKeys[idx]
                          ? "inset 0 4px 8px rgba(0,0,0,0.3)"
                          : "none",
                      }}
                    >
                      <div className="text-lg sm:text-2xl">{key}</div>
                      <div className="text-[10px] sm:text-xs opacity-60">{altKeys[idx]}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-3 sm:mt-4 text-center text-white bg-black/40 backdrop-blur-sm p-2 sm:p-3 rounded-lg max-w-full">
                <p className="text-xs sm:text-sm font-semibold mb-1">
                  {typeof window !== 'undefined' && window.innerWidth < 640 
                    ? "👆 Tap buttons when tiles enter the GREEN ZONE"
                    : "⌨️ Press keys when tiles enter the GREEN ZONE"}
                </p>
                <p className="text-[10px] sm:text-xs opacity-90">
                  {typeof window !== 'undefined' && window.innerWidth < 640 
                    ? "Tap the buttons below the game"
                    : <>Keys: <span className="font-bold">D F J K</span> or <span className="font-bold">1 2 3 4</span></>}
                </p>
              </div>
            </div>
          </>
        )}

        {gameState === "start" && (
          <div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl text-center max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 text-purple-600">
              🎹 Magic Tile Challenge!
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
              {typeof window !== 'undefined' && window.innerWidth < 640 
                ? "Tap the buttons when black tiles reach the green zone!"
                : "Press the correct keys when black tiles reach the green zone!"}
            </p>
            <div className="mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">Select Difficulty:</h3>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
                {(["easy", "medium", "hard"] as Difficulty[]).map((diff) => (
                  <button
                    key={diff}
                    className={`px-4 sm:px-6 py-2 rounded-lg font-bold transition-all touch-manipulation min-h-[44px] ${
                      difficulty === diff
                        ? "bg-purple-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300 active:bg-gray-400"
                    }`}
                    onClick={() => setDifficulty(diff)}
                  >
                    {diff.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg mb-4 sm:mb-6 text-left space-y-1.5 sm:space-y-2">
              <p className="text-xs sm:text-sm">
                {typeof window !== 'undefined' && window.innerWidth < 640 
                  ? <>👆 <strong>Tap buttons below the game</strong></>
                  : <>⌨️ <strong>Keys: D, F, J, K</strong> (recommended) or <strong>1, 2, 3, 4</strong></>}
              </p>
              <p className="text-xs sm:text-sm">
                🎯 {typeof window !== 'undefined' && window.innerWidth < 640 
                  ? "Tap the button for each column when tiles reach the green zone"
                  : "Press the key for each column when tiles reach the green zone"}
              </p>
              <p className="text-xs sm:text-sm">⚡ Build combos for bonus points</p>
              <p className="text-xs sm:text-sm">🚀 Speed increases every 10 hits</p>
              <p className="text-xs sm:text-sm">
                ❌ Game ends after {MAX_MISSED} mistakes
              </p>
            </div>
            <button
              onClick={() => startGame(difficulty)}
              className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white py-3 rounded-lg font-bold text-base sm:text-lg hover:from-purple-700 hover:to-fuchsia-700 active:from-purple-800 active:to-fuchsia-800 transition-all touch-manipulation min-h-[48px]"
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
