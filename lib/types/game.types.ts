export type GameType =
  | "depth-perception"
  | "eye-hand-coordination"
  | "pursuit-follow"
  | "saccadic-movement";

export type DomainKey = GameType;

export interface GameSession {
  id: string;
  user_id: string;
  game_type: GameType;
  game_name: string | null;
  score: number;
  accuracy: number | null;
  reaction_time: number | null;
  duration: number | null;
  level: number | null;
  metadata: Record<string, unknown> | null;
  played_at: string;
}

export interface PerformanceMetrics {
  id: string;
  user_id: string;
  game_type: GameType;
  total_games: number;
  average_score: number;
  average_accuracy: number | null;
  best_score: number;
  total_playtime: number;
  updated_at: string;
}

export interface DomainPerformance {
  id: string;
  user_id: string;
  period_start: string;
  period_end: string;
  total_sessions: number;
  average_score: number;
  median_score: number;
  best_score: number;
  score_stddev: number;
  average_accuracy: number | null;
  total_playtime_seconds: number;
  last_played: string | null;
  last_updated: string;
}

export interface DomainMetrics {
  [key: string]: DomainPerformance | null;
}

export interface GameResult {
  score: number;
  accuracy: number;
  reactionTimes: number[];
  duration: number;
  level: number;
  metadata?: Record<string, unknown>;
}

export interface GameConfig {
  title: string;
  description: string;
  icon: string;
  gameType: GameType;
  difficulty: "easy" | "medium" | "hard";
  instructions: string[];
}
