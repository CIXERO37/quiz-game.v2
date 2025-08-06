/*
  # Quiz Game Database Schema

  1. New Tables
    - `games`
      - `id` (uuid, primary key)
      - `code` (text, unique game code)
      - `quiz_id` (integer, quiz identifier)
      - `status` (text, game status: waiting/playing/finished)
      - `created_at` (timestamp)
      - `host_id` (uuid, optional host identifier)
    
    - `players`
      - `id` (uuid, primary key)
      - `game_id` (uuid, foreign key to games)
      - `name` (text, player name)
      - `avatar` (text, avatar URL)
      - `score` (integer, player score)
      - `current_question` (integer, current question number)
      - `created_at` (timestamp)
    
    - `answers`
      - `id` (uuid, primary key)
      - `player_id` (uuid, foreign key to players)
      - `question_id` (integer, question identifier)
      - `answer` (text, selected answer)
      - `is_correct` (boolean, whether answer is correct)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for public read/write access (game context)
    - Allow real-time subscriptions for multiplayer functionality

  3. Indexes
    - Add indexes for frequently queried columns
    - Optimize for real-time queries
*/

-- Create games table
CREATE TABLE IF NOT EXISTS games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  quiz_id integer NOT NULL,
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished')),
  created_at timestamptz DEFAULT now(),
  host_id uuid
);

-- Create players table
CREATE TABLE IF NOT EXISTS players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  name text NOT NULL,
  avatar text NOT NULL,
  score integer DEFAULT 0,
  current_question integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create answers table
CREATE TABLE IF NOT EXISTS answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  question_id integer NOT NULL,
  answer text NOT NULL,
  is_correct boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_games_code ON games(code);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_players_game_id ON players(game_id);
CREATE INDEX IF NOT EXISTS idx_players_score ON players(score DESC);
CREATE INDEX IF NOT EXISTS idx_answers_player_id ON answers(player_id);

-- Enable Row Level Security
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

-- Create policies for games table
CREATE POLICY "Allow public read access to games"
  ON games
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to games"
  ON games
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to games"
  ON games
  FOR UPDATE
  TO public
  USING (true);

-- Create policies for players table
CREATE POLICY "Allow public read access to players"
  ON players
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to players"
  ON players
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to players"
  ON players
  FOR UPDATE
  TO public
  USING (true);

-- Create policies for answers table
CREATE POLICY "Allow public read access to answers"
  ON answers
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to answers"
  ON answers
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Enable real-time subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE games;
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE answers;