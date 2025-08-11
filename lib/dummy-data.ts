// lib/dummy-data.ts

import type { Quiz } from "./types"
import { supabase } from "./supabase" // Pastikan ini diimpor dengan benar

// Export AVATAR_OPTIONS
export { AVATAR_OPTIONS } from "./types"

// Update DUMMY_QUIZZES untuk compatibility
export let DUMMY_QUIZZES: Quiz[] = []

// Fetch function untuk backward compatibility
export async function fetchQuizzes(): Promise<Quiz[]> {
  try {
    const { data: quizzes, error: quizzesError } = await supabase
      .from("quizzes")
      .select("*")
      .eq("difficulty_level", "TK")

    if (quizzesError) {
      console.error("Error fetching quizzes:", quizzesError)
      return DUMMY_QUIZZES
    }

    const quizzesWithQuestions = await Promise.all(
      quizzes.map(async (quiz) => {
        const { data: questions, error: questionsError } = await supabase
          .from("questions")
          .select(
            `
            id,
            question,
            type,
            order_index,
            question_image_url,
            question_image_alt,
            choices (
              id,
              choice_text,
              is_correct,
              order_index,
              choice_image_url,
              choice_image_alt
            )
          `,
          )
          .eq("quiz_id", quiz.id)
          .order("order_index")

        if (questionsError) {
          console.error("Error fetching questions:", questionsError)
          return { ...quiz, questions: [] }
        }

        return {
          ...quiz,
          questions: questions.map((q) => ({
            id: q.id,
            question: q.question,
            type: q.type,
            order_index: q.order_index,
            question_image_url: q.question_image_url,
            question_image_alt: q.question_image_alt,
            choices: q.choices || [],
          })),
        }
      }),
    )
    DUMMY_QUIZZES = quizzesWithQuestions
    return quizzesWithQuestions
  } catch (error) {
    console.error("Error:", error)
    return DUMMY_QUIZZES
  }
}
