"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trophy, Medal, Award, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface LeaderboardEntry {
  id: string;
  playerName: string;
  score: number;
  survivalTime: number;
  played_at: string;
}

export function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const loadLeaderboard = useCallback(async () => {
    try {
      setLoading(true);

      const { data, error } = await (
        supabase
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .from("game_sessions") as any
      )
        .select("*")
        .eq("game_name", "shadow-pursuit")
        .order("score", { ascending: false })
        .limit(10);

      if (error) throw error;

      const formattedEntries: LeaderboardEntry[] =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (data as any[])?.map((entry: any) => {
          const survivalTime =
            entry.score ||
            (entry.metadata as { survivalTime?: number } | null)
              ?.survivalTime ||
            0;
          return {
            id: entry.id,
            playerName:
              (entry.metadata as { playerName?: string } | null)?.playerName ||
              "Anonymous",
            score: entry.score,
            survivalTime,
            played_at: entry.played_at,
          };
        }) || [];

      setEntries(formattedEntries);
    } catch (error) {
      console.error("Error loading leaderboard:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadLeaderboard();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("game_sessions_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "game_sessions",
          filter: "game_name=eq.shadow-pursuit",
        },
        () => {
          loadLeaderboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadLeaderboard, supabase]);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Award className="h-5 w-5 text-amber-600" />;
    return <span className="text-muted-foreground font-bold">{rank}</span>;
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    return `${minutes}:${secs.padStart(4, "0")}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading...
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No scores yet. Be the first to survive!
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {entries.map((entry, index) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 flex items-center justify-center">
                      {getRankIcon(index + 1)}
                    </div>
                    <div>
                      <div className="font-semibold">{entry.playerName}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(entry.played_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="font-mono flex items-center gap-1"
                    >
                      <Clock className="h-3 w-3" />
                      {formatTime(entry.survivalTime)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
