"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Star, Heart, Zap } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useGameStore } from "@/lib/store"

// Inisialisasi audio (lazy loading)
let backgroundMusic: HTMLAudioElement | null = null
let powerUpSound: HTMLAudioElement | null = null
let collisionSound: HTMLAudioElement | null = null

const initAudio = () => {
  if (typeof Audio !== "undefined") {
    backgroundMusic = new Audio("/audio/Space Pixel Background for Video Game - CraftPix - Game Assets.mp3")
    powerUpSound = new Audio("/audio/sound_untuk_dapat_poin.wav")
    collisionSound = new Audio("/audio/sound_untuk_kurangi_poin.wav")
  }
}

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

// CSS yang dioptimasi tapi tetap sama
const spaceBackgroundCSS = `
  .pixel-space-bg {
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%);
    overflow: hidden;
    will-change: transform;
  }

  .star-layer {
    position: absolute;
    inset: 0;
    background-image: 
      radial-gradient(1px 1px at 10% 20%, #fff, transparent),
      radial-gradient(1px 1px at 30% 40%, #fff, transparent),
      radial-gradient(1px 1px at 50% 60%, rgba(255,255,255,0.7), transparent),
      radial-gradient(1px 1px at 70% 30%, #fff, transparent),
      radial-gradient(1px 1px at 90% 80%, rgba(255,255,255,0.8), transparent);
    background-size: 200px 200px;
    background-repeat: repeat;
    animation: twinkle 6s infinite;
  }

  @keyframes twinkle {
    0%, 100% { opacity: 0.8; }
    50% { opacity: 0.3; }
  }

  .game-container * {
    -webkit-tap-highlight-color: transparent;
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    user-select: none;
  }

  .no-flicker {
    backface-visibility: hidden;
    transform: translateZ(0);
  }
`

