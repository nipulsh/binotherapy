export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      /**
       * Game sessions table
       * Stores individual game play sessions with scores, accuracy, and metadata
       * 
       * Schema:
       * - id: UUID PRIMARY KEY (auto-generated)
       * - user_id: UUID NOT NULL (references profiles.id)
       * - game_type: TEXT NOT NULL (e.g., 'eye-hand-coordination')
       * - game_name: TEXT (nullable, e.g., 'bike-racing')
       * - score: INTEGER NOT NULL
       * - accuracy: FLOAT (nullable, 0-100)
       * - reaction_time: FLOAT (nullable, in milliseconds)
       * - duration: INTEGER (nullable, in seconds)
       * - level: INTEGER (nullable)
       * - metadata: JSONB (nullable, additional game-specific data)
       * - played_at: TIMESTAMP WITH TIME ZONE (auto-generated)
       */
      game_sessions: {
        Row: {
          id: string
          user_id: string
          game_type: string
          game_name: string | null
          score: number
          accuracy: number | null
          reaction_time: number | null
          duration: number | null
          level: number | null
          metadata: Json | null
          played_at: string
        }
        Insert: {
          id?: string
          user_id: string
          game_type: string
          game_name?: string | null
          score: number
          accuracy?: number | null
          reaction_time?: number | null
          duration?: number | null
          level?: number | null
          metadata?: Json | null
          played_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          game_type?: string
          game_name?: string | null
          score?: number
          accuracy?: number | null
          reaction_time?: number | null
          duration?: number | null
          level?: number | null
          metadata?: Json | null
          played_at?: string
        }
      }
      performance_metrics: {
        Row: {
          id: string
          user_id: string
          game_type: string
          total_games: number
          average_score: number
          average_accuracy: number | null
          best_score: number
          total_playtime: number
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          game_type: string
          total_games?: number
          average_score?: number
          average_accuracy?: number | null
          best_score?: number
          total_playtime?: number
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          game_type?: string
          total_games?: number
          average_score?: number
          average_accuracy?: number | null
          best_score?: number
          total_playtime?: number
          updated_at?: string
        }
      }
    }
  }
}


