# Synergy Medical - Visual Skills Training Platform

A Next.js 15 application for visual skills training with Phaser games, Supabase authentication, and analytics.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI Components**: ShadCN UI
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **Game Engine**: Phaser 3
- **Charts**: Recharts
- **Language**: TypeScript

## Prerequisites

- Node.js 18+ and npm
- A Supabase account

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for database provisioning (2-3 minutes)
3. Navigate to **Settings → API**
4. Copy your **Project URL** and **anon/public key**

### 3. Create Database Tables

Run these SQL files in the Supabase SQL Editor in order:

**Step 1: Base Schema**
Run the contents of `database/schema-corrected.sql` first.

**Step 2: Extended Schema (for Analysis Page)**
Run the contents of `database/schema-extended.sql` to add tables for all analysis sectors.

**Or run this combined SQL:**

```sql
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
-- NOTE: Use REAL instead of FLOAT for PostgreSQL compatibility
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  game_type TEXT NOT NULL,
  game_name TEXT,
  score INTEGER NOT NULL,
  accuracy REAL,  -- Changed from FLOAT to REAL
  reaction_time REAL,  -- Changed from FLOAT to REAL
  duration INTEGER,
  level INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,  -- Default to empty object
  played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance metrics table
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_game_type ON game_sessions(game_type);
CREATE INDEX IF NOT EXISTS idx_game_sessions_played_at ON game_sessions(played_at DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_id ON performance_metrics(user_id);

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own game sessions" ON game_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own game sessions" ON game_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own metrics" ON performance_metrics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own metrics" ON performance_metrics FOR UPDATE USING (auth.uid() = user_id);

-- Trigger to create profile on signup
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to update performance_metrics on game_session insert
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

CREATE TRIGGER on_game_session_insert
  AFTER INSERT ON public.game_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_performance_metrics();
```

### 4. Configure Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
synergy-project/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── games/             # Game pages
│   ├── analysis/          # Analytics page
│   ├── dashboard/         # Dashboard page
│   └── login/             # Authentication page
├── components/            # React components
│   ├── ui/               # ShadCN UI components
│   ├── game/             # Game-specific components
│   └── navbar.tsx        # Navigation component
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities and configurations
│   ├── phaser/           # Phaser game configurations
│   ├── supabase/         # Supabase clients
│   └── types/            # TypeScript type definitions
└── middleware.ts          # Next.js middleware for auth
```

## Features

- ✅ User authentication (Email/Password & OAuth)
- ✅ Four interactive Phaser games:
  - Depth Perception
  - Eye-Hand Coordination
  - Pursuit & Follow
  - Saccadic Movement
- ✅ Real-time game data tracking
- ✅ Performance analytics dashboard
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ TypeScript for type safety

## Games

1. **Depth Perception**: Test your ability to judge distances by identifying the closest circle
2. **Eye-Hand Coordination**: Click on targets before they disappear
3. **Pursuit & Follow**: Track a moving target with your cursor
4. **Saccadic Movement**: Rapidly click falling tiles

## Development

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint
npm run lint
```

## Deployment

This project is ready to deploy on Vercel:

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

## License

MIT
