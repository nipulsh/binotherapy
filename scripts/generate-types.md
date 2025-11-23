# Generate Supabase Types

To regenerate the TypeScript types from your Supabase schema, use the Supabase CLI:

## Prerequisites

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link your project:
```bash
supabase link --project-ref your-project-ref
```

## Generate Types

Run this command to generate types from your Supabase schema:

```bash
supabase gen types typescript --linked > lib/types/database.types.ts
```

Or if using the project ID directly:

```bash
supabase gen types typescript --project-id your-project-id > lib/types/database.types.ts
```

## Manual Update

If you prefer to manually update the types, ensure the `game_sessions` table includes:

- `id`: UUID (auto-generated)
- `user_id`: UUID (references profiles.id)
- `game_type`: TEXT (required)
- `game_name`: TEXT (nullable) ⚠️ **IMPORTANT: This column must exist in Supabase**
- `score`: INTEGER (required)
- `accuracy`: FLOAT (nullable)
- `reaction_time`: FLOAT (nullable)
- `duration`: INTEGER (nullable)
- `level`: INTEGER (nullable)
- `metadata`: JSONB (nullable)
- `played_at`: TIMESTAMP WITH TIME ZONE (auto-generated)

## Verify Schema

To verify your Supabase schema matches, run this SQL in Supabase SQL Editor:

```sql
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'game_sessions'
ORDER BY ordinal_position;
```

