"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Trophy, Zap, Star, Heart, Bomb } from 'lucide-react'
import { useMobileOptimization } from '@/hooks/use-mobile-optimization'

interface MiniGameProps {
  level?: number
  onComplete: (score: number) => void
}

interface Item {
  id: string
  type: 'positive' | 'negative'
  icon: React.ReactNode
  points: number
  x: number
  y: number
  vx?: number
  vy?: number
}

export default function MiniGame({ level = 1, onComplete }: MiniGameProps) {
  const [stage, setStage] = useState<'game' | 'end'>('game')
  const [timeLeft, setTimeLeft] = useState(8)
  const [items, setItems] = useState<Item[]>([])
  const [score, setScore] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Performance optimization refs
  const animationFrameRef = useRef<number>()
  const lastFrameTime = useRef(performance.now())
  const itemPool = useRef<Item[]>([])
  
  // Use mobile optimization hook
  const mobileConfig = useMobileOptimization(level)

  const itemTypes = useMemo(() => [
    { type: 'positive' as const, icon: <Star className="w-6 h-6" />, points: 50 },
    { type: 'positive' as const, icon: <Heart className="w-6 h-6" />, points: 30 },
    { type: 'positive' as const, icon: <Zap className="w-6 h-6" />, points: 40 },
    { type: 'negative' as const, icon: <Bomb className="w-6 h-6" />, points: -30 },
  ], [])

  // Optimized item spawning with object pooling
  const spawnItem = useCallback(() => {
    if (!containerRef.current || items.length >= mobileConfig.maxItems) return
    
    const rect = containerRef.current.getBoundingClientRect()
    const itemType = itemTypes[Math.floor(Math.random() * itemTypes.length)]
    const x = Math.random() * (rect.width - 60) + 30
    const y = Math.random() * (rect.height - 60) + 30
    
    const newItem: Item = {
      id: Math.random().toString(36).substring(7),
      type: itemType.type,
      icon: itemType.icon,
      points: itemType.points,
      x,
      y,
      vx: (Math.random() - 0.5) * 2.5 * mobileConfig.velocityMultiplier,
      vy: (Math.random() - 0.5) * 2.5 * mobileConfig.velocityMultiplier,
    }
    
    setItems(prev => [...prev, newItem])
  }, [itemTypes, items.length, mobileConfig.maxItems, mobileConfig.velocityMultiplier])

  // ---------- STAGE: GAME ----------
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setStage('end')
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Optimized item spawning with adaptive timing
  useEffect(() => {
    const interval = setInterval(spawnItem, mobileConfig.spawnInterval)
    return () => clearInterval(interval)
  }, [level, spawnItem, mobileConfig.spawnInterval])

  // Optimized game loop using requestAnimationFrame
  const gameLoop = useCallback((currentTime: number) => {
    if (stage !== 'game' || !containerRef.current) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
      return
    }

    const deltaTime = Math.min((currentTime - lastFrameTime.current) / 1000, 0.033)
    lastFrameTime.current = currentTime
    
    // Adaptive frame rate for mobile
    const frameInterval = 1000 / mobileConfig.frameRate
    
    if (deltaTime * 1000 >= frameInterval) {
      const rect = containerRef.current.getBoundingClientRect()
      
      setItems(prev => 
        prev.map(item => ({
          ...item,
          x: Math.max(0, Math.min(item.x + (item.vx ?? 0) * deltaTime * 60, rect.width - 48)),
          y: Math.max(0, Math.min(item.y + (item.vy ?? 0) * deltaTime * 60, rect.height - 48)),
        }))
      )
    }

    animationFrameRef.current = requestAnimationFrame(gameLoop)
  }, [stage])

  // Start game loop
  useEffect(() => {
    if (stage === 'game') {
      animationFrameRef.current = requestAnimationFrame(gameLoop)
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [stage, gameLoop])

  const collectItem = useCallback((item: Item) => {
    setItems(prev => prev.filter(i => i.id !== item.id))
    setScore(prev => prev + item.points)
  }, [])

  useEffect(() => {
    if (stage === 'end') {
      // Ensure score is valid before completing
      const validScore = Math.max(0, Math.floor(score || 0))
      setTimeout(() => onComplete(validScore), 2000)
    }
  }, [stage, score, onComplete])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-purple-500 via-blue-600 to-indigo-700 font-mono text-white">
      <AnimatePresence mode="wait">
        {/* ---------- GAME STAGE ---------- */}
        {stage === 'game' && (
          <motion.div
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full relative mini-game-container"
            ref={containerRef}
          >
            {/* Header */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
              <div className="bg-black/60 backdrop-blur-md border border-white/30 px-4 py-2 rounded-xl flex items-center gap-4 text-lg font-bold">
                <Clock className="w-5 h-5 text-yellow-300" />
                <span>{timeLeft}s</span>
                <span>|</span>
                <Trophy className="w-5 h-5 text-yellow-300" />
                <span>{score}</span>
              </div>
            </div>

            {/* Items with optimized rendering */}
            <AnimatePresence>
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  layout={false} // Disable layout animation for better performance
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  style={{ 
                    position: 'absolute', 
                    left: item.x, 
                    top: item.y
                  }}
                  className={`w-14 h-14 rounded-full flex items-center justify-center cursor-pointer shadow-lg text-white mini-game-item ${
                    item.type === 'positive'
                      ? 'bg-gradient-to-br from-yellow-400 to-orange-500'
                      : 'bg-gradient-to-br from-red-500 to-red-700'
                  }`}
                  onClick={() => collectItem(item)}
                  // Touch optimization for mobile
                  onTouchStart={(e) => {
                    e.preventDefault()
                    collectItem(item)
                  }}
                >
                  {item.icon}
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ---------- END STAGE ---------- */}
        {stage === 'end' && (
          <motion.div
            key="end"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/10 backdrop-blur-md border border-white/30 rounded-2xl p-8 max-w-md w-full text-center space-y-4"
          >
            <h2 className="text-3xl font-bold">Permainan Selesai!</h2>
            <p className="text-2xl">Skor Akhir: {score}</p>
            <p className="text-sm">Tutup dalam 2 detik...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}