import { supabase } from "./supabase"
import type { GameSettings } from "./types"

// Generate a unique 6-character game code
export function generateGameCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let result = ""
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Create a new game in the database with user settings
export async function createGame(quizId: number, hostId: string, settings: GameSettings) {
  const gameCode = generateGameCode()

  const { data, error } = await supabase
    .from("games")
    .insert({
      code: gameCode,
      quiz_id: quizId,
      host_id: hostId,
      status: "waiting",
      time_limit: settings.timeLimit,
      question_count: settings.questionCount,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create game: ${error.message}`)
  }

  return {
    gameId: data.id,
    gameCode: data.code,
    timeLimit: data.time_limit,
    questionCount: data.question_count,
  }
}
