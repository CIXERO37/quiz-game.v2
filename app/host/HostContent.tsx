/* eslint-disable @next/next/no-img-element */
"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Play,
  Users,
  QrCode,
  Clock,
  UsersRound,
  Timer,
  HelpCircle,
  Copy,
  Check,
} from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import { useGameStore } from "@/lib/store"
import { supabase } from "@/lib/supabase"
import { fetchQuizzes } from "@/lib/dummy-data"
import { toast, Toaster } from "sonner"
import Image from "next/image"
import { Progress } from "@/components/ui/progress"
import type { Quiz, Player } from "@/lib/types"
import { RulesDialog } from "@/components/rules-dialog"
import { createGame } from "@/lib/game-utils"
import type { GameSettings } from "@/lib/types"

// Pixel Button Component
function PixelButton({
  color = "blue",
  size = "md",
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  color?: string
  size?: string
}) {
  const colorStyles: Record<string, string> = {
    red: "bg-red-500 border-red-700 text-white hover:bg-red-600 active:bg-red-700",
    green: "bg-green-500 border-green-700 text-white hover:bg-green-600 active:bg-green-700",
    blue: "bg-blue-500 border-blue-700 text-white hover:bg-blue-600 active:bg-blue-700",
    yellow: "bg-yellow-400 border-yellow-600 text-black hover:bg-yellow-500 active:bg-yellow-600",
    gray: "bg-gray-500 border-gray-700 text-white hover:bg-gray-600 active:bg-gray-700",
  }

  const sizeStyles: Record<string, string> = {
    sm: "px-3 py-2 text-xs",
    md: "px-4 py-3 text-sm",
    lg: "px-6 py-4 text-base",
  }

  return (
    <button
      className={`border-2 font-mono uppercase tracking-wide shadow-[4px_4px_0px_rgba(0,0,0,0.8)] active:shadow-[2px_2px_0px_rgba(0,0,0,0.8)] active:translate-x-[2px] active:translate-y-[2px] transition-all ${colorStyles[color]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

interface PlayerProgress {
  id: string
  name: string
  avatar: string
  score: number
  currentQuestion: number
  totalQuestions: number
  isActive: boolean
}

export default function HostContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const gameId = searchParams.get("gameId")
  const gameCode = searchParams.get("gameCode")
  const quizId = searchParams.get("quizId")

  useEffect(() => {
    if (!gameId || !gameCode || !quizId) {
      router.replace("/")
    }
  }, [gameId, gameCode, quizId, router])

  const [isStarting, setIsStarting] = useState(false)
  const [playerProgress, setPlayerProgress] = useState<PlayerProgress[]>([])
  const [quizStarted, setQuizStarted] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showExitModal, setShowExitModal] = useState(false)
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [showRulesDialog, setShowRulesDialog] = useState(false)
  const [quizTimeLeft, setQuizTimeLeft] = useState(0)
  const [isTimerActive, setIsTimerActive] = useState(false)
  const [leaderboardAnimated, setLeaderboardAnimated] = useState(false)

  function handleAnimationComplete() {
    setLeaderboardAnimated(true)
  }

  const {
    gameCode: storedGameCode,
    gameId: storedGameId,
    quizId: storedQuizId,
    players,
    setPlayers,
    gameSettings,
    setGameSettings,
    setGameCode,
    setGameId,
    setQuizId,
    setIsHost,
  } = useGameStore()

  const joinUrl =
    typeof window !== "undefined"
      ? `${window.location.protocol}//${window.location.host}?code=${gameCode}`
      : `https://${process.env.NEXT_PUBLIC_VERCEL_URL || "localhost:3000"}?code=${gameCode}`

  useEffect(() => {
    if (!gameId || !gameCode) {
      setShowRulesDialog(true)
      return
    }
    const fetchGameData = async () => {
      try {
        const { data: gameData } = await supabase.from("games").select("*").eq("id", gameId).single()
        if (gameData) {
          setGameSettings({
            timeLimit: gameData.time_limit,
            questionCount: gameData.question_count,
          })
          setIsHost(true)
        }
      } catch {
        setShowRulesDialog(true)
      }
    }
    fetchGameData()
  }, [gameId, gameCode, setGameSettings, setIsHost])

  useEffect(() => {
    if (!quizId) {
      toast.error("Missing quiz data.")
      router.push("/")
      return
    }
    const loadQuiz = async () => {
      setLoading(true)
      try {
        const quizzes = await fetchQuizzes()
        const found = quizzes.find((q) => q.id === Number(quizId))
        if (!found) {
          toast.error("Quiz not found.")
          router.push("/")
        } else {
          setQuiz(found)
        }
      } catch {
        toast.error("Failed to load quiz.")
        router.push("/")
      } finally {
        setLoading(false)
      }
    }
    loadQuiz()
  }, [quizId, router])

  const handleStartGame = async (settings: GameSettings) => {
    if (
      typeof settings.timeLimit !== "number" ||
      typeof settings.questionCount !== "number" ||
      settings.timeLimit <= 0 ||
      settings.questionCount <= 0
    ) {
      toast.error("Invalid game settings")
      return
    }
    try {
      setLoading(true)
      const defaultQuizId = 1
      const hostId = "host-" + Date.now()
      const gameData = await createGame(defaultQuizId, hostId, settings)
      setGameId(gameData.gameId)
      setGameCode(gameData.gameCode)
      setQuizId(defaultQuizId)
      setGameSettings({
        timeLimit: gameData.timeLimit,
        questionCount: gameData.questionCount,
      })
      setIsHost(true)
      setShowRulesDialog(false)
      toast.success("🎮 Game created successfully!")
    } catch {
      toast.error("❌ Failed to create game")
    } finally {
      setLoading(false)
    }
  }

  const fetchPlayers = useCallback(async () => {
    if (!gameId) return
    const { data } = await supabase.from("players").select("*").eq("game_id", gameId)
    if (data) setPlayers(data)
  }, [gameId, setPlayers])

  const updatePlayerProgress = useCallback(async () => {
    if (!gameId || !quiz) return
    const { data: answers } = await supabase
      .from("player_answers")
      .select("player_id, question_index, points_earned")
      .eq("game_id", gameId)

    const { data: playersData } = await supabase.from("players").select("*").eq("game_id", gameId)

    const progressMap = new Map<string, PlayerProgress>()
    playersData?.forEach((player: Player) => {
      const playerAnswers = answers?.filter((a) => a.player_id === player.id) || []
      const score = playerAnswers.reduce((sum, a) => sum + (a.points_earned || 0), 0)
      const currentQuestion = playerAnswers.length
      progressMap.set(player.id, {
        id: player.id,
        name: player.name,
        avatar: player.avatar || "/placeholder.svg?height=40&width=40&text=Player",
        score,
        currentQuestion,
        totalQuestions: quiz.questionCount,
        isActive: currentQuestion < quiz.questionCount,
      })
    })
    setPlayerProgress(Array.from(progressMap.values()))

    const sudahSelesai = Array.from(progressMap.values()).some((p) => p.currentQuestion >= quiz.questionCount)
    if (sudahSelesai && !showLeaderboard) {
      await supabase.from("games").update({ is_started: false, finished: true }).eq("id", gameId)
    }
  }, [gameId, quiz, showLeaderboard])

  useEffect(() => {
    if (!gameId) return
    const gameSubscription = supabase
      .channel("game_status")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "games", filter: `id=eq.${gameId}` }, (payload) => {
        if (payload.new.finished) {
          setQuizStarted(false)
          setShowLeaderboard(true)
          toast.success("🎉 Quiz ended!")
        }
      })
      .subscribe()

    const playersSubscription = supabase
      .channel("players")
      .on("postgres_changes", { event: "*", schema: "public", table: "players", filter: `game_id=eq.${gameId}` }, () => {
        fetchPlayers()
      })
      .subscribe()

    let answersSubscription: any = null
    if (!showLeaderboard) {
      answersSubscription = supabase
        .channel("player_answers")
        .on("postgres_changes", { event: "*", schema: "public", table: "player_answers", filter: `game_id=eq.${gameId}` }, () => {
          if (quizStarted) setTimeout(updatePlayerProgress, 1000)
        })
        .subscribe()
    }

    fetchPlayers()
    return () => {
      supabase.removeChannel(gameSubscription)
      supabase.removeChannel(playersSubscription)
      if (answersSubscription) supabase.removeChannel(answersSubscription)
    }
  }, [gameId, fetchPlayers, quizStarted, showLeaderboard])

  useEffect(() => {
    if (quizStarted && gameId && quiz) updatePlayerProgress()
  }, [quizStarted, gameId, quiz])

  useEffect(() => {
    if (!quizStarted || !gameSettings.timeLimit) return
    const initializeTimer = async () => {
      try {
        const { data } = await supabase.from("games").select("quiz_start_time, time_limit").eq("id", gameId).single()
        if (!data?.quiz_start_time) {
          const startTime = new Date().toISOString()
          await supabase.from("games").update({ quiz_start_time: startTime }).eq("id", gameId)
          setQuizTimeLeft(gameSettings.timeLimit)
        } else {
          const startTime = new Date(data.quiz_start_time).getTime()
          const elapsed = Math.floor((Date.now() - startTime) / 1000)
          setQuizTimeLeft(Math.max(0, data.time_limit - elapsed))
        }
        setIsTimerActive(true)
      } catch {
        setQuizTimeLeft(gameSettings.timeLimit)
        setIsTimerActive(true)
      }
    }
    initializeTimer()
  }, [quizStarted, gameSettings.timeLimit, gameId])

  useEffect(() => {
    if (!isTimerActive || quizTimeLeft <= 0) return
    const timer = setInterval(() => {
      setQuizTimeLeft((prev) => {
        if (prev <= 1) {
          setIsTimerActive(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [isTimerActive, quizTimeLeft])

  const handleCopyCode = () => {
    navigator.clipboard.writeText(gameCode ?? "")
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const startQuiz = async () => {
    if (players.length === 0) {
      toast.error("❌ No players have joined yet!")
      return
    }
    setIsStarting(true)
    try {
      await supabase.from("games").update({ is_started: true }).eq("id", gameId)
      setQuizStarted(true)
      toast.success("🚀 Quiz started!")
    } catch {
      toast.error("❌ Failed to start quiz")
    } finally {
      setIsStarting(false)
    }
  }

  const endQuiz = async () => {
    try {
      await supabase.from("games").update({ is_started: false, finished: true }).eq("id", gameId)
      toast.success("🏁 Quiz ended!")
      setQuizStarted(false)
      setShowLeaderboard(true)
    } catch {
      toast.error("❌ Failed to end quiz")
    }
  }

  const handleExitGame = async () => {
    try {
      if (gameId) {
        await supabase.from("games").update({ is_started: false, finished: true }).eq("id", gameId)
      }
      router.push("/")
    } catch {
      router.push("/")
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const PodiumLeaderboard = ({ animateOnce, onAnimationComplete }: {
    animateOnce: boolean
    onAnimationComplete: () => void
  }) => {
    const sorted = [...playerProgress].sort((a, b) => b.score - a.score)
    const first = sorted[0] || { name: "No Player", score: 0, avatar: "/placeholder.svg" }
    const second = sorted[1] || { name: "No Player", score: 0, avatar: "/placeholder.svg" }
    const third = sorted[2] || { name: "No Player", score: 0, avatar: "/placeholder.svg" }
    const rest = sorted.slice(3)

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        onAnimationComplete={animateOnce ? onAnimationComplete : undefined}
        className="min-h-screen flex items-center justify-center p-4"
      >
        <div className="text-center">
          <motion.h1 className="text-5xl font-bold mb-12 text-yellow-300 drop-shadow-[4px_4px_0px_#000]">
            🏆 CHAMPIONS 🏆
          </motion.h1>
          <div className="flex items-end justify-center gap-8">
            {[second, first, third].map((p, i) => (
              <div key={i} className="flex flex-col items-center">
                <Image
                  src={p.avatar}
                  alt={p.name}
                  width={i === 1 ? 160 : 128}
                  height={i === 1 ? 160 : 128}
                  className="rounded-full border-4 border-white object-cover"
                />
                <p className="font-bold mt-2">{p.name}</p>
                <p className="text-lg font-bold">{p.score} pts</p>
              </div>
            ))}
          </div>
          {rest.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl mb-4">Others</h2>
              {rest.map((p, idx) => (
                <div key={p.id} className="flex items-center justify-center gap-4">
                  <span>{idx + 4}. {p.name}</span>
                  <span>{p.score}</span>
                </div>
              ))}
            </div>
          )}
          <PixelButton color="blue" className="mt-8" onClick={() => router.push("/")}>
            Back to Dashboard
          </PixelButton>
        </div>
      </motion.div>
    )
  }

  if (loading)
    return (
      <div className="fixed inset-0 bg-[#87CEEB] flex items-center justify-center font-mono text-white">
        <div className="text-white font-mono text-lg">Loading quiz...</div>
      </div>
    )

  if (!quiz)
    return (
      <div className="fixed inset-0 bg-[#87CEEB] flex items-center justify-center font-mono text-white">
        <div className="bg-white/10 border-2 border-white/30 p-8 text-center font-mono text-white rounded-lg">
          <p className="mb-4">Quiz not found.</p>
          <PixelButton onClick={() => router.push("/")}>Back</PixelButton>
        </div>
      </div>
    )

  return (
    <>
      <RulesDialog
        open={showRulesDialog}
        onOpenChange={setShowRulesDialog}
        quiz={quiz}
        onStartGame={handleStartGame}
        aria-describedby="rules-description"
      />

      <div className="fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[#87CEEB]" style={{ imageRendering: "pixelated" }} />
        <div className="absolute bottom-0 w-full h-1/3 bg-[#8B4513]" style={{ imageRendering: "pixelated" }}>
          <div className="absolute top-0 w-full h-6 bg-[#228B22]" style={{ imageRendering: "pixelated" }} />
        </div>
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 min-h-screen font-mono text-white">
        {showLeaderboard ? (
          <PodiumLeaderboard
            animateOnce={!leaderboardAnimated}
            onAnimationComplete={handleAnimationComplete}
          />
        ) : !quizStarted ? (
          /* ---------- WAITING ROOM ---------- */
          <div className="grid lg:grid-cols-2 gap-8">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <div className="bg-white/10 border-2 border-white/20 p-6 rounded-lg">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <QrCode className="w-5 h-5" /> Game Code
                </h2>

                <div className="flex gap-4 justify-center mb-4">
                  <div className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    <Timer className="w-4 h-4" />
                    {(() => {
                      const totalSeconds = gameSettings.timeLimit
                      const minutes = Math.floor(totalSeconds / 60)
                      const seconds = totalSeconds % 60
                      if (minutes > 0) {
                        return seconds > 0 ? `${minutes}m ${seconds}s total` : `${minutes}m total`
                      }
                      return `${totalSeconds}s total`
                    })()}
                  </div>
                  <div className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                    <HelpCircle className="w-4 h-4" />
                    {gameSettings.questionCount} questions
                  </div>
                </div>

                <div className="text-center">
                  <div className="relative inline-block">
                    <div className="text-5xl font-mono font-bold bg-white text-black rounded-lg py-8 px-12 mb-4 pr-16 w-[400px]">
                      {gameCode}
                    </div>
                    <button
                      onClick={handleCopyCode}
                      className="absolute top-2 right-2 p-2 hover:bg-gray-100 rounded transition-colors"
                      title="Copy game code"
                    >
                      {copied ? (
                        <Check className="w-5 h-5 text-green-600" />
                      ) : (
                        <Copy className="w-5 h-5 text-gray-600" />
                      )}
                    </button>
                  </div>

                  <div className="relative inline-block">
                    <div className="bg-white text-black rounded-lg py-8 px-12 mb-4 pr-16 w-[400px] flex justify-center items-center">
                      <QRCodeSVG value={joinUrl} size={180} />
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <PixelButton color="red" size="sm" onClick={() => setShowExitModal(true)}>
                      ❌ Exit Game
                    </PixelButton>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div className="bg-white/10 border-2 border-white/20 p-6 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <Users className="w-5 h-5" /> Players ({players.length})
                  </h2>
                  <PixelButton color="green" onClick={startQuiz} disabled={players.length === 0 || isStarting}>
                    <Play className="w-4 h-4 inline-block mr-2" /> Start Quiz
                  </PixelButton>
                </div>

                {players.length === 0 ? (
                  <div className="text-center py-12 text-white/60">
                    <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Waiting for players to join...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {players.map((player, index) => (
                      <motion.div
                        key={player.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white/10 rounded-lg p-4 flex items-center gap-3"
                      >
                        <Image
                          src={player.avatar || "/placeholder.svg?height=48&width=48&text=Player"}
                          alt={player.name}
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-full border-2 border-white/30 object-cover"
                        />
                        <div className="flex-1">
                          <h3 className="font-bold">{player.name}</h3>
                          <p className="text-sm text-white/70">Ready</p>
                        </div>
                        <span className="text-green-400 text-xs">✔</span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        ) : (
          /* ---------- PLAYER PROGRESS ---------- */
          <div className="space-y-8">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="bg-white/10 border-2 border-white/20 p-6 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Clock className="w-5 h-5" />
                  <span className="text-lg">Quiz - Game {gameCode}</span>
                  <div className="flex gap-3 ml-4">
                    <div className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      <Timer className="w-4 h-4" />
                      {formatTime(gameSettings.timeLimit)}
                    </div>
                    <div className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                      <HelpCircle className="w-4 h-4" />
                      {gameSettings.questionCount} questions
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-white">
                    <Clock className="w-5 h-5" />
                    <span className="text-lg font-mono">{formatTime(quizTimeLeft)}</span>
                  </div>
                  <PixelButton color="red" onClick={endQuiz}>
                    ⏹ End Quiz
                  </PixelButton>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/10 border-2 border-white/20 rounded-lg p-4"
            >
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                <UsersRound className="w-5 h-5" /> Players Progress
              </h2>

              {playerProgress.length === 0 ? (
                <div className="text-center py-8 text-white/60">
                  <UsersRound className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No players found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {playerProgress.map((p) => (
                    <motion.div
                      key={p.id}
                      className="flex flex-col gap-3 bg-white/5 rounded p-3"
                    >
                      <div className="flex items-center gap-3">
                        <Image
                          src={p.avatar}
                          alt={p.name}
                          width={40}
                          height={40}
                          className="rounded-full border-2 border-white/30 object-cover"
                        />
                        <div className="flex-1">
                          <p className="font-bold">{p.name}</p>
                          <p className="text-sm text-white/70">{p.score} pts</p>
                        </div>
                        <p className="text-sm text-white/70">
                          Q {p.currentQuestion}/{p.totalQuestions}
                        </p>
                      </div>
                      <Progress value={(p.currentQuestion / p.totalQuestions) * 100} className="w-full" />
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}

        <AnimatePresence>
          {showExitModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
              onClick={() => setShowExitModal(false)}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-[#1a1a2e] border-4 border-white font-mono text-white p-8 rounded-lg shadow-[8px_8px_0px_#000] max-w-md w-full mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center">
                  <div className="text-4xl mb-4">⚠️</div>
                  <h2 className="text-xl mb-4 font-bold">Exit Game?</h2>
                  <p className="text-sm mb-6 text-white/80">
                    Are you sure you want to exit? All game progress will be lost and players will be disconnected.
                  </p>
                  <div className="flex justify-center gap-4">
                    <PixelButton color="gray" onClick={() => setShowExitModal(false)}>
                      Cancel
                    </PixelButton>
                    <PixelButton color="red" onClick={handleExitGame}>
                      Exit Game
                    </PixelButton>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            fontFamily: "Press Start 2P",
            fontSize: "12px",
            background: "#222",
            color: "#fff",
            border: "2px solid #fff",
          },
        }}
      />
      {/* komen */}
    </>
  )
}