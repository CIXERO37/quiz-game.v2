/* eslint-disable @next/next/no-img-element */
"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { useGameStore } from "@/lib/store"
import { supabase } from "@/lib/supabase"
import { cleanupPresence } from "@/lib/presence"
import { syncServerTime } from "@/lib/server-time"
import { toast } from "sonner"
import { getFirstName, formatDisplayName } from "@/lib/utils"
import React from "react"

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

// === SMART NAME DISPLAY ===
const SmartNameDisplay = React.memo(({ 
  name, 
  maxLength = 8,
  className = "",
  multilineClassName = ""
}: {
  name: string;
  maxLength?: number;
  className?: string;
  multilineClassName?: string;
}) => {
  const { displayName, isBroken } = formatDisplayName(name, maxLength)
  
  if (isBroken) {
    return (
      <span className={`${className} ${multilineClassName} whitespace-pre-line leading-tight text-center block`}>
        {displayName}
      </span>
    )
  }
  
  return (
    <span className={className}>
      {displayName}
    </span>
  )
})
SmartNameDisplay.displayName = "SmartNameDisplay"

// Tambahkan ini untuk disable SSR pada halaman ini
export const dynamic = "force-dynamic"

export default function WaitContent({ gameCode }: WaitContentProps) {
  const router = useRouter()
  const { clearGame } = useGameStore()

  const [loading, setLoading] = useState(true)
  const [playerName, setPlayerName] = useState("")
  const [playerAvatar, setPlayerAvatar] = useState("")
  const [gameId, setGameId] = useState<string>("")
  const [showCountdown, setShowCountdown] = useState(false)
  const [countdownValue, setCountdownValue] = useState(0)
  const [shouldRedirect, setShouldRedirect] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)

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
    if (loading || !gameId || isRedirecting) return

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

          let serverTime: number
          try {
            serverTime = await syncServerTime()
          } catch (error) {
            console.warn("[v0] Server time sync failed, using client time:", error)
            serverTime = Date.now()
          }

          const elapsed = Math.floor((serverTime - start) / 1000)

          if (elapsed >= 10) {
            console.log("[v0] Countdown finished, redirecting to play")
            setIsRedirecting(true)
            router.replace(`/play/${gameCode}`)
            return
          }

          const left = Math.max(0, Math.min(10, 10 - elapsed))

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
          }

          if (left === 0) {
            console.log("[v0] Countdown reached 0, redirecting immediately")
            setIsRedirecting(true)
            router.replace(`/play/${gameCode}`)
          }
        } else if (data.is_started) {
          console.log("[v0] Game already started, redirecting")
          setIsRedirecting(true)
          router.replace(`/play/${gameCode}`)
        }
      } catch (error) {
        console.error("[v0] Error in countdown tick:", error)

        try {
          const { data } = await supabase
            .from("games")
            .select("countdown_start_at, is_started")
            .eq("id", gameId)
            .single()

          if (data?.is_started) {
            console.log("[v0] Fallback: game started, redirecting")
            setIsRedirecting(true)
            router.replace(`/play/${gameCode}`)
          } else if (data?.countdown_start_at) {
            const start = new Date(data.countdown_start_at).getTime()
            const elapsed = Math.floor((Date.now() - start) / 1000)

            if (elapsed >= 10) {
              console.log("[v0] Fallback: countdown finished, redirecting")
              setIsRedirecting(true)
              router.replace(`/play/${gameCode}`)
            }
          }
        } catch (fallbackError) {
          console.error("[v0] Fallback countdown also failed:", fallbackError)
        }
      }
    }

    tick()
    const iv = setInterval(tick, 200)
    return () => clearInterval(iv)
  }, [loading, gameId, gameCode, router, isRedirecting])

  const showExitDialog = () => {
    setShowExitConfirm(true)
  }

  const handleExitConfirm = async () => {
    setShowExitConfirm(false)
    try {
      console.log("[v0] Starting exit process for player:", playerName, "in game:", gameId)

      await cleanupPresence()

      if (gameId && playerName) {
        console.log("[v0] Deleting player from database...")

        // First, find the player to get their ID for more reliable deletion
        const { data: playerToDelete, error: findError } = await supabase
          .from("players")
          .select("id, name")
          .eq("game_id", gameId)
          .eq("name", playerName)
          .single()

        if (findError) {
          console.error("[v0] Error finding player to delete:", findError)
          // Try alternative deletion method if player not found by name
          const { error: deleteError } = await supabase
            .from("players")
            .delete()
            .eq("game_id", gameId)
            .eq("name", playerName)

          if (deleteError) {
            console.error("[v0] Failed to delete player by name:", deleteError)
            toast.error("Failed to remove player from game")
            return
          }
        } else {
          console.log("[v0] Found player to delete:", playerToDelete)
          
          // Delete using both ID and name for maximum reliability
          const { error: deleteError, data: deletedData } = await supabase
            .from("players")
            .delete()
            .eq("id", playerToDelete.id)
            .eq("game_id", gameId)
            .select()

          if (deleteError) {
            console.error("[PLAYER] ❌ Error removing player by ID:", deleteError)
            // Fallback to deletion by name
            const { error: fallbackError } = await supabase
              .from("players")
              .delete()
              .eq("game_id", gameId)
              .eq("name", playerName)

            if (fallbackError) {
              console.error("[v0] Fallback deletion also failed:", fallbackError)
              toast.error("Failed to remove player from game")
              return
            }
          } else {
            console.log("[PLAYER] ✅ Player successfully deleted from database:", deletedData)
            console.log("[PLAYER] 📡 Broadcasting deletion event for player ID:", playerToDelete.id)
          }
        }

        // Wait a moment for real-time updates to propagate
        await new Promise(resolve => setTimeout(resolve, 300))

        // Verify deletion was successful
        const { data: verifyData, error: verifyError } = await supabase
          .from("players")
          .select("id, name")
          .eq("game_id", gameId)
          .eq("name", playerName)

        if (verifyError) {
          console.log("[v0] Verification query failed (this might be normal):", verifyError)
        } else if (verifyData && verifyData.length > 0) {
          console.warn("[v0] Player still exists after deletion, attempting final cleanup:", verifyData)
          // Final cleanup attempt
          await supabase
            .from("players")
            .delete()
            .eq("game_id", gameId)
            .eq("name", playerName)
        } else {
          console.log("[v0] Player successfully removed from database")
        }

        // Force trigger a notification for any listening hosts
        try {
          await supabase
            .from("games")
            .update({ updated_at: new Date().toISOString() })
            .eq("id", gameId)
          console.log("[PLAYER] 🔔 Triggered host notification")
        } catch (notifyError) {
          console.warn("[PLAYER] ⚠️ Failed to notify host:", notifyError)
        }

        toast.success("Left the game successfully")
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
            alt={getFirstName(playerName)}
            className="w-32 h-32 rounded-full object-cover mx-auto mb-4 border-2 border-white"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
          />
          <p className="text-lg mb-2 drop-shadow-[1px_1px_0px_#000]">
            <SmartNameDisplay 
              name={playerName} 
              maxLength={10}
              className="text-lg text-white"
              multilineClassName="text-base leading-tight"
            />
          </p>
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
            onClick={showExitDialog}
            className="bg-red-500 hover:bg-red-600 border-2 border-red-700 px-4 py-2 rounded-lg text-white font-bold shadow-[4px_4px_0px_#000] text-sm"
          >
            Exit Room
          </button>
        </motion.div>
      </div>

      {/* Exit Confirmation Modal */}
      <AnimatePresence>
        {showExitConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setShowExitConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-black/90 border-4 border-white font-mono text-white p-6 rounded-lg shadow-[8px_8px_0px_#000] max-w-sm w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="text-4xl mb-4">⚠️</div>
                <h2 className="text-xl mb-4 font-bold">Exit Game?</h2>
                <p className="text-sm mb-6 text-white/80">
                  Are you sure you want to leave the game? You'll need to join again if you change your mind.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-3">
                  <button
                    onClick={() => setShowExitConfirm(false)}
                    className="bg-gray-500 hover:bg-gray-600 border-2 border-gray-700 px-4 py-2 rounded-lg text-white font-bold shadow-[4px_4px_0px_#000] text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExitConfirm}
                    className="bg-red-500 hover:bg-red-600 border-2 border-red-700 px-4 py-2 rounded-lg text-white font-bold shadow-[4px_4px_0px_#000] text-sm"
                  >
                    Exit Game
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
