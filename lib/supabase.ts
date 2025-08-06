import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      games: {
        Row: {
          id: string
          code: string
          quiz_id: number
          status: 'waiting' | 'playing' | 'finished'
          created_at: string
          host_id?: string
        }
        Insert: {
          id?: string
          code: string
          quiz_id: number
          status?: 'waiting' | 'playing' | 'finished'
          created_at?: string
          host_id?: string
        }
        Update: {
          id?: string
          code?: string
          quiz_id?: number
          status?: 'waiting' | 'playing' | 'finished'
          created_at?: string
          host_id?: string
        }
      }
      players: {
        Row: {
          id: string
          game_id: string
          name: string
          avatar: string
          score: number
          current_question: number
          created_at: string
        }
        Insert: {
          id?: string
          game_id: string
          name: string
          avatar: string
          score?: number
          current_question?: number
          created_at?: string
        }
        Update: {
          id?: string
          game_id?: string
          name?: string
          avatar?: string
          score?: number
          current_question?: number
          created_at?: string
        }
      }
      answers: {
        Row: {
          id: string
          player_id: string
          question_id: number
          answer: string
          is_correct: boolean
          created_at: string
        }
        Insert: {
          id?: string
          player_id: string
          question_id: number
          answer: string
          is_correct: boolean
          created_at?: string
        }
        Update: {
          id?: string
          player_id?: string
          question_id?: number
          answer?: string
          is_correct?: boolean
          created_at?: string
        }
      }
    }
  }
}