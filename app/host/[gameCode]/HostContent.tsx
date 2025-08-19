"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { QRCodeSVG } from "qrcode.react"
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
  Trophy,
  Medal,
  Award,
} from "lucide-react"
import { useGameStore } from "@/lib/store"
import { supabase } from "@/lib/supabase"
import { fetchQuizzes } from "@/lib/dummy-data"
import { toast, Toaster } from "sonner"
import Image from "next/image"
import type { Quiz, Player } from "@/lib/types"
import { RulesDialog } from "@/components/rules-dialog"

interface PlayerProgress {
  id: string
  name: string
  avatar: string
  score: number
  currentQuestion: number
  totalQuestions: number
  isActive: boolean
  rank: number
}

interface HostContentProps {
  gameCode: string
}

export default function HostContent({ gameCode }: HostContentProps) {
  const router = useRouter()

  /* ------------------ STATE ------------------ */
  const [gameId, setGameId] = useState<string | null>(null)
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)

  const [players, setPlayers] = useState<Player[]>([])
  const [playerProgress, setPlayerProgress] = useState<PlayerProgress[]>([])

  const [quizStarted, setQuizStarted] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [quizTimeLeft, setQuizTimeLeft] = useState(0)
  const [isTimerActive, setIsTimerActive] = useState(false)

  const [copied, setCopied] = useState(false)
  const [showExitModal, setShowExitModal] = useState(false)
  const [isStarting, setIsStarting] = useState(false)

  /* ------------------ STORE ------------------ */
  const { setGameCode, setQuizId, setIsHost, gameSettings, setGameSettings } = useGameStore()

  const [joinUrl, setJoinUrl] = useState("")

  useEffect(() => {
    setJoinUrl(`${window.location.origin}/wait/${gameCode}`)
  }, [gameCode])

  const calculateRanking = (players: PlayerProgress[]): PlayerProgress[] => {
    return players
      .sort((a, b) => {
        // Primary sort: current question (higher is better)
        if (b.currentQuestion !== a.currentQuestion) {
          return b.currentQuestion - a.currentQuestion
        }
        // Secondary sort: score (higher is better)
        return b.score - a.score
      })
      .map((player, index) => ({
        ...player,
        rank: index + 1,
      }))
  }

  /* ------------------ FETCH DATA ------------------ */
  useEffect(() => {
    const fetchData = async () => {
      const { data: gameData, error: gameErr } = await supabase
        .from("games")
        .select("id, quiz_id, time_limit, question_count, is_started, finished")
        .eq("code", gameCode.toUpperCase())
        .single()

      if (gameErr || !gameData) {
        toast.error("Game not found!")
        router.replace("/")
        return
      }

      setGameId(gameData.id)
      setGameCode(gameCode)
      setQuizId(gameData.quiz_id)
      setGameSettings({ timeLimit: gameData.time_limit, questionCount: gameData.question_count })
      setIsHost(true)
      setQuizStarted(gameData.is_started)
      setShowLeaderboard(gameData.finished)

      const quizzes = await fetchQuizzes()
      const found = quizzes.find((q) => q.id === gameData.quiz_id)
      if (!found) {
        toast.error("Quiz not found!")
        router.replace("/")
        return
      }
      setQuiz(found)
      setLoading(false)
    }
    fetchData()
  }, [gameCode, router, setGameCode, setGameId, setQuizId, setGameSettings, setIsHost])

  /* ------------------ REALTIME & LOGIC ------------------ */
  const fetchPlayers = useCallback(async () => {
    if (!gameId) return
    const { data } = await supabase.from("players").select("*").eq("game_id", gameId)
    if (data) setPlayers(data)
  }, [gameId])

  const updatePlayerProgress = useCallback(async () => {
    if (!gameId || !quiz) return

    console.log("[v0] Updating player progress for gameId:", gameId)

    const [answersResult, playersResult] = await Promise.all([
      supabase
        .from("player_answers")
        .select("player_id, question_index, points_earned, created_at")
        .eq("game_id", gameId)
        .order("created_at", { ascending: true }),
      supabase.from("players").select("*").eq("game_id", gameId),
    ])

    const answers = answersResult.data || []
    const playersData = playersResult.data || []

    console.log("[v0] Player answers:", answers)
    console.log("[v0] Players data:", playersData)

    const progressMap = new Map<string, PlayerProgress>()

    playersData.forEach((player: Player) => {
      const playerAnswers = answers.filter((a) => a.player_id === player.id)
      const score = playerAnswers.reduce((sum, a) => sum + (a.points_earned || 0), 0)

      const answeredQuestions = playerAnswers.length
      const currentQuestion = answeredQuestions + 1 // Next question they're working on
      const isActive = answeredQuestions < quiz.questionCount

      console.log("[v0] Player progress calculation:", {
        name: player.name,
        answeredQuestions,
        currentQuestion,
        totalQuestions: quiz.questionCount,
        score,
        isActive,
        progressPercentage: Math.round((answeredQuestions / quiz.questionCount) * 100),
      })

      progressMap.set(player.id, {
        id: player.id,
        name: player.name,
        avatar: player.avatar || "/placeholder.svg?height=40&width=40&text=Player",
        score,
        currentQuestion: currentQuestion,
        totalQuestions: quiz.questionCount,
        isActive,
        rank: 0,
      })
    })

    const playersArray = Array.from(progressMap.values())
    const rankedPlayers = calculateRanking(playersArray)

    console.log("[v0] Final ranked players:", rankedPlayers)
    setPlayerProgress(rankedPlayers)

    const allDone = rankedPlayers.every((p) => p.currentQuestion > quiz.questionCount)
    if (allDone && rankedPlayers.length > 0 && !showLeaderboard) {
      console.log("[v0] All players finished, ending quiz")
      await supabase.from("games").update({ finished: true }).eq("id", gameId)
    }
  }, [gameId, quiz, showLeaderboard])

  useEffect(() => {
    if (!gameId) return

    const gameSubscription = supabase
      .channel("game_status")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "games", filter: `id=eq.${gameId}` },
        (payload) => {
          console.log("[v0] Game status update:", payload.new)
          if (payload.new.finished) {
            setQuizStarted(false)
            setShowLeaderboard(true)
            toast.success("🎉 Quiz ended!")
          }
          if (payload.new.is_started) {
            setQuizStarted(true)
          }
        },
      )
      .subscribe()

    const playersSubscription = supabase
      .channel("players")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "players", filter: `game_id=eq.${gameId}` },
        () => {
          console.log("[v0] Players table changed")
          fetchPlayers()
          updatePlayerProgress()
        },
      )
      .subscribe()

    const answersSubscription = supabase
      .channel("player_answers")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "player_answers", filter: `game_id=eq.${gameId}` },
        (payload) => {
          console.log("[v0] Player answer submitted:", payload)
          setTimeout(() => {
            updatePlayerProgress()
          }, 100)
        },
      )
      .subscribe()

    fetchPlayers()
    updatePlayerProgress()

    return () => {
      supabase.removeChannel(gameSubscription)
      supabase.removeChannel(playersSubscription)
      supabase.removeChannel(answersSubscription)
    }
  }, [gameId, fetchPlayers, quizStarted, showLeaderboard, updatePlayerProgress])

  useEffect(() => {
    if (quizStarted && gameId && quiz) {
      console.log("[v0] Quiz started, setting up frequent progress updates")
      updatePlayerProgress()

      const interval = setInterval(() => {
        console.log("[v0] Periodic progress update")
        updatePlayerProgress()
      }, 1000) // Update every second during quiz

      return () => clearInterval(interval)
    }
  }, [quizStarted, gameId, quiz, updatePlayerProgress])

  useEffect(() => {
    if (!quizStarted || !gameSettings.timeLimit) return
    const init = async () => {
      const { data } = await supabase.from("games").select("quiz_start_time, time_limit").eq("id", gameId).single()
      if (!data?.quiz_start_time) {
        const startTime = new Date().toISOString()
        await supabase.from("games").update({ quiz_start_time: startTime }).eq("id", gameId)
        setQuizTimeLeft(gameSettings.timeLimit)
      } else {
        const start = new Date(data.quiz_start_time).getTime()
        const elapsed = Math.floor((Date.now() - start) / 1000)
        setQuizTimeLeft(Math.max(0, data.time_limit - elapsed))
      }
      setIsTimerActive(true)
    }
    init()
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

  /* ------------------ HANDLERS ------------------ */
  const handleCopyCode = () => {
    navigator.clipboard.writeText(gameCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const startQuiz = async () => {
    if (players.length === 0) {
      toast.error("❌ No players have joined!")
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
      await supabase
        .from("games")
        .update({
          is_started: false,
          finished: true,
          quiz_start_time: null,
        })
        .eq("id", gameId)

      toast.success("🏁 Quiz ended!")
      setQuizStarted(false)
      setShowLeaderboard(true)
    } catch {
      toast.error("❌ Failed to end quiz")
    }
  }

  const handleExitGame = async () => {
    if (gameId) {
      try {
        console.log("[v0] Host exiting game, gameId:", gameId)

        const updateResult = await supabase
          .from("games")
          .update({
            finished: true,
            is_started: false,
            status: "ended",
            quiz_start_time: null,
          })
          .eq("id", gameId)

        console.log("[v0] Game update result:", updateResult)

        const deleteResult = await supabase.from("players").delete().eq("game_id", gameId)
        console.log("[v0] Players delete result:", deleteResult)

        const { data: verifyGame } = await supabase.from("games").select("*").eq("id", gameId).single()

        console.log("[v0] Game after update:", verifyGame)

        toast.success("🚪 Game session ended")
      } catch (error) {
        console.error("Error ending game session:", error)
        toast.error("❌ Failed to end session properly")
      }
    }
    router.push("/")
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const PodiumLeaderboard = ({
    animateOnce,
    onAnimationComplete,
  }: {
    animateOnce: boolean
    onAnimationComplete: () => void
  }) => {
    const sorted = [...playerProgress].sort((a, b) => b.score - a.score)
    const [second, first, third] = [
      sorted[1] || { name: "No Player", score: 0, avatar: "/placeholder.svg" },
      sorted[0] || { name: "No Player", score: 0, avatar: "/placeholder.svg" },
      sorted[2] || { name: "No Player", score: 0, avatar: "/placeholder.svg" },
    ]
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
                  src={p.avatar || "/placeholder.svg"}
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
                  <span>
                    {idx + 4}. {p.name}
                  </span>
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

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-400" />
      case 2:
        return <Medal className="w-5 h-5 text-gray-300" />
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-white/70">#{rank}</span>
    }
  }

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "border-yellow-400 bg-yellow-400/10"
      case 2:
        return "border-gray-300 bg-gray-300/10"
      case 3:
        return "border-amber-600 bg-amber-600/10"
      default:
        return "border-white/30 bg-white/5"
    }
  }

  /* ------------------ RENDER ------------------ */
  if (loading)
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-gray-900 via-indigo-950 to-black flex items-center justify-center font-mono text-white">
        <AnimatedStars />
        <div className="relative z-10 text-white font-mono text-lg">Loading quiz...</div>
      </div>
    )

  if (!quiz)
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-gray-900 via-indigo-950 to-black flex items-center justify-center font-mono text-white">
        <AnimatedStars />
        <div className="relative z-10 bg-white/10 border-2 border-white/30 p-8 text-center font-mono text-white rounded-lg backdrop-blur-sm">
          <p className="mb-4">Quiz not found.</p>
          <PixelButton onClick={() => router.push("/")}>Back</PixelButton>
        </div>
      </div>
    )

  return (
    <>
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
      <RulesDialog
        open={false}
        onOpenChange={() => {}}
        quiz={quiz}
        onStartGame={() => {}}
        aria-describedby="rules-description"
      />

      {/* Background with animated galaxy theme */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-indigo-950 to-black" />
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute top-3/4 right-1/4 w-80 h-80 bg-indigo-600/8 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          />
          <div
            className="absolute bottom-1/4 left-1/2 w-64 h-64 bg-violet-600/6 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "2s" }}
          />
        </div>
        <AnimatedStars />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 min-h-screen font-mono text-white">
        {showLeaderboard ? (
          <PodiumLeaderboard animateOnce={true} onAnimationComplete={() => {}} />
        ) : !quizStarted ? (
          /* ---------- WAITING ROOM ---------- */
          <div className="grid lg:grid-cols-2 gap-8">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <div className="bg-white/10 border-2 border-white/20 p-6 rounded-lg backdrop-blur-sm">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <QrCode className="w-5 h-5" /> Game Code
                </h2>

                <div className="flex gap-4 justify-center mb-4">
                  <div className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    <Timer className="w-4 h-4" />
                    {formatTime(gameSettings.timeLimit)}
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
              <div className="bg-white/10 border-2 border-white/20 p-6 rounded-lg backdrop-blur-sm">
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
                        className="bg-white/10 rounded-lg p-4 flex items-center gap-3 backdrop-blur-sm"
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
              <div className="bg-white/10 border-2 border-white/20 p-6 rounded-lg flex items-center justify-between backdrop-blur-sm">
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
              className="bg-white/10 border-2 border-white/20 rounded-lg p-6 backdrop-blur-sm"
            >
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-400" /> Live Player Rankings
              </h2>

              {playerProgress.length === 0 ? (
                <div className="text-center py-8 text-white/60">
                  <UsersRound className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No players found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {playerProgress
                    .sort((a, b) => a.rank - b.rank)
                    .map((player, index) => (
                      <motion.div
                        key={player.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          duration: 0.5,
                          delay: index * 0.1,
                          layout: { duration: 0.3 },
                        }}
                        className={`relative overflow-hidden rounded-xl border-2 ${getRankColor(player.rank)} backdrop-blur-sm transition-all duration-300 hover:scale-[1.02]`}
                      >
                        <div className="absolute top-4 left-4 z-10">
                          <div
                            className={`flex items-center justify-center w-10 h-10 rounded-full ${
                              player.rank === 1
                                ? "bg-yellow-400/20 border-2 border-yellow-400"
                                : player.rank === 2
                                  ? "bg-gray-300/20 border-2 border-gray-300"
                                  : player.rank === 3
                                    ? "bg-amber-600/20 border-2 border-amber-600"
                                    : "bg-white/10 border-2 border-white/30"
                            }`}
                          >
                            {getRankIcon(player.rank)}
                          </div>
                        </div>

                        <div className="p-6 pl-20">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                              <Image
                                src={player.avatar || "/placeholder.svg"}
                                alt={player.name}
                                width={60}
                                height={60}
                                className="rounded-full border-3 border-white/40 object-cover shadow-lg"
                              />
                              <div>
                                <h3 className="text-xl font-bold text-white mb-1">{player.name}</h3>
                                <div className="flex items-center gap-4 text-sm">
                                  <span className="text-green-400 font-semibold">{player.score} points</span>
                                  <span>
                                    Question {player.currentQuestion}/{player.totalQuestions}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-2xl font-bold text-white mb-1">
                                {Math.round(((player.currentQuestion - 1) / player.totalQuestions) * 100)}%
                              </div>
                              <div className="text-xs text-white/60">Complete</div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-xs text-white/70">
                              <span>Progress</span>
                              <span>
                                {player.currentQuestion - 1}/{player.totalQuestions} questions
                              </span>
                            </div>
                            <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{
                                  width: `${player.totalQuestions > 0 ? ((player.currentQuestion - 1) / player.totalQuestions) * 100 : 0}%`,
                                }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className={`h-full rounded-full ${
                                  player.rank === 1
                                    ? "bg-gradient-to-r from-yellow-400 to-yellow-600"
                                    : player.rank === 2
                                      ? "bg-gradient-to-r from-gray-300 to-gray-500"
                                      : player.rank === 3
                                        ? "bg-gradient-to-r from-amber-500 to-amber-700"
                                        : "bg-gradient-to-r from-blue-400 to-blue-600"
                                }`}
                              />
                              <div
                                className={`absolute inset-0 ${
                                  player.rank <= 3 ? "animate-pulse" : ""
                                } bg-gradient-to-r from-transparent via-white/20 to-transparent`}
                              />
                            </div>
                          </div>

                          <div className="mt-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  player.isActive ? "bg-green-400 animate-pulse" : "bg-gray-400"
                                }`}
                              />
                              <span className="text-xs text-white/70">{player.isActive ? "Active" : "Finished"}</span>
                            </div>

                            <div className="text-xs text-white/50">Rank #{player.rank}</div>
                          </div>
                        </div>

                        {player.rank === 1 && (
                          <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/5 via-transparent to-yellow-400/5 animate-pulse" />
                          </div>
                        )}
                      </motion.div>
                    ))}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </div>

      {/* Modal Exit */}
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
              className="bg-[#1a1a2e] border-4 border-white font-mono text-white p-8 rounded-lg shadow-[8px_8px_0px_#000] max-w-md w-full mx-4 backdrop-blur-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="text-4xl mb-4">⚠️</div>
                <h2 className="text-xl mb-4 font-bold">Exit Game?</h2>
                <p className="text-sm mb-6 text-white/80">
                  Are you sure you want to exit? The game session will end immediately and all players will be
                  disconnected.
                </p>
                <div className="flex justify-center gap-4">
                  <PixelButton color="gray" onClick={() => setShowExitModal(false)}>
                    Cancel
                  </PixelButton>
                  <PixelButton color="red" onClick={handleExitGame}>
                    End Session
                  </PixelButton>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// Animated Stars Component
const AnimatedStars = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {Array.from({ length: 50 }).map((_, i) => (
        <motion.div
          key={`star-${i}`}
          className="absolute w-1 h-1 bg-white rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            opacity: [0.3, 1, 0.3],
            scale: [0.5, 1.2, 0.5],
          }}
          transition={{
            duration: 2 + Math.random() * 3,
            repeat: Number.POSITIVE_INFINITY,
            delay: Math.random() * 2,
          }}
        />
      ))}
      {Array.from({ length: 100 }).map((_, i) => (
        <div
          key={`twinkle-${i}`}
          className="absolute w-0.5 h-0.5 bg-white rounded-full opacity-60"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
          }}
        />
      ))}
      {Array.from({ length: 3 }).map((_, i) => (
        <motion.div
          key={`shooting-${i}`}
          className="absolute w-1 h-0.5 bg-gradient-to-r from-white to-transparent rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 50}%`,
          }}
          animate={{
            x: [0, 200],
            y: [0, 100],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Number.POSITIVE_INFINITY,
            delay: i * 4 + Math.random() * 2,
            repeatDelay: 8,
          }}
        />
      ))}
    </div>
  )
}

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
