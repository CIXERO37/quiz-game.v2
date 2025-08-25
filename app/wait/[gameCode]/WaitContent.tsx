/* eslint-disable @next/next/no-img-element */
"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { useGameStore } from "@/lib/store"
import { supabase } from "@/lib/supabase"
import { cleanupPresence } from "@/lib/presence"
import { syncServerTime } from "@/lib/server-time"
import { toast } from "sonner"

interface WaitContentProps {
  gameCode: string
}

function Background() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      <div
        className="absolute inset-0 bg-[url('/images/space_bg.jpg')]"
        style={{ backgroundSize: "cover", imageRendering: "pixelated" }}
      />
    </div>
  )
}

export default function WaitContent({ gameCode }: WaitContentProps) {
  const router = useRouter()
  const { clearGame } = useGameStore()

  const [loading, setLoading] = useState(true)
  const [playerName, setPlayerName] = useState("")
  const [playerAvatar, setPlayerAvatar] = useState("")
  const [gameId, setGameId] = useState<string>("")
  const [showCountdown, setShowCountdown] = useState(false)
  const [countdownValue, setCountdownValue] = useState(10)
  const [shouldRedirect, setShouldRedirect] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem("player")
    if (!stored) {
      toast.error("Player data not found")
      router.replace("/")
      return
    }

    const { name, avatar } = JSON.parse(stored)
    setPlayerName(name)
    setPlayerAvatar(avatar)

    const fetchGame = async () => {
      const { data, error } = await supabase
        .from("games")
        .select("id, is_started, quiz_id, countdown_start_at")
        .eq("code", gameCode.toUpperCase())
        .single()

      if (error || !data) {
        toast.error("Game not found")
        router.replace("/")
        return
      }

      setGameId(data.id)

      if (data.is_started && !data.countdown_start_at) {
        router.replace(`/play/${gameCode}`)
        return
      }

      setLoading(false)
    }

    fetchGame()
  }, [gameCode, router])

  useEffect(() => {
    if (loading || !gameId) return

    const tick = async () => {
      try {
        const { data, error } = await supabase
          .from("games")
          .select("countdown_start_at, is_started")
          .eq("id", gameId)
          .single()

        if (!data) return

        if (data.countdown_start_at) {
          const start = new Date(data.countdown_start_at).getTime()
          const serverTime = await syncServerTime()
          const elapsed = Math.floor((serverTime - start) / 1000)
          const left = Math.max(0, 10 - elapsed)

          console.log(
            "[v0] Player countdown sync - Server time:",
            new Date(serverTime).toISOString(),
            "Start:",
            new Date(start).toISOString(),
            "Elapsed:",
            elapsed,
            "Left:",
            left,
          )

          if (left >= 0 && left <= 10) {
            setCountdownValue(left)
            setShowCountdown(true)
          } else {
            console.warn("[v0] Invalid countdown value:", left)
          }

          if (left <= 0) {
            router.replace(`/play/${gameCode}`)
          }
        } else if (data.is_started) {
          router.replace(`/play/${gameCode}`)
        }
      } catch (error) {
        console.error("[v0] Error in countdown tick:", error)
        const { data } = await supabase.from("games").select("countdown_start_at, is_started").eq("id", gameId).single()

        if (data?.countdown_start_at) {
          const start = new Date(data.countdown_start_at).getTime()
          const elapsed = Math.floor((Date.now() - start) / 1000)
          const left = Math.max(0, 10 - elapsed)
          if (left >= 0 && left <= 10) {
            setCountdownValue(left)
            setShowCountdown(true)
          }
        }
      }
    }

    tick()
    const iv = setInterval(tick, 200)
    return () => clearInterval(iv)
  }, [loading, gameId, gameCode, router])

  // Monitor player leaving the page and clean up
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (gameId && playerName) {
        try {
          await cleanupPresence()
          
          // Remove player from database
          await supabase
            .from("players")
            .delete()
            .eq("game_id", gameId)
            .eq("name", playerName)
          
          clearGame?.()
          localStorage.removeItem("player")
        } catch (error) {
          console.error("Error cleaning up player on leave:", error)
        }
      }
    }

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'hidden' && gameId && playerName) {
        try {
          await cleanupPresence()
          
          // Remove player from database
          await supabase
            .from("players")
            .delete()
            .eq("game_id", gameId)
            .eq("name", playerName)
          
          clearGame?.()
          localStorage.removeItem("player")
        } catch (error) {
          console.error("Error cleaning up player on visibility change:", error)
        }
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [gameId, playerName, clearGame])

  const handleExit = async () => {
    try {
      console.log("[v0] Starting exit process for player:", playerName, "in game:", gameId)

      await cleanupPresence()

      if (gameId && playerName) {
        console.log("[v0] Deleting player from database...")

        const { data: playerToDelete, error: findError } = await supabase
          .from("players")
          .select("id, name")
          .eq("game_id", gameId)
          .eq("name", playerName)
          .single()

        if (findError) {
          console.error("[v0] Error finding player to delete:", findError)
        } else {
          console.log("[v0] Found player to delete:", playerToDelete)
        }

        const { error, data } = await supabase
          .from("players")
          .delete()
          .eq("game_id", gameId)
          .eq("name", playerName)
          .select()

        if (error) {
          console.error("[v0] Error removing player:", error)
          toast.error("Failed to remove player from game")
        } else {
          console.log("[v0] Player successfully deleted from database:", data)
          toast.success("Left the game successfully")
        }

        setTimeout(async () => {
          console.log("[v0] First cleanup verification")
          const { data: remainingPlayers } = await supabase
            .from("players")
            .select("id, name")
            .eq("game_id", gameId)
            .eq("name", playerName)

          if (remainingPlayers && remainingPlayers.length > 0) {
            console.warn("[v0] Player still exists, attempting force removal:", remainingPlayers)
            await supabase.from("players").delete().eq("game_id", gameId).eq("name", playerName)
          }
        }, 100)

        setTimeout(async () => {
          console.log("[v0] Final cleanup verification")
          const { data: stillRemaining } = await supabase
            .from("players")
            .select("id, name")
            .eq("game_id", gameId)
            .eq("name", playerName)

          if (stillRemaining && stillRemaining.length > 0) {
            console.warn("[v0] Final cleanup attempt for:", stillRemaining)
            await supabase.from("players").delete().eq("game_id", gameId).eq("name", playerName)
          } else {
            console.log("[v0] Player successfully removed from database")
          }
        }, 300)
      }

      clearGame?.()
      localStorage.removeItem("player")

      console.log("[v0] Redirecting to home page...")
      router.replace("/")
    } catch (error) {
      console.error("[v0] Error exiting game:", error)
      toast.error("Failed to exit game")
    }
  }

  if (loading)
    return (
      <>
        <Background />
        <div className="relative z-10 min-h-screen flex items-center justify-center font-mono text-white">
          <div className="bg-black/70 border-4 border-white p-6 rounded-lg">
            <p>Loading...</p>
          </div>
        </div>
      </>
    )

  if (showCountdown)
    return (
      <>
        <Background />
        <div className="relative z-10 min-h-screen flex items-center justify-center font-mono text-white">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-black/80 border-4 border-white p-12 rounded-lg text-center"
          >
            <p className="text-3xl mb-6 font-bold">Game Starting!</p>
            <motion.div
              key={countdownValue}
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
              className="text-9xl font-bold text-yellow-300"
              style={{ textShadow: "4px 4px 0px #000" }}
            >
              {countdownValue}
            </motion.div>
            <p className="text-lg mt-4 opacity-80">Get ready in {countdownValue} seconds...</p>
          </motion.div>
        </div>
      </>
    )

  return (
    <>
      <Background />
      <div className="relative z-10 flex items-center justify-center min-h-screen font-mono text-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-black/70 border-4 border-white p-8 rounded-lg shadow-[8px_8px_0px_#000] text-center max-w-sm"
        >
          <h1 className="text-2xl mb-4 drop-shadow-[2px_2px_0px_#000]">Get Ready!</h1>
          <motion.img
            src={playerAvatar}
            alt={playerName}
            className="w-32 h-32 rounded-full object-cover mx-auto mb-4 border-2 border-white"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
          />
          <p className="text-lg mb-2 drop-shadow-[1px_1px_0px_#000]">{playerName}</p>
          <p className="text-sm text-white/70 mb-6">
            Waiting to start
            <motion.span
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
            >
              ...
            </motion.span>
          </p>

          <button
            onClick={handleExit}
            className="bg-red-500 hover:bg-red-600 border-2 border-red-700 px-4 py-2 rounded-lg text-white font-bold shadow-[4px_4px_0px_#000] text-sm"
          >
            Exit Room
          </button>
        </motion.div>
      </div>
    </>
  )
}
