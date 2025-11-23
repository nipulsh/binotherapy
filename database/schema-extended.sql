-- ============================================
-- Synergy Medical - EXTENDED Database Schema
-- ============================================
-- Extended schema to support all analysis sectors:
-- 1. Productivity
-- 2. Fitness / Training
-- 3. Learning / Study
-- 4. Game Performance (existing)
-- 5. Mental Wellbeing
-- 6. Screen Time / Digital Habits
-- 7. Custom User Metrics
-- ============================================

-- ============================================
-- NEW TABLES FOR ANALYSIS SECTORS
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
  productivity_score REAL DEFAULT 0, -- 0-100
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Fitness / Training tracking table
CREATE TABLE IF NOT EXISTS fitness_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  workout_type TEXT, -- e.g., 'cardio', 'strength', 'flexibility'
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
  comprehension_score REAL, -- 0-100
  notes_taken INTEGER DEFAULT 0,
  quiz_score REAL, -- 0-100
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mental Wellbeing tracking table
CREATE TABLE IF NOT EXISTS wellbeing_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  mood_score INTEGER, -- 1-10
  stress_level INTEGER, -- 1-10
  sleep_hours REAL,
  energy_level INTEGER, -- 1-10
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

-- Custom User Metrics table (flexible for any custom tracking)
CREATE TABLE IF NOT EXISTS custom_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  metric_value REAL NOT NULL,
  metric_unit TEXT, -- e.g., 'kg', 'hours', 'count'
  category TEXT, -- e.g., 'health', 'work', 'personal'
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR NEW TABLES
-- ============================================

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

ALTER TABLE productivity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitness_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellbeing_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE screentime_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_metrics ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES FOR NEW TABLES
-- ============================================

-- Productivity logs policies
CREATE POLICY "Users can view own productivity logs" 
  ON productivity_logs FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own productivity logs" 
  ON productivity_logs FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own productivity logs" 
  ON productivity_logs FOR UPDATE 
  USING (auth.uid() = user_id);

-- Fitness logs policies
CREATE POLICY "Users can view own fitness logs" 
  ON fitness_logs FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own fitness logs" 
  ON fitness_logs FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fitness logs" 
  ON fitness_logs FOR UPDATE 
  USING (auth.uid() = user_id);

-- Study logs policies
CREATE POLICY "Users can view own study logs" 
  ON study_logs FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own study logs" 
  ON study_logs FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own study logs" 
  ON study_logs FOR UPDATE 
  USING (auth.uid() = user_id);

-- Wellbeing logs policies
CREATE POLICY "Users can view own wellbeing logs" 
  ON wellbeing_logs FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wellbeing logs" 
  ON wellbeing_logs FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wellbeing logs" 
  ON wellbeing_logs FOR UPDATE 
  USING (auth.uid() = user_id);

-- Screen time logs policies
CREATE POLICY "Users can view own screentime logs" 
  ON screentime_logs FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own screentime logs" 
  ON screentime_logs FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own screentime logs" 
  ON screentime_logs FOR UPDATE 
  USING (auth.uid() = user_id);

-- Custom metrics policies
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
-- COMMENTS
-- ============================================

COMMENT ON TABLE productivity_logs IS 'Daily productivity tracking including tasks, focus time, and productivity scores';
COMMENT ON TABLE fitness_logs IS 'Fitness and training activities including workouts, calories, and heart rate';
COMMENT ON TABLE study_logs IS 'Learning and study sessions with time, topics, and comprehension scores';
COMMENT ON TABLE wellbeing_logs IS 'Mental wellbeing tracking including mood, stress, sleep, and energy levels';
COMMENT ON TABLE screentime_logs IS 'Screen time and digital habit tracking across devices';
COMMENT ON TABLE custom_metrics IS 'Flexible custom metrics for user-defined tracking categories';