export default function SpaceDodge({ onComplete }: Props) {
  const [timeLeft, setTimeLeft] = useState(30)
  const [score, setScore] = useState(0)
  const [meteors, setMeteors] = useState<Meteor[]>([])
  const [powerUps, setPowerUps] = useState<PowerUp[]>([])
  const [particles, setParticles] = useState<Particle[]>([])
  const [shipX, setShipX] = useState(50)
  const [gameOver, setGameOver] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const lastFrameTime = useRef(performance.now())
  const animationRef = useRef<number>()

  const { gameId, playerId } = useGameStore()

  // Mobile detection
  const isMobile = useRef(
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) || window.innerWidth <= 768
  )

  // Optimasi kecepatan untuk mobile
  const getSpeedMultiplier = useCallback(() => {
    if (timeLeft > 15) return isMobile.current ? 0.7 : 1
    return (1 + ((15 - timeLeft) / 15) * 1.5) * (isMobile.current ? 0.7 : 1)
  }, [timeLeft])

  // Spawn rate yang dioptimasi
  const SPAWN_RATES = {
    meteor: isMobile.current ? 800 : 600,
    powerup: isMobile.current ? 2200 : 2000,
  }

  // Object limits untuk performa
  const LIMITS = {
    meteors: isMobile.current ? 12 : 20,
    powerups: isMobile.current ? 6 : 10,
    particles: isMobile.current ? 15 : 25,
  }

  // Particle system yang dioptimasi
  const spawnParticles = useCallback((x: number, y: number, count: number, color: string) => {
    const maxCount = isMobile.current ? Math.min(count, 5) : count
    const newParticles: Particle[] = []
    
    for (let i = 0; i < maxCount; i++) {
      newParticles.push({
        id: Math.random().toString(36).slice(2),
        x,
        y,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3,
        size: Math.random() * 3 + 2,
        life: 1,
      })
    }
    
    setParticles(prev => [...prev.slice(-LIMITS.particles + maxCount), ...newParticles])
  }, [LIMITS.particles])

  // Hitbox yang dioptimasi untuk mobile
  const checkCollision = useCallback((objX: number, objY: number) => {
    const shipLeft = shipX - 5
    const shipRight = shipX + 5
    const shipTop = 82
    const shipBottom = 90
    
    return (
      objX >= shipLeft &&
      objX <= shipRight &&
      objY >= shipTop &&
      objY <= shipBottom
    )
  }, [shipX])

  // Game loop yang dioptimasi
  const gameLoop = useCallback((currentTime: number) => {
    if (gameOver || !containerRef.current) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      return
    }

    const deltaTime = Math.min((currentTime - lastFrameTime.current) / 1000, 0.033)
    lastFrameTime.current = currentTime
    const speed = deltaTime * 30 * getSpeedMultiplier()

    // Update meteors dengan limit
    setMeteors(prev => 
      prev
        .map(m => ({ ...m, y: m.y + m.speed * speed }))
        .filter(m => {
          if (m.y > 110) return false
          if (checkCollision(m.x, m.y)) {
            setScore(s => Math.max(0, s - 20))
            spawnParticles(m.x, m.y, 6, "#f87171")
            return false
          }
          return true
        })
        .slice(-LIMITS.meteors)
    )

    // Update power-ups dengan limit
    setPowerUps(prev =>
      prev
        .map(p => ({ ...p, y: p.y + speed }))
        .filter(p => {
          if (p.y > 110) return false
          if (checkCollision(p.x, p.y)) {
            setScore(s => s + p.points)
            spawnParticles(p.x, p.y, 5, p.type === "star" ? "#fbbf24" : p.type === "heart" ? "#ec4899" : "#38bdf8")
            return false
          }
          return true
        })
        .slice(-LIMITS.powerups)
    )

    // Update particles
    setParticles(prev =>
      prev
        .map(p => ({
          ...p,
          x: p.x + p.vx * deltaTime * 20,
          y: p.y + p.vy * deltaTime * 20,
          life: p.life - deltaTime * 2,
        }))
        .filter(p => p.life > 0)
    )

    animationRef.current = requestAnimationFrame(gameLoop)
  }, [gameOver, getSpeedMultiplier, checkCollision, spawnParticles, LIMITS])

  // Start game loop
  useEffect(() => {
    if (!gameOver) {
      animationRef.current = requestAnimationFrame(gameLoop)
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [gameOver, gameLoop])

  // Spawn systems yang dioptimasi
  useEffect(() => {
    if (gameOver) return

    const meteorTimer = setInterval(() => {
      const id = Math.random().toString(36).slice(2)
      const x = Math.random() * 90 + 5
      setMeteors(prev => [...prev, { id, x, y: -10, speed: 1 + Math.random() * 2 }])
    }, SPAWN_RATES.meteor)

    const powerupTimer = setInterval(() => {
      const id = Math.random().toString(36).slice(2)
      const x = Math.random() * 90 + 5
      const types = Object.keys(POWER_UPS_CONFIG) as (keyof typeof POWER_UPS_CONFIG)[]
      const type = types[Math.floor(Math.random() * types.length)]
      setPowerUps(prev => [...prev, { id, x, y: -10, type, ...POWER_UPS_CONFIG[type] }])
    }, SPAWN_RATES.powerup)

    return () => {
      clearInterval(meteorTimer)
      clearInterval(powerupTimer)
    }
  }, [gameOver, SPAWN_RATES.meteor, SPAWN_RATES.powerup])

  // Timer
  useEffect(() => {
    if (gameOver) return
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameOver(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [gameOver])

  // Background music
  useEffect(() => {
    if (!gameOver) {
      initAudio()
      if (backgroundMusic && !isMobile.current) {
        backgroundMusic.loop = true
        backgroundMusic.volume = 0.3
        backgroundMusic.play().catch(() => {})
      }
    }
    return () => {
      if (backgroundMusic) {
        backgroundMusic.pause()
        backgroundMusic.currentTime = 0
      }
    }
  }, [gameOver])

  // Save score yang sudah diperbaiki
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

  // Touch control yang dioptimasi
  const handleMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return
    
    e.preventDefault()
    
    const rect = containerRef.current.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const percent = ((clientX - rect.left) / rect.width) * 100
    
    setShipX(Math.max(8, Math.min(92, percent)))
  }, [])

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center bg-black"
      onMouseMove={handleMove}
      onTouchMove={handleMove}
      onTouchStart={handleMove}
      onMouseDown={handleMove}
    >
      <style>{spaceBackgroundCSS}</style>
      <div className="pixel-space-bg">
        <div className="star-layer" />
      </div>

      {/* Background Canvas (optimized) */}
      <canvas 
        ref={useRef<HTMLCanvasElement>(null)} 
        className="z-0" 
        style={{ imageRendering: "pixelated", pointerEvents: "none" }} 
      />

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
        className="absolute bottom-8 w-12 h-12 flex items-center justify-center no-flicker"
        style={{ left: `${shipX}%`, x: "-50%" }}
        animate={{ scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
      >
        <img
          src="/images/DurrrSpaceShip_2.png"
          alt="Spaceship"
          className="w-12 h-12 drop-shadow-[0_0_8px_rgba(125,211,252,0.8)] object-contain"
          style={{ imageRendering: "pixelated" }}
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
            className="absolute w-8 h-8 no-flicker"
            style={{ left: `${m.x}%`, top: `${m.y}%`, x: "-50%", y: "-50%" }}
          >
            <img
              src="/images/Asteroid.png"
              alt="Meteor"
              className="w-8 h-8 drop-shadow-[0_0_6px_rgba(248,113,113,0.6)] object-contain"
              style={{ imageRendering: "pixelated" }}
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
            className="absolute w-8 h-8 text-white rounded-full flex items-center justify-center drop-shadow-[0_0_6px_rgba(255,255,255,0.8)] no-flicker"
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
            className="absolute rounded-full no-flicker"
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