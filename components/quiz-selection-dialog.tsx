"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence, type Transition } from "framer-motion" // Import Transition type
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useGameStore } from "@/lib/store"
import { supabase } from "@/lib/supabase"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface Quiz {
  id: number
  title: string
  description: string
  questions: Question[]
}

interface Question {
  id: number
  question: string
  choices: Choice[]
}

interface Choice {
  id: number
  choice_text: string
  is_correct: boolean
}

interface QuizSelectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QuizSelectionDialog({ open, onOpenChange }: QuizSelectionDialogProps) {
  const [selectedQuiz, setSelectedQuiz] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()
  const { setQuizId, setGameCode, setGameId, setIsHost } = useGameStore()

  // Fetch quizzes dari Supabase
  const fetchQuizzes = async () => {
    const { data, error } = await supabase
      .from("quizzes")
      .select(`
  *,
  questions (
    id,
    question,
    choices (
      id,
      choice_text,
      is_correct
    )
  )
`)
      .eq("difficulty_level", "TK")
      .order("id")

    if (!error && data) {
      setQuizzes(data as Quiz[])
    }
  }

  useEffect(() => {
    if (open) {
      fetchQuizzes()
    }
  }, [open])

  const handleStartGame = async () => {
    if (!selectedQuiz) return

    setIsLoading(true)
    try {
      const gameCode = Math.random().toString(36).substring(2, 8).toUpperCase()

      const { data, error } = await supabase
        .from("games")
        .insert({
          code: gameCode,
          quiz_id: selectedQuiz,
          status: "waiting",
        })
        .select()
        .single()

      if (error) throw error

      setQuizId(selectedQuiz)
      setGameCode(gameCode)
      setGameId(data.id)
      setIsHost(true)

      router.push("/host")
      onOpenChange(false)
    } catch (error) {
      console.error("Error creating game:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredQuizzes = quizzes.filter(
    (quiz) =>
      quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quiz.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Define transitions explicitly
  const dialogEnterTransition: Transition = { duration: 0.3, ease: "easeOut" }
  const dialogExitTransition: Transition = { duration: 0.2, ease: "easeIn" }
  const cardSpringTransition: Transition = { type: "spring", stiffness: 100, damping: 10 }

  const dialogVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: dialogEnterTransition },
    exit: { opacity: 0, scale: 0.95, transition: dialogExitTransition },
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: cardSpringTransition },
    hover: { scale: 1.03, boxShadow: "0px 8px 16px rgba(0, 0, 0, 0.1)" },
    tap: { scale: 0.98 },
  }

  const buttonVariants = {
    hover: { scale: 1.05 },
    tap: { scale: 0.95 },
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <motion.div initial="hidden" animate="visible" exit="exit" variants={dialogVariants}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-white/95 backdrop-blur-lg border border-white/20">
              <DialogHeader className="flex items-center justify-between flex-row">
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent pt-4">
                  Select a Quiz
                </DialogTitle>
                <div className="relative w-full max-w-xs p-4">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 " />
                  <Input
                    type="text"
                    placeholder="Search quizzes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                {filteredQuizzes.map((quiz, index) => (
                  <motion.div
                    key={quiz.id}
                    initial="hidden"
                    animate="visible"
                    whileHover="hover"
                    whileTap="tap"
                    variants={cardVariants}
                    transition={{ delay: index * 0.05 }} // Slightly faster stagger
                  >
                    <Card
                      className={`cursor-pointer transition-all duration-300 ${
                        selectedQuiz === quiz.id ? "ring-2 ring-purple-500 bg-purple-50" : "hover:shadow-purple-100"
                      }`}
                      onClick={() => setSelectedQuiz(quiz.id)}
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">{quiz.title}</CardTitle>
                        <CardDescription className="text-sm">{quiz.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span>{quiz.questions?.length || 0} Questions</span>
                          <span className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-2 py-1 rounded-full text-xs">
                            TK Level
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              <div className="flex justify-center mt-8">
                <motion.div whileHover="hover" whileTap="tap" variants={buttonVariants}>
                  <Button
                    onClick={handleStartGame}
                    disabled={!selectedQuiz || isLoading}
                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg disabled:opacity-50"
                  >
                    {isLoading ? "Creating Game..." : "Start Game"}
                  </Button>
                </motion.div>
              </div>
            </DialogContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Dialog>
  )
}
