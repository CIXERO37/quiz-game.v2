export interface Player {
  id: string
  name: string
  avatar?: string
  game_id: string
  score: number
  correct_answers: number
  created_at: string
  joined_at?: string // When player joined
}

export interface Quiz {
  id: number
  title: string
  description: string
  difficulty_level: string
  created_at: string
  questionCount: number
  timeLimit: number
  questions: Question[]
  thumbnail?: string // For backward compatibility
  updated_at?: string // For backward compatibility
}

export interface Question {
  id: number
  question: string // Teks pertanyaan
  type: string // Tipe pertanyaan (misal: 'multiple_choice')
  order_index: number
  question_image_url?: string | null // URL gambar pertanyaan
  question_image_alt?: string | null // Alt text untuk gambar pertanyaan
  choices: Choice[]
  options?: string[] // For backward compatibility
  correctAnswer?: number // For backward compatibility
  correct_answer?: number // For backward compatibility
  time_limit?: number // For backward compatibility
  points?: number // For backward compatibility
}

export interface Choice {
  id: number
  choice_text: string | null // Bisa null jika hanya ada gambar
  is_correct: boolean
  order_index: number
  choice_image_url?: string | null // URL gambar pilihan jawaban
  choice_image_alt?: string | null // Alt text untuk gambar pilihan jawaban
}

export interface GameSettings {
  timeLimit: number
  questionCount: number
}

export interface Game {
  id: string
  quiz_id: number
  host_name: string
  is_started: boolean
  finished: boolean
  created_at: string
  code?: string // Game code for joining
  host_id?: string // Host identifier
  time_limit?: number // Time limit setting
  question_count?: number // Number of questions setting
  quiz_start_time?: string
}

export interface PlayerAnswer {
  id: string
  player_id: string
  game_id: string
  question_index: number
  is_correct: boolean
  points_earned: number
  created_at: string
  selected_answer?: number // Selected answer index
  answered_at?: string // When answer was submitted
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
