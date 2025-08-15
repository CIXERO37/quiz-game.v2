/* eslint-disable @next/next/no-img-element */
"use client"

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import { Trophy, Medal, Star, Home } from 'lucide-react'
import confetti from 'canvas-confetti'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useGameStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'

interface PlayerResult {
  id: string
  name: string
  avatar: string
  score: number
  position: number
}

export default function ResultContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const gameId = searchParams.get("gameId") || useGameStore().gameId
  const playerId = searchParams.get("playerId") || useGameStore().playerId
  const [playerResults, setPlayerResults] = useState<PlayerResult[]>([])
  const [userPosition, setUserPosition] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)

  const {
    playerName,
    playerAvatar,
    score,
    isHost,
    resetGame,
  } = useGameStore()

  useEffect(() => {
    if (!gameId) {
      router.push("/")
      return
    }
    fetchResults()
  }, [gameId, playerId, router])

  const fetchResults = async () => {
    try {
      await supabase.from('players').update({ score }).eq('id', playerId)

      const { data: players, error } = await supabase
        .from('players')
        .select('*')
        .eq('game_id', gameId)
        .order('score', { ascending: false })

      if (error) throw error

      const results: PlayerResult[] = players.map((p, idx) => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        score: p.score,
        position: idx + 1,
      }))
      setPlayerResults(results)

      const userPos = results.findIndex(p => p.id === playerId) + 1
      setUserPosition(userPos)

      if (userPos <= 3 || (isHost && results.length > 0)) {
        setTimeout(() => confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } }), 500)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const getPodiumColor = (pos: number) => {
    switch (pos) {
      case 1: return 'from-yellow-400 to-yellow-600'
      case 2: return 'from-gray-300 to-gray-500'
      case 3: return 'from-amber-600 to-amber-800'
      default: return 'from-blue-400 to-blue-600'
    }
  }

  const handlePlayAgain = () => {
    resetGame()
    router.push('/')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white font-mono">
        <p>Loading result...</p>
      </div>
    )
  }

  const userResult = playerResults.find(p => p.id === playerId)
  if (!userResult && !isHost) return null

  if (isHost) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white p-6">
        <h1 className="text-4xl font-bold text-center mb-6">🏆 Final Results</h1>
        <div className="max-w-2xl mx-auto space-y-4">
          {playerResults.map((p, idx) => (
            <div key={p.id} className="flex items-center justify-between bg-slate-700 p-4 rounded-lg">
              <div className="flex items-center gap-4">
                <span className="text-2xl font-bold">{p.position}.</span>
                <img src={p.avatar} alt={p.name} className="w-10 h-10 rounded-full object-cover" />
                <span>{p.name}</span>
              </div>
              <span className="text-xl font-bold text-yellow-400">{p.score}</span>
            </div>
          ))}
        </div>
        <div className="text-center mt-6">
          <Button onClick={handlePlayAgain} className="bg-purple-600 hover:bg-purple-700">
            <Home className="w-5 h-5 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800 text-white p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        <div className="bg-slate-800/80 backdrop-blur-lg border border-slate-700 rounded-lg p-6 text-center space-y-4">
          <img src={playerAvatar} alt={playerName} className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-purple-500" />
          <h1 className="text-2xl font-bold">{playerName}</h1>
          <p className="text-3xl font-bold text-purple-400">{score} pts</p>
          <p className="text-xl">Position #{userPosition}</p>
          <Button onClick={handlePlayAgain} className="w-full bg-purple-600 hover:bg-purple-700">
            <Home className="w-5 h-5 mr-2" />
            Play Again
          </Button>
        </div>
        {/* komen */}
      </motion.div>
    </div>
  )
}