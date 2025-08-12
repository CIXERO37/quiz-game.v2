"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, Hash, Play, ArrowLeft } from "lucide-react"

interface Quiz {
  id: number
  title: string
  description: string
  questions: any[]
}

interface RulesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  quiz: Quiz | null
  onStartGame: (settings: GameSettings) => void
}

interface GameSettings {
  timeLimit: number
  questionCount: number
}

export function RulesDialog({ open, onOpenChange, quiz, onStartGame }: RulesDialogProps) {
  const [timeLimit, setTimeLimit] = useState(300) // 5 minutes in seconds
  const [questionCount, setQuestionCount] = useState(15)

  const handleStartGame = () => {
    onStartGame({
      timeLimit,
      questionCount,
    })
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
    const options = []

    // Generate multiples of 5 up to the maximum available questions
    for (let i = 5; i <= maxQuestions; i += 5) {
      options.push(i)
    }

    // If maxQuestions is not a multiple of 5, add it as the final option
    if (maxQuestions > 0 && maxQuestions % 5 !== 0) {
      options.push(maxQuestions)
    }

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
            <DialogContent className="max-w-md bg-white/95 backdrop-blur-lg border border-white/20">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-2">
                  <Clock className="h-6 w-6 text-purple-600" />
                  Game Rules
                </DialogTitle>
              </DialogHeader>

              <motion.div initial="hidden" animate="visible" variants={cardVariants} transition={{ delay: 0.1 }}>
                <Card className="mb-6">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-gray-800">{quiz.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">{quiz.description}</p>
                    <div className="text-sm text-gray-500">amount Questions: {quiz.questions?.length || 0}</div>
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
                  <Label className="text-base font-semibold text-gray-700 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Time Limit
                  </Label>
                  <Select value={String(timeLimit / 60)} onValueChange={(value) => setTimeLimit(Number(value) * 60)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select time limit" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.map((minutes) => (
                        <SelectItem key={minutes} value={String(minutes)}>
                          {minutes} minutes
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                
                </div>

                {/* Question Count Settings */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold text-gray-700 flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    Number of Questions
                  </Label>
                  <Select value={String(questionCount)} onValueChange={(value) => setQuestionCount(Number(value))}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select number of questions" />
                    </SelectTrigger>
                    <SelectContent>
                      {getQuestionOptions().map((count) => (
                        <SelectItem key={count} value={String(count)}>
                          {count} questions
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    Choose questions in multiples of 5 (Maximum: {quiz.questions?.length || 0})
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="flex-1 flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    onClick={handleStartGame}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold flex items-center gap-2"
                  >
                    <Play className="h-4 w-4" />
                    Start Game
                  </Button>
                </div>
              </motion.div>
            </DialogContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Dialog>
  )
}
