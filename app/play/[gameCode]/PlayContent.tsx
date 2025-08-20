"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { Clock } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import SpaceDodge from "@/components/space-dodge"
import { useGameStore } from "@/lib/store"
import { supabase } from "@/lib/supabase"
import type { Quiz, Question } from "@/lib/types"
import Image from "next/image"
import { toast } from "sonner"

function PixelButton({
  children,
  color = "blue",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  color?: "blue" | "green" | "red" | "yellow"
}) {
  const colorStyles = {
    blue: "bg-blue-500 border-blue-700 text-white hover:bg-blue-600 active:bg-blue-700",
    green: "bg-green-500 border-green-700 text-white hover:bg-green-600 active:bg-green-700",
    red: "bg-red-500 border-red-700 text-white hover:bg-red-600 active:bg-red-700",
    yellow: "bg-yellow-400 border-yellow-600 text-black hover:bg-yellow-500 active:bg-yellow-600",
  }

  return (
    <button
      className={`border-2 font-mono uppercase tracking-wide shadow-[4px_4px_0px_rgba(0,0,0,0.8)] active:shadow-[2px_2px_0px_rgba(0,0,0,0.8)] active:translate-x-[2px] active:translate-y-[2px] transition-all ${colorStyles[color]} px-4 py-3 text-sm w-full ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

interface PlayContentProps {
  gameCode: string
}

export default function PlayContent({ gameCode }: PlayContentProps) {
  const router = useRouter()
  const { currentQuestion, score, correctAnswers, setCurrentQuestion, addScore, incrementCorrectAnswers } =
    useGameStore()

  const [timeLeft, setTimeLeft] = useState(0)
  const [selectedChoiceId, setSelectedChoiceId] = useState<number | null>(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [isQuizStarted, setIsQuizStarted] = useState(false)
  const [shouldNavigate, setShouldNavigate] = useState(false)
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [showMiniGame, setShowMiniGame] = useState(false)
  const [gameSettings, setGameSettings] = useState<{ timeLimit: number; questionCount: number } | null>(null)
  const [allQuestions, setAllQuestions] = useState<Question[]>([])

  useEffect(() => {
    const fetchGame = async () => {
      const { data: gameData, error: gameErr } = await supabase
        .from("games")
        .select("id, quiz_id, time_limit, question_count, is_started")
        .eq("code", gameCode.toUpperCase())
        .single()

      if (gameErr || !gameData) {
        router.replace("/")
        return
      }

      setGameSettings({
        timeLimit: gameData.time_limit,
        questionCount: gameData.question_count,
      })
      setTimeLeft(gameData.time_limit)

      const { data: quizData } = await supabase
        .from("quizzes")
        .select(`
          *,
          questions (
            id,
            question,
            question_image_url,
            question_image_alt,
            choices (
              id,
              choice_text,
              choice_image_url,
              choice_image_alt,
              is_correct
            )
          )
        `)
        .eq("id", gameData.quiz_id)
        .single()

      if (!quizData) {
        toast.error("Quiz not found")
        router.replace("/")
        return
      }

      setQuiz(quizData as Quiz)

      // 🔽 Langsung shuffle & simpan semua soal
      const shuffled = [...quizData.questions]
        .sort(() => Math.random() - 0.5)
        .slice(0, gameData.question_count)
        .map((q: any) => ({
          ...q,
          choices: [...q.choices].sort(() => Math.random() - 0.5),
        }))
      setAllQuestions(shuffled)

      if (gameData.is_started) {
        setIsQuizStarted(true)
      } else {
        setIsQuizStarted(false)
      }
      setCurrentQuestion(0)
      setLoading(false)
    }

    fetchGame()
  }, [gameCode, router, setCurrentQuestion])

  useEffect(() => {
    if (!gameCode) return

    const channel = supabase
      .channel("game-start")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "games", filter: `code=eq.${gameCode.toUpperCase()}` },
        (payload) => {
          if (payload.new.is_started && !isQuizStarted) {
            setIsQuizStarted(true)
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [gameCode, isQuizStarted])

  useEffect(() => {
    if (!gameCode) return

    const channel = supabase
      .channel("game-finished")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "games", filter: `code=eq.${gameCode.toUpperCase()}` },
        (payload) => {
          if (payload.new.finished) {
            router.replace(`/result/${gameCode}`)
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [gameCode, router])

  // ✅ Timer sinkron dengan server
  useEffect(() => {
    if (!isQuizStarted || !gameSettings) return

    let unsub = () => {}
    ;(async () => {
      const { data } = await supabase
        .from("games")
        .select("quiz_start_time, time_limit")
        .eq("code", gameCode.toUpperCase())
        .single()

      if (!data?.quiz_start_time) return

      const start = new Date(data.quiz_start_time).getTime()
      const limitMs = data.time_limit * 1000

      const tick = () => {
        const remain = Math.max(0, start + limitMs - Date.now())
        setTimeLeft(Math.floor(remain / 1000))
        if (remain <= 0) {
          setShouldNavigate(true)
        }
      }

      tick()
      const iv = setInterval(tick, 1000)
      unsub = () => clearInterval(iv)
    })()

    return unsub
  }, [isQuizStarted, gameSettings, gameCode])

  const question = allQuestions[currentQuestion]

  const getChoiceLabel = (index: number) => String.fromCharCode(65 + index)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleAnswerSelect = async (choice: {
    id: number
    choice_text: string | null
    is_correct: boolean
  }) => {
    if (isAnswered || !question) return

    setSelectedChoiceId(choice.id)
    setIsAnswered(true)
    const correct = choice.is_correct
    setIsCorrect(correct)

    let earnedPoints = 0
    if (correct) {
      earnedPoints = 10
      addScore(earnedPoints)
      incrementCorrectAnswers()
    }

    try {
      // First, insert the answer
      await supabase.from("player_answers").insert({
        game_id: useGameStore.getState().gameId,
        player_id: useGameStore.getState().playerId,
        question_index: currentQuestion,
        points_earned: earnedPoints,
      })

      // Then, update player score if correct
      if (correct) {
        const { data: player } = await supabase
          .from("players")
          .select("score")
          .eq("id", useGameStore.getState().playerId)
          .single()

        if (player) {
          const newScore = (player.score || 0) + earnedPoints
          await supabase.from("players").update({ score: newScore }).eq("id", useGameStore.getState().playerId)
        }
      }

      if (currentQuestion + 1 >= gameSettings!.questionCount) {
        // Mark this player as finished and trigger game completion
        const { data: gameData } = await supabase.from("games").select("id").eq("code", gameCode.toUpperCase()).single()

        if (gameData) {
          // End the quiz for all players
          await supabase
            .from("games")
            .update({
              finished: true,
              is_started: false,
            })
            .eq("id", gameData.id)
        }
      }
    } catch (error) {
      console.error("Error updating answer and score:", error)
      toast.error("Failed to save answer. Please try again.")
      return
    }

    setShowResult(true)

    setTimeout(
      () => {
        setShowResult(false)
        setIsAnswered(false)
        setSelectedChoiceId(null)
        if (correct && (correctAnswers + 1) % 3 === 0) {
          setShowMiniGame(true)
        } else if (currentQuestion + 1 < gameSettings!.questionCount) {
          setCurrentQuestion(currentQuestion + 1)
        } else {
          router.replace(`/result/${gameCode}`)
        }
      },
      correct ? 1500 : 2500,
    ) // Slightly longer delay to ensure host sees the update
  }

  const handleMiniGameComplete = (score: number) => {
    addScore(score)
    setShowMiniGame(false)
    if (currentQuestion + 1 < gameSettings!.questionCount) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      router.replace(`/result/${gameCode}`)
    }
  }

  if (loading || !gameSettings)
    return (
      <>
        <Background />
        <div className="relative z-10 min-h-screen flex items-center justify-center font-mono text-white">
          <div className="bg-black/70 border-4 border-white p-6 rounded-lg">
            <p>Loading quiz...</p>
          </div>
        </div>
      </>
    )

  if (!quiz || !question)
    return (
      <>
        <Background />
        <div className="relative z-10 min-h-screen flex items-center justify-center font-mono text-white">
          <div className="bg-black/70 border-4 border-red-500 p-6 rounded-lg">
            <p>Quiz not found or invalid quiz ID.</p>
            <button onClick={() => router.replace("/")} className="mt-4 px-4 py-2 bg-red-600 rounded">
              Go Home
            </button>
          </div>
        </div>
      </>
    )

  if (!isQuizStarted)
    return (
      <>
        <Background />
        <div className="relative z-10 min-h-screen flex items-center justify-center font-mono text-white">
          <div className="bg-black/70 border-4 border-white p-6 rounded-lg">
            <p>Waiting for host to start...</p>
          </div>
        </div>
      </>
    )

  return (
    <>
      <Background />
      <div className="relative z-10 min-h-screen flex items-center justify-center font-mono text-white">
        <AnimatePresence>{showMiniGame && <SpaceDodge onComplete={handleMiniGameComplete} />}</AnimatePresence>

        <div className="w-full max-w-4xl mx-auto p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="text-lg">
              Score: <span className="font-bold text-yellow-300">{score}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span className="text-lg">{formatTime(timeLeft)}</span>
            </div>
          </div>

          <Progress value={((currentQuestion + 1) / gameSettings.questionCount) * 100} className="mb-6" />

          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white/10 border-4 border-white/20 p-6 rounded-lg mb-6"
          >
            <h2 className="text-xl mb-4">
              Question {currentQuestion + 1} of {gameSettings.questionCount}
            </h2>
            {question.question_image_url && (
              <div className="mb-6 flex justify-center">
                <Image
                  src={question.question_image_url || "/placeholder.svg"}
                  alt={question.question_image_alt || "Gambar soal"}
                  width={300}
                  height={200}
                  sizes="(max-width: 768px) 100vw, 300px"
                  priority
                  className="max-w-full max-h-64 object-contain rounded-lg border-2 border-white/20"
                  style={{ imageRendering: "pixelated" }}
                />
              </div>
            )}
            <p className="text-lg mb-6">{question.question}</p>

            <div
              className={`grid ${question.choices.length === 3 ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"} gap-4`}
            >
              {question.choices.map((choice, index) => {
                const isSelected = selectedChoiceId === choice.id
                const isRight = choice.is_correct
                let buttonColor: "blue" | "green" | "red" = "blue"

                if (isAnswered) {
                  if (isRight) buttonColor = "green"
                  else if (isSelected && !isRight) buttonColor = "red"
                }

                return (
                  <PixelButton
                    key={choice.id}
                    color={buttonColor}
                    disabled={isAnswered}
                    onClick={() => handleAnswerSelect(choice)}
                    className={`${isAnswered ? "cursor-not-allowed" : ""} ${isAnswered && !isSelected ? "opacity-50" : ""} text-left`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-lg bg-black/30 px-2 py-1 rounded border border-white/20 min-w-[32px] text-center">
                        {String.fromCharCode(65 + index)}
                      </span>
                      <div className="flex-1 flex items-center gap-3">
                        {choice.choice_image_url && (
                          <Image
                            src={choice.choice_image_url || "/placeholder.svg"}
                            alt={choice.choice_image_alt || "Pilihan jawaban"}
                            width={48}
                            height={48}
                            sizes="48px"
                            className="w-12 h-12 object-contain rounded border border-white/20"
                            style={{ imageRendering: "pixelated" }}
                          />
                        )}
                        {choice.choice_text && <span className="flex-1">{choice.choice_text}</span>}
                      </div>
                    </div>
                  </PixelButton>
                )
              })}
            </div>

            <AnimatePresence>
              {showResult && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="mt-6 text-center"
                >
                  <div className={`text-2xl font-bold ${isCorrect ? "text-green-400" : "text-red-400"}`}>
                    {isCorrect ? "✅ Correct!" : "❌ Wrong!"}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </>
  )
}

function Background() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      <div
        className="absolute inset-0 bg-[url('/images/space_bg.jpg')]"
        style={{ backgroundSize: "cover", imageRendering: "pixelated" }}
      />
      <div className="absolute inset-0 bg-black/40" />
    </div>
  )
}
