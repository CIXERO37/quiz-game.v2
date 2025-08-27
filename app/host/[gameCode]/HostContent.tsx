"use client"

import React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
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
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { useGameStore } from "@/lib/store"
import { supabase } from "@/lib/supabase"
import { fetchQuizzes } from "@/lib/dummy-data"
import { toast, Toaster } from "sonner"
import Image from "next/image"
import type { Quiz, Player } from "@/lib/types"
import { RulesDialog } from "@/components/rules-dialog"
import { QRCodeModal } from "@/components/qr-code-modal"
import { syncServerTime } from "@/lib/server-time"
import { getFirstName } from "@/lib/utils"

// === TYPES ===
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

// === STABLE PROGRESS BAR ===
const StableProgressBar = React.memo(({ 
  playerId, 
  currentQuestion, 
  totalQuestions 
}: {
  playerId: string;
  currentQuestion: number;
  totalQuestions: number;
}) => {
  const [displayProgress, setDisplayProgress] = useState(currentQuestion)
  
  useEffect(() => {
    // Only update if progress actually increased
    if (currentQuestion > displayProgress) {
      setDisplayProgress(currentQuestion)
    }
  }, [currentQuestion, displayProgress])
  
  const percentage = totalQuestions > 0 ? (displayProgress / totalQuestions) * 100 : 0
  
  return (
    <div className="flex-1 h-3 bg-white/30 rounded-full overflow-hidden border border-white/40">
      <motion.div
        className="h-full bg-gradient-to-r from-green-400 to-green-500 shadow-sm"
        initial={{ width: `${percentage}%` }}
        animate={{ width: `${Math.min(percentage, 100)}%` }}
        transition={{ duration: 0.4, ease: "easeOut", type: "tween" }}
      />
    </div>
  )
})
StableProgressBar.displayName = "StableProgressBar"

