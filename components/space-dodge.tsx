// space-dodge.tsx
"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Star, Heart, Zap } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useGameStore } from "@/lib/store"

// Inisialisasi audio
const backgroundMusic = typeof Audio !== "undefined" ? new Audio("/audio/Space Pixel Background for Video Game - CraftPix - Game Assets.mp3") : null
const powerUpSound = typeof Audio !== "undefined" ? new Audio("/audio/sound_untuk_dapat_poin.wav") : null
const collisionSound = typeof Audio !== "undefined" ? new Audio("/audio/sound_untuk_kurangi_poin.wav") : null

interface Props {
  onComplete: (score: number) => void
}

interface Meteor {
  id: string
  x: number
  y: number
  speed: number
}

interface PowerUp {
  id: string
  x: number
  y: number
  type: "star" | "heart" | "zap"
  points: number
  icon: React.ReactNode
}

interface Particle {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  size: number
  life: number
}

const POWER_UPS_CONFIG = {
  star: { points: 50, icon: <Star className="w-5 h-5" /> },
  heart: { points: 30, icon: <Heart className="w-5 h-5" /> },
  zap: { points: 20, icon: <Zap className="w-5 h-5" /> },
}

export default function SpaceDodge({ onComplete }: Props) {
  const [timeLeft, setTimeLeft] = useState(30)
  const [score, setScore] = useState(0)
  const [meteors, setMeteors] = useState<Meteor[]>([])
  const [powerUps, setPowerUps] = useState<PowerUp[]>([])
  const [particles, setParticles] = useState<Particle[]>([])
  const [shipX, setShipX] = useState(50)
  const [gameOver, setGameOver] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const lastFrameTime = useRef(performance.now())

  const { gameId, playerId } = useGameStore()

  // Fungsi untuk menghitung multiplier kecepatan
  const getSpeedMultiplier = () => {
  if (timeLeft > 15) return 1.0
  return 1 + ((15 - timeLeft) / 15) * 1.5 // 1.0 → 2.0
}

  // ---------- BACKGROUND MUSIC ----------
  useEffect(() => {
    if (backgroundMusic && !gameOver) {
      backgroundMusic.loop = true
      backgroundMusic.volume = 0.3
      backgroundMusic.play().catch((e) => console.error("Error playing background music:", e))
    }
    return () => {
      if (backgroundMusic) {
        backgroundMusic.pause()
        backgroundMusic.currentTime = 0
      }
    }
  }, [gameOver])

  // ---------- TIMER ----------
  useEffect(() => {
    if (gameOver) return
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          setGameOver(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [gameOver])

  // ---------- SAVE SCORE AND CALL ONCOMPLETE ----------
  useEffect(() => {
    if (gameOver && gameId && playerId) {
      supabase
        .from("player_answers")
        .insert({
          player_id: playerId,
          game_id: gameId,
          question_index: -1,
          is_correct: true,
          points_earned: Math.floor(score),
        })
        .then(({ error }) => {
          if (error) {
            console.error("Supabase insert error:", error)
          }
        })
      onComplete(Math.floor(score))
    }
  }, [gameOver, gameId, playerId, score, onComplete])

  // ---------- SPAWN METEORS ----------
  useEffect(() => {
    if (gameOver) return
    const spawn = setInterval(() => {
      const id = Math.random().toString(36).slice(2)
      const x = Math.random() * 90 + 5
      setMeteors((m) => [...m, { id, x, y: -10, speed: 1 + Math.random() * 2 }])
    }, 600)
    return () => clearInterval(spawn)
  }, [gameOver])

  // ---------- SPAWN POWER-UPS ----------
  useEffect(() => {
    if (gameOver) return
    const spawn = setInterval(() => {
      const id = Math.random().toString(36).slice(2)
      const x = Math.random() * 90 + 5
      const types = Object.keys(POWER_UPS_CONFIG) as (keyof typeof POWER_UPS_CONFIG)[]
      const type = types[Math.floor(Math.random() * types.length)]
      setPowerUps((p) => [...p, { id, x, y: -10, type, ...POWER_UPS_CONFIG[type] }])
    }, 2000)
    return () => clearInterval(spawn)
  }, [gameOver])

  // ---------- PARTICLE SYSTEM ----------
  const spawnParticles = (x: number, y: number, count: number, color: string) => {
    const newParticles: Particle[] = []
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: Math.random().toString(36).slice(2),
        x,
        y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        size: Math.random() * 4 + 2,
        life: 1,
      })
    }
    setParticles((p) => [...p, ...newParticles])
  }

  // ---------- MOVE & COLLISION ----------
  useEffect(() => {
    let animationFrameId: number
    const move = (currentTime: number) => {
      if (gameOver || !containerRef.current) {
        cancelAnimationFrame(animationFrameId)
        return
      }
      const rect = containerRef.current.getBoundingClientRect()
      const deltaTime = (currentTime - lastFrameTime.current) / 1000
      lastFrameTime.current = currentTime

      const speedMultiplier = getSpeedMultiplier()

      setMeteors((prev) =>
        prev
          .map((m) => ({ ...m, y: m.y + m.speed * deltaTime * 30 * speedMultiplier }))
          .filter((m) => {
            if (m.y > 110) return false
            const hit = Math.abs(m.x - shipX) < 2.5 && m.y > 80 && m.y < 90
            if (hit) {
              setScore((s) => Math.max(0, s - 20))
              spawnParticles(m.x, m.y, 10, "#f87171")
              if (collisionSound) {
                collisionSound.currentTime = 0
                collisionSound.play().catch((e) => console.error("Error playing collision sound:", e))
              }
            }
            return !hit
          })
      )

      setPowerUps((prev) =>
        prev
          .map((p) => ({ ...p, y: p.y + 1 * deltaTime * 30 * speedMultiplier }))
          .filter((p) => {
            if (p.y > 110) return false
            const hit = Math.abs(p.x - shipX) < 2.5 && p.y > 80 && p.y < 90
            if (hit) {
              setScore((s) => s + p.points)
              spawnParticles(p.x, p.y, 8, p.type === "star" ? "#fbbf24" : p.type === "heart" ? "#ec4899" : "#38bdf8")
              if (powerUpSound) {
                powerUpSound.currentTime = 0
                powerUpSound.play().catch((e) => console.error("Error playing power-up sound:", e))
              }
            }
            return !hit
          })
      )

      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx * deltaTime * 30,
            y: p.y + p.vy * deltaTime * 30,
            life: p.life - deltaTime * 2,
          }))
          .filter((p) => p.life > 0)
      )

      animationFrameId = requestAnimationFrame(move)
    }
    animationFrameId = requestAnimationFrame(move)
    return () => cancelAnimationFrame(animationFrameId)
  }, [shipX, gameOver, timeLeft])

  // ---------- SHIP CONTROL ----------
  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
    const percent = ((clientX - rect.left) / rect.width) * 100
    setShipX(Math.max(5, Math.min(95, percent)))
  }

  // ---------- CANVAS FOR BACKGROUND IMAGE ----------
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const backgroundImage = new Image()
    backgroundImage.src = "/images/space_background.jpg"

    let animationFrameId: number
    const animateBackground = () => {
      if (gameOver) {
        cancelAnimationFrame(animationFrameId)
        return
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      if (backgroundImage.complete) {
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height)
      }
      animationFrameId = requestAnimationFrame(animateBackground)
    }

    backgroundImage.onload = () => {
      animateBackground()
    }

    return () => cancelAnimationFrame(animationFrameId)
  }, [gameOver])

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 overflow-hidden"
      onMouseMove={handleMove}
      onTouchMove={handleMove}
    >
      {/* Background Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0" />

      {/* HUD */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4 bg-gradient-to-r from-purple-900/80 to-indigo-900/80 backdrop-blur-md px-6 py-3 rounded-lg border-2 border-yellow-300 shadow-lg">
        <div className="flex items-center gap-2">
          <span className="font-bold text-white">⏱ {timeLeft}s</span>
          <div className="w-32 h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-yellow-300 transition-all"
              style={{ width: `${(timeLeft / 30) * 100}%` }}
            />
          </div>
        </div>
        <span className="font-bold text-yellow-300">⭐ {Math.floor(score)}</span>
      </div>

      {/* Ship */}
      <motion.div
        className="absolute bottom-8 w-12 h-12 flex items-center justify-center"
        style={{ left: `${shipX}%`, x: "-50%" }}
        animate={{ scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
      >
        <img
          src="/images/DurrrSpaceShip_2.png"
          alt="Spaceship"
          className="w-12 h-12 drop-shadow-[0_0_8px_rgba(125,211,252,0.8)] object-contain"
          onError={() => console.error("Failed to load spaceship image: /images/DurrrSpaceShip_2.png")}
        />
      </motion.div>

      {/* Meteors */}
      <AnimatePresence>
        {meteors.map((m) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, scale: 0.5, rotate: 0 }}
            animate={{ opacity: 1, scale: 1, rotate: 360 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ rotate: { duration: 2, repeat: Infinity, ease: "linear" } }}
            className="absolute w-8 h-8"
            style={{ left: `${m.x}%`, top: `${m.y}%`, x: "-50%", y: "-50%" }}
          >
            <img
              src="/images/Asteroid.png"
              alt="Meteor"
              className="w-8 h-8 drop-shadow-[0_0_6px_rgba(248,113,113,0.6)] object-contain"
              onError={() => console.error("Failed to load meteor image: /images/Asteroid.png")}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Power-ups */}
      <AnimatePresence>
        {powerUps.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1, rotate: [0, 10, -10, 0] }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ rotate: { repeat: Infinity, duration: 1.5 } }}
            className="absolute w-8 h-8 text-white rounded-full flex items-center justify-center drop-shadow-[0_0_6px_rgba(255,255,255,0.8)]"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              x: "-50%",
              y: "-50%",
              backgroundColor: p.type === "star" ? "#fbbf24" : p.type === "heart" ? "#ec4899" : "#38bdf8",
            }}
          >
            {p.icon}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Particles */}
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 1, scale: 1 }}
            animate={{ opacity: 0, scale: 0.5, x: p.vx * 20, y: p.vy * 20 }}
            transition={{ duration: p.life }}
            className="absolute rounded-full"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              backgroundColor: p.life > 0.5 ? "#ffffff" : "#aaaaaa",
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}