// lib/dummy-data.ts
import { Quiz, AVATAR_OPTION } from './types';

// Export AVATAR_OPTIONS
export { AVATAR_OPTIONS } from './types';

// Update DUMMY_QUIZZES untuk compatibility
export let DUMMY_QUIZZES: Quiz[] = [];

// Fetch function untuk backward compatibility
export async function fetchQuizzes(): Promise<Quiz[]> {
  try {
    const { supabase } = await import('./supabase');
    const { data: quizzes, error: quizzesError } = await supabase
      .from('quizzes')
      .select('*')
      .eq('difficulty_level', 'TK');

    if (quizzesError) {
      console.error('Error fetching quizzes:', quizzesError);
      return DUMMY_QUIZZES;
    }

    const quizzesWithQuestions = await Promise.all(
      quizzes.map(async (quiz) => {
        const { data: questions, error: questionsError } = await supabase
          .from('questions')
          .select(`
            *,
            choices (
              id,
              choice_text,
              is_correct
            )
          `)
          .eq('quiz_id', quiz.id)
          .order('order_index');

        if (questionsError) {
          console.error('Error fetching questions:', questionsError);
          return { ...quiz, questions: [] };
        }

        return {
          ...quiz,
          questions: questions.map(q => ({
            id: q.id,
            question: q.question,
            choices: q.choices || []
          }))
        };
      })
    );

    DUMMY_QUIZZES = quizzesWithQuestions;
    return quizzesWithQuestions;
  } catch (error) {
    console.error('Error:', error);
    return DUMMY_QUIZZES;
  }
}