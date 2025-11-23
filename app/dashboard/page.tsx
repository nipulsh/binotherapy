import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GameCard } from "@/components/game/game-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PerformanceMetrics } from "@/lib/types/game.types";

const games = [
  {
    title: "Depth Perception",
    description:
      "Test your ability to judge distances and spatial relationships",
    icon: "📦",
    href: "/games/depth-perception",
    gameType: "depth-perception" as const,
    difficulty: "medium" as const,
  },
  {
    title: "Eye-Hand Coordination",
    description:
      "Improve your hand-eye coordination through precision targeting",
    icon: "🎮",
    href: "/games/eye-hand-coordination",
    gameType: "eye-hand-coordination" as const,
    difficulty: "easy" as const,
  },
  {
    title: "Pursuit & Follow",
    description: "Enhance your ability to track moving objects smoothly",
    icon: "🎯",
    href: "/games/pursuit-follow",
    gameType: "pursuit-follow" as const,
    difficulty: "hard" as const,
  },
  {
    title: "Saccadic Movement",
    description: "Train rapid eye movements between fixed points",
    icon: "⚡",
    href: "/games/saccadic-movement",
    gameType: "saccadic-movement" as const,
    difficulty: "medium" as const,
  },
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch performance metrics

  const { data: metrics } = await (
    supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from("performance_metrics") as any
  )
    .select("*")
    .eq("user_id", user.id);

  // Create metrics map for easy lookup
  const metricsMap = new Map<string, PerformanceMetrics>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (metrics as any)?.forEach((metric: PerformanceMetrics) => {
    metricsMap.set(metric.game_type, metric);
  });

  // Calculate overall stats
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const metricsArray = (metrics as PerformanceMetrics[]) || [];
  const totalGames =
    metricsArray.reduce((sum, m) => sum + m.total_games, 0) || 0;
  const avgAccuracy =
    metricsArray.length > 0
      ? Math.round(
          metricsArray.reduce((sum, m) => sum + (m.average_accuracy || 0), 0) /
            metricsArray.length
        )
      : 0;
  const totalPlaytime =
    metricsArray.reduce((sum, m) => sum + m.total_playtime, 0) || 0;
  const bestScore = Math.max(...(metricsArray.map((m) => m.best_score) || [0]));

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: "#0a0a1a" }}>
      {/* Subtle gradient overlay */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(107, 76, 255, 0.1) 0%, rgba(10, 10, 26, 0.8) 70%, rgba(0, 0, 0, 0.95) 100%)",
        }}
      />

      <div className="container py-8 relative z-10">
        <div className="mb-8">
          <h1
            className="text-3xl font-bold mb-2"
            style={{ color: "var(--galaxy-primary)" }}
          >
            Welcome, {user.user_metadata?.full_name || user.email}
          </h1>
          <p className="mt-2 text-gray-400">
            Select a game to start training your visual skills
          </p>
        </div>

        {/* Stats Cards */}
        {totalGames > 0 && (
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card
              className="bg-white/5 backdrop-blur-md border-white/10 hover:border-[var(--galaxy-accent)]/50 transition-all duration-300 hover:bg-white/10 hover:shadow-2xl"
              style={{
                boxShadow: "0 0 20px rgba(0, 212, 255, 0.1)",
              }}
            >
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-300">
                  Total Games
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="text-2xl font-bold"
                  style={{ color: "var(--galaxy-accent)" }}
                >
                  {totalGames}
                </div>
              </CardContent>
            </Card>
            <Card
              className="bg-white/5 backdrop-blur-md border-white/10 hover:border-[var(--galaxy-secondary)]/50 transition-all duration-300 hover:bg-white/10 hover:shadow-2xl"
              style={{
                boxShadow: "0 0 20px rgba(157, 92, 255, 0.1)",
              }}
            >
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-300">
                  Avg Accuracy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="text-2xl font-bold"
                  style={{ color: "var(--galaxy-secondary)" }}
                >
                  {avgAccuracy}%
                </div>
              </CardContent>
            </Card>
            <Card
              className="bg-white/5 backdrop-blur-md border-white/10 hover:border-[var(--galaxy-highlight)]/50 transition-all duration-300 hover:bg-white/10 hover:shadow-2xl"
              style={{
                boxShadow: "0 0 20px rgba(255, 184, 77, 0.1)",
              }}
            >
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-300">
                  Total Playtime
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="text-2xl font-bold"
                  style={{ color: "var(--galaxy-highlight)" }}
                >
                  {Math.floor(totalPlaytime / 60)}m
                </div>
              </CardContent>
            </Card>
            <Card
              className="bg-white/5 backdrop-blur-md border-white/10 hover:border-[var(--galaxy-primary)]/50 transition-all duration-300 hover:bg-white/10 hover:shadow-2xl"
              style={{
                boxShadow: "0 0 20px rgba(107, 76, 255, 0.1)",
              }}
            >
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-300">
                  Best Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="text-2xl font-bold"
                  style={{ color: "var(--galaxy-primary)" }}
                >
                  {bestScore.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Games Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {games.map((game) => {
            const metric = metricsMap.get(game.gameType);
            return (
              <GameCard
                key={game.gameType}
                title={game.title}
                description={game.description}
                icon={game.icon}
                href={game.href}
                difficulty={game.difficulty}
                bestScore={metric?.best_score}
                totalPlays={metric?.total_games}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
