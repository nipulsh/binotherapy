"use client";

import { GameWrapper } from "@/components/game/game-wrapper";
import { GameType } from "@/lib/types/game.types";
import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { GameResult as HookGameResult } from "@/hooks/useGame";
import Script from "next/script";

// Find the Queen Game Component
const FindTheQueenGameComponent = ({
  onGameEnd,
}: {
  onGameEnd: (result: HookGameResult) => void;
}) => {
  const gameRef = useRef<HTMLDivElement>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [difficulty, setDifficulty] = useState("easy");
  const [gsapLoaded, setGsapLoaded] = useState(false);
  const [message, setMessage] = useState(
    'Select difficulty and click "Start Game" to begin!'
  );
  const [messageColor, setMessageColor] = useState("white");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("findTheQueenHighScore");
      return stored ? parseInt(stored, 10) : 0;
    }
    return 0;
  });
  const [startButtonDisabled, setStartButtonDisabled] = useState(false);

  const gameStateRef = useRef<{
    queenPosition: number;
    gameInProgress: boolean;
    cleanup: (() => void) | null;
    startTime: number | null;
    startGameFn: (() => Promise<void>) | null;
  }>({
    queenPosition: 0,
    gameInProgress: false,
    cleanup: null,
    startTime: null,
    startGameFn: null,
  });

  const difficultySettings = useMemo(
    () => ({
      easy: { swaps: 5, speed: 0.6, showTime: 2500 },
      medium: { swaps: 10, speed: 0.4, showTime: 2000 },
      hard: { swaps: 15, speed: 0.3, showTime: 1500 },
    }),
    []
  );

  const setCardFaces = useCallback(() => {
    if (!gameRef.current) return;
    const cards = gameRef.current.querySelectorAll(".card");
    gameStateRef.current.queenPosition = Math.floor(Math.random() * 3);
    cards.forEach((card, index) => {
      const cardBack = card.querySelector(".card-back");
      if (cardBack) {
        cardBack.classList.remove("queen", "not-queen");
        if (index === gameStateRef.current.queenPosition) {
          cardBack.classList.add("queen");
        } else {
          cardBack.classList.add("not-queen");
        }
      }
    });
  }, []);

  const shuffleCards = useCallback(
    async (selectedDifficulty: string) => {
      if (!gameRef.current || !window.gsap) return;
      const settings =
        difficultySettings[
          selectedDifficulty as keyof typeof difficultySettings
        ];
      const containers = Array.from(
        gameRef.current.querySelectorAll(".card-container")
      );

      for (let s = 0; s < settings.swaps; s++) {
        const i = Math.floor(Math.random() * 3);
        let j = Math.floor(Math.random() * 3);
        while (i === j) j = Math.floor(Math.random() * 3);

        const container1 = containers[i];
        const container2 = containers[j];
        const card1 = container1.querySelector(".card");
        const card2 = container2.querySelector(".card");

        if (!card1 || !card2) continue;

        const pos1 = container1.getBoundingClientRect();
        const pos2 = container2.getBoundingClientRect();
        const deltaX1 = pos2.left - pos1.left;
        const deltaX2 = pos1.left - pos2.left;

        const tl = window.gsap.timeline();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (tl as any).to([card1, card2], {
          y: -30,
          duration: settings.speed / 3,
          ease: "power2.out",
        })
          .to(
            card1,
            {
              x: deltaX1,
              duration: settings.speed / 2,
              ease: "power2.inOut",
            },
            `-=${settings.speed / 6}`
          )
          .to(
            card2,
            {
              x: deltaX2,
              duration: settings.speed / 2,
              ease: "power2.inOut",
            },
            `-=${settings.speed / 2}`
          )
          .to(
            [card1, card2],
            { y: 0, duration: settings.speed / 3, ease: "power2.in" },
            `-=${settings.speed / 6}`
          );

        await tl.then();

        const parent = container1.parentNode;
        const next1 =
          container1.nextSibling === container2
            ? container1
            : container1.nextSibling;
        const next2 =
          container2.nextSibling === container1
            ? container2
            : container2.nextSibling;

        if (parent && next1 && next2) {
          parent.insertBefore(container2, next1);
          parent.insertBefore(container1, next2);
        }

        if (window.gsap) {
          window.gsap.set([card1, card2], { x: 0, y: 0 });
        }
        [containers[i], containers[j]] = [containers[j], containers[i]];
        await window.gsap.delayedCall(0.05).then();
      }
    },
    [difficultySettings]
  );

  const handleCardClick = useCallback(
    async (e: Event) => {
      if (
        !gameStateRef.current.gameInProgress ||
        !window.gsap ||
        !gameRef.current
      )
        return;

      const clickedCard = e.currentTarget as HTMLElement;
      gameStateRef.current.gameInProgress = false;
      setStartButtonDisabled(false);

      const cardInner = clickedCard.querySelector(".card-inner");
      if (cardInner && window.gsap) {
        window.gsap.to(cardInner, {
          rotateY: 180,
          duration: 0.6,
          ease: "power2.inOut",
        });
      }

      setTimeout(() => {
        const cardBack = clickedCard.querySelector(".card-back");
        const currentScore = score;
        const currentHighScore = highScore;
        const currentDifficulty = difficulty;
        const currentStartTime = gameStateRef.current.startTime;

        if (cardBack?.classList.contains("queen")) {
          // Correct guess
          setMessage("🎉 You found the Queen! Congratulations!");
          setMessageColor("#2ecc71");

          const newScore = currentScore + 1;
          setScore(newScore);
          if (newScore > currentHighScore) {
            const newHighScore = newScore;
            setHighScore(newHighScore);
            if (typeof window !== "undefined") {
              localStorage.setItem(
                "findTheQueenHighScore",
                newHighScore.toString()
              );
            }
          }

          // Victory animation
          if (window.gsap) {
            window.gsap.to(clickedCard, {
              scale: 1.2,
              duration: 0.3,
              yoyo: true,
              repeat: 1,
              ease: "power2.inOut",
            });
          }

          // Continue to next round after a delay
          setTimeout(() => {
            if (gameStateRef.current.startGameFn) {
              gameStateRef.current.startGameFn();
            }
          }, 1500);
        } else {
          // Wrong guess
          setMessage("❌ Sorry, that was not the Queen!");
          setMessageColor("#e74c3c");

          setScore(0);

          // Shake animation for wrong card
          if (window.gsap) {
            window.gsap.to(clickedCard, {
              x: -10,
              duration: 0.1,
              yoyo: true,
              repeat: 3,
              ease: "power2.inOut",
            });
          }

          // Reveal the queen after a delay
          setTimeout(() => {
            if (!gameRef.current || !window.gsap) return;
            const cards = gameRef.current.querySelectorAll(".card");
            cards.forEach((card) => {
              const cardBack = card.querySelector(".card-back");
              if (cardBack?.classList.contains("queen")) {
                const cardInner = card.querySelector(".card-inner");
                if (cardInner && window.gsap) {
                  window.gsap.to(cardInner, {
                    rotateY: 180,
                    duration: 0.6,
                    ease: "power2.inOut",
                  });
                }
              }
            });

            // End game after revealing queen
            if (currentStartTime) {
              const duration = Math.floor(
                (Date.now() - currentStartTime) / 1000
              );
              onGameEnd({
                score: currentScore * 100,
                accuracy: currentScore > 0 ? 100 : 0,
                duration,
                level: currentScore,
                metadata: {
                  roundsCompleted: currentScore,
                  difficulty: currentDifficulty,
                },
              });
            }
            setGameStarted(false);
          }, 800);
        }
      }, 600);
    },
    [score, highScore, difficulty, onGameEnd]
  );

  const startGame = useCallback(async () => {
    if (!gameRef.current || !window.gsap) return;

    gameStateRef.current.gameInProgress = false;
    setStartButtonDisabled(true);
    const settings =
      difficultySettings[difficulty as keyof typeof difficultySettings];

    setMessage("Watch the Queen...");
    setMessageColor("white");

    // Reset card positions and rotations from previous games
    const cards = gameRef.current.querySelectorAll(".card");
    cards.forEach((card) => {
      if (window.gsap) {
        window.gsap.set(card, { x: 0, y: 0 });
        const cardInner = card.querySelector(".card-inner");
        if (cardInner) {
          window.gsap.set(cardInner, { rotateY: 180 }); // Show card backs
        }
      }
    });

    setCardFaces();

    // Wait for the user to see the queen
    await window.gsap.delayedCall(settings.showTime / 1000).then();

    // Flip cards to hide them (show fronts)
    cards.forEach((card) => {
      const cardInner = card.querySelector(".card-inner");
      if (cardInner && window.gsap) {
        window.gsap.to(cardInner, {
          rotateY: 0,
          duration: 0.6,
          ease: "power2.inOut",
        });
      }
    });
    setMessage("Shuffling...");

    // Wait for the flip animation to finish
    await window.gsap.delayedCall(0.8).then();

    // Shuffle with animation
    await shuffleCards(difficulty);

    setMessage("Find the Queen! 👑");
    setMessageColor("white");
    gameStateRef.current.gameInProgress = true;
    gameStateRef.current.startTime = Date.now();
  }, [difficulty, setCardFaces, shuffleCards, difficultySettings]);

  const selectDifficulty = useCallback((selectedDifficulty: string) => {
    if (gameStateRef.current.gameInProgress) return;
    setDifficulty(selectedDifficulty);
    const difficultyName =
      selectedDifficulty.charAt(0).toUpperCase() + selectedDifficulty.slice(1);
    setMessage(`${difficultyName} mode selected! Click "Start Game" to begin!`);
    setMessageColor("white");
  }, []);

  // Initialize game when started
  useEffect(() => {
    if (gameStarted && gameRef.current && window.gsap) {
      const cards = gameRef.current.querySelectorAll(".card");
      const cleanupFn = () => {
        cards.forEach((card) => {
          card.removeEventListener("click", handleCardClick);
        });
      };

      cards.forEach((card) => {
        card.addEventListener("click", handleCardClick);
      });

      // Store cleanup function
      gameStateRef.current.cleanup = cleanupFn;

      // Store startGame function reference
      gameStateRef.current.startGameFn = startGame;

      // Use setTimeout to avoid calling setState synchronously in effect
      const timeoutId = setTimeout(() => {
        startGame();
      }, 0);

      return () => {
        clearTimeout(timeoutId);
        cleanupFn();
      };
    }
  }, [gameStarted, handleCardClick, startGame]);

  return (
    <>
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"
        onLoad={() => setGsapLoaded(true)}
      />
      <div
        className="flex flex-col items-center justify-center w-full h-[calc(100vh-4rem)] p-4"
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
      >
        {gsapLoaded && (
          <>
            <div className="flex flex-col items-center space-y-4 mb-4">
              <div className="flex gap-2.5">
                {["easy", "medium", "hard"].map((d) => (
                  <button
                    key={d}
                    onClick={() => selectDifficulty(d)}
                    className={`px-5 py-2.5 text-base font-bold cursor-pointer transition-all rounded-[20px] border-2 ${
                      difficulty === d
                        ? "bg-gradient-to-r from-[#f39c12] to-[#e67e22] border-[#f39c12] text-white"
                        : "bg-white/20 text-white border-white hover:bg-white/30 hover:-translate-y-0.5"
                    }`}
                  >
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  setGameStarted(true);
                }}
                disabled={startButtonDisabled}
                className="mt-7 px-7.5 py-3 text-lg font-bold cursor-pointer bg-gradient-to-r from-[#f39c12] to-[#e67e22] text-white rounded-[25px] shadow-[0_4px_6px_rgba(0,0,0,0.3)] transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_8px_rgba(0,0,0,0.4)] active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Start Game
              </button>

              <p
                className="mt-5 text-xl font-bold min-h-[30px]"
                style={{
                  color: messageColor,
                  textShadow: "2px 2px 4px rgba(0, 0, 0, 0.3)",
                }}
              >
                {message}
              </p>

              <div className="mt-4 text-lg text-white flex gap-12 bg-black/20 px-5 py-2.5 rounded-[15px]">
                <p style={{ textShadow: "1px 1px 2px rgba(0, 0, 0, 0.2)" }}>
                  Score: <span>{score}</span>
                </p>
                <p style={{ textShadow: "1px 1px 2px rgba(0, 0, 0, 0.2)" }}>
                  High Score: <span>{highScore}</span>
                </p>
              </div>
            </div>

            <div
              ref={gameRef}
              className="flex gap-5 mt-5"
              style={{ position: "relative" }}
            >
              {[0, 1, 2].map((index) => (
                <div
                  key={index}
                  className="card-container"
                  style={{ perspective: "1000px" }}
                >
                  <div
                    className="card cursor-pointer"
                    style={{
                      width: "120px",
                      height: "180px",
                      position: "relative",
                      transformStyle: "preserve-3d",
                    }}
                  >
                    <div
                      className="card-inner"
                      style={{
                        width: "100%",
                        height: "100%",
                        position: "relative",
                        transformStyle: "preserve-3d",
                        transition: "transform 0.6s",
                      }}
                    >
                      <div
                        className="card-front"
                        style={{
                          width: "100%",
                          height: "100%",
                          position: "absolute",
                          backfaceVisibility: "hidden",
                          background:
                            "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)",
                          borderRadius: "10px",
                          border: "3px solid #fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "48px",
                          fontWeight: "bold",
                          color: "white",
                          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)",
                        }}
                      >
                        ?
                      </div>
                      <div
                        className="card-back"
                        style={{
                          width: "100%",
                          height: "100%",
                          position: "absolute",
                          backfaceVisibility: "hidden",
                          background:
                            "linear-gradient(135deg, #3498db 0%, #2980b9 100%)",
                          borderRadius: "10px",
                          border: "3px solid #fff",
                          transform: "rotateY(180deg)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "64px",
                          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)",
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <style jsx>{`
        .card:hover {
          transform: scale(1.05);
        }
        .card-back.queen::after {
          content: "👑";
          font-size: 64px;
        }
        .card-back.not-queen::after {
          content: "❌";
          font-size: 48px;
        }
      `}</style>
    </>
  );
};

export default function FindTheQueenPage() {
  return (
    <GameWrapper
      title="Find the Queen"
      gameType={"pursuit-follow" as GameType}
      gameName="find-the-queen"
    >
      <FindTheQueenGameComponent
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
