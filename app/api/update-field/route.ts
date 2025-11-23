import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  isValidTable,
  isValidField,
  isReadonlyField,
  TABLE_CONFIG,
} from "@/lib/database/table-config";

/**
 * PUT /api/update-field
 *
 * Updates a single field in a single row.
 *
 * Body:
 * {
 *   table: string (table name)
 *   id: string (row ID)
 *   fieldName: string (field to update)
 *   value: any (new value)
 * }
 */
export async function PUT(request: NextRequest) {
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
    const { table, id, fieldName, value } = body;

    // Validate inputs
    if (!table || !id || !fieldName) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          required: ["table", "id", "fieldName"],
        },
        { status: 400 }
      );
    }

    // Validate table name (prevent SQL injection)
    if (!isValidTable(table)) {
      return NextResponse.json(
        {
          error: "Invalid table name",
          allowed: Array.from(new Set(Object.keys(TABLE_CONFIG))),
        },
        { status: 400 }
      );
    }

    // Validate field name (prevent SQL injection)
    if (!isValidField(table, fieldName)) {
      return NextResponse.json(
        {
          error: "Invalid field name",
          table,
          allowedFields: [
            ...TABLE_CONFIG[table].required,
            ...TABLE_CONFIG[table].optional,
          ],
        },
        { status: 400 }
      );
    }

    // Check if field is readonly
    if (isReadonlyField(table, fieldName)) {
      return NextResponse.json(
        {
          error: "Field is readonly and cannot be updated",
          field: fieldName,
        },
        { status: 400 }
      );
    }

    // For user_id fields, ensure user can only update their own data
    if (fieldName === "user_id" && value !== user.id) {
      return NextResponse.json(
        { error: "Cannot change user_id to a different user" },
        { status: 403 }
      );
    }

    // Build update object
    const updateData: Record<string, unknown> = { [fieldName]: value };

    // Add updated_at if table has it
    if (
      TABLE_CONFIG[table].optional.includes("updated_at") ||
      TABLE_CONFIG[table].required.includes("updated_at")
    ) {
      updateData.updated_at = new Date().toISOString();
    }

    // Perform update
    // Type assertion needed because table name is dynamic and Supabase types don't support dynamic table names
    const { data, error } =
      await // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from(table) as any)
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

    if (error) {
      console.error("Update field error:", error);
      return NextResponse.json(
        {
          error: "Failed to update field",
          details: error.message,
          code: error.code,
        },
        { status: 500 }
      );
    }

    // Verify user owns this row (for tables with user_id)
    if (data && "user_id" in data && data.user_id !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized: Cannot update other user's data" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: `Field ${fieldName} updated successfully`,
    });
  } catch (error) {
    console.error("Update field error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
