import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DOMAINS, getDomainTableName } from "@/lib/utils/domain-mapping";

export async function GET() {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch data for all sectors
    // Always return arrays, never errors - return empty arrays if no data

    // 1. Productivity
    const { data: productivityData, error: productivityError } = await supabase
      .from("productivity_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(30);

    // 2. Fitness
    const { data: fitnessData, error: fitnessError } = await supabase
      .from("fitness_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(30);

    // 3. Study/Learning
    const { data: studyData, error: studyError } = await supabase
      .from("study_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(30);

    // 4. Game Performance (existing)
    const { data: gameSessions, error: gameError } = await supabase
      .from("game_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("played_at", { ascending: false })
      .limit(30);

    // 5. Wellbeing
    const { data: wellbeingData, error: wellbeingError } = await supabase
      .from("wellbeing_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(30);

    // 6. Screen Time
    const { data: screentimeData, error: screentimeError } = await supabase
      .from("screentime_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(30);

    // 7. Custom Metrics
    const { data: customData, error: customError } = await supabase
      .from("custom_metrics")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(100);

    // Log errors but don't fail - return empty arrays
    if (productivityError) {
      console.error("Productivity error:", productivityError);
    }
    if (fitnessError) {
      console.error("Fitness error:", fitnessError);
    }
    if (studyError) {
      console.error("Study error:", studyError);
    }
    if (gameError) {
      console.error("Game error:", gameError);
    }
    if (wellbeingError) {
      console.error("Wellbeing error:", wellbeingError);
    }
    if (screentimeError) {
      console.error("Screentime error:", screentimeError);
    }
    if (customError) {
      console.error("Custom metrics error:", customError);
    }

    // 8. Fetch domain performance metrics
    // Set default period: last 30 days
    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const domainPerformance: Record<string, unknown> = {};

    for (const domain of DOMAINS) {
      const tableName = getDomainTableName(domain);
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select("*")
          .eq("user_id", user.id)
          .eq("period_start", startDate)
          .eq("period_end", endDate)
          .maybeSingle();

        if (error) {
          console.error(`Error fetching ${tableName}:`, error);
          domainPerformance[domain] = null;
        } else {
          domainPerformance[domain] = data;
        }
      } catch (err) {
        console.error(`Exception fetching ${tableName}:`, err);
        domainPerformance[domain] = null;
      }
    }

    // Always return structured data with arrays (empty if no data)
    return NextResponse.json({
      success: true,
      productivity: productivityData || [],
      fitness: fitnessData || [],
      study: studyData || [],
      game: gameSessions || [],
      wellbeing: wellbeingData || [],
      screentime: screentimeData || [],
      custom: customData || [],
      domains: domainPerformance,
      period_start: startDate,
      period_end: endDate,
    });
  } catch (error) {
    console.error("Progress API error:", error);
    // Return empty arrays on error
    return NextResponse.json({
      success: true,
      productivity: [],
      fitness: [],
      study: [],
      game: [],
      wellbeing: [],
      screentime: [],
      custom: [],
      domains: {
        "depth-perception": null,
        "eye-hand-coordination": null,
        "pursuit-follow": null,
        "saccadic-movement": null,
      },
    });
  }
}
