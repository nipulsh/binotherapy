-- Migration: Add game_name column to game_sessions table
-- Run this in your Supabase SQL Editor if the column doesn't exist

-- Add game_name column if it doesn't exist
ALTER TABLE game_sessions 
ADD COLUMN IF NOT EXISTS game_name TEXT;

-- Verify the column was added
-- You can check by running: SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'game_sessions';

