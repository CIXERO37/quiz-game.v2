/* eslint-disable @next/next/no-img-element */
"use client"

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
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

export default function ResultPage() {
  const [playerResults, setPlayerResults] = useState<PlayerResult[]>([])
  const [userPosition, setUserPosition] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  
  const { 
    gameId, 
    playerId, 
    playerName, 
    playerAvatar, 
    score, 
    isHost,
    resetGame 
  } = useGameStore()

  useEffect(() => {
    if (!gameId) {
      router.push('/')
      return
    }

    fetchResults()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId])

  const fetchResults = async () => {
    try {
      // Update current player's final score
      await supabase
        .from('players')
        .update({ score })
        .eq('id', playerId)

      // Fetch all players and their scores
      const { data: players, error } = await supabase
        .from('players')
        .select('*')
        .eq('game_id', gameId)
        .order('score', { ascending: false })

      if (error) throw error

      // Add positions
      const results: PlayerResult[] = players.map((player, index) => ({
        id: player.id,
        name: player.name,
        avatar: player.avatar,
        score: player.score,
        position: index + 1
      }))

      setPlayerResults(results)
      
      // Find user's position
      const userPos = results.findIndex(p => p.id === playerId) + 1
      setUserPosition(userPos)

      // Trigger confetti for top 3 or if user did well
      if (userPos <= 3 || (isHost && results.length > 0)) {
        setTimeout(() => {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          })
        }, 500)
      }

    } catch (error) {
      console.error('Error fetching results:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getPodiumColor = (position: number) => {
    switch (position) {
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
      <>
        {/* Pixel Art Background with Dark Overlay */}
        <div className="fixed inset-0 z-0 overflow-hidden">
          <div className="absolute inset-0 bg-[#87CEEB]" style={{ imageRendering: 'pixelated' }}></div>
          <div className="absolute top-10 left-10 w-20 h-10 bg-white" style={{ imageRendering: 'pixelated' }}></div>
          <div className="absolute top-12 left-20 w-10 h-10 bg-white" style={{ imageRendering: 'pixelated' }}></div>
          <div className="absolute top-20 right-24 w-24 h-12 bg-white" style={{ imageRendering: 'pixelated' }}></div>
          <div className="absolute top-24 right-36 w-12 h-12 bg-white" style={{ imageRendering: 'pixelated' }}></div>
          <div className="absolute bottom-0 w-full h-1/3 bg-[#8B4513]" style={{ imageRendering: 'pixelated' }}>
            <div className="absolute top-0 w-full h-6 bg-[#228B22]" style={{ imageRendering: 'pixelated' }}></div>
            <div className="absolute bottom-10 left-1/4">
              <div className="w-4 h-20 bg-[#8B4513] mx-auto" style={{ imageRendering: 'pixelated' }}></div>
              <div className="w-16 h-16 bg-[#006400] -mt-8 mx-auto" style={{ imageRendering: 'pixelated' }}></div>
            </div>
            <div className="absolute bottom-10 right-1/4">
              <div className="w-4 h-24 bg-[#8B4513] mx-auto" style={{ imageRendering: 'pixelated' }}></div>
              <div className="w-20 h-20 bg-[#006400] -mt-10 mx-auto" style={{ imageRendering: 'pixelated' }}></div>
            </div>
          </div>
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `
                repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, transparent 1px, transparent 2px, rgba(0,0,0,0.15) 3px),
                repeating-linear-gradient(90deg, rgba(0,0,0,0.15) 0px, transparent 1px, transparent 2px, rgba(0,0,0,0.15) 3px)
              `,
              backgroundSize: '16px 16px',
              imageRendering: 'pixelated',
            }}
          />
          <div className="absolute inset-0 bg-black/40"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 py-8 min-h-screen flex items-center justify-center">
          <Card className="bg-slate-800/80 backdrop-blur-lg border border-slate-700 text-white shadow-2xl">
            <CardContent className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-purple-300 rounded-full mx-auto mb-4"></div>
              <p className="text-lg">Calculating results...</p>
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  if (isHost) {
    // Host view - Full leaderboard with podium
    return (
      <>
        {/* Pixel Art Background with Dark Overlay */}
        <div className="fixed inset-0 z-0 overflow-hidden">
          <div className="absolute inset-0 bg-[#87CEEB]" style={{ imageRendering: 'pixelated' }}></div>
          <div className="absolute top-10 left-10 w-20 h-10 bg-white" style={{ imageRendering: 'pixelated' }}></div>
          <div className="absolute top-12 left-20 w-10 h-10 bg-white" style={{ imageRendering: 'pixelated' }}></div>
          <div className="absolute top-20 right-24 w-24 h-12 bg-white" style={{ imageRendering: 'pixelated' }}></div>
          <div className="absolute top-24 right-36 w-12 h-12 bg-white" style={{ imageRendering: 'pixelated' }}></div>
          <div className="absolute bottom-0 w-full h-1/3 bg-[#8B4513]" style={{ imageRendering: 'pixelated' }}>
            <div className="absolute top-0 w-full h-6 bg-[#228B22]" style={{ imageRendering: 'pixelated' }}></div>
            <div className="absolute bottom-10 left-1/4">
              <div className="w-4 h-20 bg-[#8B4513] mx-auto" style={{ imageRendering: 'pixelated' }}></div>
              <div className="w-16 h-16 bg-[#006400] -mt-8 mx-auto" style={{ imageRendering: 'pixelated' }}></div>
            </div>
            <div className="absolute bottom-10 right-1/4">
              <div className="w-4 h-24 bg-[#8B4513] mx-auto" style={{ imageRendering: 'pixelated' }}></div>
              <div className="w-20 h-20 bg-[#006400] -mt-10 mx-auto" style={{ imageRendering: 'pixelated' }}></div>
            </div>
          </div>
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `
                repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, transparent 1px, transparent 2px, rgba(0,0,0,0.15) 3px),
                repeating-linear-gradient(90deg, rgba(0,0,0,0.15) 0px, transparent 1px, transparent 2px, rgba(0,0,0,0.15) 3px)
              `,
              backgroundSize: '16px 16px',
              imageRendering: 'pixelated',
            }}
          />
          <div className="absolute inset-0 bg-black/40"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 py-8 min-h-screen">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-2xl">🏆 Final Results</h1>
            <p className="text-white/80 text-xl">Congratulations to all players!</p>
          </motion.div>

          {/* Podium */}
          {playerResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="mb-12"
            >
              <div className="flex justify-center items-end space-x-4 max-w-2xl mx-auto">
                {playerResults.slice(0, 3).map((player, index) => {
                  const actualPosition = player.position
                  const podiumOrder = [1, 0, 2] // Center, Left, Right for visual podium
                  const displayIndex = podiumOrder.indexOf(index)
                  
                  return (
                    <motion.div
                      key={player.id}
                      initial={{ opacity: 0, y: 100 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + displayIndex * 0.2 }}
                      className="flex flex-col items-center"
                    >
                      <div className="relative mb-4">
                        <img
                          src={player.avatar}
                          alt={player.name}
                          className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                        />
                        <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br ${getPodiumColor(actualPosition)} flex items-center justify-center`}>
                          <span className="text-white font-bold text-sm">{actualPosition}</span>
                        </div>
                      </div>
                      
                      <h3 className="text-white font-bold text-lg mb-2">{player.name}</h3>
                      <div className="text-2xl font-bold text-yellow-400 mb-4">{player.score}</div>
                      
                      <div className={`${actualPosition === 1 ? 'h-32' : actualPosition === 2 ? 'h-24' : 'h-16'} w-24 bg-gradient-to-t ${getPodiumColor(actualPosition)} rounded-t-lg flex items-end justify-center pb-2 shadow-lg`}>
                        <span className="text-white font-bold text-lg">#{actualPosition}</span>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* Full Leaderboard */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            <div className="bg-slate-800/80 backdrop-blur-lg border border-slate-700 shadow-2xl rounded-lg">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-center text-white mb-6">
                  Complete Leaderboard
                </h2>
                <div className="space-y-3">
                  {playerResults.map((player, index) => (
                    <motion.div
                      key={player.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1 + index * 0.1 }}
                      className={`flex items-center space-x-4 p-4 rounded-lg transition-all backdrop-blur-sm ${
                        player.position <= 3 
                          ? 'bg-gradient-to-r from-yellow-900/30 to-amber-900/30 border border-yellow-800/50' 
                          : 'bg-slate-700/30 hover:bg-slate-700/50 border border-slate-600/50'
                      }`}
                    >
                      <div className="relative">
                        <img
                          src={player.avatar}
                          alt={player.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        {player.position <= 3 && (
                          <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br ${getPodiumColor(player.position)} flex items-center justify-center shadow-md`}>
                            {player.position === 1 && <Trophy className="w-3 h-3 text-white" />}
                            {player.position === 2 && <Medal className="w-3 h-3 text-white" />}
                            {player.position === 3 && <Star className="w-3 h-3 text-white" />}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-bold text-white">{player.name}</h3>
                        <p className="text-sm text-gray-300">Position #{player.position}</p>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-2xl font-bold text-purple-400">{player.score}</div>
                        <p className="text-xs text-gray-400">points</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="text-center mt-8"
          >
            <Button
              onClick={handlePlayAgain}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-xl shadow-lg"
            >
              <Home className="w-5 h-5 mr-2" />
              Back to Dashboard
            </Button>
          </motion.div>
        </div>
      </>
    )
  }

  // Player view - Personal results
  const userResult = playerResults.find(p => p.id === playerId)
  if (!userResult) return null

  return (
    <>
      {/* Pixel Art Background with Dark Overlay */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[#87CEEB]" style={{ imageRendering: 'pixelated' }}></div>
        <div className="absolute top-10 left-10 w-20 h-10 bg-white" style={{ imageRendering: 'pixelated' }}></div>
        <div className="absolute top-12 left-20 w-10 h-10 bg-white" style={{ imageRendering: 'pixelated' }}></div>
        <div className="absolute top-20 right-24 w-24 h-12 bg-white" style={{ imageRendering: 'pixelated' }}></div>
        <div className="absolute top-24 right-36 w-12 h-12 bg-white" style={{ imageRendering: 'pixelated' }}></div>
        <div className="absolute bottom-0 w-full h-1/3 bg-[#8B4513]" style={{ imageRendering: 'pixelated' }}>
          <div className="absolute top-0 w-full h-6 bg-[#228B22]" style={{ imageRendering: 'pixelated' }}></div>
          <div className="absolute bottom-10 left-1/4">
            <div className="w-4 h-20 bg-[#8B4513] mx-auto" style={{ imageRendering: 'pixelated' }}></div>
            <div className="w-16 h-16 bg-[#006400] -mt-8 mx-auto" style={{ imageRendering: 'pixelated' }}></div>
          </div>
          <div className="absolute bottom-10 right-1/4">
            <div className="w-4 h-24 bg-[#8B4513] mx-auto" style={{ imageRendering: 'pixelated' }}></div>
            <div className="w-20 h-20 bg-[#006400] -mt-10 mx-auto" style={{ imageRendering: 'pixelated' }}></div>
          </div>
        </div>
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, transparent 1px, transparent 2px, rgba(0,0,0,0.15) 3px),
              repeating-linear-gradient(90deg, rgba(0,0,0,0.15) 0px, transparent 1px, transparent 2px, rgba(0,0,0,0.15) 3px)
            `,
            backgroundSize: '16px 16px',
            imageRendering: 'pixelated',
          }}
        />
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md mx-auto"
        >
          <div className="bg-slate-800/80 backdrop-blur-lg border border-slate-700 text-white shadow-2xl rounded-lg">
            <div className="p-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 150 }}
                className="relative"
              >
                <img
                  src={playerAvatar}
                  alt={playerName}
                  className="w-32 h-32 rounded-full object-cover mx-auto border-4 border-purple-500 shadow-2xl"
                />
                {userPosition <= 3 && (
                  <div className={`absolute -top-2 -right-2 w-12 h-12 rounded-full bg-gradient-to-br ${getPodiumColor(userPosition)} flex items-center justify-center shadow-lg`}>
                    {userPosition === 1 && <Trophy className="w-6 h-6 text-white" />}
                    {userPosition === 2 && <Medal className="w-6 h-6 text-white" />}
                    {userPosition === 3 && <Star className="w-6 h-6 text-white" />}
                  </div>
                )}
              </motion.div>
              
              <div className="text-center mt-4">
                <h1 className="text-3xl font-bold text-white mt-4">
                  {playerName}
                </h1>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="text-5xl font-bold text-purple-400 mb-2">{score}</div>
                  <p className="text-gray-300">Points</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className={`p-6 rounded-lg transition-all backdrop-blur-sm ${
                    userPosition <= 3 
                      ? 'bg-gradient-to-r from-yellow-900/30 to-amber-900/30 border border-yellow-800/50' 
                      : 'bg-slate-700/30 border border-slate-600/50'
                  }`}
                >
                  <div className="text-3xl font-bold text-purple-400 mb-2">#{userPosition}</div>
                  
                  {userPosition === 1 && (
                    <Badge className="mt-3 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white">
                      🏆 Champion!
                    </Badge>
                  )}
                  {userPosition === 2 && (
                    <Badge className="mt-3 bg-gradient-to-r from-gray-300 to-gray-500 text-white">
                      🥈 Runner-up!
                    </Badge>
                  )}
                  {userPosition === 3 && (
                    <Badge className="mt-3 bg-gradient-to-r from-amber-600 to-amber-800 text-white">
                      🥉 Third Place!
                    </Badge>
                  )}
                  {userPosition > 3 && (
                    <Badge variant="outline" className="mt-3 bg-slate-700 text-white border-slate-600">
                      Great effort!
                    </Badge>
                  )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  <Button
                    onClick={handlePlayAgain}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 rounded-xl shadow-lg"
                  >
                    <Home className="w-5 h-5 mr-2" />
                    Play Again
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  )
}