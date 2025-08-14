"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence, type Transition } from "framer-motion"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useGameStore } from "@/lib/store"
import { supabase } from "@/lib/supabase"
import { Input } from "@/components/ui/input"
import { Search, Play, ChevronDown, ChevronUp } from "lucide-react"
import { RulesDialog } from "@/components/rules-dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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

interface GameSettings {
  timeLimit: number
  questionCount: number
}

export function QuizSelectionDialog({ open, onOpenChange }: QuizSelectionDialogProps) {
  const [isLoading, setIsLoading] = useState<number | null>(null) // Track loading state per quiz
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null)
  const [showRulesDialog, setShowRulesDialog] = useState(false)
  const [gameSettings, setGameSettings] = useState<GameSettings | null>(null)
  const [expandedQuizId, setExpandedQuizId] = useState<number | null>(null)

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

  const handleStartGame = (quiz: Quiz) => {
    setSelectedQuiz(quiz)
    setShowRulesDialog(true)
  }

  const handleCreateGame = async (settings: GameSettings) => {
    if (!selectedQuiz) return

    setIsLoading(selectedQuiz.id)
    try {
      if (!selectedQuiz.questions || selectedQuiz.questions.length === 0) {
        throw new Error("Selected quiz has no questions")
      }

      if (settings.questionCount > selectedQuiz.questions.length) {
        throw new Error(
          `Cannot select ${settings.questionCount} questions from a quiz with only ${selectedQuiz.questions.length} questions`,
        )
      }

      const gameCode = Math.random().toString(36).substring(2, 8).toUpperCase()

      console.log("Creating game with:", {
        code: gameCode,
        quiz_id: selectedQuiz.id,
        status: "waiting",
        time_limit: settings.timeLimit,
        question_count: settings.questionCount,
      })

      const { data, error } = await supabase
        .from("games")
        .insert({
          code: gameCode,
          quiz_id: selectedQuiz.id,
          status: "waiting",
          time_limit: settings.timeLimit,
          question_count: settings.questionCount,
        })
        .select()
        .single()

      if (error) {
        console.error("Supabase error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        })
        throw new Error(`Database error: ${error.message}`)
      }

      if (!data) {
        throw new Error("No data returned from game creation")
      }

      setQuizId(selectedQuiz.id)
      setGameCode(gameCode)
      setGameId(data.id)
      setIsHost(true)

      router.push("/host")
      onOpenChange(false)
      setShowRulesDialog(false)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      console.error("Error creating game:", {
        error: errorMessage,
        selectedQuiz: selectedQuiz?.id,
        settings,
        timestamp: new Date().toISOString(),
      })

      alert(`Failed to create game: ${errorMessage}`)
    } finally {
      setIsLoading(null)
    }
  }

  const filteredQuizzes = quizzes.filter(
    (quiz) =>
      quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quiz.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

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
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <AnimatePresence>
          {open && (
            <motion.div initial="hidden" animate="visible" exit="exit" variants={dialogVariants}>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-white/95 backdrop-blur-lg border border-white/20">
                <TooltipProvider>
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
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className="cursor-pointer transition-all duration-300 hover:shadow-purple-100 relative">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <CardTitle
                                      className={`text-lg hover:text-purple-600 transition-colors duration-200 ${expandedQuizId === quiz.id ? "" : "truncate"}`}
                                    >
                                      {quiz.title}
                                    </CardTitle>
                                  </TooltipTrigger>
                                  <TooltipContent className="bg-purple-600 text-white border-none shadow-lg rounded-md p-2 max-w-xs">
                                    <p>{quiz.title}</p>
                                  </TooltipContent>
                                </Tooltip>
                                <span className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-2 py-1 mx-1 rounded-full text-xs flex-shrink-0">
                                  TK Level
                                </span>
                              </div>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setExpandedQuizId(expandedQuizId === quiz.id ? null : quiz.id)
                                }}
                                className="text-gray-500 hover:text-purple-600 transition-colors"
                              >
                                {expandedQuizId === quiz.id ? (
                                  <ChevronUp className="h-5 w-5" />
                                ) : (
                                  <ChevronDown className="h-5 w-5" />
                                )}
                              </button>
                            </div>

                            <AnimatePresence>
                              {expandedQuizId === quiz.id && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <CardDescription className="text-sm mt-2">{quiz.description}</CardDescription>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </CardHeader>
                          <CardContent className="pb-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">{quiz.questions?.length || 0} Questions</span>
                              <motion.div whileHover="hover" whileTap="tap" variants={buttonVariants}>
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleStartGame(quiz)
                                  }}
                                  disabled={isLoading === quiz.id}
                                  size="sm"
                                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg shadow-md disabled:opacity-50 flex items-center gap-1"
                                >
                                  {isLoading === quiz.id ? (
                                    "Starting..."
                                  ) : (
                                    <>
                                      <Play className="h-3 w-3" />
                                      Start
                                    </>
                                  )}
                                </Button>
                              </motion.div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </TooltipProvider>
              </DialogContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Dialog>

      <RulesDialog
        open={showRulesDialog}
        onOpenChange={setShowRulesDialog}
        quiz={selectedQuiz}
        onStartGame={handleCreateGame}
      />
    </>
  )
}