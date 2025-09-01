-- Add finished column to games table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'games' AND column_name = 'finished'
    ) THEN
        ALTER TABLE games ADD COLUMN finished BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Add is_started column to games table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'games' AND column_name = 'is_started'
    ) THEN
        ALTER TABLE games ADD COLUMN is_started BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Add quiz_start_time column to games table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'games' AND column_name = 'quiz_start_time'
    ) THEN
        ALTER TABLE games ADD COLUMN quiz_start_time TIMESTAMPTZ;
    END IF;
END $$;

-- Add countdown_start_at column to games table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'games' AND column_name = 'countdown_start_at'
    ) THEN
        ALTER TABLE games ADD COLUMN countdown_start_at TIMESTAMPTZ;
    END IF;
END $$;

-- Add time_limit column to games table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'games' AND column_name = 'time_limit'
    ) THEN
        ALTER TABLE games ADD COLUMN time_limit INTEGER DEFAULT 300;
    END IF;
END $$;

-- Add question_count column to games table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'games' AND column_name = 'question_count'
    ) THEN
        ALTER TABLE games ADD COLUMN question_count INTEGER DEFAULT 10;
    END IF;
END $$;

-- Create index on finished column for better performance
CREATE INDEX IF NOT EXISTS idx_games_finished ON games(finished);

-- Create index on is_started column for better performance
CREATE INDEX IF NOT EXISTS idx_games_is_started ON games(is_started);
