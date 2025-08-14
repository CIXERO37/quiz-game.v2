"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Play, Users, Gamepad2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { QuizSelectionDialog } from "@/components/quiz-selection-dialog"
import { JoinGameDialog } from "@/components/join-game-dialog"

function GameCodeHandler({ onGameCodeDetected }: { onGameCodeDetected: (code: string) => void }) {
  const searchParams = useSearchParams()

  useEffect(() => {
    const codeParam = searchParams.get("code")
    if (codeParam) {
      console.log("Game code detected from URL:", codeParam) // Debug log
      onGameCodeDetected(codeParam.toUpperCase())
    }
  }, [searchParams, onGameCodeDetected])

  return null
}

export default function HomePage() {
  const [showQuizSelection, setShowQuizSelection] = useState(false)
  const [showJoinGame, setShowJoinGame] = useState(false)
  const [gameCodeFromUrl, setGameCodeFromUrl] = useState("")

  const handleGameCodeDetected = (code: string) => {
    console.log("Setting game code:", code) // Debug log
    setGameCodeFromUrl(code)
    setShowJoinGame(true)
  }

  return (
    <>
      <Suspense fallback={null}>
        <GameCodeHandler onGameCodeDetected={handleGameCodeDetected} />
      </Suspense>

      <div className="fixed inset-0 z-0 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/images/galaxy.webp')",
          }}
        />

        <div className="absolute inset-0 flex items-center justify-center">
          {/* Inner orbit planets - responsive sizing */}
          <div className="absolute orbit-inner">
            <div className="w-[1vw] h-[1vw] min-w-[12px] min-h-[12px] max-w-[16px] max-h-[16px] bg-gradient-to-br from-orange-400 to-red-500 rounded-full shadow-lg shadow-orange-400/60 border border-orange-300/30">
              <div className="w-full h-full rounded-full bg-gradient-to-tl from-transparent to-white/20"></div>
            </div>
          </div>
          <div className="absolute orbit-inner" style={{ animationDelay: "-10s" }}>
            <div className="w-[0.8vw] h-[0.8vw] min-w-[10px] min-h-[10px] max-w-[14px] max-h-[14px] bg-gradient-to-br from-gray-400 to-gray-600 rounded-full shadow-lg shadow-gray-400/50 border border-gray-300/30">
              <div className="w-full h-full rounded-full bg-gradient-to-tl from-transparent to-white/30"></div>
            </div>
          </div>

          {/* Middle orbit planets - responsive sizing */}
          <div className="absolute orbit-middle">
            <div className="w-[1.5vw] h-[1.5vw] min-w-[18px] min-h-[18px] max-w-[24px] max-h-[24px] bg-gradient-to-br from-blue-400 to-blue-600 rounded-full shadow-lg shadow-blue-400/70 border border-blue-300/40 relative">
              <div className="w-full h-full rounded-full bg-gradient-to-tl from-transparent to-white/25"></div>
              <div className="absolute top-[0.2vw] left-[0.2vw] w-[0.2vw] h-[0.2vw] min-w-[2px] min-h-[2px] max-w-[4px] max-h-[4px] bg-green-300 rounded-full opacity-60"></div>
              <div className="absolute bottom-[0.3vw] right-[0.2vw] w-[0.2vw] h-[0.1vw] min-w-[2px] min-h-[1px] max-w-[4px] max-h-[2px] bg-green-400 rounded-full opacity-40"></div>
            </div>
          </div>
          <div className="absolute orbit-middle" style={{ animationDelay: "-17s" }}>
            <div className="w-[1.2vw] h-[1.2vw] min-w-[16px] min-h-[16px] max-w-[20px] max-h-[20px] bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full shadow-lg shadow-yellow-300/60 border border-yellow-200/40">
              <div className="w-full h-full rounded-full bg-gradient-to-tl from-transparent to-white/20"></div>
            </div>
          </div>

          {/* Outer orbit planets - responsive sizing */}
          <div className="absolute orbit-outer">
            <div className="w-[2vw] h-[2vw] min-w-[24px] min-h-[24px] max-w-[32px] max-h-[32px] bg-gradient-to-br from-orange-300 to-red-600 rounded-full shadow-lg shadow-orange-400/80 border border-orange-200/50 relative">
              <div className="w-full h-full rounded-full bg-gradient-to-tl from-transparent to-white/20"></div>
              <div className="absolute top-[0.5vw] left-[0.5vw] w-[0.3vw] h-[0.1vw] min-w-[4px] min-h-[2px] max-w-[6px] max-h-[2px] bg-red-800 rounded-full opacity-70"></div>
              <div className="absolute bottom-[0.3vw] right-[0.5vw] w-[0.2vw] h-[0.1vw] min-w-[3px] min-h-[2px] max-w-[4px] max-h-[2px] bg-red-700 rounded-full opacity-50"></div>
            </div>
          </div>
          <div className="absolute orbit-outer" style={{ animationDelay: "-25s" }}>
            <div className="w-[1.8vw] h-[1.8vw] min-w-[22px] min-h-[22px] max-w-[28px] max-h-[28px] bg-gradient-to-br from-red-400 to-red-700 rounded-full shadow-lg shadow-red-400/70 border border-red-300/40">
              <div className="w-full h-full rounded-full bg-gradient-to-tl from-transparent to-white/15"></div>
            </div>
          </div>

          {/* Far orbit planets with Saturn rings - responsive sizing */}
          <div className="absolute orbit-far">
            <div className="relative">
              <div className="w-[2.5vw] h-[2.5vw] min-w-[30px] min-h-[30px] max-w-[40px] max-h-[40px] bg-gradient-to-br from-yellow-200 to-amber-400 rounded-full shadow-lg shadow-yellow-300/80 border border-yellow-100/50">
                <div className="w-full h-full rounded-full bg-gradient-to-tl from-transparent to-white/25"></div>
              </div>
              {/* Saturn's rings - responsive */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-[3.5vw] h-[3.5vw] min-w-[42px] min-h-[42px] max-w-[56px] max-h-[56px] border border-yellow-200/30 rounded-full"></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-[4vw] h-[4vw] min-w-[48px] min-h-[48px] max-w-[64px] max-h-[64px] border border-yellow-100/20 rounded-full"></div>
              </div>
            </div>
          </div>
          <div className="absolute orbit-far" style={{ animationDelay: "-35s" }}>
            <div className="w-[1.5vw] h-[1.5vw] min-w-[18px] min-h-[18px] max-w-[24px] max-h-[24px] bg-gradient-to-br from-purple-300 to-indigo-500 rounded-full shadow-lg shadow-purple-400/60 border border-purple-200/40">
              <div className="w-full h-full rounded-full bg-gradient-to-tl from-transparent to-white/20"></div>
            </div>
          </div>

          {/* Central sun - responsive sizing */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[3vw] h-[3vw] min-w-[36px] min-h-[36px] max-w-[48px] max-h-[48px] bg-gradient-to-br from-yellow-200 via-orange-300 to-red-400 rounded-full shadow-lg shadow-yellow-300/90 border border-yellow-100/60 animate-pulse">
              <div className="w-full h-full rounded-full bg-gradient-to-tl from-transparent to-white/40"></div>
            </div>
          </div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center cosmic-ring-slow">
          <div className="w-[80vw] h-[80vw] min-w-[320px] min-h-[320px] max-w-[500px] max-h-[500px] border border-purple-300/10 rounded-full"></div>
        </div>

        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ animation: "cosmic-ring-orbit 120s linear infinite" }}
        >
          <div className="w-[100vw] h-[100vw] min-w-[400px] min-h-[400px] max-w-[700px] max-h-[700px] border border-blue-300/8 rounded-full"></div>
        </div>

        {/* Dark Overlay for text readability */}
        <div className="absolute inset-0 bg-black/30"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 min-h-screen flex flex-col justify-center items-center">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8 sm:mb-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 150 }}
            className="mb-4 sm:mb-6"
          >
            <div
              className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mx-auto bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center mb-4 border-4 border-white/30"
              style={{ imageRendering: "pixelated" }}
            >
              <Gamepad2 className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white" />
            </div>
          </motion.div>

          <h1
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 sm:mb-4"
            style={{
              textShadow: "2px 2px 0px #000, 4px 4px 0px #333",
              fontFamily: "monospace",
              imageRendering: "pixelated",
            }}
          >
            QUIZ-GAME
          </h1>
          <p
            className="text-base sm:text-lg md:text-xl text-white max-w-2xl mx-auto px-4"
            style={{
              textShadow: "1px 1px 0px #000",
              fontFamily: "monospace",
            }}
          >
            Challenge your friends with interactive quizzes and exciting mini-game!
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8 w-full max-w-2xl px-4"
        >
          <motion.div whileHover={{ scale: 1.05, y: -10 }} whileTap={{ scale: 0.95 }} className="group">
            <Button
              onClick={() => setShowQuizSelection(true)}
              className="w-full h-32 sm:h-36 md:h-40 bg-[#FF6B6B] border-4 border-[#FF5252] hover:bg-[#FF5252] transition-all duration-300 flex flex-col items-center justify-center space-y-2 sm:space-y-3 md:space-y-4 text-white font-mono shadow-lg"
              style={{ imageRendering: "pixelated" }}
            >
              <div
                className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-[#FFD93D] border-2 border-[#FFC107] rounded-md flex items-center justify-center group-hover:rotate-12 transition-transform duration-300"
                style={{ imageRendering: "pixelated" }}
              >
                <Play className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-[#FF6B6B]" />
              </div>
              <div className="text-center">
                <h2 className="text-xl sm:text-xl md:text-2xl font-bold mb-1">HOST</h2>
              </div>
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05, y: -10 }} whileTap={{ scale: 0.95 }} className="group">
            <Button
              onClick={() => setShowJoinGame(true)}
              className="w-full h-32 sm:h-36 md:h-40 bg-[#4ECDC4] border-4 border-[#26A69A] hover:bg-[#26A69A] transition-all duration-300 flex flex-col items-center justify-center space-y-2 sm:space-y-3 md:space-y-4 text-white font-mono shadow-lg"
              style={{ imageRendering: "pixelated" }}
            >
              <div
                className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-[#FFD93D] border-2 border-[#FFC107] rounded-md flex items-center justify-center group-hover:rotate-12 transition-transform duration-300"
                style={{ imageRendering: "pixelated" }}
              >
                <Users className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-[#4ECDC4]" />
              </div>
              <div className="text-center">
                <h2 className="text-xl sm:text-xl md:text-2xl font-bold mb-1">JOIN</h2>
              </div>
            </Button>
          </motion.div>
        </motion.div>
      </div>

      <QuizSelectionDialog open={showQuizSelection} onOpenChange={setShowQuizSelection} />

      <JoinGameDialog open={showJoinGame} onOpenChange={setShowJoinGame} initialGameCode={gameCodeFromUrl} />
    </>
  )
}