// === MAGNIFICENT PODIUM LEADERBOARD ===
const PodiumLeaderboard = React.memo(
  ({ players, onAnimationComplete }: { players: PlayerProgress[]; onAnimationComplete: () => void }) => {
    const router = useRouter()
    const [hasAnimated, setHasAnimated] = useState(false)
    const [showFireworks, setShowFireworks] = useState(false)

    useEffect(() => {
      if (!hasAnimated) {
        setHasAnimated(true)
        setShowFireworks(true)
        onAnimationComplete()
        // Hide fireworks after animation
        setTimeout(() => setShowFireworks(false), 3000)
      }
    }, [hasAnimated, onAnimationComplete])

    const sorted = [...players].sort((a, b) => b.score - a.score)

    // Fireworks animation component
    const Fireworks = () => (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-yellow-400 rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: window.innerHeight,
              scale: 0,
              opacity: 1,
            }}
            animate={{
              y: Math.random() * window.innerHeight * 0.3,
              scale: [0, 1, 0],
              opacity: [1, 1, 0],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              delay: Math.random() * 2,
              ease: "easeOut",
            }}
          />
        ))}
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={`star-${i}`}
            className="absolute text-2xl"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 50}%`,
            }}
            initial={{ scale: 0, rotate: 0, opacity: 0 }}
            animate={{
              scale: [0, 1.5, 1, 0],
              rotate: [0, 180, 360],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: 3,
              delay: Math.random() * 1.5,
              ease: "easeInOut",
            }}
          >
            ⭐
          </motion.div>
        ))}
      </div>
    )

    // 1 player - Grand Champion
    if (sorted.length === 1) {
      const [onlyPlayer] = sorted
      return (
        <div className="min-h-screen relative overflow-hidden">
          {showFireworks && <Fireworks />}
          
          {/* Spotlight effect */}
          <div className="absolute inset-0 bg-gradient-radial from-yellow-400/20 via-transparent to-black/40" />
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2 }}
            className="min-h-screen flex flex-col items-center justify-center p-2 sm:p-4 lg:p-8 font-mono text-white relative z-10"
          >


            <motion.h1 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.8, delay: 0.8, type: "spring" }}
              className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-6 sm:mb-8 lg:mb-12 text-center bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(255,215,0,0.5)] px-2"
              style={{ textShadow: "0 0 30px rgba(255, 215, 0, 0.8), 0 0 60px rgba(255, 215, 0, 0.4)" }}
            >
              CHAMPIONS
            </motion.h1>

            {/* Champion pedestal */}
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1, delay: 1.2 }}
              className="relative"
            >
              {/* Pedestal base */}
              <div className="relative bg-gradient-to-b from-yellow-400 via-yellow-500 to-yellow-600 rounded-t-2xl sm:rounded-t-3xl p-1 shadow-[0_0_30px_rgba(255,215,0,0.6)] sm:shadow-[0_0_50px_rgba(255,215,0,0.6)]">
                <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-t-2xl sm:rounded-t-3xl p-4 sm:p-8 lg:p-12">
                  
                  {/* Glowing ring around avatar */}
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 blur-lg opacity-75 animate-pulse" />
                    <div className="relative">
                      <Image
                        src={onlyPlayer.avatar || "/placeholder.svg"}
                        alt={getFirstName(onlyPlayer.name)}
                        width={200}
                        height={200}
                        className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 rounded-full border-4 sm:border-6 lg:border-8 border-yellow-400 object-cover relative z-10 shadow-[0_0_20px_rgba(255,215,0,0.8)] sm:shadow-[0_0_40px_rgba(255,215,0,0.8)]"
                      />
                    </div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 1.5 }}
                    className="text-center mt-6"
                  >
                    <h2 className="font-bold text-lg sm:text-2xl md:text-3xl lg:text-4xl mb-2 text-yellow-300 drop-shadow-lg text-center">
                      {getFirstName(onlyPlayer.name)}
                    </h2>
                    <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-3 sm:px-6 py-2 sm:py-3 rounded-full font-bold text-base sm:text-xl lg:text-2xl shadow-lg">
                      {onlyPlayer.score} POINTS
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Pedestal steps */}
              <div className="bg-gradient-to-b from-yellow-600 to-yellow-700 h-6 sm:h-8 w-full rounded-b-lg shadow-lg" />
              <div className="bg-gradient-to-b from-yellow-700 to-yellow-800 h-4 sm:h-6 w-[110%] -ml-[5%] rounded-b-lg shadow-lg" />
              <div className="bg-gradient-to-b from-yellow-800 to-yellow-900 h-3 sm:h-4 w-[120%] -ml-[10%] rounded-b-lg shadow-lg" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 2 }}
            >
              <PixelButton 
                color="blue" 
                className="mt-8 sm:mt-12 text-sm sm:text-lg px-4 sm:px-8 py-2 sm:py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-[0_0_20px_rgba(59,130,246,0.5)]" 
                onClick={() => router.push("/")}
              >
                🏠 Back to Dashboard
              </PixelButton>
            </motion.div>
          </motion.div>
        </div>
      )
    }

    // 2 players - Victory Duo
    if (sorted.length === 2) {
      const [first, second] = sorted
      return (
        <div className="min-h-screen relative overflow-hidden">
          {showFireworks && <Fireworks />}
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="min-h-screen flex flex-col items-center justify-center p-2 sm:p-4 lg:p-8 font-mono text-white relative z-10"
          >
            <motion.h1 
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-8 sm:mb-12 text-center bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 bg-clip-text text-transparent px-2"
              style={{ textShadow: "0 0 20px rgba(255, 215, 0, 0.6)" }}
            >
              🏆 CHAMPIONS 🏆
            </motion.h1>

            <div className="flex items-end justify-center gap-4 sm:gap-8 lg:gap-12">
              {/* Second Place */}
              <motion.div
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="flex flex-col items-center"
              >
                {/* Silver Podium */}
                <div className="relative">
                  <div className="bg-gradient-to-b from-gray-300 via-gray-400 to-gray-500 rounded-t-xl sm:rounded-t-2xl p-1 shadow-[0_0_20px_rgba(192,192,192,0.5)] sm:shadow-[0_0_30px_rgba(192,192,192,0.5)]">
                    <div className="bg-gradient-to-b from-gray-700 to-gray-800 rounded-t-xl sm:rounded-t-2xl p-3 sm:p-6 lg:p-8">
                      <div className="relative flex justify-center">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-gray-300 to-gray-400 blur-md opacity-60 animate-pulse" />
                        <Image
                          src={second.avatar || "/placeholder.svg"}
                          alt={getFirstName(second.name)}
                          width={120}
                          height={120}
                          className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-full border-4 sm:border-6 border-gray-300 object-cover relative z-10 shadow-[0_0_15px_rgba(192,192,192,0.6)] sm:shadow-[0_0_25px_rgba(192,192,192,0.6)]"
                        />
                      </div>
                      <div className="text-center mt-2 sm:mt-4">
                        <div className="text-lg sm:text-2xl mb-1 sm:mb-2">🥈</div>
                        <h3 className="font-bold text-sm sm:text-lg lg:text-xl text-gray-300 truncate">{getFirstName(second.name)}</h3>
                        <div className="bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800 px-2 sm:px-4 py-1 sm:py-2 rounded-full font-bold text-xs sm:text-sm lg:text-base mt-1 sm:mt-2">
                          {second.score} PTS
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-b from-gray-500 to-gray-600 h-12 sm:h-16 w-full rounded-b-lg" />
                  <div className="bg-gradient-to-b from-gray-600 to-gray-700 h-3 sm:h-4 w-[110%] -ml-[5%] rounded-b-lg" />
                </div>
              </motion.div>

              {/* First Place */}
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 1.2 }}
                className="flex flex-col items-center"
              >
                {/* Gold Podium */}
                <div className="relative">
                  <div className="bg-gradient-to-b from-yellow-400 via-yellow-500 to-yellow-600 rounded-t-2xl sm:rounded-t-3xl p-1 shadow-[0_0_30px_rgba(255,215,0,0.7)] sm:shadow-[0_0_40px_rgba(255,215,0,0.7)]">
                    <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-t-2xl sm:rounded-t-3xl p-4 sm:p-8 lg:p-10">
                      <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 blur-lg opacity-70 animate-pulse" />
                        <Image
                          src={first.avatar || "/placeholder.svg"}
                          alt={getFirstName(first.name)}
                          width={160}
                          height={160}
                          className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-36 lg:h-36 rounded-full border-4 sm:border-6 lg:border-8 border-yellow-400 object-cover relative z-10 shadow-[0_0_25px_rgba(255,215,0,0.8)] sm:shadow-[0_0_35px_rgba(255,215,0,0.8)]"
                        />
                      </div>
                      <div className="text-center mt-2 sm:mt-4">
                        <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">🥇</div>
                        <h3 className="font-bold text-base sm:text-xl lg:text-2xl text-yellow-300 truncate">{getFirstName(first.name)}</h3>
                        <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-3 sm:px-6 py-2 sm:py-3 rounded-full font-bold text-sm sm:text-base lg:text-lg mt-1 sm:mt-2">
                          {first.score} PTS
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-b from-yellow-600 to-yellow-700 h-16 sm:h-20 w-full rounded-b-lg" />
                  <div className="bg-gradient-to-b from-yellow-700 to-yellow-800 h-4 sm:h-6 w-[110%] -ml-[5%] rounded-b-lg" />
                  <div className="bg-gradient-to-b from-yellow-800 to-yellow-900 h-3 sm:h-4 w-[120%] -ml-[10%] rounded-b-lg" />
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.8 }}
            >
              <PixelButton 
                color="blue" 
                className="mt-12 text-lg px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-[0_0_20px_rgba(59,130,246,0.5)]" 
                onClick={() => router.push("/")}
              >
                🏠 Back to Dashboard
              </PixelButton>
            </motion.div>
          </motion.div>
        </div>
      )
    }

    // 3+ players - Grand Podium
    const [first, second, third] = [
      sorted[0] || { name: "No Player", score: 0, avatar: "/placeholder.svg" },
      sorted[1] || { name: "No Player", score: 0, avatar: "/placeholder.svg" },
      sorted[2] || { name: "No Player", score: 0, avatar: "/placeholder.svg" },
    ]
    const rest = sorted.slice(3)

    return (
      <div className="min-h-screen relative overflow-hidden">
        {showFireworks && <Fireworks />}
        
        {/* Epic background effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-radial from-purple-900/30 via-blue-900/20 to-black/60" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-yellow-400/10 via-transparent to-transparent" />
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2 }}
          className="min-h-screen flex items-center justify-center p-2 sm:p-4 lg:p-8 relative z-10"
        >
          <div className="text-center w-full max-w-6xl">
            <motion.h1 
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 1, delay: 0.3, type: "spring", bounce: 0.3 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-8xl font-bold mb-8 sm:mb-12 bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 bg-clip-text text-transparent px-2"
              style={{ textShadow: "0 0 40px rgba(255, 215, 0, 0.8)" }}
            >
              🏆 CHAMPIONS 🏆
            </motion.h1>

            {/* Main Podium */}
            <div className="flex items-end justify-center gap-2 sm:gap-4 md:gap-6 lg:gap-8 xl:gap-12 mb-6 sm:mb-8">
              {/* Third Place */}
              <motion.div
                initial={{ x: -200, y: 100, opacity: 0 }}
                animate={{ x: 0, y: 0, opacity: 1 }}
                transition={{ duration: 1, delay: 0.8, type: "spring" }}
                className="flex flex-col items-center"
              >
                <div className="relative">
                  <div className="bg-gradient-to-b from-amber-600 via-amber-700 to-amber-800 rounded-t-xl sm:rounded-t-2xl p-1 shadow-[0_0_15px_rgba(217,119,6,0.5)] sm:shadow-[0_0_25px_rgba(217,119,6,0.5)]">
                    <div className="bg-gradient-to-b from-gray-700 to-gray-800 rounded-t-xl sm:rounded-t-2xl p-2 sm:p-4 lg:p-6">
                      <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-600 to-amber-700 blur-md opacity-50 animate-pulse" />
                        <Image
                          src={third.avatar || "/placeholder.svg"}
                          alt={getFirstName(third.name)}
                          width={100}
                          height={100}
                          className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full border-2 sm:border-3 border-amber-600 object-cover relative z-10 shadow-[0_0_10px_rgba(217,119,6,0.6)] sm:shadow-[0_0_15px_rgba(217,119,6,0.6)]"
                        />
                      </div>
                      <div className="text-center mt-2 sm:mt-3">
                        <div className="text-base sm:text-xl lg:text-2xl mb-1">🥉</div>
                        <h3 className="font-bold text-xs sm:text-sm lg:text-base text-amber-300 truncate">{getFirstName(third.name)}</h3>
                        <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white px-2 sm:px-3 py-1 rounded-full font-bold text-xs mt-1">
                          {third.score}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-b from-amber-800 to-amber-900 h-8 sm:h-12 lg:h-16 w-full rounded-b-lg" />
                  <div className="bg-gradient-to-b from-amber-900 to-amber-950 h-2 sm:h-3 w-[110%] -ml-[5%] rounded-b-lg" />
                </div>
              </motion.div>

              {/* First Place - The Champion */}
              <motion.div
                initial={{ y: 150, opacity: 0, scale: 0.8 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ duration: 1.2, delay: 1.2, type: "spring", bounce: 0.2 }}
                className="flex flex-col items-center relative"
              >


                <div className="relative">
                  <div className="bg-gradient-to-b from-yellow-400 via-yellow-500 to-yellow-600 rounded-t-2xl sm:rounded-t-3xl p-1 sm:p-2 shadow-[0_0_30px_rgba(255,215,0,0.8)] sm:shadow-[0_0_50px_rgba(255,215,0,0.8)]">
                    <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-t-2xl sm:rounded-t-3xl p-3 sm:p-6 lg:p-10">
                      <div className="relative">
                        {/* Multiple glowing rings */}
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 blur-xl opacity-60 animate-pulse" />
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-300 to-yellow-400 blur-lg opacity-40 animate-pulse" style={{ animationDelay: "0.5s" }} />
                        <div className="relative">
                          <Image
                            src={first.avatar || "/placeholder.svg"}
                            alt={getFirstName(first.name)}
                            width={200}
                            height={200}
                            className="w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 rounded-full border-3 sm:border-4 lg:border-6 border-yellow-400 object-cover relative z-10 shadow-[0_0_20px_rgba(255,215,0,0.9)] sm:shadow-[0_0_30px_rgba(255,215,0,0.9)]"
                          />
                        </div>
                      </div>
                      <div className="text-center mt-2 sm:mt-4">
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="text-2xl sm:text-4xl lg:text-5xl mb-1 sm:mb-2"
                        >
                          🥇
                        </motion.div>
                        <h3 className="font-bold text-sm sm:text-xl lg:text-2xl xl:text-3xl text-yellow-300 mb-1 sm:mb-2 truncate">{getFirstName(first.name)}</h3>
                        <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-3 sm:px-6 py-2 sm:py-3 rounded-full font-bold text-sm sm:text-lg lg:text-xl shadow-[0_0_15px_rgba(255,215,0,0.5)] sm:shadow-[0_0_20px_rgba(255,215,0,0.5)]">
                          {first.score} PTS
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-b from-yellow-600 to-yellow-700 h-16 sm:h-20 lg:h-24 w-full rounded-b-lg" />
                  <div className="bg-gradient-to-b from-yellow-700 to-yellow-800 h-4 sm:h-6 w-[110%] -ml-[5%] rounded-b-lg" />
                  <div className="bg-gradient-to-b from-yellow-800 to-yellow-900 h-3 sm:h-4 w-[120%] -ml-[10%] rounded-b-lg" />
                </div>
              </motion.div>

              {/* Second Place */}
              <motion.div
                initial={{ x: 200, y: 100, opacity: 0 }}
                animate={{ x: 0, y: 0, opacity: 1 }}
                transition={{ duration: 1, delay: 1.0, type: "spring" }}
                className="flex flex-col items-center"
              >
                <div className="relative">
                  <div className="bg-gradient-to-b from-gray-300 via-gray-400 to-gray-500 rounded-t-xl sm:rounded-t-2xl p-1 shadow-[0_0_20px_rgba(192,192,192,0.6)] sm:shadow-[0_0_30px_rgba(192,192,192,0.6)]">
                    <div className="bg-gradient-to-b from-gray-700 to-gray-800 rounded-t-xl sm:rounded-t-2xl p-2 sm:p-5 lg:p-7">
                      <div className="relative flex justify-center">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-gray-300 to-gray-400 blur-md opacity-60 animate-pulse" />
                        <Image
                          src={second.avatar || "/placeholder.svg"}
                          alt={getFirstName(second.name)}
                          width={120}
                          height={120}
                          className="w-10 h-10 sm:w-16 sm:h-16 md:w-18 md:h-18 lg:w-22 lg:h-22 rounded-full border-2 sm:border-3 lg:border-4 border-gray-300 object-cover relative z-10 shadow-[0_0_12px_rgba(192,192,192,0.7)] sm:shadow-[0_0_20px_rgba(192,192,192,0.7)]"
                        />
                      </div>
                      <div className="text-center mt-2 sm:mt-3">
                        <div className="text-lg sm:text-2xl lg:text-3xl mb-1">🥈</div>
                        <h3 className="font-bold text-xs sm:text-base lg:text-lg text-gray-300 truncate">{getFirstName(second.name)}</h3>
                        <div className="bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800 px-2 sm:px-4 py-1 sm:py-2 rounded-full font-bold text-xs sm:text-sm lg:text-base mt-1 sm:mt-2">
                          {second.score} PTS
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-b from-gray-500 to-gray-600 h-10 sm:h-16 lg:h-20 w-full rounded-b-lg" />
                  <div className="bg-gradient-to-b from-gray-600 to-gray-700 h-2 sm:h-4 w-[110%] -ml-[5%] rounded-b-lg" />
                </div>
              </motion.div>
            </div>

            {/* Other players */}
            {rest.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.8 }}
                className="mt-4 sm:mt-6 lg:mt-8"
              >

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 max-w-5xl mx-auto px-2">
                  {rest.map((p, idx) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: 2 + idx * 0.1 }}
                      className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border border-purple-500/30 rounded-lg sm:rounded-xl p-2 sm:p-4 backdrop-blur-sm hover:border-purple-400/50 transition-all duration-300"
                    >
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm">
                          {idx + 4}
                        </div>
                        <Image
                          src={p.avatar || "/placeholder.svg"}
                          alt={getFirstName(p.name)}
                          width={40}
                          height={40}
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-purple-400 object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-white truncate text-xs sm:text-sm">{getFirstName(p.name)}</p>
                          <p className="text-purple-300 text-xs sm:text-sm font-semibold">{p.score} pts</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 2.5 }}
            >
              <PixelButton 
                color="blue" 
                className="mt-6 sm:mt-8 lg:mt-12 text-sm sm:text-lg px-4 sm:px-10 py-2 sm:py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-[0_0_20px_rgba(59,130,246,0.6)] sm:shadow-[0_0_30px_rgba(59,130,246,0.6)] border-2 border-blue-400" 
                onClick={() => router.push("/")}
              >
                Return
              </PixelButton>
            </motion.div>
          </div>
        </motion.div>
      </div>
    )
  },
)
PodiumLeaderboard.displayName = "PodiumLeaderboard"

// === HOST CONTENT COMPONENT ===
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
  const [linkCopied, setLinkCopied] = useState(false)

  const [showExitModal, setShowExitModal] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [mounted, setMounted] = useState(false)

  const [countdownLeft, setCountdownLeft] = useState<number | null>(null)
  const [showQRModal, setShowQRModal] = useState(false)

  // Pagination states
  const [currentPlayerPage, setCurrentPlayerPage] = useState(0)
  const [currentProgressPage, setCurrentProgressPage] = useState(0)
  const [slideDirection, setSlideDirection] = useState(0) // -1 for left, 1 for right
  const PLAYERS_PER_PAGE = 12 // 3 rows x 4 columns
  
  // Store previous progress values to prevent unnecessary resets
  const prevProgressRef = useRef<Map<string, number>>(new Map())

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

  // Pagination helper functions
  const getPaginatedPlayers = (playersList: Player[], page: number) => {
    const startIndex = page * PLAYERS_PER_PAGE
    const endIndex = startIndex + PLAYERS_PER_PAGE
    return playersList.slice(startIndex, endIndex)
  }

  const getPaginatedProgress = (progressList: PlayerProgress[], page: number) => {
    const startIndex = page * PLAYERS_PER_PAGE
    const endIndex = startIndex + PLAYERS_PER_PAGE
    return progressList.slice(startIndex, endIndex)
  }

  const getTotalPages = (totalItems: number) => {
    return Math.ceil(totalItems / PLAYERS_PER_PAGE)
  }

  // Animation variants for sliding transitions
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.8,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.8,
    }),
  }

  const slideTransition = {
    x: { type: "spring" as const, stiffness: 300, damping: 30 },
    opacity: { duration: 0.2 },
    scale: { duration: 0.2 },
  }

  // Pagination component with slide direction tracking
  const PaginationControls = ({ 
    currentPage, 
    totalPages, 
    onPageChange,
    onDirectionChange 
  }: { 
    currentPage: number; 
    totalPages: number; 
    onPageChange: (page: number) => void;
    onDirectionChange: (direction: number) => void;
  }) => {
    if (totalPages <= 1) return null;

    const handlePrevious = () => {
      const newPage = Math.max(0, currentPage - 1);
      if (newPage !== currentPage) {
        onDirectionChange(-1);
        onPageChange(newPage);
      }
    };

    const handleNext = () => {
      const newPage = Math.min(totalPages - 1, currentPage + 1);
      if (newPage !== currentPage) {
        onDirectionChange(1);
        onPageChange(newPage);
      }
    };

    const handlePageClick = (page: number) => {
      if (page !== currentPage) {
        onDirectionChange(page > currentPage ? 1 : -1);
        onPageChange(page);
      }
    };

    return (
      <div className="flex items-center justify-center gap-2 sm:gap-4 mt-4">
        <button
          onClick={handlePrevious}
          disabled={currentPage === 0}
          className="p-1 sm:p-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        
        <div className="flex items-center gap-1 sm:gap-2">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => handlePageClick(i)}
              className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full text-xs sm:text-sm font-mono transition-colors ${
                i === currentPage
                  ? "bg-blue-500 text-white"
                  : "bg-white/10 border border-white/20 hover:bg-white/20"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        <button
          onClick={handleNext}
          disabled={currentPage === totalPages - 1}
          className="p-1 sm:p-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!gameCode || typeof gameCode !== "string") {
        toast.error("Invalid game code!")
        router.replace("/")
        return
      }

      const { data: gameData, error: gameErr } = await supabase
        .from("games")
        .select(
          "id, quiz_id, time_limit, question_count, is_started, finished, countdown_start_at",
        )
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
      supabase.from("player_answers").select("*").eq("game_id", gameId).not("question_index", "eq", -1),
      supabase.from("players").select("*").eq("game_id", gameId),
    ])

    const answers = answersResult.data || []
    const playersData = playersResult.data || []

    const progressMap = new Map<string, PlayerProgress>()

    playersData.forEach((player: Player) => {
      const playerAnswers = answers.filter((a) => a.player_id === player.id && a.question_index >= 0)

      const uniqueQuestionIndices = new Set(playerAnswers.map((a) => a.question_index))
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

    console.log("[v0] Fetching players for game:", gameId)
    const { data: playersData, error } = await supabase.from("players").select("*").eq("game_id", gameId)
    if (error) {
      console.error("Error fetching players:", error)
      return
    }

    console.log("[v0] Fetched players:", playersData)
    setPlayers(playersData || [])
    if (playersData) {
      const progressMap = new Map<string, PlayerProgress>()
      playersData.forEach((player: Player) => {
        progressMap.set(player.id, {
          id: player.id,
          name: player.name,
          avatar: player.avatar || "/placeholder.svg?height=40&width=40&text=Player",
          score: player.score || 0,
          currentQuestion: 0,
          totalQuestions: gameSettings.questionCount || quiz?.questionCount || 10,
          isActive: true,
          rank: 0,
        })
      })
      const sorted = Array.from(progressMap.values()).sort((a, b) => b.score - a.score)
      const ranked = sorted.map((p, idx) => ({ ...p, rank: idx + 1 }))
      setPlayerProgress(ranked)
    }
  }, [gameId, gameSettings.questionCount, quiz?.questionCount])

  // Reset pagination when players change
  useEffect(() => {
    setCurrentPlayerPage(0)
  }, [players.length])

  useEffect(() => {
    setCurrentProgressPage(0)
  }, [playerProgress.length])

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
          if (payload.new.is_started) setQuizStarted(true)
        },
      )
      .subscribe()

    const playersSubscription = supabase
      .channel("players")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "players", filter: `game_id=eq.${gameId}` },
        (payload) => {
          console.log("[v0] Player joined:", payload.new)
          fetchPlayers()
          updatePlayerProgress()
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "players", filter: `game_id=eq.${gameId}` },
        (payload) => {
          console.log("[v0] Player left:", payload.old)
          fetchPlayers()
          updatePlayerProgress()
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "players", filter: `game_id=eq.${gameId}` },
        (payload) => {
          console.log("[v0] Player updated:", payload.new)
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
        () => updatePlayerProgress(),
      )
      .subscribe()

    setTimeout(() => {
      fetchPlayers()
      updatePlayerProgress()
    }, 50)

    return () => {
      supabase.removeChannel(gameSubscription)
      supabase.removeChannel(playersSubscription)
      supabase.removeChannel(answersSubscription)
    }
  }, [gameId, fetchPlayers, updatePlayerProgress])

  useEffect(() => {
    if (!quizStarted || !gameSettings?.timeLimit) return

    let unsub = () => {}
    ;(async () => {
      const { data } = await supabase
        .from("games")
        .select("quiz_start_time, time_limit")
        .eq("id", gameId)
        .single()
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
      try {
        const { data } = await supabase.from("games").select("countdown_start_at").eq("id", gameId).single()
        if (!data?.countdown_start_at) return

        const start = new Date(data.countdown_start_at).getTime()
        const serverTime = await syncServerTime()
        const elapsed = Math.floor((serverTime - start) / 1000)
        const left = Math.max(0, 10 - elapsed)

        if (left >= 0 && left <= 10) {
          setCountdownLeft(left)
        } else {
          setCountdownLeft(0)
        }
      } catch {
        setCountdownLeft(0)
      }
    }

    tick()
    const iv = setInterval(tick, 200)
    return () => clearInterval(iv)
  }, [quizStarted, gameId])

  const handleCopyCode = () => {
    navigator.clipboard.writeText(joinUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(joinUrl)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
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
      } catch {
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
        return (
          <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-white/70">
            #{rank}
          </span>
        )
    }
  }

  // === RENDER STATES ===
  if (!gameCode) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center font-mono text-white">
        <div className="text-lg">Invalid game code</div>
      </div>
    )
  }

  if (loading)
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center font-mono text-white">
        {mounted && <StaticBackground />}
        <div className="relative z-10 text-white font-mono text-lg">Loading quiz...</div>
      </div>
    )

  if (!quiz)
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center font-mono text-white">
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
      <RulesDialog open={false} onOpenChange={() => {}} quiz={quiz} onStartGame={() => {}} />
      <QRCodeModal open={showQRModal} onOpenChange={setShowQRModal} joinUrl={joinUrl} />

      <div className="fixed inset-0 z-0 overflow-hidden bg-black">
        <div className="absolute inset-0">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice">
            <defs>
              <radialGradient id="galaxy1" cx="20%" cy="30%" r="80%">
                <stop offset="0%" stopColor="#4c1d95" stopOpacity="0.3" />
                <stop offset="50%" stopColor="#1e1b4b" stopOpacity="0.2" />
                <stop offset="100%" stopColor="transparent" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="galaxy2" cx="80%" cy="70%" r="65%">
                <stop offset="0%" stopColor="#701a75" stopOpacity="0.25" />
                <stop offset="50%" stopColor="#312e81" stopOpacity="0.15" />
                <stop offset="100%" stopColor="transparent" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="galaxy3" cx="60%" cy="10%" r="55%">
                <stop offset="0%" stopColor="#064e3b" stopOpacity="0.2" />
                <stop offset="50%" stopColor="#1e1b4b" stopOpacity="0.1" />
                <stop offset="100%" stopColor="transparent" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="galaxy4" cx="10%" cy="80%" r="45%">
                <stop offset="0%" stopColor="#7f1d1d" stopOpacity="0.15" />
                <stop offset="50%" stopColor="#312e81" stopOpacity="0.1" />
                <stop offset="100%" stopColor="transparent" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="nebula1" cx="40%" cy="60%" r="90%">
                <stop offset="0%" stopColor="#1e1b4b" stopOpacity="0.1" />
                <stop offset="70%" stopColor="#0f0f23" stopOpacity="0.05" />
                <stop offset="100%" stopColor="transparent" stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect width="100%" height="100%" fill="#000000" />
            <rect width="100%" height="100%" fill="url(#nebula1)" />
            <rect width="100%" height="100%" fill="url(#galaxy1)" />
            <rect width="100%" height="100%" fill="url(#galaxy2)" />
            <rect width="100%" height="100%" fill="url(#galaxy3)" />
            <rect width="100%" height="100%" fill="url(#galaxy4)" />
          </svg>
        </div>

        {Array.from({ length: 300 }).map((_, i) => (
          <div
            key={`distant-star-${i}`}
            className="absolute bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 1.5 + 0.3}px`,
              height: `${Math.random() * 1.5 + 0.3}px`,
              opacity: Math.random() * 0.4 + 0.1,
              animation: `twinkle ${Math.random() * 4 + 2}s infinite alternate`,
            }}
          />
        ))}

        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={`bright-star-${i}`}
            className="absolute bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 2 + 1}px`,
              height: `${Math.random() * 2 + 1}px`,
              opacity: Math.random() * 0.6 + 0.4,
              boxShadow: "0 0 8px rgba(255, 255, 255, 0.6), 0 0 16px rgba(255, 255, 255, 0.3)",
              animation: `twinkle ${Math.random() * 3 + 1.5}s infinite alternate`,
            }}
          />
        ))}

        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={`shooting-star-${i}`}
            className="absolute bg-gradient-to-r from-white to-transparent h-px opacity-70"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 100 + 50}px`,
              transform: `rotate(${Math.random() * 360}deg)`,
              animation: `shooting-star ${Math.random() * 8 + 4}s infinite linear`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 container mx-auto px-2 sm:px-4 py-4 sm:py-8 min-h-screen font-mono text-white">
        {showLeaderboard ? (
          <PodiumLeaderboard players={playerProgress} onAnimationComplete={() => {}} />
        ) : !quizStarted ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <div className="bg-white/10 border-2 border-white/20 p-4 sm:p-6 rounded-lg backdrop-blur-sm">
                <h2 className="text-base sm:text-2xl font-bold mb-4 flex items-center gap-2">
                  Space-Dodge Quiz
                </h2>

                <div className="flex flex-wrap gap-2 sm:gap-4 justify-center mb-4">
                  <div className="flex items-center gap-1 sm:gap-2 bg-blue-100 text-blue-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
                    <Timer className="w-3 h-3 sm:w-4 sm:h-4" />
                    {formatTime(gameSettings.timeLimit)}
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 bg-green-100 text-green-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
                    <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                    {gameSettings.questionCount} questions
                  </div>
                </div>

                <div className="text-center">
                  <div className="relative inline-block w-full max-w-sm sm:max-w-md">
                    <div className="text-2xl sm:text-3xl lg:text-7xl font-mono font-bold bg-white text-black rounded-lg py-4 sm:py-6 lg:py-8 px-6 sm:px-8 lg:px-12 mb-1 pr-8 sm:pr-12 lg:pr-16 w-full">
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

                  <div className="relative inline-block mb-4 w-full max-w-sm sm:max-w-md">
                    <div className="bg-white text-black rounded-lg py-4 sm:py-6 lg:py-8 px-4 sm:px-8 lg:px-12 w-full flex flex-col justify-center items-center">
                      <button
                        onClick={() => setShowQRModal(true)}
                        className="hover:opacity-80 transition-opacity cursor-pointer mb-4"
                        title="Click to enlarge QR code"
                      >
                        <QRCodeSVG value={joinUrl} size={120} className="sm:w-[140px] sm:h-[140px] lg:w-[335px] lg:h-[335px]" />
                      </button>
                      <div className="w-full">
                      
                        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-2 sm:p-3">
                          <span className="text-xs sm:text-sm font-mono break-all flex-1 text-gray-900">{joinUrl}</span>
                          <button
                            onClick={handleCopyLink}
                            className="p-2 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                            title="Copy join link"
                          >
                            {linkCopied ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4 text-gray-600" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div className="bg-white/10 border-2 border-white/20 p-4 sm:p-6 rounded-lg backdrop-blur-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                  <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5" /> Players ({players.length})
                  </h2>
                  <div className="flex gap-2 sm:gap-3">
                    <PixelButton color="red" size="sm" onClick={() => setShowExitModal(true)}>
                      ❌ Exit Game
                    </PixelButton>
                    <PixelButton color="green" onClick={startQuiz} disabled={players.length === 0 || isStarting}>
                      <Play className="w-4 h-4 inline-block mr-2" /> Start Quiz
                    </PixelButton>
                  </div>
                </div>

{players.length === 0 ? (
                  <div className="text-center py-12 text-white/60">
                    <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Waiting for players to join...</p>
                  </div>
) : (
                  <>
                    <div className="relative overflow-hidden">
                      <AnimatePresence initial={false} custom={slideDirection} mode="wait">
                        <motion.div
                          key={currentPlayerPage}
                          custom={slideDirection}
                          variants={slideVariants}
                          initial="enter"
                          animate="center"
                          exit="exit"
                          transition={slideTransition}
                          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4"
                        >
                          {getPaginatedPlayers(players, currentPlayerPage).map((player, index) => (
                            <motion.div
                              key={player.id}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.05 }}
                              className="bg-white/10 rounded-lg p-2 sm:p-4 flex flex-col items-center gap-2 sm:gap-3 backdrop-blur-sm"
                            >
                              <Image
                                src={player.avatar || "/placeholder.svg?height=48&width=48&text=Player"}
                                alt={getFirstName(player.name)}
                                width={48}
                                height={48}
                                className="w-8 h-8 sm:w-12 sm:h-12 rounded-full border-2 border-white/30 object-cover"
                              />
                              <div className="text-center">
                                <h3 className="font-bold text-xs sm:text-sm truncate max-w-full">{getFirstName(player.name)}</h3>
                              </div>
                            </motion.div>
                          ))}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                    
                    <PaginationControls
                      currentPage={currentPlayerPage}
                      totalPages={getTotalPages(players.length)}
                      onPageChange={setCurrentPlayerPage}
                      onDirectionChange={setSlideDirection}
                    />
                  </>
                )}
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-8">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="bg-white/10 border-2 border-white/20 p-3 sm:p-6 rounded-lg backdrop-blur-sm">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="text-sm sm:text-lg">Quiz - Game {gameCode}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                      <div className="flex items-center gap-1 sm:gap-2 bg-blue-100 text-blue-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
                        <Timer className="w-3 h-3 sm:w-4 sm:h-4" />
                        {formatTime(gameSettings.timeLimit)}
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 bg-green-100 text-green-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
                        <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                        {gameSettings.questionCount} questions
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
                    <div className="flex items-center gap-2 text-white">
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="text-base sm:text-lg font-mono">{formatTime(quizTimeLeft)}</span>
                    </div>
                    <PixelButton color="red" onClick={endQuiz} className="w-full sm:w-auto text-xs sm:text-sm">
                      ⏹ End Quiz
                    </PixelButton>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/10 border-2 border-white/20 rounded-lg p-4 sm:p-6 backdrop-blur-sm"
            >
              <h2 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" /> Players
              </h2>

{playerProgress.length === 0 ? (
                <div className="text-center py-8 text-white/60">
                  <UsersRound className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No players found.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {getPaginatedProgress(playerProgress, currentProgressPage).map((player, index) => (
                      <motion.div
                        key={player.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.05 }}
                        className={`flex flex-col p-2 sm:p-3 rounded-lg border-2 transition-all duration-300 ${
                          player.rank === 1
                            ? "border-yellow-400 bg-yellow-400/10"
                            : player.rank === 2
                              ? "border-gray-300 bg-gray-300/10"
                              : player.rank === 3
                                ? "border-amber-600 bg-amber-600/10"
                                : "border-white/20 bg-white/5"
                        }`}
                      >
                        <div className="flex items-center gap-2 sm:gap-4">
                          <div className="text-lg sm:text-xl font-bold text-white w-6 sm:w-8 text-center">{player.rank}</div>

                          <Image
                            src={player.avatar || "/placeholder.svg"}
                            alt={getFirstName(player.name)}
                            width={40}
                            height={40}
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover"
                          />

                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-white text-sm sm:text-base truncate">{getFirstName(player.name)}</p>
                            <p className="text-yellow-300 text-xs sm:text-sm">{player.score} pts</p>
                          </div>

                          <div className="flex items-center gap-2">{getRankIcon(player.rank)}</div>
                        </div>

                        <div className="flex items-center gap-1 sm:gap-2 mt-2 sm:mt-3">
                          <span className="text-xs text-white/70 min-w-fit">
                            {player.currentQuestion}/{player.totalQuestions}
                          </span>
                          <StableProgressBar
                            playerId={player.id}
                            currentQuestion={player.currentQuestion}
                            totalQuestions={player.totalQuestions}
                          />
                          <span className="text-xs text-green-400 font-mono min-w-[30px] sm:min-w-[35px]">
                            {player.totalQuestions > 0
                              ? Math.round((player.currentQuestion / player.totalQuestions) * 100)
                              : 0}
                            %
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  
                  <PaginationControls
                    currentPage={currentProgressPage}
                    totalPages={getTotalPages(playerProgress.length)}
                    onPageChange={setCurrentProgressPage}
                    onDirectionChange={setSlideDirection}
                  />
                </>
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
                className="bg-[#1a1a2e] border-4 border-white font-mono text-white p-4 sm:p-8 rounded-lg shadow-[8px_8px_0px_#000] max-w-sm sm:max-w-md w-full mx-4 backdrop-blur-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center">
                  <div className="text-2xl sm:text-4xl mb-4">⚠️</div>
                  <h2 className="text-lg sm:text-xl mb-4 font-bold">Exit Game?</h2>
                  <p className="text-xs sm:text-sm mb-6 text-white/80">
                    Are you sure you want to exit? The game session will end immediately and all players will be
                    disconnected.
                  </p>
                  <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4">
                    <PixelButton color="gray" onClick={() => setShowExitModal(false)} className="text-xs sm:text-sm">
                      Cancel
                    </PixelButton>
                    <PixelButton color="red" onClick={handleExitGame} className="text-xs sm:text-sm">
                      End Session
                    </PixelButton>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}

// === STATIC BACKGROUND ===
const StaticBackground = () => (
  <div className="fixed inset-0 z-0 overflow-hidden bg-black">
    <div className="absolute inset-0">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="galaxy1" cx="20%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#4c1d95" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#1e1b4b" stopOpacity="0.2" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="galaxy2" cx="80%" cy="70%" r="65%">
            <stop offset="0%" stopColor="#701a75" stopOpacity="0.25" />
            <stop offset="50%" stopColor="#312e81" stopOpacity="0.15" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="galaxy3" cx="60%" cy="10%" r="55%">
            <stop offset="0%" stopColor="#064e3b" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#1e1b4b" stopOpacity="0.1" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="galaxy4" cx="10%" cy="80%" r="45%">
            <stop offset="0%" stopColor="#7f1d1d" stopOpacity="0.15" />
            <stop offset="50%" stopColor="#312e81" stopOpacity="0.1" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="nebula1" cx="40%" cy="60%" r="90%">
            <stop offset="0%" stopColor="#1e1b4b" stopOpacity="0.1" />
            <stop offset="70%" stopColor="#0f0f23" stopOpacity="0.05" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="#000000" />
        <rect width="100%" height="100%" fill="url(#nebula1)" />
        <rect width="100%" height="100%" fill="url(#galaxy1)" />
        <rect width="100%" height="100%" fill="url(#galaxy2)" />
        <rect width="100%" height="100%" fill="url(#galaxy3)" />
        <rect width="100%" height="100%" fill="url(#galaxy4)" />
      </svg>
    </div>

    {Array.from({ length: 300 }).map((_, i) => (
      <div
        key={`distant-star-${i}`}
        className="absolute bg-white rounded-full"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          width: `${Math.random() * 1.5 + 0.3}px`,
          height: `${Math.random() * 1.5 + 0.3}px`,
          opacity: Math.random() * 0.4 + 0.1,
        }}
      />
    ))}

    {Array.from({ length: 50 }).map((_, i) => (
      <div
        key={`bright-star-${i}`}
        className="absolute bg-white rounded-full"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          width: `${Math.random() * 2 + 1}px`,
          height: `${Math.random() * 2 + 1}px`,
          opacity: Math.random() * 0.6 + 0.4,
          boxShadow: "0 0 8px rgba(255, 255, 255, 0.6), 0 0 16px rgba(255, 255, 255, 0.3)",
        }}
      />
    ))}

    {Array.from({ length: 3 }).map((_, i) => (
      <div
        key={`shooting-star-${i}`}
        className="absolute bg-gradient-to-r from-white to-transparent h-px opacity-70"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          width: `${Math.random() * 100 + 50}px`,
          transform: `rotate(${Math.random() * 360}deg)`,
          animation: `shooting-star ${Math.random() * 8 + 4}s infinite linear`,
          animationDelay: `${Math.random() * 5}s`,
        }}
      />
    ))}
  </div>
)

// === PIXEL BUTTON ===
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