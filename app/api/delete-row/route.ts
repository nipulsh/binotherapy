import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isValidTable, TABLE_CONFIG } from "@/lib/database/table-config";

/**
 * DELETE /api/delete-row
 *
 * Deletes a row by ID.
 *
 * Body:
 * {
 *   table: string (table name)
 *   id: string (row ID)
 * }
 */
export async function DELETE(request: NextRequest) {
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
    const { table, id } = body;

    // Validate inputs
    if (!table || !id) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          required: ["table", "id"],
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

    // First, verify the row exists and user owns it

    const { data: existingRow, error: fetchError } = await (
      supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(table) as any
    )
      .select("id, user_id")
      .eq("id", id)
      .single();

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
        { error: "Unauthorized: Cannot delete other user's data" },
        { status: 403 }
      );
    }

    // Perform delete
    // Type assertion needed because table name is dynamic and Supabase types don't support dynamic table names
    const { error: deleteError } = await (
      supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(table) as any
    )
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Delete row error:", deleteError);
      return NextResponse.json(
        {
          error: "Failed to delete row",
          details: deleteError.message,
          code: deleteError.code,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Row deleted successfully",
      deletedId: id,
    });
  } catch (error) {
    console.error("Delete row error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
