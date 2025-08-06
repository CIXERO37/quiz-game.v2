"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Play, Users, Gamepad2, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { QuizSelectionDialog } from '@/components/quiz-selection-dialog'
import { JoinGameDialog } from '@/components/join-game-dialog'

export default function Dashboard() {
  const [showQuizSelection, setShowQuizSelection] = useState(false)
  const [showJoinGame, setShowJoinGame] = useState(false)

  return (
    <>
      {/* Pixel Art Background */}
      <div className="fixed inset-0 z-0">
        {/* Sky */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#87CEEB] to-[#98D8E8]">
          {/* Clouds */}
          <div className="absolute top-10 left-10 w-16 h-8 bg-white" style={{ imageRendering: 'pixelated' }}></div>
          <div className="absolute top-12 left-16 w-8 h-8 bg-white" style={{ imageRendering: 'pixelated' }}></div>
          <div className="absolute top-20 right-20 w-20 h-10 bg-white" style={{ imageRendering: 'pixelated' }}></div>
          <div className="absolute top-22 right-28 w-10 h-10 bg-white" style={{ imageRendering: 'pixelated' }}></div>
          
          {/* Ground */}
          <div className="absolute bottom-0 w-full h-1/3 bg-[#8B4513]" style={{ imageRendering: 'pixelated' }}>
            {/* Grass */}
            <div className="absolute top-0 w-full h-4 bg-[#228B22]" style={{ imageRendering: 'pixelated' }}></div>
            
            {/* Pixel Trees */}
            <div className="absolute bottom-8 left-1/4">
              <div className="w-4 h-16 bg-[#8B4513]" style={{ imageRendering: 'pixelated' }}></div>
              <div className="absolute -top-8 -left-4 w-12 h-12 bg-[#006400]" style={{ imageRendering: 'pixelated' }}></div>
            </div>
            
            <div className="absolute bottom-8 right-1/4">
              <div className="w-4 h-20 bg-[#8B4513]" style={{ imageRendering: 'pixelated' }}></div>
              <div className="absolute -top-10 -left-5 w-14 h-14 bg-[#006400]" style={{ imageRendering: 'pixelated' }}></div>
            </div>
          </div>
        </div>
        
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/20"></div>
        
        {/* Pixel Grid Overlay */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px',
            imageRendering: 'pixelated'
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-8 min-h-screen flex flex-col justify-center items-center">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 150 }}
            className="mb-6"
          >
            <div className="w-24 h-24 mx-auto bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center mb-4 border-4 border-white/30" style={{ imageRendering: 'pixelated' }}>
              <Gamepad2 className="w-12 h-12 text-white" />
            </div>
          </motion.div>
          
          <h1 className="text-6xl font-bold text-white mb-4" style={{ 
            textShadow: '2px 2px 0px #000, 4px 4px 0px #333',
            fontFamily: 'monospace',
            imageRendering: 'pixelated'
          }}>
            QUIZ-GAME
          </h1>
          <p className="text-xl text-white max-w-2xl mx-auto" style={{ 
            textShadow: '1px 1px 0px #000',
            fontFamily: 'monospace'
          }}>
            Challenge your friends with interactive quizzes and exciting mini-games!
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="grid md:grid-cols-2 gap-8 w-full max-w-2xl"
        >
          <motion.div
            whileHover={{ scale: 1.05, y: -10 }}
            whileTap={{ scale: 0.95 }}
            className="group"
          >
            <Button
              onClick={() => setShowQuizSelection(true)}
              className="w-full h-40 bg-[#FF6B6B] border-4 border-[#FF5252] hover:bg-[#FF5252] transition-all duration-300 flex flex-col items-center justify-center space-y-4 text-white font-mono shadow-lg"
              style={{ imageRendering: 'pixelated' }}
            >
              <div className="w-16 h-16 bg-[#FFD93D] border-2 border-[#FFC107] rounded-md flex items-center justify-center group-hover:rotate-12 transition-transform duration-300" style={{ imageRendering: 'pixelated' }}>
                <Play className="w-8 h-8 text-[#FF6B6B]" />
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-1">HOST</h2>
              </div>
            </Button>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05, y: -10 }}
            whileTap={{ scale: 0.95 }}
            className="group"
          >
            <Button
              onClick={() => setShowJoinGame(true)}
              className="w-full h-40 bg-[#4ECDC4] border-4 border-[#26A69A] hover:bg-[#26A69A] transition-all duration-300 flex flex-col items-center justify-center space-y-4 text-white font-mono shadow-lg"
              style={{ imageRendering: 'pixelated' }}
            >
              <div className="w-16 h-16 bg-[#FFD93D] border-2 border-[#FFC107] rounded-md flex items-center justify-center group-hover:rotate-12 transition-transform duration-300" style={{ imageRendering: 'pixelated' }}>
                <Users className="w-8 h-8 text-[#4ECDC4]" />
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-1">JOIN </h2>
               
              </div>
            </Button>
          </motion.div>
        </motion.div>
      </div>

      <QuizSelectionDialog 
        open={showQuizSelection}
        onOpenChange={setShowQuizSelection}
      />
      
      <JoinGameDialog
        open={showJoinGame}
        onOpenChange={setShowJoinGame}
      />
    </>
  )
}