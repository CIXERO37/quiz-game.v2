import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface Player {
  id: string
  name: string
  avatar: string
  score: number
  current_question: number
}

export interface Question {
  id: number
  question: string
  image?: string
  options: string[]
  correct_answer: string
  option_images?: string[]
}

export interface Quiz {
  id: number
  title: string
  description: string
  questions: Question[]
}

export interface GameState {
  clearGame(): unknown
  // Game info
  gameCode: string
  gameId: string
  quizId: number
  gameStatus: "waiting" | "playing" | "finished"

  // Player info
  playerId: string
  playerName: string
  playerAvatar: string
  isHost: boolean

  // Quiz state
  currentQuestion: number
  score: number
  correctAnswers: number
  players: Player[]

  // Mini-game state
  showMiniGame: boolean
  miniGameScore: number

  // Game settings
  gameSettings: {
    timeLimit: number
    questionCount: number
  }

  // Actions
  setGameCode: (code: string) => void
  setGameId: (id: string) => void
  setQuizId: (id: number) => void
  setGameStatus: (status: "waiting" | "playing" | "finished") => void
  setPlayer: (id: string, name: string, avatar: string) => void
  setIsHost: (isHost: boolean) => void
  setCurrentQuestion: (question: number) => void
  setScore: (score: number) => void
  addScore: (points: number) => void
  setCorrectAnswers: (count: number) => void
  incrementCorrectAnswers: () => void
  setPlayers: (players: Player[]) => void
  addPlayer: (player: Player) => void
  updatePlayer: (playerId: string, updates: Partial<Player>) => void
  removePlayer: (playerId: string) => void
  setShowMiniGame: (show: boolean) => void
  setMiniGameScore: (score: number) => void
  addMiniGameScore: (points: number) => void
  setGameSettings: (settings: { timeLimit: number; questionCount: number }) => void
  resetGame: () => void
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      // Initial state
      gameCode: "",
      gameId: "",
      quizId: 0,
      gameStatus: "waiting",
      playerId: "",
      playerName: "",
      playerAvatar: "",
      isHost: false,
      currentQuestion: 0,
      score: 0,
      correctAnswers: 0,
      players: [],
      showMiniGame: false,
      miniGameScore: 0,
      gameSettings: {
        timeLimit: 300,
        questionCount: 15,
      },

      // Actions
      setGameCode: (code) => set({ gameCode: code }),
      setGameId: (id) => set({ gameId: id }),
      setQuizId: (id) => set({ quizId: id }),
      setGameStatus: (status) => set({ gameStatus: status }),
      setPlayer: (id, name, avatar) =>
        set({
          playerId: id,
          playerName: name,
          playerAvatar: avatar,
        }),
      setIsHost: (isHost) => set({ isHost }),
      setCurrentQuestion: (question) => set({ currentQuestion: question }),
      setScore: (score) => set({ score }),
      addScore: (points) => set((state) => ({ score: state.score + points })),
      setCorrectAnswers: (count) => set({ correctAnswers: count }),
      incrementCorrectAnswers: () =>
        set((state) => ({
          correctAnswers: state.correctAnswers + 1,
        })),
      setPlayers: (players) => set({ players }),
      addPlayer: (player) =>
        set((state) => ({
          players: [...state.players.filter((p) => p.id !== player.id), player],
        })),
      updatePlayer: (playerId, updates) =>
        set((state) => ({
          players: state.players.map((p) => (p.id === playerId ? { ...p, ...updates } : p)),
        })),
      removePlayer: (playerId) =>
        set((state) => ({
          players: state.players.filter((p) => p.id !== playerId),
        })),
      setShowMiniGame: (show) => set({ showMiniGame: show }),
      setMiniGameScore: (score) => set({ miniGameScore: score }),
      addMiniGameScore: (points) =>
        set((state) => ({
          miniGameScore: state.miniGameScore + points,
        })),
      setGameSettings: (settings) => set({ gameSettings: settings }),
      resetGame: () =>
        set({
          gameCode: "",
          gameId: "",
          quizId: 0,
          gameStatus: "waiting",
          playerId: "",
          playerName: "",
          playerAvatar: "",
          isHost: false,
          currentQuestion: 0,
          score: 0,
          correctAnswers: 0,
          players: [],
          showMiniGame: false,
          miniGameScore: 0,
          gameSettings: {
            timeLimit: 300,
            questionCount: 15,
          },
        }),

      clearGame: () => get().resetGame(),
    }),
    {
      name: "quiz-game-store",
    },
  ),
)
