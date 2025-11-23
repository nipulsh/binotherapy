-- ============================================
-- Synergy Medical - Database Schema
-- ============================================
-- This file contains all database tables, indexes, 
-- Row Level Security policies, and triggers for the
-- Synergy Medical visual skills training platform.
-- ============================================

-- ============================================
-- TABLES
-- ============================================

-- Profiles table
-- Stores user profile information linked to Supabase auth
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game sessions table
-- Stores individual game play sessions with scores, accuracy, and metadata
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  game_type TEXT NOT NULL,
  game_name TEXT,
  score INTEGER NOT NULL,
  accuracy FLOAT,
  reaction_time FLOAT,
  duration INTEGER,
  level INTEGER,
  metadata JSONB,
  played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance metrics table
-- Stores aggregated performance statistics per user and game type
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  game_type TEXT NOT NULL,
  total_games INTEGER DEFAULT 0,
  average_score FLOAT DEFAULT 0,
  average_accuracy FLOAT,
  best_score INTEGER DEFAULT 0,
  total_playtime INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, game_type)
);

-- ============================================
-- INDEXES
-- ============================================

-- Indexes for game_sessions table
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_game_type ON game_sessions(game_type);
CREATE INDEX IF NOT EXISTS idx_game_sessions_played_at ON game_sessions(played_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_game_type ON game_sessions(user_id, game_type);

-- Indexes for performance_metrics table
CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_id ON performance_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_game_type ON performance_metrics(game_type);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_game_type ON performance_metrics(user_id, game_type);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Profiles policies
CREATE POLICY "Users can view own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Game sessions policies
CREATE POLICY "Users can view own game sessions" 
  ON game_sessions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own game sessions" 
  ON game_sessions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Performance metrics policies
CREATE POLICY "Users can view own metrics" 
  ON performance_metrics FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own metrics" 
  ON performance_metrics FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own metrics" 
  ON performance_metrics FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update performance metrics when a game session is inserted
CREATE OR REPLACE FUNCTION public.update_performance_metrics()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.performance_metrics (
    user_id,
    game_type,
    total_games,
    average_score,
    average_accuracy,
    best_score,
    total_playtime,
    updated_at
  )
  VALUES (
    NEW.user_id,
    NEW.game_type,
    1,
    NEW.score,
    NEW.accuracy,
    NEW.score,
    COALESCE(NEW.duration, 0),
    NOW()
  )
  ON CONFLICT (user_id, game_type)
  DO UPDATE SET
    total_games = performance_metrics.total_games + 1,
    average_score = (
      (performance_metrics.average_score * performance_metrics.total_games + NEW.score) /
      (performance_metrics.total_games + 1)
    ),
    average_accuracy = CASE
      WHEN NEW.accuracy IS NOT NULL THEN
        (performance_metrics.average_accuracy * performance_metrics.total_games + NEW.accuracy) /
        (performance_metrics.total_games + 1)
      ELSE performance_metrics.average_accuracy
    END,
    best_score = GREATEST(performance_metrics.best_score, NEW.score),
    total_playtime = performance_metrics.total_playtime + COALESCE(NEW.duration, 0),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to update performance metrics on game session insert
DROP TRIGGER IF EXISTS on_game_session_insert ON public.game_sessions;
CREATE TRIGGER on_game_session_insert
  AFTER INSERT ON public.game_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_performance_metrics();

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE profiles IS 'User profile information linked to Supabase authentication';
COMMENT ON TABLE game_sessions IS 'Individual game play sessions with scores, accuracy, and metadata';
COMMENT ON TABLE performance_metrics IS 'Aggregated performance statistics per user and game type';

COMMENT ON COLUMN game_sessions.game_type IS 'Type of game (e.g., eye-hand-coordination, depth-perception)';
COMMENT ON COLUMN game_sessions.game_name IS 'Specific game name (e.g., bike-racing, fruit-ninja)';
COMMENT ON COLUMN game_sessions.accuracy IS 'Accuracy percentage (0-100)';
COMMENT ON COLUMN game_sessions.reaction_time IS 'Reaction time in milliseconds';
COMMENT ON COLUMN game_sessions.duration IS 'Game duration in seconds';
COMMENT ON COLUMN game_sessions.metadata IS 'Additional game-specific data in JSON format';

