-- ============================================
-- Synergy Medical - COMPLETE Database Schema
-- ============================================
-- This file contains ALL tables needed for the application:
-- - Base tables (profiles, game_sessions, performance_metrics)
-- - Extended tables for analysis page (7 sectors)
-- ============================================
-- Run this file in Supabase SQL Editor to set up the complete database
-- ============================================

-- ============================================
-- BASE TABLES (from schema-corrected.sql)
-- ============================================

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game sessions table
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  game_type TEXT NOT NULL,
  game_name TEXT,
  score INTEGER NOT NULL,
  accuracy REAL,
  reaction_time REAL,
  duration INTEGER,
  level INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance metrics table
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  game_type TEXT NOT NULL,
  total_games INTEGER DEFAULT 0,
  average_score REAL DEFAULT 0,
  average_accuracy REAL,
  best_score INTEGER DEFAULT 0,
  total_playtime INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, game_type)
);

-- ============================================
-- EXTENDED TABLES FOR ANALYSIS SECTORS
-- ============================================

-- Productivity tracking table
CREATE TABLE IF NOT EXISTS productivity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  tasks_completed INTEGER DEFAULT 0,
  tasks_total INTEGER DEFAULT 0,
  focus_time_minutes INTEGER DEFAULT 0,
  breaks_taken INTEGER DEFAULT 0,
  productivity_score REAL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Fitness / Training tracking table
CREATE TABLE IF NOT EXISTS fitness_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  workout_type TEXT,
  duration_minutes INTEGER DEFAULT 0,
  calories_burned INTEGER DEFAULT 0,
  distance_km REAL DEFAULT 0,
  heart_rate_avg INTEGER,
  heart_rate_max INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Learning / Study tracking table
CREATE TABLE IF NOT EXISTS study_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  subject TEXT,
  study_time_minutes INTEGER DEFAULT 0,
  topics_covered INTEGER DEFAULT 0,
  comprehension_score REAL,
  notes_taken INTEGER DEFAULT 0,
  quiz_score REAL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mental Wellbeing tracking table
CREATE TABLE IF NOT EXISTS wellbeing_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  mood_score INTEGER,
  stress_level INTEGER,
  sleep_hours REAL,
  energy_level INTEGER,
  meditation_minutes INTEGER DEFAULT 0,
  journal_entries INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Screen Time / Digital Habits tracking table
CREATE TABLE IF NOT EXISTS screentime_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_minutes INTEGER DEFAULT 0,
  phone_minutes INTEGER DEFAULT 0,
  computer_minutes INTEGER DEFAULT 0,
  tablet_minutes INTEGER DEFAULT 0,
  apps_used INTEGER DEFAULT 0,
  notifications_count INTEGER DEFAULT 0,
  breaks_taken INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Custom User Metrics table
CREATE TABLE IF NOT EXISTS custom_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  metric_value REAL NOT NULL,
  metric_unit TEXT,
  category TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Base table indexes
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_game_type ON game_sessions(game_type);
CREATE INDEX IF NOT EXISTS idx_game_sessions_played_at ON game_sessions(played_at DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_id ON performance_metrics(user_id);

-- Extended table indexes
CREATE INDEX IF NOT EXISTS idx_productivity_logs_user_id ON productivity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_productivity_logs_date ON productivity_logs(date DESC);
CREATE INDEX IF NOT EXISTS idx_fitness_logs_user_id ON fitness_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_fitness_logs_date ON fitness_logs(date DESC);
CREATE INDEX IF NOT EXISTS idx_study_logs_user_id ON study_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_study_logs_date ON study_logs(date DESC);
CREATE INDEX IF NOT EXISTS idx_wellbeing_logs_user_id ON wellbeing_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_wellbeing_logs_date ON wellbeing_logs(date DESC);
CREATE INDEX IF NOT EXISTS idx_screentime_logs_user_id ON screentime_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_screentime_logs_date ON screentime_logs(date DESC);
CREATE INDEX IF NOT EXISTS idx_custom_metrics_user_id ON custom_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_metrics_date ON custom_metrics(date DESC);
CREATE INDEX IF NOT EXISTS idx_custom_metrics_name ON custom_metrics(metric_name);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE productivity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitness_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellbeing_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE screentime_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_metrics ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Base table policies
CREATE POLICY "Users can view own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own game sessions" 
  ON game_sessions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own game sessions" 
  ON game_sessions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own metrics" 
  ON performance_metrics FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own metrics" 
  ON performance_metrics FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own metrics" 
  ON performance_metrics FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Extended table policies
CREATE POLICY "Users can view own productivity logs" 
  ON productivity_logs FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own productivity logs" 
  ON productivity_logs FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own productivity logs" 
  ON productivity_logs FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own fitness logs" 
  ON fitness_logs FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own fitness logs" 
  ON fitness_logs FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fitness logs" 
  ON fitness_logs FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own study logs" 
  ON study_logs FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own study logs" 
  ON study_logs FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own study logs" 
  ON study_logs FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own wellbeing logs" 
  ON wellbeing_logs FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wellbeing logs" 
  ON wellbeing_logs FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wellbeing logs" 
  ON wellbeing_logs FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own screentime logs" 
  ON screentime_logs FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own screentime logs" 
  ON screentime_logs FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own screentime logs" 
  ON screentime_logs FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own custom metrics" 
  ON custom_metrics FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own custom metrics" 
  ON custom_metrics FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own custom metrics" 
  ON custom_metrics FOR UPDATE 
  USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NULL),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update performance metrics when a game session is inserted
CREATE OR REPLACE FUNCTION public.update_performance_metrics()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
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
    COALESCE(NEW.accuracy, NULL),
    NEW.score,
    COALESCE(NEW.duration, 0),
    NOW()
  )
  ON CONFLICT (user_id, game_type)
  DO UPDATE SET
    total_games = performance_metrics.total_games + 1,
    average_score = (
      (performance_metrics.average_score * performance_metrics.total_games + NEW.score)::REAL /
      (performance_metrics.total_games + 1)::REAL
    ),
    average_accuracy = CASE
      WHEN NEW.accuracy IS NOT NULL AND performance_metrics.average_accuracy IS NOT NULL THEN
        ((performance_metrics.average_accuracy * performance_metrics.total_games + NEW.accuracy)::REAL /
         (performance_metrics.total_games + 1)::REAL)
      WHEN NEW.accuracy IS NOT NULL THEN
        NEW.accuracy
      ELSE
        performance_metrics.average_accuracy
    END,
    best_score = GREATEST(performance_metrics.best_score, NEW.score),
    total_playtime = performance_metrics.total_playtime + COALESCE(NEW.duration, 0),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
COMMENT ON TABLE productivity_logs IS 'Daily productivity tracking including tasks, focus time, and productivity scores';
COMMENT ON TABLE fitness_logs IS 'Fitness and training activities including workouts, calories, and heart rate';
COMMENT ON TABLE study_logs IS 'Learning and study sessions with time, topics, and comprehension scores';
COMMENT ON TABLE wellbeing_logs IS 'Mental wellbeing tracking including mood, stress, sleep, and energy levels';
COMMENT ON TABLE screentime_logs IS 'Screen time and digital habit tracking across devices';
COMMENT ON TABLE custom_metrics IS 'Flexible custom metrics for user-defined tracking categories';

