import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://mock.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "mock-anon-key"

// Only show warning in development, don't throw error
if (
  (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) &&
  process.env.NODE_ENV === "development"
) {
  console.warn(
    "⚠️  Supabase environment variables not found. Using mock client for development. Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Project Settings for production.",
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      games: {
        Row: {
          id: string
          code: string
          quiz_id: number
          status: "waiting" | "playing" | "finished"
          created_at: string
          host_id?: string
          time_limit?: number
          question_count?: number
        }
        Insert: {
          id?: string
          code: string
          quiz_id: number
          status?: "waiting" | "playing" | "finished"
          created_at?: string
          host_id?: string
          time_limit?: number
          question_count?: number
        }
        Update: {
          id?: string
          code?: string
          quiz_id?: number
          status?: "waiting" | "playing" | "finished"
          created_at?: string
          host_id?: string
          time_limit?: number
          question_count?: number
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
