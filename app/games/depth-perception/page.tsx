import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GameCard } from "@/components/game/game-card";
import Link from "next/link";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const games = [
  {
    title: "Falling Blocks",
    description:
      "Judge how far blocks fall before they land and stack them high",
    icon: "📦",
    href: "/games/depth-perception/falling-blocks",
    gameName: "falling-blocks",
    difficulty: "medium" as const,
  },

  {
    title: "Depth Matching",
    description: "Match objects based on depth perception in 3D space",
    icon: "🎲",
    href: "/games/depth-perception/depth-matching",
    gameName: "depth-matching",
    difficulty: "hard" as const,
  },
];

export default async function DepthPerceptionPage() {
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
    .eq("user_id", user.id)
    .eq("game_type", "depth-perception");

  const metricsMap = new Map();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (metrics as any)?.forEach((metric: any) => {
    metricsMap.set(metric.game_type, metric);
  });

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
          <Link
            href="/dashboard"
            className="text-gray-400 hover:text-[var(--galaxy-accent)] mb-4 inline-block transition-colors duration-300"
            style={{
              color: "var(--galaxy-accent)",
            }}
          >
            ← Back to Dashboard
          </Link>
          <h1
            className="text-3xl font-bold mb-2"
            style={{ color: "var(--galaxy-primary)" }}
          >
            📦 Depth Perception Games
          </h1>
          <p className="text-gray-400">
            Train your visual depth and precision.
          </p>
        </div>

        {/* Rules Section */}
        <Card
          className="mb-8 bg-white/5 backdrop-blur-md border-white/10"
          style={{
            boxShadow: "0 0 20px rgba(0, 212, 255, 0.1)",
          }}
        >
          <CardHeader>
            <CardTitle className="text-gray-200">Game Rules</CardTitle>
            <CardDescription className="text-gray-400">
              Click the object that appears closer first. Each level increases
              difficulty with faster movements and more complex depth cues.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Games Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
          {games.map((game) => {
            const metric = metricsMap.get("depth-perception");
            return (
              <GameCard
                key={game.gameName}
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
