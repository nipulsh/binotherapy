import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  isValidTable,
  isValidField,
  isReadonlyField,
  TABLE_CONFIG,
} from "@/lib/database/table-config";

/**
 * POST /api/update-table
 *
 * Updates multiple fields in a table row.
 *
 * Body:
 * {
 *   table: string (table name)
 *   id: string (row ID)
 *   data: object (key/value pairs to update)
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
    const { table, id, data } = body;

    // Validate inputs
    if (!table || !id || !data || typeof data !== "object") {
      return NextResponse.json(
        {
          error: "Missing required fields",
          required: ["table", "id", "data"],
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

    // Validate all fields and filter out readonly fields
    const updateData: Record<string, unknown> = {};
    const invalidFields: string[] = [];
    const readonlyFields: string[] = [];

    for (const [fieldName, value] of Object.entries(data)) {
      if (!isValidField(table, fieldName)) {
        invalidFields.push(fieldName);
        continue;
      }

      if (isReadonlyField(table, fieldName)) {
        readonlyFields.push(fieldName);
        continue;
      }

      // Prevent user_id changes to different user
      if (fieldName === "user_id" && value !== user.id) {
        return NextResponse.json(
          { error: "Cannot change user_id to a different user" },
          { status: 403 }
        );
      }

      updateData[fieldName] = value;
    }

    if (invalidFields.length > 0) {
      return NextResponse.json(
        {
          error: "Invalid fields",
          invalidFields,
          allowedFields: [
            ...TABLE_CONFIG[table].required,
            ...TABLE_CONFIG[table].optional,
          ],
        },
        { status: 400 }
      );
    }

    if (readonlyFields.length > 0) {
      return NextResponse.json(
        {
          error: "Cannot update readonly fields",
          readonlyFields,
        },
        { status: 400 }
      );
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // Add updated_at if table has it
    if (
      TABLE_CONFIG[table].optional.includes("updated_at") ||
      TABLE_CONFIG[table].required.includes("updated_at")
    ) {
      updateData.updated_at = new Date().toISOString();
    }

    // First, verify the row exists and user owns it
    // Type assertion needed because table name is dynamic and Supabase types don't support dynamic table names
    const { data: existingRow, error: fetchError } =
      await // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from(table) as any).select("id, user_id").eq("id", id).single();

    if (fetchError || !existingRow) {
      return NextResponse.json(
        {
          error: "Row not found",
          details: fetchError?.message,
        },
        { status: 404 }
      );
    }

    // Verify ownership (if table has user_id)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row = existingRow as any;
    if ("user_id" in row && row.user_id !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized: Cannot update other user's data" },
        { status: 403 }
      );
    }

    // Perform update
    const { data: updatedRow, error: updateError } =
      await // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from(table) as any)
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

    if (updateError) {
      console.error("Update table error:", updateError);
      return NextResponse.json(
        {
          error: "Failed to update row",
          details: updateError.message,
          code: updateError.code,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedRow,
      message: "Row updated successfully",
      updatedFields: Object.keys(updateData),
    });
  } catch (error) {
    console.error("Update table error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
