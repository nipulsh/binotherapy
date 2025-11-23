-- ============================================
-- Domain Performance Tables Schema
-- ============================================
-- Creates 4 domain-specific performance tables based on game_type:
-- 1. depth_perception_performance (depth-perception games)
-- 2. eye_hand_coordination_performance (eye-hand-coordination games)
-- 3. pursuit_follow_performance (pursuit-follow games)
-- 4. saccadic_movement_performance (saccadic-movement games)
-- ============================================

-- ============================================
-- DROP EXISTING TABLES (if needed for clean migration)
-- ============================================

DROP TABLE IF EXISTS public.depth_perception_performance CASCADE;
DROP TABLE IF EXISTS public.eye_hand_coordination_performance CASCADE;
DROP TABLE IF EXISTS public.pursuit_follow_performance CASCADE;
DROP TABLE IF EXISTS public.saccadic_movement_performance CASCADE;

-- ============================================
-- DOMAIN PERFORMANCE TABLES
-- ============================================

-- 1. Depth Perception Performance
CREATE TABLE public.depth_perception_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_sessions INTEGER DEFAULT 0,
  average_score REAL DEFAULT 0,
  median_score REAL DEFAULT 0,
  best_score INTEGER DEFAULT 0,
  score_stddev REAL DEFAULT 0,
  average_accuracy REAL DEFAULT NULL,
  total_playtime_seconds INTEGER DEFAULT 0,
  last_played TIMESTAMPTZ,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, period_start, period_end)
);

-- 2. Eye-Hand Coordination Performance
CREATE TABLE public.eye_hand_coordination_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_sessions INTEGER DEFAULT 0,
  average_score REAL DEFAULT 0,
  median_score REAL DEFAULT 0,
  best_score INTEGER DEFAULT 0,
  score_stddev REAL DEFAULT 0,
  average_accuracy REAL DEFAULT NULL,
  total_playtime_seconds INTEGER DEFAULT 0,
  last_played TIMESTAMPTZ,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, period_start, period_end)
);

-- 3. Pursuit & Follow Performance
CREATE TABLE public.pursuit_follow_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_sessions INTEGER DEFAULT 0,
  average_score REAL DEFAULT 0,
  median_score REAL DEFAULT 0,
  best_score INTEGER DEFAULT 0,
  score_stddev REAL DEFAULT 0,
  average_accuracy REAL DEFAULT NULL,
  total_playtime_seconds INTEGER DEFAULT 0,
  last_played TIMESTAMPTZ,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, period_start, period_end)
);

-- 4. Saccadic Movement Performance
CREATE TABLE public.saccadic_movement_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_sessions INTEGER DEFAULT 0,
  average_score REAL DEFAULT 0,
  median_score REAL DEFAULT 0,
  best_score INTEGER DEFAULT 0,
  score_stddev REAL DEFAULT 0,
  average_accuracy REAL DEFAULT NULL,
  total_playtime_seconds INTEGER DEFAULT 0,
  last_played TIMESTAMPTZ,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, period_start, period_end)
);

-- ============================================
-- INDEXES
-- ============================================

