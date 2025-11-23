"use client";

import dynamic from "next/dynamic";
import { useState, useCallback } from "react";
import { GameWrapper } from "@/components/game/game-wrapper";
import { GameType } from "@/lib/types/game.types";
import { ScoreDisplay } from "@/components/game/shadow-pursuit/ScoreDisplay";
import { Leaderboard } from "@/components/game/shadow-pursuit/Leaderboard";
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

const ShadowPursuitGameContainer = dynamic(
  () =>
    import("@/components/game/shadow-pursuit/GameContainer").then(
      (mod) => mod.ShadowPursuitGameContainer
    ),
  { ssr: false }
);

const ShadowPursuitGameComponent = ({
  onGameEnd,
}: {
  onGameEnd: (result: GameResult) => void;
}) => {
  const [gameStats, setGameStats] = useState({
    survivalTime: 0,
    chaserSpeed: 120,
    distance: 500,
    level: 1,
  });

  const handleUIUpdate = useCallback(
    (data: {
      survivalTime: number;
      chaserSpeed: number;
      distance: number;
      stars: number;
    }) => {
      // Map stars to level (stars typically represent level progression)
      setGameStats({
        survivalTime: data.survivalTime,
        chaserSpeed: data.chaserSpeed,
        distance: data.distance,
        level: data.stars || 1,
      });
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
    <div className="container py-8 max-w-7xl mx-auto px-4">
      <div className="mb-8">
        <h1
          className="text-4xl md:text-5xl font-bold mb-3 tracking-tight"
          style={{ color: "var(--galaxy-primary)" }}
        >
          Shadow Pursuit
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Run from the shadow. Hide behind obstacles. Survive as long as you
          can.
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
            survivalTime={gameStats.survivalTime}
            chaserSpeed={gameStats.chaserSpeed}
            distance={gameStats.distance}
            level={gameStats.level}
          />

          <Card
            className="overflow-hidden border-2"
            style={{
              borderColor: "var(--galaxy-primary)",
              boxShadow: "0 8px 32px rgba(107, 76, 255, 0.2)",
              backdropFilter: "blur(10px)",
              backgroundColor: "rgba(26, 26, 46, 0.8)",
            }}
          >
            <CardContent className="p-0">
              <ShadowPursuitGameContainer
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
          <Card
            className="border-2"
            style={{
              borderColor: "var(--galaxy-secondary)",
              boxShadow: "0 4px 20px rgba(157, 92, 255, 0.15)",
              backgroundColor: "rgba(26, 26, 46, 0.6)",
              backdropFilter: "blur(10px)",
            }}
          >
            <CardHeader>
              <CardTitle
                className="flex items-center gap-2"
                style={{ color: "var(--galaxy-accent)" }}
              >
                <Info className="h-5 w-5" />
                How to Play Shadow Pursuit
              </CardTitle>
              <CardDescription>
                Learn how to survive the shadow&apos;s pursuit
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Objective</h3>
                <p className="text-sm text-muted-foreground">
                  You are the Runner. A dark shadow awakens and will follow you
                  everywhere. Hide behind obstacles and survive as long as
                  possible. Each level increases the police speed!
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Controls</h3>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>
                    <strong>WASD Keys:</strong> Move up, left, down, right
                  </li>
                  <li>
                    <strong>Arrow Keys:</strong> Alternative movement controls
                  </li>
                  <li>
                    <strong>Mobile:</strong> Use the on-screen joystick
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Game Mechanics</h3>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>
                    <strong>Level System:</strong> Every 10 seconds, you level
                    up and police gets faster
                  </li>
                  <li>
                    <strong>Obstacles:</strong> Use colorful obstacles to hide
                    and block the police
                  </li>
                  <li>
                    <strong>Survival Time:</strong> Your score is how long you
                    survive (in seconds)
                  </li>
                  <li>
                    <strong>Danger Zone:</strong> Screen shakes when police is
                    close
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Strategies</h3>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Hide behind obstacles to break line of sight</li>
                  <li>Keep moving - never stay in one place</li>
                  <li>
                    Use obstacles to create distance between you and police
                  </li>
                  <li>
                    Watch the level indicator - police gets faster each level
                  </li>
                  <li>Plan your escape routes between obstacles</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Game Over</h3>
                <p className="text-sm text-muted-foreground">
                  When the shadow catches you, your survival time and level
                  reached are recorded. Try to beat your best time and reach
                  higher levels!
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default function ShadowPursuitPage() {
  return (
    <GameWrapper
      title="Shadow Pursuit"
      gameType={"pursuit-follow" as GameType}
      gameName="shadow-pursuit"
    >
      <ShadowPursuitGameComponent onGameEnd={() => {}} />
    </GameWrapper>
  );
}
