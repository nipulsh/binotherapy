# Backend CRUD API Documentation

## Overview

The backend now includes comprehensive CRUD (Create, Read, Update, Delete) routes for all database tables. All routes include:
- Input validation
- SQL injection prevention
- Authentication checks
- Row-level security enforcement
- Meaningful error messages

## Database Schema

The complete database schema is defined in `database/schema-final.sql`. This includes:

### Base Tables
- `profiles` - User profile information
- `game_sessions` - Individual game play sessions
- `performance_metrics` - Aggregated performance statistics

### Extended Tables (Analysis Sectors)
- `productivity_logs` - Daily productivity tracking
- `fitness_logs` - Fitness and training activities
- `study_logs` - Learning and study sessions
- `wellbeing_logs` - Mental wellbeing tracking
- `screentime_logs` - Screen time and digital habits
- `custom_metrics` - User-defined custom metrics

## API Routes

### 1. PUT /api/update-field

Updates a single field in a single row.

**Request:**
```json
{
  "table": "productivity_logs",
  "id": "uuid-here",
  "fieldName": "productivity_score",
  "value": 85
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": { /* updated row */ },
  "message": "Field productivity_score updated successfully"
}
```

**Response (Error):**
```json
{
  "error": "Invalid field name",
  "table": "productivity_logs",
  "allowedFields": ["id", "user_id", "date", ...]
}
```

**Validation:**
- Table name must be in allowed list
- Field name must be valid for the table
- Field cannot be readonly (id, created_at, etc.)
- User can only update their own data

---

### 2. POST /api/update-table

Updates multiple fields in a table row.

**Request:**
```json
{
  "table": "fitness_logs",
  "id": "uuid-here",
  "data": {
    "duration_minutes": 60,
    "calories_burned": 500,
    "workout_type": "cardio"
  }
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": { /* updated row */ },
  "message": "Row updated successfully",
  "updatedFields": ["duration_minutes", "calories_burned", "workout_type"]
}
```

**Response (Error):**
```json
{
  "error": "Cannot update readonly fields",
  "readonlyFields": ["id", "created_at"]
}
```

**Validation:**
- All fields must be valid for the table
- Readonly fields are automatically filtered out
- User ownership is verified before update

---

### 3. POST /api/create-row

Creates a new row in any table.

**Request:**
```json
{
  "table": "wellbeing_logs",
  "data": {
    "date": "2024-01-15",
    "mood_score": 8,
    "stress_level": 3,
    "sleep_hours": 7.5,
    "energy_level": 7
  }
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": { /* created row with id */ },
  "message": "Row created successfully"
}
```

**Response (Error):**
```json
{
  "error": "Missing required fields",
  "missingRequired": ["date"],
  "required": ["user_id", "date"]
}
```

**Notes:**
- `user_id` is automatically set to the authenticated user
- Default values are applied for optional fields
- `created_at` and `updated_at` are set automatically
- `date` defaults to today if not provided

---

### 4. DELETE /api/delete-row

Deletes a row by ID.

**Request:**
```json
{
  "table": "study_logs",
  "id": "uuid-here"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Row deleted successfully",
  "deletedId": "uuid-here"
}
```

**Response (Error):**
```json
{
  "error": "Row not found"
}
```

**Validation:**
- Row must exist
- User must own the row (if table has user_id)
- Returns 404 if row doesn't exist
- Returns 403 if user doesn't own the row

---

### 5. POST /api/create-table

**Note:** This route is disabled for security. Tables should be created via SQL migrations.

**Response:**
```json
{
  "error": "Table creation via API is disabled for security",
  "message": "Please create tables using SQL migrations in Supabase SQL Editor",
  "instructions": [
    "1. Go to Supabase Dashboard → SQL Editor",
    "2. Run the SQL schema from database/schema-final.sql",
    "3. Or use database/schema-extended.sql for additional tables"
  ]
}
```

## Security Features

### 1. SQL Injection Prevention
- All table names are validated against an allowlist
- All field names are validated against table configuration
- Parameterized queries via Supabase client (no raw SQL)

### 2. Authentication
- All routes require authentication
- Returns 401 if user is not authenticated

### 3. Row-Level Security
- Users can only access their own data
- `user_id` is automatically set on create
- Ownership is verified before update/delete

### 4. Field Validation
- Readonly fields (id, created_at) cannot be updated
- Required fields must be provided on create
- Invalid fields are rejected with clear error messages

## Table Configuration

Table configurations are defined in `lib/database/table-config.ts`:

- **Required fields**: Must be provided on create
- **Optional fields**: Can be omitted (defaults applied)
- **Readonly fields**: Cannot be updated (id, created_at, etc.)
- **Defaults**: Applied automatically if not provided

## Example Usage

### Create a Productivity Log
```typescript
const response = await fetch('/api/create-row', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    table: 'productivity_logs',
    data: {
      date: '2024-01-15',
      tasks_completed: 8,
      tasks_total: 10,
      focus_time_minutes: 240,
      productivity_score: 80
    }
  })
});
```

### Update a Fitness Log
```typescript
const response = await fetch('/api/update-table', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    table: 'fitness_logs',
    id: 'fitness-log-id',
    data: {
      duration_minutes: 90,
      calories_burned: 750
    }
  })
});
```

### Update Single Field
```typescript
const response = await fetch('/api/update-field', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    table: 'wellbeing_logs',
    id: 'wellbeing-log-id',
    fieldName: 'mood_score',
    value: 9
  })
});
```

### Delete a Row
```typescript
const response = await fetch('/api/delete-row', {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    table: 'study_logs',
    id: 'study-log-id'
  })
});
```

## Error Handling

All routes return consistent error responses:

```json
{
  "error": "Error message",
  "details": "Additional details",
  "code": "ERROR_CODE" // if available
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created (for create-row)
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (cannot access other user's data)
- `404` - Not Found (row doesn't exist)
- `500` - Internal Server Error

## Testing

To test the CRUD operations:

1. **Setup Database**: Run `database/schema-final.sql` in Supabase SQL Editor
2. **Authenticate**: Ensure you're logged in
3. **Create**: Use `/api/create-row` to create test data
4. **Read**: Use existing routes like `/api/progress` to read data
5. **Update**: Use `/api/update-field` or `/api/update-table`
6. **Delete**: Use `/api/delete-row` to clean up

## Migration Guide

If you have existing data:

1. Run `database/schema-final.sql` (it uses `CREATE TABLE IF NOT EXISTS`)
2. Existing data will be preserved
3. New tables will be created for analysis sectors
4. RLS policies will be updated
5. All existing routes continue to work

## Notes

- All timestamps are in UTC
- Dates should be in ISO format (YYYY-MM-DD)
- JSONB fields (like `metadata`) accept any valid JSON
- REAL fields are used instead of FLOAT for PostgreSQL compatibility
- All tables have proper indexes for performance

