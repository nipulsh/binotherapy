/**
 * Database Table Configuration
 * 
 * Defines all allowed tables and their required/optional fields
 * Used for validation in CRUD operations
 */

export const ALLOWED_TABLES = [
  "profiles",
  "game_sessions",
  "performance_metrics",
  "productivity_logs",
  "fitness_logs",
  "study_logs",
  "wellbeing_logs",
  "screentime_logs",
  "custom_metrics",
] as const;

export type AllowedTable = (typeof ALLOWED_TABLES)[number];

export interface TableFieldConfig {
  required: string[];
  optional: string[];
  readonly?: string[]; // Fields that cannot be updated
  defaults?: Record<string, unknown>;
}

export const TABLE_CONFIG: Record<AllowedTable, TableFieldConfig> = {
  profiles: {
    required: ["id", "email"],
    optional: ["full_name", "avatar_url", "created_at", "updated_at"],
    readonly: ["id", "created_at"],
    defaults: {},
  },
  game_sessions: {
    required: ["user_id", "game_type", "score"],
    optional: [
      "id",
      "game_name",
      "accuracy",
      "reaction_time",
      "duration",
      "level",
      "metadata",
      "played_at",
    ],
    readonly: ["id", "played_at"],
    defaults: {
      metadata: {},
    },
  },
  performance_metrics: {
    required: ["user_id", "game_type"],
    optional: [
      "id",
      "total_games",
      "average_score",
      "average_accuracy",
      "best_score",
      "total_playtime",
      "updated_at",
    ],
    readonly: ["id"],
    defaults: {
      total_games: 0,
      average_score: 0,
      best_score: 0,
      total_playtime: 0,
    },
  },
  productivity_logs: {
    required: ["user_id", "date"],
    optional: [
      "id",
      "tasks_completed",
      "tasks_total",
      "focus_time_minutes",
      "breaks_taken",
      "productivity_score",
      "notes",
      "created_at",
    ],
    readonly: ["id", "created_at"],
    defaults: {
      tasks_completed: 0,
      tasks_total: 0,
      focus_time_minutes: 0,
      breaks_taken: 0,
      productivity_score: 0,
    },
  },
  fitness_logs: {
    required: ["user_id", "date"],
    optional: [
      "id",
      "workout_type",
      "duration_minutes",
      "calories_burned",
      "distance_km",
      "heart_rate_avg",
      "heart_rate_max",
      "notes",
      "created_at",
    ],
    readonly: ["id", "created_at"],
    defaults: {
      duration_minutes: 0,
      calories_burned: 0,
      distance_km: 0,
    },
  },
  study_logs: {
    required: ["user_id", "date"],
    optional: [
      "id",
      "subject",
      "study_time_minutes",
      "topics_covered",
      "comprehension_score",
      "notes_taken",
      "quiz_score",
      "notes",
      "created_at",
    ],
    readonly: ["id", "created_at"],
    defaults: {
      study_time_minutes: 0,
      topics_covered: 0,
      notes_taken: 0,
    },
  },
  wellbeing_logs: {
    required: ["user_id", "date"],
    optional: [
      "id",
      "mood_score",
      "stress_level",
      "sleep_hours",
      "energy_level",
      "meditation_minutes",
      "journal_entries",
      "notes",
      "created_at",
    ],
    readonly: ["id", "created_at"],
    defaults: {
      meditation_minutes: 0,
      journal_entries: 0,
    },
  },
  screentime_logs: {
    required: ["user_id", "date"],
    optional: [
      "id",
      "total_minutes",
      "phone_minutes",
      "computer_minutes",
      "tablet_minutes",
      "apps_used",
      "notifications_count",
      "breaks_taken",
      "notes",
      "created_at",
    ],
    readonly: ["id", "created_at"],
    defaults: {
      total_minutes: 0,
      phone_minutes: 0,
      computer_minutes: 0,
      tablet_minutes: 0,
      apps_used: 0,
      notifications_count: 0,
      breaks_taken: 0,
    },
  },
  custom_metrics: {
    required: ["user_id", "metric_name", "metric_value", "date"],
    optional: ["id", "metric_unit", "category", "notes", "created_at"],
    readonly: ["id", "created_at"],
    defaults: {},
  },
};

/**
 * Validates if a table name is allowed (prevents SQL injection)
 */
export function isValidTable(table: string): table is AllowedTable {
  return ALLOWED_TABLES.includes(table as AllowedTable);
}

/**
 * Validates field names for a table (prevents SQL injection)
 */
export function isValidField(
  table: AllowedTable,
  field: string
): boolean {
  const config = TABLE_CONFIG[table];
  return (
    config.required.includes(field) ||
    config.optional.includes(field)
  );
}

/**
 * Checks if a field is readonly
 */
export function isReadonlyField(
  table: AllowedTable,
  field: string
): boolean {
  return TABLE_CONFIG[table].readonly?.includes(field) || false;
}

