import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication - this sets the auth context for RLS
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Auth error:", authError);
      return NextResponse.json(
        { error: "Unauthorized", details: authError?.message },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      game_type,
      game_name,
      score,
      accuracy,
      reaction_time,
      duration,
      level,
      metadata,
    } = body;

    // Validate required fields
    if (!game_type || typeof score !== "number") {
      return NextResponse.json(
        {
          error: "Missing required fields: game_type, score",
          received: { game_type, score: typeof score },
        },
        { status: 400 }
      );
    }

    // Prepare insert data - ensure all types match SQL schema
    const insertData: {
      user_id: string;
      game_type: string;
      game_name: string | null;
      score: number;
      accuracy: number | null;
      reaction_time: number | null;
      duration: number | null;
      level: number | null;
      metadata: Record<string, unknown>;
    } = {
      user_id: user.id,
      game_type: String(game_type),
      game_name: game_name ? String(game_name) : null,
      score: Math.max(0, Number(score)),
      accuracy:
        accuracy !== undefined && accuracy !== null
          ? Math.max(0, Math.min(100, Number(accuracy)))
          : null,
      reaction_time:
        reaction_time !== undefined && reaction_time !== null
          ? Math.max(0, Number(reaction_time))
          : null,
      duration:
        duration !== undefined && duration !== null
          ? Math.max(0, Math.floor(Number(duration)))
          : null,
      level:
        level !== undefined && level !== null
          ? Math.max(1, Math.floor(Number(level)))
          : null,
      metadata: metadata && typeof metadata === "object" ? metadata : {},
    };

    // Log for debugging (remove in production)
    console.log("Inserting game session:", {
      user_id: insertData.user_id,
      game_type: insertData.game_type,
      game_name: insertData.game_name,
      score: insertData.score,
    });

    // Insert game session
    // Type assertion needed to ensure proper typing with Supabase
    const { data: session, error } =
      await // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from("game_sessions") as any)
        .insert(insertData)
        .select()
        .single();

    if (error) {
      console.error("Database error:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      console.error("Error details:", error.details);
      console.error("Error hint:", error.hint);
      console.error("Insert data:", JSON.stringify(insertData, null, 2));

      // Check if it's an RLS policy issue
      if (error.code === "42501" || error.message?.includes("policy")) {
        return NextResponse.json(
          {
            error: "Permission denied",
            details:
              "Row Level Security policy violation. Ensure user is authenticated and RLS policies are correctly configured.",
            code: error.code,
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        {
          error: "Failed to save game session",
          details: error.message || "Unknown database error",
          code: error.code || "UNKNOWN",
          hint: error.hint,
        },
        { status: 500 }
      );
    }

    if (!session) {
      console.error("No session data returned despite no error");
      return NextResponse.json(
        { error: "Failed to save game session - no data returned" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: session }, { status: 201 });
  } catch (error) {
    console.error("Save game error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal server error", details: errorMessage },
      { status: 500 }
    );
  }
}
