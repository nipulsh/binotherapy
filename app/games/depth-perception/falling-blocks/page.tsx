"use client";

import dynamic from "next/dynamic";
import { useState, useCallback } from "react";
import { GameWrapper } from "@/components/game/game-wrapper";
import { GameType } from "@/lib/types/game.types";
import { ScoreDisplay } from "@/components/game/falling-blocks/ScoreDisplay";
import { Leaderboard } from "@/components/game/falling-blocks/Leaderboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Info } from "lucide-react";
import type { GameResult } from "@/lib/types/game.types";

const FallingBlocksGameContainer = dynamic(
  () =>
    import("@/components/game/falling-blocks/GameContainer").then(
      (mod) => mod.FallingBlocksGameContainer
    ),
  { ssr: false }
);

const FallingBlocksGameComponent = ({
  onGameEnd,
}: {
  onGameEnd: (result: GameResult) => void;
}) => {
  const [gameStats, setGameStats] = useState({
    score: 0,
    remainingTime: 30,
  });

  const handleUIUpdate = useCallback(
    (data: { score: number; remainingTime: number }) => {
      setGameStats(data);
    },
    []
  );

  const handleGameEnd = useCallback(
    (result: GameResult) => {
      // GameWrapper will handle showing the modal and saving
      onGameEnd(result);
    },
    [onGameEnd]
  );

  return (
    <div className="container py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">🍎 Apple Catcher</h1>
        <p className="text-muted-foreground">
          Catch as many apples as you can in 30 seconds! Use arrow keys to move
          the basket (desktop) or drag to move (mobile/tablet).
        </p>
      </div>

      <Tabs defaultValue="game" className="space-y-6">
        <TabsList>
          <TabsTrigger value="game">Game</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="instructions">How to Play</TabsTrigger>
        </TabsList>

        <TabsContent value="game" className="space-y-6">
          <ScoreDisplay
            score={gameStats.score}
            remainingTime={gameStats.remainingTime}
          />

          <Card>
            <CardContent className="p-0">
              <FallingBlocksGameContainer
                onGameEnd={handleGameEnd}
                onUIUpdate={handleUIUpdate}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboard">
          <Leaderboard />
        </TabsContent>

        <TabsContent value="instructions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                How to Play
              </CardTitle>
              <CardDescription>Learn how to play Apple Catcher</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Objective</h3>
                <p className="text-sm text-muted-foreground">
                  Catch as many apples as you can in 30 seconds! Move your
                  basket left and right using arrow keys (desktop) or by
                  dragging (mobile/tablet) to catch falling apples.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">How to Play</h3>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>
                    <strong>Desktop:</strong> Use Left/Right Arrow Keys to move
                    the basket
                  </li>
                  <li>
                    <strong>Mobile/Tablet:</strong> Drag your finger on the
                    screen to move the basket
                  </li>
                  <li>
                    <strong>Goal:</strong> Catch at least 10 apples to win!
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Winning</h3>
                <p className="text-sm text-muted-foreground">
                  You win if you catch 10 or more apples within 30 seconds. If
                  you catch less than 10 apples, you lose. Good luck!
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Tips</h3>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Keep moving! Don&apos;t stay in one place</li>
                  <li>Watch the timer - you only have 30 seconds</li>
                  <li>Try to catch apples as they fall</li>
                  <li>Submit your score to compete on the leaderboard!</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default function FallingBlocksPage() {
  return (
    <GameWrapper
      title="Apple Catcher"
      gameType={"depth-perception" as GameType}
      gameName="falling-blocks"
    >
      <FallingBlocksGameComponent
        onGameEnd={(result) => {
          if (typeof window !== "undefined") {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const handler = (window as any).handleGameEnd;
            if (handler) {
              handler(result);
            }
          }
        }}
      />
    </GameWrapper>
  );
}
