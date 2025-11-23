import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  isValidTable,
  isValidField,
  TABLE_CONFIG,
} from "@/lib/database/table-config";

/**
 * POST /api/create-row
 *
 * Creates a new row in any table.
 *
 * Body:
 * {
 *   table: string (table name)
 *   data: object (field values)
 * }
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { table, data } = body;

    // Validate inputs
    if (!table || !data || typeof data !== "object") {
      return NextResponse.json(
        {
          error: "Missing required fields",
          required: ["table", "data"],
        },
        { status: 400 }
      );
    }

    // Validate table name
    if (!isValidTable(table)) {
      return NextResponse.json(
        {
          error: "Invalid table name",
          allowed: Array.from(new Set(Object.keys(TABLE_CONFIG))),
        },
        { status: 400 }
      );
    }

    const config = TABLE_CONFIG[table];
    const insertData: Record<string, unknown> = {};

    // Validate required fields
    const missingRequired: string[] = [];
    for (const field of config.required) {
      // Skip id if it's auto-generated
      if (field === "id" && !data[field]) {
        continue;
      }
      // Skip user_id - we'll set it automatically
      if (field === "user_id") {
        insertData.user_id = user.id;
        continue;
      }
      if (
        !(field in data) ||
        data[field] === undefined ||
        data[field] === null
      ) {
        missingRequired.push(field);
      } else {
        insertData[field] = data[field];
      }
    }

    if (missingRequired.length > 0) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          missingRequired,
          required: config.required,
        },
        { status: 400 }
      );
    }

    // Add optional fields if provided
    for (const field of config.optional) {
      if (field in data && data[field] !== undefined) {
        // Skip readonly fields
        if (config.readonly?.includes(field)) {
          continue;
        }
        // Validate field
        if (isValidField(table, field)) {
          insertData[field] = data[field];
        }
      }
    }

    // Apply defaults for fields not provided
    if (config.defaults) {
      for (const [field, defaultValue] of Object.entries(config.defaults)) {
        if (!(field in insertData)) {
          insertData[field] = defaultValue;
        }
      }
    }

    // Ensure user_id is set for all tables that require it
    if (
      config.required.includes("user_id") ||
      config.optional.includes("user_id")
    ) {
      insertData.user_id = user.id;
    }

    // Set date defaults if needed
    if (config.optional.includes("date") && !insertData.date) {
      insertData.date = new Date().toISOString().split("T")[0];
    }

    // Set timestamp defaults
    if (config.optional.includes("created_at") && !insertData.created_at) {
      insertData.created_at = new Date().toISOString();
    }
    if (config.optional.includes("updated_at") && !insertData.updated_at) {
      insertData.updated_at = new Date().toISOString();
    }

    // Perform insert
    // Type assertion needed because table name is dynamic and Supabase types don't support dynamic table names
    const { data: newRow, error: insertError } =
      await // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from(table) as any).insert(insertData).select().single();

    if (insertError) {
      console.error("Create row error:", insertError);
      return NextResponse.json(
        {
          error: "Failed to create row",
          details: insertError.message,
          code: insertError.code,
          hint: insertError.hint,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: newRow,
        message: "Row created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create row error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
