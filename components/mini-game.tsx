"use client"

import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Trophy, Zap, Star, Heart, Bomb } from 'lucide-react'

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

  const itemTypes = useMemo(() => [
    { type: 'positive' as const, icon: <Star className="w-6 h-6" />, points: 50 },
    { type: 'positive' as const, icon: <Heart className="w-6 h-6" />, points: 30 },
    { type: 'positive' as const, icon: <Zap className="w-6 h-6" />, points: 40 },
    { type: 'negative' as const, icon: <Bomb className="w-6 h-6" />, points: -30 },
  ], [])

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

  useEffect(() => {
    const spawnItem = () => {
      if (!containerRef.current) return
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
        vx: (Math.random() - 0.5) * 2.5,
        vy: (Math.random() - 0.5) * 2.5,
      }
      setItems((prev) => [...prev, newItem])
    }

    const interval = setInterval(spawnItem, Math.max(500, 1000 - level * 100))
    return () => clearInterval(interval)
  }, [level, itemTypes])

  useEffect(() => {
    const moveInterval = setInterval(() => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      setItems((prev) =>
        prev.map((item) => ({
          ...item,
          x: Math.max(0, Math.min(item.x + (item.vx ?? 0), rect.width - 48)),
          y: Math.max(0, Math.min(item.y + (item.vy ?? 0), rect.height - 48)),
        }))
      )
    }, 50)
    return () => clearInterval(moveInterval)
  }, [])

  const collectItem = (item: Item) => {
    setItems((prev) => prev.filter((i) => i.id !== item.id))
    setScore((prev) => prev + item.points)
  }

  useEffect(() => {
    if (stage === 'end') {
      setTimeout(() => onComplete(score), 2000)
    }
  }, [stage, score, onComplete])

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
            className="w-full h-full relative"
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

            {/* Items */}
            <AnimatePresence>
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  style={{ position: 'absolute', left: item.x, top: item.y }}
                  className={`w-14 h-14 rounded-full flex items-center justify-center cursor-pointer shadow-lg text-white ${
                    item.type === 'positive'
                      ? 'bg-gradient-to-br from-yellow-400 to-orange-500'
                      : 'bg-gradient-to-br from-red-500 to-red-700'
                  }`}
                  onClick={() => collectItem(item)}
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