export interface Choice {
  id: number
  choice_text: string | null // Bisa null jika hanya ada gambar
  is_correct: boolean
  order_index: number
  choice_image_url?: string | null // URL gambar pilihan jawaban
  choice_image_alt?: string | null // Alt text untuk gambar pilihan jawaban
}

export interface Question {
  id: number
  question: string // Teks pertanyaan
  type: string // Tipe pertanyaan (misal: 'multiple_choice')
  order_index: number
  question_image_url?: string | null // URL gambar pertanyaan
  question_image_alt?: string | null // Alt text untuk gambar pertanyaan
  choices: Choice[]
}

export interface Quiz {
  id: number
  title: string
  description: string
  difficulty_level: string
  created_at: string
  questions: Question[]
}

export interface Game {
  id: string
  quiz_id: number
  host_name: string
  is_started: boolean
  finished: boolean
  created_at: string
}

export interface Player {
  id: string
  game_id: string
  name: string
  score: number
  correct_answers: number
  created_at: string
}

export interface PlayerAnswer {
  id: string
  player_id: string
  game_id: string
  question_index: number
  is_correct: boolean
  points_earned: number
  created_at: string
}

export interface AVATAR_OPTION {
  id: string
  name: string
  image: string
}

// Avatar options untuk join game
export const AVATAR_OPTIONS: AVATAR_OPTION[] = [
  { id: "bear", name: "Bear", image: "/avatars/bear.png" },
  { id: "cat", name: "Cat", image: "/avatars/cat.png" },
  { id: "dog", name: "Dog", image: "/avatars/dog.png" },
  { id: "elephant", name: "Elephant", image: "/avatars/elephant.png" },
  { id: "lion", name: "Lion", image: "/avatars/lion.png" },
  { id: "panda", name: "Panda", image: "/avatars/panda.png" },
  { id: "rabbit", name: "Rabbit", image: "/avatars/rabbit.png" },
  { id: "tiger", name: "Tiger", image: "/avatars/tiger.png" },
]
