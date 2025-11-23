import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/create-table
 *
 * Creates a new table if it doesn't exist.
 * This is a fallback for missing tables - normally tables should be created via SQL.
 *
 * Body:
 * {
 *   tableName: string
 *   schema: object (field definitions)
 * }
 *
 * NOTE: This route should be used sparingly. Prefer running SQL migrations.
 */
export async function POST() {
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

    // This route requires service role key for table creation
    // For security, we'll return instructions instead of creating tables directly
    return NextResponse.json(
      {
        error: "Table creation via API is disabled for security",
        message:
          "Please create tables using SQL migrations in Supabase SQL Editor",
        instructions: [
          "1. Go to Supabase Dashboard → SQL Editor",
          "2. Run the SQL schema from database/schema-complete.sql",
          "3. Or use database/schema-extended.sql for additional tables",
        ],
      },
      { status: 403 }
    );
  } catch (error) {
    console.error("Create table error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