-- Depth Perception indexes
CREATE INDEX IF NOT EXISTS idx_depth_perception_perf_user_id ON depth_perception_performance(user_id);
CREATE INDEX IF NOT EXISTS idx_depth_perception_perf_period ON depth_perception_performance(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_depth_perception_perf_user_period ON depth_perception_performance(user_id, period_start, period_end);

-- Eye-Hand Coordination indexes
CREATE INDEX IF NOT EXISTS idx_eye_hand_coord_perf_user_id ON eye_hand_coordination_performance(user_id);
CREATE INDEX IF NOT EXISTS idx_eye_hand_coord_perf_period ON eye_hand_coordination_performance(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_eye_hand_coord_perf_user_period ON eye_hand_coordination_performance(user_id, period_start, period_end);

-- Pursuit & Follow indexes
CREATE INDEX IF NOT EXISTS idx_pursuit_follow_perf_user_id ON pursuit_follow_performance(user_id);
CREATE INDEX IF NOT EXISTS idx_pursuit_follow_perf_period ON pursuit_follow_performance(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_pursuit_follow_perf_user_period ON pursuit_follow_performance(user_id, period_start, period_end);

-- Saccadic Movement indexes
CREATE INDEX IF NOT EXISTS idx_saccadic_movement_perf_user_id ON saccadic_movement_performance(user_id);
CREATE INDEX IF NOT EXISTS idx_saccadic_movement_perf_period ON saccadic_movement_performance(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_saccadic_movement_perf_user_period ON saccadic_movement_performance(user_id, period_start, period_end);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE depth_perception_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE eye_hand_coordination_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE pursuit_follow_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE saccadic_movement_performance ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own depth perception performance" ON depth_perception_performance;
DROP POLICY IF EXISTS "Users can insert own depth perception performance" ON depth_perception_performance;
DROP POLICY IF EXISTS "Users can update own depth perception performance" ON depth_perception_performance;
DROP POLICY IF EXISTS "Users can delete own depth perception performance" ON depth_perception_performance;

DROP POLICY IF EXISTS "Users can view own eye-hand coordination performance" ON eye_hand_coordination_performance;
DROP POLICY IF EXISTS "Users can insert own eye-hand coordination performance" ON eye_hand_coordination_performance;
DROP POLICY IF EXISTS "Users can update own eye-hand coordination performance" ON eye_hand_coordination_performance;
DROP POLICY IF EXISTS "Users can delete own eye-hand coordination performance" ON eye_hand_coordination_performance;

DROP POLICY IF EXISTS "Users can view own pursuit follow performance" ON pursuit_follow_performance;
DROP POLICY IF EXISTS "Users can insert own pursuit follow performance" ON pursuit_follow_performance;
DROP POLICY IF EXISTS "Users can update own pursuit follow performance" ON pursuit_follow_performance;
DROP POLICY IF EXISTS "Users can delete own pursuit follow performance" ON pursuit_follow_performance;

DROP POLICY IF EXISTS "Users can view own saccadic movement performance" ON saccadic_movement_performance;
DROP POLICY IF EXISTS "Users can insert own saccadic movement performance" ON saccadic_movement_performance;
DROP POLICY IF EXISTS "Users can update own saccadic movement performance" ON saccadic_movement_performance;
DROP POLICY IF EXISTS "Users can delete own saccadic movement performance" ON saccadic_movement_performance;

-- Depth Perception policies
CREATE POLICY "Users can view own depth perception performance" 
  ON depth_perception_performance FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own depth perception performance" 
  ON depth_perception_performance FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own depth perception performance" 
  ON depth_perception_performance FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own depth perception performance" 
  ON depth_perception_performance FOR DELETE 
  USING (auth.uid() = user_id);

-- Eye-Hand Coordination policies
CREATE POLICY "Users can view own eye-hand coordination performance" 
  ON eye_hand_coordination_performance FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own eye-hand coordination performance" 
  ON eye_hand_coordination_performance FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own eye-hand coordination performance" 
  ON eye_hand_coordination_performance FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own eye-hand coordination performance" 
  ON eye_hand_coordination_performance FOR DELETE 
  USING (auth.uid() = user_id);

-- Pursuit & Follow policies
CREATE POLICY "Users can view own pursuit follow performance" 
  ON pursuit_follow_performance FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pursuit follow performance" 
  ON pursuit_follow_performance FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pursuit follow performance" 
  ON pursuit_follow_performance FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own pursuit follow performance" 
  ON pursuit_follow_performance FOR DELETE 
  USING (auth.uid() = user_id);

-- Saccadic Movement policies
CREATE POLICY "Users can view own saccadic movement performance" 
  ON saccadic_movement_performance FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saccadic movement performance" 
  ON saccadic_movement_performance FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saccadic movement performance" 
  ON saccadic_movement_performance FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saccadic movement performance" 
  ON saccadic_movement_performance FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE depth_perception_performance IS 'Performance metrics for depth perception games aggregated by user and time period';
COMMENT ON TABLE eye_hand_coordination_performance IS 'Performance metrics for eye-hand coordination games aggregated by user and time period';
COMMENT ON TABLE pursuit_follow_performance IS 'Performance metrics for pursuit & follow games aggregated by user and time period';
COMMENT ON TABLE saccadic_movement_performance IS 'Performance metrics for saccadic movement games aggregated by user and time period';

