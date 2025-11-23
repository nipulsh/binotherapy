"use client";

import { GameWrapper } from "@/components/game/game-wrapper";
import { GameType } from "@/lib/types/game.types";
import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { GameResult as HookGameResult } from "@/hooks/useGame";
import { Button } from "@/components/ui/button";
import Script from "next/script";

// Hit the Mole Game Component
const HitTheMoleGameComponent = ({
  onGameEnd,
}: {
  onGameEnd: (result: HookGameResult) => void;
}) => {
  const gameRef = useRef<HTMLDivElement>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [difficulty, setDifficulty] = useState("easy");
  const [gsapLoaded, setGsapLoaded] = useState(false);
  const [score, setScore] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const gameStateRef = useRef<{
    isPlaying: boolean;
    activeMoles: Set<number>;
    moleTimeouts: Map<number, NodeJS.Timeout>;
    spawnInterval: NodeJS.Timeout | null;
    timerInterval: NodeJS.Timeout | null;
    difficulty: string;
  }>({
    isPlaying: false,
    activeMoles: new Set(),
    moleTimeouts: new Map(),
    spawnInterval: null,
    timerInterval: null,
    difficulty: "easy",
  });

  const GRID_SIZE = 3; // 3x3 grid
  const TOTAL_HOLES = GRID_SIZE * GRID_SIZE;

  const difficultySettings = useMemo(
    () => ({
      easy: {
        spawnInterval: 1500, // Moles appear every 1.5 seconds
        visibleTime: 2500, // Moles stay visible for 2.5 seconds
        gameTime: 60, // 60 seconds
      },
      medium: {
        spawnInterval: 1000, // Moles appear every 1 second
        visibleTime: 1800, // Moles stay visible for 1.8 seconds
        gameTime: 60,
      },
      hard: {
        spawnInterval: 700, // Moles appear every 0.7 seconds
        visibleTime: 1200, // Moles stay visible for 1.2 seconds
        gameTime: 60,
      },
    }),
    []
  );

  const hideMole = useCallback((holeIndex: number) => {
    if (!gameRef.current || !window.gsap) return;

    const hole = gameRef.current.querySelector(
      `[data-hole-index="${holeIndex}"]`
    ) as HTMLElement;
    if (!hole) return;

    const mole = hole.querySelector(".mole") as HTMLElement;
    if (!mole) return;

    // Clear any pending timeout for this mole
    const timeout = gameStateRef.current.moleTimeouts.get(holeIndex);
    if (timeout) {
      clearTimeout(timeout);
      gameStateRef.current.moleTimeouts.delete(holeIndex);
    }

    // Only hide if mole is actually active
    if (!gameStateRef.current.activeMoles.has(holeIndex)) return;

    gameStateRef.current.activeMoles.delete(holeIndex);

    // Animate mole going down
    if (window.gsap) {
      window.gsap.killTweensOf(mole); // Kill any existing animations
      window.gsap.to(mole, {
        y: 100,
        opacity: 0,
        scale: 0.5,
        duration: 0.2,
        ease: "power2.in",
        onComplete: () => {
          mole.classList.remove("active");
          if (window.gsap) {
            window.gsap.set(mole, { y: 100, opacity: 0, scale: 0.5 });
          }
        },
      });
    } else {
      mole.classList.remove("active");
    }
  }, []);

  const spawnMole = useCallback(
    (holeIndex: number) => {
      if (!gameRef.current || !window.gsap || !gameStateRef.current.isPlaying)
        return;

      const hole = gameRef.current.querySelector(
        `[data-hole-index="${holeIndex}"]`
      ) as HTMLElement;
      if (!hole) return;

      const mole = hole.querySelector(".mole") as HTMLElement;
      if (!mole) return;

      // Don't spawn if already active or has pending timeout
      if (
        gameStateRef.current.activeMoles.has(holeIndex) ||
        gameStateRef.current.moleTimeouts.has(holeIndex)
      )
        return;

      gameStateRef.current.activeMoles.add(holeIndex);
      mole.classList.add("active");

      const settings =
        difficultySettings[
          gameStateRef.current.difficulty as keyof typeof difficultySettings
        ];

      // Animate mole popping up
      if (window.gsap) {
        window.gsap.killTweensOf(mole); // Kill any existing animations
        window.gsap.set(mole, { y: 100, opacity: 0, scale: 0.5 });
        window.gsap.to(mole, {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.3,
          ease: "back.out(1.7)",
        });
      }

      // Auto-hide mole after visible time
      const timeout = setTimeout(() => {
        if (
          gameStateRef.current.activeMoles.has(holeIndex) &&
          mole.classList.contains("active")
        ) {
          hideMole(holeIndex);
        }
      }, settings.visibleTime);

      gameStateRef.current.moleTimeouts.set(holeIndex, timeout);
    },
    [hideMole, difficultySettings]
  );

  const hitMole = useCallback(
    (holeIndex: number, e: React.MouseEvent) => {
      if (!gameStateRef.current.isPlaying) return;

      const hole = e.currentTarget as HTMLElement;
      const mole = hole.querySelector(".mole") as HTMLElement;

      if (!mole || !mole.classList.contains("active")) return;

      // Hit successful!
      setScore((prev) => prev + 1);

      // Add hit effect
      if (window.gsap && mole) {
        window.gsap.to(mole, {
          scale: 1.5,
          rotation: 360,
          duration: 0.3,
          ease: "power2.out",
          onComplete: () => {
            hideMole(holeIndex);
          },
        });
      } else {
        hideMole(holeIndex);
      }

      // Play hit sound effect (optional - using a simple beep)
      try {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        const audioContext = new AudioContextClass();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = "sine";

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.currentTime + 0.1
        );

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
      } catch {
        // Audio not supported or failed
      }
    },
    [hideMole]
  );

  const endGame = useCallback(() => {
    gameStateRef.current.isPlaying = false;

    if (gameStateRef.current.spawnInterval) {
      clearInterval(gameStateRef.current.spawnInterval);
      gameStateRef.current.spawnInterval = null;
    }
    if (gameStateRef.current.timerInterval) {
      clearInterval(gameStateRef.current.timerInterval);
      gameStateRef.current.timerInterval = null;
    }

    // Clear all mole timeouts
    gameStateRef.current.moleTimeouts.forEach((timeout) => {
      clearTimeout(timeout);
    });
    gameStateRef.current.moleTimeouts.clear();

    // Hide all active moles
    gameStateRef.current.activeMoles.forEach((holeIndex) => {
      hideMole(holeIndex);
    });

    const settings =
      difficultySettings[
        gameStateRef.current.difficulty as keyof typeof difficultySettings
      ];
    const currentTimeRemaining = timeRemaining;
    const currentScore = score;
    const duration = settings.gameTime - currentTimeRemaining;
    const accuracy = currentScore > 0 ? 100 : 0; // Simplified - in real game, track misses too

    onGameEnd({
      score: currentScore * 10,
      accuracy,
      duration,
      level: Math.floor(currentScore / 10) + 1,
      metadata: {
        molesHit: currentScore,
        difficulty: gameStateRef.current.difficulty,
      },
    });

    setGameStarted(false);
  }, [timeRemaining, score, hideMole, onGameEnd, difficultySettings]);

  const startGame = useCallback(
    (selectedDifficulty: string) => {
      if (!gameRef.current || !window.gsap) return;

      gameStateRef.current.difficulty = selectedDifficulty;
      gameStateRef.current.isPlaying = true;
      gameStateRef.current.activeMoles.clear();
      setScore(0);

      const settings =
        difficultySettings[
          selectedDifficulty as keyof typeof difficultySettings
        ];
      setTimeRemaining(settings.gameTime);

      // Clear any existing intervals
      if (gameStateRef.current.spawnInterval) {
        clearInterval(gameStateRef.current.spawnInterval);
      }
      if (gameStateRef.current.timerInterval) {
        clearInterval(gameStateRef.current.timerInterval);
      }

      // Hide all moles initially
      for (let i = 0; i < TOTAL_HOLES; i++) {
        const hole = gameRef.current.querySelector(
          `[data-hole-index="${i}"]`
        ) as HTMLElement;
        if (hole) {
          const mole = hole.querySelector(".mole") as HTMLElement;
          if (mole) {
            mole.classList.remove("active");
            if (window.gsap) {
              window.gsap.set(mole, { y: 100, opacity: 0, scale: 0.5 });
            }
          }
        }
      }

      // Spawn moles at intervals
      gameStateRef.current.spawnInterval = setInterval(() => {
        if (!gameStateRef.current.isPlaying) return;

        // Find available holes (not currently active)
        const availableHoles: number[] = [];
        for (let i = 0; i < TOTAL_HOLES; i++) {
          if (!gameStateRef.current.activeMoles.has(i)) {
            availableHoles.push(i);
          }
        }

        if (availableHoles.length > 0) {
          // Spawn 1-2 moles randomly
          const molesToSpawn = Math.random() > 0.7 ? 2 : 1;
          const shuffled = [...availableHoles].sort(() => Math.random() - 0.5);
          for (let i = 0; i < Math.min(molesToSpawn, shuffled.length); i++) {
            spawnMole(shuffled[i]);
          }
        }
      }, settings.spawnInterval) as unknown as NodeJS.Timeout;

      // Timer countdown
      gameStateRef.current.timerInterval = setInterval(() => {
        if (!gameStateRef.current.isPlaying) return;

        setTimeRemaining((prev) => {
          if (prev <= 1) {
            endGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000) as unknown as NodeJS.Timeout;
    },
    [spawnMole, endGame, TOTAL_HOLES, difficultySettings]
  );

  const startGameInternal = useCallback(
    (selectedDifficulty: string) => {
      setDifficulty(selectedDifficulty);
      setGameStarted(true);
      setTimeout(() => {
        startGame(selectedDifficulty);
      }, 100);
    },
    [startGame]
  );

  // Cleanup on unmount
  useEffect(() => {
    const state = gameStateRef.current;
    return () => {
      if (state.spawnInterval) {
        clearInterval(state.spawnInterval);
      }
      if (state.timerInterval) {
        clearInterval(state.timerInterval);
      }
      // Clear all mole timeouts
      state.moleTimeouts.forEach((timeout) => {
        clearTimeout(timeout);
      });
      state.moleTimeouts.clear();
    };
  }, []);

  return (
    <>
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"
        onLoad={() => setGsapLoaded(true)}
      />
      <div className="flex flex-col items-center justify-center w-full min-h-screen p-4 sm:p-6 md:p-8 bg-gradient-to-br from-green-600 to-green-800 overflow-auto">
        {!gameStarted && gsapLoaded && (
          <div className="flex flex-col items-center space-y-4 mb-6 sm:mb-8">
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white">
              Select Difficulty
            </h3>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              {["easy", "medium", "hard"].map((d) => (
                <Button
                  key={d}
                  onClick={() => startGameInternal(d)}
                  variant={difficulty === d ? "default" : "outline"}
                  className="bg-white/20 hover:bg-white/30 text-white border-white min-h-[44px] px-6"
                >
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        )}

        {gameStarted && (
          <div className="flex flex-col items-center space-y-3 sm:space-y-4 mb-4 sm:mb-6">
            <div className="flex space-x-6 sm:space-x-8 text-white">
              <div className="text-center">
                <div className="text-xs sm:text-sm opacity-80">Score</div>
                <div className="text-2xl sm:text-3xl font-bold">{score}</div>
              </div>
              <div className="text-center">
                <div className="text-xs sm:text-sm opacity-80">Time</div>
                <div className="text-2xl sm:text-3xl font-bold">
                  {timeRemaining}s
                </div>
              </div>
            </div>
          </div>
        )}

        <div
          ref={gameRef}
          className="grid grid-cols-3 gap-3 sm:gap-4 md:gap-6 p-3 sm:p-4 md:p-6 bg-green-900/30 rounded-2xl backdrop-blur-sm max-w-full"
        >
          {Array.from({ length: TOTAL_HOLES }).map((_, index) => (
            <div
              key={index}
              data-hole-index={index}
              onClick={(e) => hitMole(index, e)}
              className="relative w-16 h-16 xs:w-20 xs:h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 cursor-pointer flex items-end justify-center touch-manipulation"
            >
              {/* Hole */}
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background:
                    "radial-gradient(circle, #5a3e2b 0%, #3d2817 70%, #2a1a0f 100%)",
                  boxShadow: "inset 0 10px 20px rgba(0, 0, 0, 0.5)",
                }}
              />
              {/* Mole */}
              <div
                className="mole relative z-10 w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 lg:w-20 lg:h-20 rounded-full flex items-center justify-center text-3xl xs:text-4xl sm:text-4xl md:text-5xl transition-all duration-300"
                style={{
                  background:
                    "radial-gradient(circle, #8b6f47 0%, #6b5438 50%, #4a3726 100%)",
                  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.4)",
                  transform: "translateY(100px) scale(0.5)",
                  opacity: 0,
                  pointerEvents: "none",
                }}
              >
                🐹
              </div>
            </div>
          ))}
        </div>

        {gameStarted && (
          <div className="mt-4 sm:mt-6 text-white text-center px-4">
            <p className="text-xs sm:text-sm opacity-80">
              Click on the moles as they pop up!
            </p>
          </div>
        )}
      </div>
      <style jsx>{`
        .mole.active {
          pointer-events: auto;
        }
        .mole:hover {
          transform: scale(1.1) !important;
        }
      `}</style>
    </>
  );
};

export default function HitTheMolePage() {
  return (
    <GameWrapper
      title="Hit The Mole"
      gameType={"eye-hand-coordination" as GameType}
      gameName="hit-the-mole"
    >
      <HitTheMoleGameComponent
        onGameEnd={(result) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if ((window as any).handleGameEnd) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).handleGameEnd(result);
          }
        }}
      />
    </GameWrapper>
  );
}
