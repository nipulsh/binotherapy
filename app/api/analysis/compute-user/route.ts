import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  DOMAINS,
  getDomainTableName,
  getGameDomain,
} from "@/lib/utils/domain-mapping";
import type { GameSession } from "@/lib/types/game.types";

/**
 * POST /api/analysis/compute-user
 *
 * Computes domain-level performance metrics for a user
 * and saves them to the respective domain performance tables.
 *
 * Body:
 *   - user_id: string (required)
 *   - period_start?: string (ISO date, defaults to 30 days ago)
 *   - period_end?: string (ISO date, defaults to today)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized", details: authError?.message },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { user_id: providedUserId, period_start, period_end } = body;

    // Use current user's ID (from auth) if not provided or if "current" is specified
    const userId =
      providedUserId && providedUserId !== "current" ? providedUserId : user.id;

    // Only allow users to compute their own metrics
    if (userId !== user.id) {
      return NextResponse.json(
        { error: "Forbidden: can only compute own metrics" },
        { status: 403 }
      );
    }

    // Set default period: last 30 days
    const endDate = period_end || new Date().toISOString().split("T")[0];
    const startDate =
      period_start ||
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

    console.log(
      `Computing metrics for user ${userId} from ${startDate} to ${endDate}`
    );

    // Fetch all game sessions for this user in the period
    const { data: sessions, error: sessionsError } = await supabase
      .from("game_sessions")
      .select("*")
      .eq("user_id", userId)
      .gte("played_at", startDate)
      .lte("played_at", endDate + "T23:59:59.999Z");

    if (sessionsError) {
      console.error("Error fetching sessions:", sessionsError);
      return NextResponse.json(
        {
          error: "Failed to fetch game sessions",
          details: sessionsError.message,
        },
        { status: 500 }
      );
    }

    const gameSessions = sessions as GameSession[];
    console.log(`Found ${gameSessions.length} sessions`);

    // Group sessions by domain
    const sessionsByDomain: Record<string, GameSession[]> = {};
    for (const domain of DOMAINS) {
      sessionsByDomain[domain] = [];
    }

    for (const session of gameSessions) {
      const domain = getGameDomain(session.game_type);
      if (sessionsByDomain[domain]) {
        sessionsByDomain[domain].push(session);
      }
    }

    // Compute metrics for each domain and upsert
    const results: Record<string, unknown> = {};

    for (const domain of DOMAINS) {
      const domainSessions = sessionsByDomain[domain];
      const tableName = getDomainTableName(domain);

      // Compute metrics
      const totalSessions = domainSessions.length;
      let averageScore = 0;
      let bestScore = 0;
      let scoreStddev = 0;
      let averageAccuracy: number | null = null;
      let totalPlaytimeSeconds = 0;
      let lastPlayed: string | null = null;

      let medianScore = 0;

      if (totalSessions > 0) {
        // Average score
        const scores = domainSessions.map((s) => s.score);
        averageScore =
          scores.reduce((sum, score) => sum + score, 0) / totalSessions;

        // Median score
        const sortedScores = [...scores].sort((a, b) => a - b);
        const mid = Math.floor(sortedScores.length / 2);
        medianScore =
          sortedScores.length % 2 !== 0
            ? sortedScores[mid]
            : (sortedScores[mid - 1] + sortedScores[mid]) / 2;

        // Best score
        bestScore = Math.max(...scores);

        // Standard deviation
        const variance =
          scores.reduce(
            (sum, score) => sum + Math.pow(score - averageScore, 2),
            0
          ) / totalSessions;
        scoreStddev = Math.sqrt(variance);

        // Average accuracy (ignore nulls)
        const accuracies = domainSessions
          .map((s) => s.accuracy)
          .filter((acc): acc is number => acc !== null && acc !== undefined);

        if (accuracies.length > 0) {
          averageAccuracy =
            accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length;
        }

        // Total playtime
        totalPlaytimeSeconds = domainSessions.reduce(
          (sum, s) => sum + (s.duration || 0),
          0
        );

        // Last played
        const sortedSessions = [...domainSessions].sort(
          (a, b) =>
            new Date(b.played_at).getTime() - new Date(a.played_at).getTime()
        );
        lastPlayed = sortedSessions[0].played_at;
      }

      // Prepare data for upsert
      const performanceData = {
        user_id: userId,
        period_start: startDate,
        period_end: endDate,
        total_sessions: totalSessions,
        average_score: averageScore,
        median_score: medianScore,
        best_score: bestScore,
        score_stddev: scoreStddev,
        average_accuracy: averageAccuracy,
        total_playtime_seconds: totalPlaytimeSeconds,
        last_played: lastPlayed,
        last_updated: new Date().toISOString(),
      };

      // Upsert to domain table
      // Type assertion needed because table name is dynamic and Supabase types don't support dynamic table names
      const { data: upsertData, error: upsertError } =
        await // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase.from(tableName) as any)
          .upsert(performanceData, {
            onConflict: "user_id,period_start,period_end",
          })
          .select()
          .single();

      if (upsertError) {
        console.error(`Error upserting to ${tableName}:`, upsertError);
        // Continue with other domains even if one fails
        results[domain] = {
          error: upsertError.message,
          computed: performanceData,
        };
      } else {
        results[domain] = upsertData;
      }
    }

    return NextResponse.json(
      {
        success: true,
        user_id: userId,
        period_start: startDate,
        period_end: endDate,
        domains: results,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Compute user error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal server error", details: errorMessage },
      { status: 500 }
    );
  }
}
