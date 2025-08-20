"use client"

import React from "react"
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

// ✅ Memoised PodiumLeaderboard
const PodiumLeaderboard = React.memo(
  ({
    players,
    onAnimationComplete,
  }: {
    players: PlayerProgress[]
    onAnimationComplete: () => void
  }) => {
    const router = useRouter()
    const [hasAnimated, setHasAnimated] = useState(false)

    const sorted = [...players].sort((a, b) => b.score - a.score)
    const [second, first, third] = [
      sorted[1] || { name: "No Player", score: 0, avatar: "/placeholder.svg" },
      sorted[0] || { name: "No Player", score: 0, avatar: "/placeholder.svg" },
      sorted[2] || { name: "No Player", score: 0, avatar: "/placeholder.svg" },
    ]
    const rest = sorted.slice(3)

    useEffect(() => {
      if (!hasAnimated) {
        setHasAnimated(true)
        onAnimationComplete()
      }
    }, [hasAnimated, onAnimationComplete])

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
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
  },
)
PodiumLeaderboard.displayName = "PodiumLeaderboard"

export default function HostContent({ gameCode }: HostContentProps) {
  const router = useRouter()
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
  const [mounted, setMounted] = useState(false)

  const [countdownLeft, setCountdownLeft] = useState<number | null>(null)

  const { setGameCode, setQuizId, setIsHost, gameSettings, setGameSettings } = useGameStore()

  const [joinUrl, setJoinUrl] = useState("")

  useEffect(() => {
    setMounted(true)
    setJoinUrl(`${window.location.origin}/?code=${gameCode}`)
  }, [gameCode])

  const calculateRanking = (players: PlayerProgress[]): PlayerProgress[] => {
    return players
      .sort((a, b) => b.score - a.score)
      .map((player, index) => ({
        ...player,
        rank: index + 1,
      }))
  }

  useEffect(() => {
    const fetchData = async () => {
      if (!gameCode || typeof gameCode !== "string") {
        toast.error("Invalid game code!")
        router.replace("/")
        return
      }

      const { data: gameData, error: gameErr } = await supabase
        .from("games")
        .select("id, quiz_id, time_limit, question_count, is_started, finished, countdown_start_at")
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

  const updatePlayerProgress = useCallback(async () => {
    if (!gameId || !quiz) return

    const [answersResult, playersResult] = await Promise.all([
      supabase
        .from("player_answers")
        .select("*")
        .eq("game_id", gameId)
        .not("question_index", "eq", -1),
      supabase.from("players").select("*").eq("game_id", gameId),
    ])

    const answers = answersResult.data || []
    const playersData = playersResult.data || []

    const progressMap = new Map<string, PlayerProgress>()

    playersData.forEach((player: Player) => {
      const playerAnswers = answers.filter(
        (a) => a.player_id === player.id && a.question_index >= 0
      )

      const uniqueQuestionIndices = new Set(playerAnswers.map(a => a.question_index))
      const answeredQuestions = uniqueQuestionIndices.size
      const totalQuestions = gameSettings.questionCount || quiz.questionCount || 10

      const calculatedScore = playerAnswers.reduce((sum, a) => sum + (a.points_earned || 0), 0)
      const score = player.score || calculatedScore

      progressMap.set(player.id, {
        id: player.id,
        name: player.name,
        avatar: player.avatar || "/placeholder.svg?height=40&width=40&text=Player",
        score,
        currentQuestion: answeredQuestions,
        totalQuestions,
        isActive: answeredQuestions < totalQuestions,
        rank: 0,
      })
    })

    const sorted = Array.from(progressMap.values()).sort((a, b) => b.score - a.score)
    const ranked = sorted.map((p, idx) => ({ ...p, rank: idx + 1 }))
    setPlayerProgress(ranked)

    const allPlayersCompleted = ranked.every((p) => p.currentQuestion >= p.totalQuestions)
    if (allPlayersCompleted && ranked.length > 0 && !showLeaderboard) {
      await supabase.from("games").update({ finished: true, is_started: false }).eq("id", gameId)
      setShowLeaderboard(true)
      toast.success("🎉 All players have completed the quiz!")
    }
  }, [gameId, quiz, showLeaderboard, gameSettings.questionCount])

  const fetchPlayers = useCallback(async () => {
    if (!gameId) return

    const { data: playersData, error } = await supabase.from("players").select("*").eq("game_id", gameId)

    if (error) {
      console.error("Error fetching players:", error)
      return
    }

    setPlayers(playersData || [])
  }, [gameId])

  useEffect(() => {
    if (!gameId) return

    const gameSubscription = supabase
      .channel("game_status")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "games", filter: `id=eq.${gameId}` },
        (payload) => {
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
          fetchPlayers()
          updatePlayerProgress()
        },
      )
      .subscribe()

    // Tambahan: Subscription untuk player_answers
    const answersSubscription = supabase
      .channel("player_answers")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "player_answers", filter: `game_id=eq.${gameId}` },
        () => {
          updatePlayerProgress()
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
  }, [gameId, fetchPlayers, updatePlayerProgress])

  useEffect(() => {
    if (!quizStarted || !gameSettings?.timeLimit) return

    let unsub = () => { }
      ; (async () => {
        const { data } = await supabase.from("games").select("quiz_start_time, time_limit").eq("id", gameId).single()

        if (!data?.quiz_start_time) return

        const start = new Date(data.quiz_start_time).getTime()
        const limitMs = data.time_limit * 1000

        const tick = () => {
          const remain = Math.max(0, start + limitMs - Date.now())
          setQuizTimeLeft(Math.floor(remain / 1000))
          if (remain <= 0) setIsTimerActive(false)
        }

        tick()
        const iv = setInterval(tick, 1000)
        unsub = () => clearInterval(iv)
      })()

    return unsub
  }, [quizStarted, gameSettings?.timeLimit, gameId])

  useEffect(() => {
    if (!quizStarted || !gameId) return

    const tick = async () => {
      const { data } = await supabase.from("games").select("countdown_start_at").eq("id", gameId).single()

      if (!data?.countdown_start_at) return

      const start = new Date(data.countdown_start_at).getTime()
      const elapsed = Math.floor((Date.now() - start) / 1000)
      const left = Math.max(0, 10 - elapsed)
      setCountdownLeft(left)
    }

    tick()
    const iv = setInterval(tick, 500)
    return () => clearInterval(iv)
  }, [quizStarted, gameId, gameCode])

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
      const startAt = new Date().toISOString()
      await supabase
        .from("games")
        .update({
          is_started: true,
          countdown_start_at: startAt,
          quiz_start_time: startAt,
        })
        .eq("id", gameId)
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
        await supabase
          .from("games")
          .update({
            finished: true,
            is_started: false,
            status: "ended",
            quiz_start_time: null,
          })
          .eq("id", gameId)

        await supabase.from("players").delete().eq("game_id", gameId)
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

  if (!gameCode) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-gray-900 via-indigo-950 to-black flex items-center justify-center font-mono text-white">
        <div className="text-lg">Invalid game code</div>
      </div>
    )
  }

  if (loading)
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-gray-900 via-indigo-950 to-black flex items-center justify-center font-mono text-white">
        {mounted && <StaticBackground />}
        <div className="relative z-10 text-white font-mono text-lg">Loading quiz...</div>
      </div>
    )

  if (!quiz)
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-gray-900 via-indigo-950 to-black flex items-center justify-center font-mono text-white">
        {mounted && <StaticBackground />}
        <div className="absolute inset-0 bg-white/10 border-2 border-white/30 p-8 text-center font-mono text-white rounded-lg backdrop-blur-sm">
          <p className="mb-4">Quiz not found.</p>
          <PixelButton onClick={() => router.push("/")}>Back</PixelButton>
        </div>
      </div>
    )

  if (countdownLeft !== null && countdownLeft > 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-black/90 border-4 border-white p-12 rounded-lg text-center font-mono text-white"
        >
          <p className="text-3xl mb-4 font-bold">Quiz Starting!</p>
          <motion.div
            key={countdownLeft}
            initial={{ scale: 1.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, type: "spring" }}
            className="text-9xl font-bold text-yellow-300"
            style={{ textShadow: "4px 4px 0px #000" }}
          >
            {countdownLeft}
          </motion.div>
        </motion.div>
      </div>
    )
  }

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
        onOpenChange={() => { }}
        quiz={quiz}
        onStartGame={() => { }}
        aria-describedby="rules-description"
      />

      <div className="fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice">
            <defs>
              <radialGradient id="galaxy1" cx="20%" cy="30%" r="80%">
                <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.7" />
                <stop offset="50%" stopColor="#1e40af" stopOpacity="0.4" />
                <stop offset="100%" stopColor="transparent" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="galaxy2" cx="80%" cy="70%" r="65%">
                <stop offset="0%" stopColor="#ec4899" stopOpacity="0.6" />
                <stop offset="50%" stopColor="#581c87" stopOpacity="0.3" />
                <stop offset="100%" stopColor="transparent" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="galaxy3" cx="60%" cy="10%" r="55%">
                <stop offset="0%" stopColor="#059669" stopOpacity="0.5" />
                <stop offset="50%" stopColor="#1e3a8a" stopOpacity="0.3" />
                <stop offset="100%" stopColor="transparent" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="galaxy4" cx="10%" cy="80%" r="45%">
                <stop offset="0%" stopColor="#dc2626" stopOpacity="0.4" />
                <stop offset="50%" stopColor="#581c87" stopOpacity="0.2" />
                <stop offset="100%" stopColor="transparent" stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#galaxy1)" />
            <rect width="100%" height="100%" fill="url(#galaxy2)" />
            <rect width="100%" height="100%" fill="url(#galaxy3)" />
            <rect width="100%" height="100%" fill="url(#galaxy4)" />
          </svg>
        </div>

        {Array.from({ length: 200 }).map((_, i) => (
          <div
            key={`distant-star-${i}`}
            className="absolute bg-white rounded-full opacity-30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 2 + 0.5}px`,
              height: `${Math.random() * 2 + 0.5}px`,
            }}
          />
        ))}

        {Array.from({ length: 80 }).map((_, i) => (
          <div
            key={`bright-star-${i}`}
            className="absolute bg-white rounded-full opacity-70"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
              boxShadow: "0 0 6px rgba(255, 255, 255, 0.8)",
            }}
          />
        ))}
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 min-h-screen font-mono text-white">
        {showLeaderboard ? (
          <PodiumLeaderboard players={playerProgress} onAnimationComplete={() => { }} />
        ) : !quizStarted ? (
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
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-400" /> Live Player Rankings
              </h2>

              {playerProgress.length === 0 ? (
                <div className="text-center py-8 text-white/60">
                  <UsersRound className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No players found.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {playerProgress.map((player, index) => (
                    <motion.div
                      key={player.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                      className={`flex flex-col p-3 rounded-lg border-2 transition-all duration-300 ${player.rank === 1
                        ? "border-yellow-400 bg-yellow-400/10"
                        : player.rank === 2
                          ? "border-gray-300 bg-gray-300/10"
                          : player.rank === 3
                            ? "border-amber-600 bg-amber-600/10"
                            : "border-white/20 bg-white/5"
                        }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-xl font-bold text-white w-8 text-center">{player.rank}</div>

                        <Image
                          src={player.avatar || "/placeholder.svg"}
                          alt={player.name}
                          width={40}
                          height={40}
                          className="rounded-full object-cover"
                        />

                        <div className="flex-1">
                          <p className="font-bold text-white">{player.name}</p>
                          <p className="text-yellow-300 text-sm">{player.score} pts</p>
                        </div>

                        <div className="flex items-center gap-2">
                          {getRankIcon(player.rank)}
                        </div>
                      </div>

                      {/* Progress bar yang sudah diperbaiki */}
                      <div className="flex items-center gap-2 mt-3">
                        <span className="text-xs text-white/70">
                          {player.currentQuestion}/{player.totalQuestions}
                        </span>
                        <div className="flex-1 h-3 bg-white/30 rounded-full overflow-hidden border border-white/40">
                          <motion.div
                            className="h-full bg-gradient-to-r from-green-400 to-green-500 shadow-sm"
                            initial={{ width: 0 }}
                            animate={{
                              width: `${Math.min(
                                player.totalQuestions > 0
                                  ? (player.currentQuestion / player.totalQuestions) * 100
                                  : 0,
                                100,
                              )}%`,
                            }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                          />
                        </div>
                        <span className="text-xs text-green-400 font-mono min-w-[35px]">
                          {player.totalQuestions > 0
                            ? Math.round((player.currentQuestion / player.totalQuestions) * 100)
                            : 0}
                          %
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </div>

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

const StaticBackground = () => (
  <div className="absolute inset-0 overflow-hidden">
    <div className="absolute inset-0">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="galaxy1" cx="20%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.7" />
            <stop offset="50%" stopColor="#1e40af" stopOpacity="0.4" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="galaxy2" cx="80%" cy="70%" r="65%">
            <stop offset="0%" stopColor="#ec4899" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#581c87" stopOpacity="0.3" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="galaxy3" cx="60%" cy="10%" r="55%">
            <stop offset="0%" stopColor="#059669" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#1e3a8a" stopOpacity="0.3" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="galaxy4" cx="10%" cy="80%" r="45%">
            <stop offset="0%" stopColor="#dc2626" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#581c87" stopOpacity="0.2" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#galaxy1)" />
        <rect width="100%" height="100%" fill="url(#galaxy2)" />
        <rect width="100%" height="100%" fill="url(#galaxy3)" />
        <rect width="100%" height="100%" fill="url(#galaxy4)" />
      </svg>
    </div>

    {Array.from({ length: 200 }).map((_, i) => (
      <div
        key={`distant-star-${i}`}
        className="absolute bg-white rounded-full opacity-30"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          width: `${Math.random() * 2 + 0.5}px`,
          height: `${Math.random() * 2 + 0.5}px`,
        }}
      />
    ))}

    {Array.from({ length: 80 }).map((_, i) => (
      <div
        key={`bright-star-${i}`}
        className="absolute bg-white rounded-full opacity-70"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          width: `${Math.random() * 3 + 1}px`,
          height: `${Math.random() * 3 + 1}px`,
          boxShadow: "0 0 6px rgba(255, 255, 255, 0.8)",
        }}
      />
    ))}
  </div>
)

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