"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { GameType } from "@/lib/types/game.types";

export interface GameResult {
  score: number;
  accuracy?: number;
  reaction_time?: number | number[];
  duration?: number;
  level?: number;
  metadata?: Record<string, unknown>;
  gameName?: string;
}

export function useGame() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // Calculate average reaction time if array provided
  const calculateAvgReactionTime = useCallback(
    (reactionTime: number | number[] | undefined): number | null => {
      if (!reactionTime) return null;

      if (Array.isArray(reactionTime)) {
        return reactionTime.length > 0
          ? reactionTime.reduce((a, b) => a + b, 0) / reactionTime.length
          : null;
      }

      return reactionTime;
    },
    []
  );

  // Update performance metrics
  const updatePerformanceMetrics = useCallback(
    async (
      userId: string,
      gameType: GameType,
      sessionData: {
        score: number;
        accuracy: number | null;
        duration: number | null;
      }
    ) => {
      try {
        // Get current metrics
        const { data: currentMetrics, error: fetchError } = await supabase
          .from("performance_metrics")
          .select("*")
          .eq("user_id", userId)
          .eq("game_type", gameType)
          .single();

        if (fetchError && fetchError.code !== "PGRST116") {
          // PGRST116 = no rows returned
          console.error("Error fetching metrics:", fetchError);
          return;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const metrics = currentMetrics as any;
        const totalGames = (metrics?.total_games || 0) + 1;
        const totalPlaytime =
          (metrics?.total_playtime || 0) + (sessionData.duration || 0);

        // Calculate new averages
        const currentAvgScore = metrics?.average_score || 0;
        const newAvgScore =
          (currentAvgScore * (totalGames - 1) + sessionData.score) / totalGames;

        const currentAvgAccuracy = metrics?.average_accuracy || null;
        let newAvgAccuracy: number | null = null;
        if (sessionData.accuracy !== null) {
          if (currentAvgAccuracy !== null) {
            newAvgAccuracy =
              (currentAvgAccuracy * (totalGames - 1) + sessionData.accuracy) /
              totalGames;
          } else {
            newAvgAccuracy = sessionData.accuracy;
          }
        } else if (currentAvgAccuracy !== null) {
          newAvgAccuracy = currentAvgAccuracy;
        }

        const bestScore = Math.max(metrics?.best_score || 0, sessionData.score);

        // Upsert performance metrics
        const { error: upsertError } = await supabase
          .from("performance_metrics")
          .upsert(
            {
              user_id: userId,
              game_type: gameType,
              total_games: totalGames,
              average_score: newAvgScore,
              average_accuracy: newAvgAccuracy,
              best_score: bestScore,
              total_playtime: totalPlaytime,
              updated_at: new Date().toISOString(),
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any,
            {
              onConflict: "user_id,game_type",
            }
          );

        if (upsertError) {
          console.error("Error updating performance metrics:", upsertError);
        }
      } catch (err) {
        console.error("Error in updatePerformanceMetrics:", err);
      }
    },
    [supabase]
  );

  // Save game session directly to Supabase
  const saveGameSession = useCallback(
    async (
      gameType: GameType,
      gameName: string,
      result: GameResult
    ): Promise<{ success: boolean; sessionId?: string; error?: string }> => {
      setSaving(true);
      setError(null);

      // Safety timeout: ensure saving state is reset after 15 seconds max
      const safetyTimeout = setTimeout(() => {
        console.warn(
          "Save operation exceeded 15 seconds, resetting saving state"
        );
        setSaving(false);
      }, 15000);

      try {
        // Get current user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          throw new Error("User not authenticated");
        }

        const avgReactionTime = calculateAvgReactionTime(result.reaction_time);

        // Prepare session data
        const sessionData = {
          user_id: user.id,
          game_type: gameType,
          game_name: gameName || null,
          score: Math.max(0, Math.floor(result.score)),
          accuracy:
            result.accuracy !== undefined && result.accuracy !== null
              ? Math.max(0, Math.min(100, Number(result.accuracy)))
              : null,
          reaction_time:
            avgReactionTime !== null
              ? Math.max(0, Number(avgReactionTime))
              : null,
          duration:
            result.duration !== undefined && result.duration !== null
              ? Math.max(0, Math.floor(Number(result.duration)))
              : null,
          level:
            result.level !== undefined && result.level !== null
              ? Math.max(1, Math.floor(Number(result.level)))
              : null,
          metadata: {
            gameName: gameName,
            ...(result.metadata || {}),
          },
        };

        // Insert game session
        const { data: session, error: insertError } = await supabase
          .from("game_sessions")
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .insert(sessionData as any)
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }

        if (!session) {
          throw new Error("Failed to save game session - no data returned");
        }

        // Update performance metrics (trigger should handle this, but we can also do it explicitly)
        // Don't let metrics update failure block the save success
        try {
          await Promise.race([
            updatePerformanceMetrics(user.id, gameType, sessionData),
            new Promise((_, reject) =>
              setTimeout(
                () => reject(new Error("Metrics update timeout")),
                5000
              )
            ),
          ]);
        } catch (metricsError) {
          // Log but don't fail the save - metrics update is non-critical
          console.warn(
            "Performance metrics update failed (non-critical):",
            metricsError
          );
        }

        clearTimeout(safetyTimeout);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return { success: true, sessionId: (session as any).id };
      } catch (err) {
        clearTimeout(safetyTimeout);
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        console.error("Error saving game session:", err);
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        // Ensure saving is always reset, even if something unexpected happens
        // This is the single source of truth for resetting the saving state
        clearTimeout(safetyTimeout);
        setSaving(false);
      }
    },
    [supabase, calculateAvgReactionTime, updatePerformanceMetrics]
  );

  // Legacy method for backward compatibility (uses API route)
  const saveGameResult = useCallback(
    async (
      gameType: GameType,
      gameName: string,
      result: GameResult
    ): Promise<boolean> => {
      const response = await saveGameSession(gameType, gameName, result);
      return response.success;
    },
    [saveGameSession]
  );

  // Get game sessions for a user
  const getGameSessions = useCallback(
    async (gameType?: GameType, limit: number = 50) => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          throw new Error("User not authenticated");
        }

        let query = supabase
          .from("game_sessions")
          .select("*")
          .eq("user_id", user.id)
          .order("played_at", { ascending: false })
          .limit(limit);

        if (gameType) {
          query = query.eq("game_type", gameType);
        }

        const { data: sessions, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        return { sessions: sessions || [], error: null };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch game sessions";
        return { sessions: [], error: errorMessage };
      }
    },
    [supabase]
  );

  return {
    saveGameResult,
    saveGameSession,
    getGameSessions,
    saving,
    error,
  };
}
