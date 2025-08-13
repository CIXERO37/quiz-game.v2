"use client"

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Clock } from 'lucide-react'
import { useGameStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'

export default function WaitPage() {
  const router = useRouter()
  const { gameId, playerName, playerAvatar } = useGameStore()
  const [dots, setDots] = useState('')
  const [isWaiting, setIsWaiting] = useState(true)

  useEffect(() => {
    if (!gameId || !playerName) {
      router.replace('/')
      return
    }

    // Animasi titik loading
    const dotInterval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'))
    }, 500)

    // ✅ Polling untuk mengecek apakah quiz sudah dimulai
    const pollingInterval = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('games')
          .select('is_started') // ✅ Tambahan: cek status
          .eq('id', gameId)
          .single()

        if (data?.is_started && !error) {
          // ✅ Baru redirect kalau host sudah mulai
          router.replace('/play')
          clearInterval(pollingInterval)
        }
      } catch (error) {
        console.error('Polling error:', error)
      }
    }, 1000)

    return () => {
      clearInterval(dotInterval)
      clearInterval(pollingInterval)
    }
  }, [gameId, playerName, router])

  if (!playerName || !playerAvatar) {
    return (
      <div className="fixed inset-0 bg-[#87CEEB] flex items-center justify-center font-mono text-white">
        <div className="bg-black/70 border-4 border-white p-6 rounded-lg text-center">
          <p className="mb-4">Session not found!</p>
          <button
            onClick={() => router.replace('/')}
            className="bg-red-500 border-2 border-red-700 px-4 py-2 text-sm hover:bg-red-600"
          >
            Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Pixel Art Background */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[#87CEEB]" style={{ imageRendering: 'pixelated' }}></div>

        {/* Clouds */}
        <div className="absolute top-10 left-10 w-20 h-10 bg-white" style={{ imageRendering: 'pixelated' }}></div>
        <div className="absolute top-12 left-24 w-10 h-10 bg-white" style={{ imageRendering: 'pixelated' }}></div>
        <div className="absolute top-20 right-20 w-24 h-12 bg-white" style={{ imageRendering: 'pixelated' }}></div>
        <div className="absolute top-22 right-32 w-12 h-12 bg-white" style={{ imageRendering: 'pixelated' }}></div>

        {/* Ground */}
        <div className="absolute bottom-0 w-full h-1/3 bg-[#8B4513]" style={{ imageRendering: 'pixelated' }}>
          <div className="absolute top-0 w-full h-6 bg-[#228B22]" style={{ imageRendering: 'pixelated' }}></div>
          <div className="absolute bottom-8 left-1/4">
            <div className="w-4 h-20 bg-[#8B4513] mx-auto" style={{ imageRendering: 'pixelated' }}></div>
            <div className="w-16 h-16 bg-[#006400] -mt-8 mx-auto" style={{ imageRendering: 'pixelated' }}></div>
          </div>
          <div className="absolute bottom-8 right-1/4">
            <div className="w-4 h-24 bg-[#8B4513] mx-auto" style={{ imageRendering: 'pixelated' }}></div>
            <div className="w-20 h-20 bg-[#006400] -mt-10 mx-auto" style={{ imageRendering: 'pixelated' }}></div>
          </div>
        </div>
      </div>

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
            transition={{ delay: 0.2, type: 'spring' }}
          />

          <p className="text-lg mb-2 drop-shadow-[1px_1px_0px_#000]">{playerName}</p>
          <p className="text-sm text-white/70 mb-6">Waiting to start{dots}</p>

          <div className="flex items-center justify-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-yellow-400" />
            <span className="text-sm">Quiz will start soon</span>
          </div>

          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex justify-center space-x-2"
          >
            <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce animation-delay-200"></div>
            <div className="w-3 h-3 bg-pink-400 rounded-full animate-bounce animation-delay-400"></div>
          </motion.div>
        </motion.div>
      </div>
    </>
  )
}