"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Clock, Hash, Play, ArrowLeft, Gamepad2, Sparkles, Star, Settings } from "lucide-react"

interface Quiz {
  id: number
  title: string
  description: string
  questions: any[]
}

interface GameSettings {
  timeLimit: number
  questionCount: number
}

interface RulesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  quiz: Quiz | null
  onStartGame: (settings: GameSettings) => void
}

export function RulesDialog({ open, onOpenChange, quiz, onStartGame }: RulesDialogProps) {
  const [timeLimit, setTimeLimit] = useState(900)
  const [questionCount, setQuestionCount] = useState(15)

  const handleStartGame = () => {
    onStartGame({ timeLimit, questionCount })
  }

  const dialogVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  const timeOptions = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60]

  const getQuestionOptions = () => {
    const maxQuestions = quiz?.questions?.length || 0
    const options: number[] = []
    for (let i = 5; i <= maxQuestions; i += 5) options.push(i)
    if (maxQuestions > 0 && maxQuestions % 5 !== 0) options.push(maxQuestions)
    return options
  }

  if (!quiz) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={dialogVariants}
            transition={{ duration: 0.3 }}
          >
            <DialogContent className="max-w-md p-0 border-0 bg-transparent">
              {/* Space Background */}
              <div className="fixed inset-0 z-0 overflow-hidden">
                <div
                  className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                  style={{
                    backgroundImage: "url('/images/galaxy.webp')",
                  }}
                />
                
                {/* Animated space elements */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="absolute orbit-inner">
                    <div className="w-2 h-2 bg-gradient-to-br from-orange-400 to-red-500 rounded-full shadow-lg shadow-orange-400/60 border border-orange-300/30">
                      <div className="w-full h-full rounded-full bg-gradient-to-tl from-transparent to-white/20"></div>
                    </div>
                  </div>
                  <div className="absolute orbit-middle">
                    <div className="w-3 h-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full shadow-lg shadow-blue-400/70 border border-blue-300/40 relative">
                      <div className="w-full h-full rounded-full bg-gradient-to-tl from-transparent to-white/25"></div>
                      <div className="absolute top-1 left-1 w-1 h-1 bg-green-300 rounded-full opacity-60"></div>
                    </div>
                  </div>
                  <div className="absolute orbit-outer">
                    <div className="w-4 h-4 bg-gradient-to-br from-purple-300 to-indigo-500 rounded-full shadow-lg shadow-purple-400/60 border border-purple-200/40">
                      <div className="w-full h-full rounded-full bg-gradient-to-tl from-transparent to-white/20"></div>
                    </div>
                  </div>
                </div>

                {/* Cosmic rings */}
                <div className="absolute inset-0 flex items-center justify-center cosmic-ring-slow">
                  <div className="w-80 h-80 border border-purple-300/10 rounded-full"></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center" style={{ animation: "cosmic-ring-orbit 120s linear infinite" }}>
                  <div className="w-96 h-96 border border-blue-300/8 rounded-full"></div>
                </div>

                {/* Dark overlay */}
                <div className="absolute inset-0 bg-black/40"></div>
              </div>

              {/* Glass morphism dialog content */}
              <div className="relative z-10 bg-black/20 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl">
                <DialogHeader className="mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 150 }}
                    className="mb-4 flex justify-center"
                  >
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500/30 to-cyan-500/30 backdrop-blur-xl rounded-2xl flex items-center justify-center border-2 border-white/40 shadow-lg shadow-purple-500/20 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-cyan-400/10 animate-pulse"></div>
                      <Settings className="w-8 h-8 text-white relative z-10" />
                      <Sparkles className="absolute top-1 right-1 w-3 h-3 text-cyan-300 animate-pulse" />
                      <Star className="absolute bottom-1 left-1 w-2 h-2 text-purple-300 animate-pulse" style={{ animationDelay: "1s" }} />
                    </div>
                  </motion.div>
                  
                  <DialogTitle 
                    className="text-2xl font-bold text-center text-transparent bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300 bg-clip-text flex items-center justify-center gap-2"
                    style={{
                      textShadow: "0 0 20px rgba(147, 197, 253, 0.5), 0 0 40px rgba(168, 85, 247, 0.3)",
                      fontFamily: "monospace",
                      imageRendering: "pixelated",
                    }}
                  >
                    <Clock className="h-6 w-6 text-cyan-400" />
                    Game Rules
                  </DialogTitle>
                  <DialogDescription id="rules-description" className="sr-only">
                    Configure the game settings and start the quiz
                  </DialogDescription>
                </DialogHeader>

                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={cardVariants}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="mb-6 bg-black/30 border-cyan-400/30 backdrop-blur-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg text-cyan-100 font-mono">{quiz.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-cyan-200/80 mb-4 font-mono">{quiz.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={cardVariants}
                  transition={{ delay: 0.2 }}
                  className="space-y-6"
                >
                  {/* Time Settings */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold text-cyan-100 flex items-center gap-2 font-mono">
                      <Clock className="h-4 w-4 text-cyan-400" />
                      Time Limit
                    </Label>
                    <Select
                      value={String(timeLimit / 60)}
                      onValueChange={(value) => setTimeLimit(Number(value) * 60)}
                    >
                      <SelectTrigger className="w-full bg-black/30 border-cyan-400/30 text-white placeholder:text-cyan-200/60 backdrop-blur-sm focus:border-cyan-400 focus:ring-cyan-400/20 font-mono">
                        <SelectValue placeholder="Select time limit" />
                      </SelectTrigger>
                      <SelectContent className="bg-black/90 border-cyan-400/30 backdrop-blur-xl">
                        {timeOptions.map((minutes) => (
                          <SelectItem key={minutes} value={String(minutes)} className="text-cyan-100 hover:bg-cyan-400/30 hover:text-white focus:bg-cyan-400/30 focus:text-white font-mono transition-all duration-200 cursor-pointer">
                            {minutes} minutes
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Question Count Settings */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold text-cyan-100 flex items-center gap-2 font-mono">
                      <Hash className="h-4 w-4 text-cyan-400" />
                      Number of Questions
                    </Label>
                    <Select
                      value={String(questionCount)}
                      onValueChange={(value) => setQuestionCount(Number(value))}
                    >
                      <SelectTrigger className="w-full bg-black/30 border-cyan-400/30 text-white placeholder:text-cyan-200/60 backdrop-blur-sm focus:border-cyan-400 focus:ring-cyan-400/20 font-mono">
                        <SelectValue placeholder="Select number of questions" />
                      </SelectTrigger>
                      <SelectContent className="bg-black/90 border-cyan-400/30 backdrop-blur-xl">
                        {getQuestionOptions().map((count) => (
                          <SelectItem key={count} value={String(count)} className="text-cyan-100 hover:bg-cyan-400/30 hover:text-white focus:bg-cyan-400/30 focus:text-white font-mono transition-all duration-200 cursor-pointer">
                            {count} questions
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-between pt-4">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="flex items-center gap-2 bg-black/30 border-cyan-400/30 text-cyan-100 hover:bg-cyan-400/20 hover:border-cyan-400 backdrop-blur-sm font-mono px-6"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        onClick={handleStartGame}
                        className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold flex items-center gap-2 shadow-lg shadow-cyan-500/30 border border-cyan-400/30 backdrop-blur-sm font-mono relative overflow-hidden px-6"
                        style={{ imageRendering: "pixelated" }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/20 to-blue-400/20 animate-pulse"></div>
                        <Play className="h-4 w-4 relative z-10" />
                        {/* penanda */}
                        <span className="relative z-10">Start Game</span>
                        <div className="absolute top-2 right-2 w-2 h-2 bg-yellow-300 rounded-full animate-ping"></div>
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            </DialogContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Dialog>
  )
}