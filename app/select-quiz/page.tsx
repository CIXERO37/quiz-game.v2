"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence, type Transition } from "framer-motion"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useGameStore } from "@/lib/store"
import { supabase } from "@/lib/supabase"
import { Input } from "@/components/ui/input"
import { Search, Play, ChevronDown, ChevronUp, ArrowLeft } from "lucide-react"
import { RulesDialog } from "@/components/rules-dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

interface Quiz {
  id: number
  title: string
  description: string
  difficulty_level?: string
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

interface GameSettings {
  timeLimit: number
  questionCount: number
}

// Function to get appropriate image based on quiz title
const getQuizImage = (title: string): string => {
  const titleLower = title.toLowerCase()
  
  // Mapping quiz titles to appropriate images
  if (titleLower.includes('angka') || titleLower.includes('berhitung') || titleLower.includes('matematika')) {
    return '/images/perbaikan.png'
  } else if (titleLower.includes('hewan') || titleLower.includes('binatang') || titleLower.includes('animal')) {
    return '/images/kucing-lucu.png'
  } else if (titleLower.includes('buah') || titleLower.includes('fruit')) {
    return '/images/apel-merah.png'
  } else if (titleLower.includes('warna') || titleLower.includes('color')) {
    return '/images/5-bola-warna-warni.png'
  } else if (titleLower.includes('bentuk') || titleLower.includes('shape') || titleLower.includes('geometri')) {
    return '/images/persegi-biru.png'
  } else if (titleLower.includes('huruf') || titleLower.includes('alphabet') || titleLower.includes('kata')) {
    return '/images/1-buku.png'
  } else if (titleLower.includes('transportasi') || titleLower.includes('kendaraan') || titleLower.includes('mobil')) {
    return '/images/1-mobil.png'
  } else if (titleLower.includes('alam') || titleLower.includes('nature') || titleLower.includes('tumbuhan')) {
    return '/images/7-bunga.png'
  } else if (titleLower.includes('makanan') || titleLower.includes('food') || titleLower.includes('sayuran')) {
    return '/images/wortel-oranye.png'
  } else if (titleLower.includes('benda') || titleLower.includes('objek') || titleLower.includes('object')) {
    return '/images/jam-dinding-bulat.png'
  } else {
    // Default image for general knowledge or other topics
    return '/images/gambar-tutor.png'
  }
}

export default function SelectQuizPage() {
  const [isLoading, setIsLoading] = useState<number | null>(null)
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [appliedSearchQuery, setAppliedSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null)
  const [showRulesDialog, setShowRulesDialog] = useState(false)
  const [expandedQuizId, setExpandedQuizId] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedLevel, setSelectedLevel] = useState<string>("all")
  const itemsPerPage = 15

  const router = useRouter()
  const { setQuizId, setGameCode, setGameId, setIsHost } = useGameStore()

  const difficultyLevels = [
    { value: "all", label: "All Category" },
    { value: "TK", label: "TK Level" },
  ]

  const fetchQuizzes = async () => {
    let query = supabase
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
    
    // Apply level filter only if not "all"
    if (selectedLevel !== "all") {
      query = query.eq("difficulty_level", selectedLevel)
    }
    
    const { data, error } = await query.order("id")

    if (!error && data) {
      setQuizzes(data as Quiz[])
    }
  }

  useEffect(() => {
    fetchQuizzes()
  }, [selectedLevel])

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

      router.push(`/host/${gameCode}`)
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

  const handleSearch = () => {
    setIsSearching(true)
    setIsTyping(false)
    // Simulate search delay for better UX
    setTimeout(() => {
      setAppliedSearchQuery(searchQuery)
      setCurrentPage(1)
      setIsSearching(false)
    }, 500)
  }

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    
    if (value.trim() !== "") {
      setIsTyping(true)
    } else {
      setIsTyping(false)
      setAppliedSearchQuery("")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const filteredQuizzes = quizzes.filter(
    (quiz) =>
      quiz.title.toLowerCase().includes(appliedSearchQuery.toLowerCase()) ||
      quiz.description.toLowerCase().includes(appliedSearchQuery.toLowerCase()),
  )

  const totalPages = Math.ceil(filteredQuizzes.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentQuizzes = filteredQuizzes.slice(startIndex, endIndex)

  useEffect(() => {
    setCurrentPage(1)
  }, [appliedSearchQuery])

  const cardSpringTransition: Transition = { type: "spring", stiffness: 100, damping: 10 }

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
      <div className="fixed inset-0 z-0 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/images/galaxy.webp')",
          }}
        />
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 min-h-screen flex flex-col">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.push("/")}
              variant="outline"
              className="bg-white/10 backdrop-blur-lg border-white/20 text-white hover:bg-white/20 transition-all duration-300"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300 bg-clip-text">
              Select Quiz
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search quizzes..."
                value={searchQuery}
                onChange={handleSearchInputChange}
                onKeyPress={handleKeyPress}
                className="pl-10 pr-12 rounded-lg bg-white/10 backdrop-blur-lg border-white/20 text-white placeholder:text-gray-300 focus:bg-white/20 focus:border-purple-400 transition-all duration-300"
              />
              {/* Search Button Icon */}
              <button
                onClick={handleSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-purple-300 transition-colors duration-200"
                title="Search quizzes"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>

            {/* Level Selector */}
            <div className="relative">
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="px-4 py-2 rounded-lg bg-white/10 backdrop-blur-lg border border-white/20 text-white focus:bg-white/20 focus:border-purple-400 transition-all duration-300 cursor-pointer"
              >
                {difficultyLevels.map((level) => (
                  <option key={level.value} value={level.value} className="bg-gray-800 text-white">
                    {level.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        {/* Konten utama */}
        <div className="flex-grow">
          {/* Search Results Info */}
          {appliedSearchQuery && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-6 text-center"
            >
              <p className="text-gray-300 text-lg">
                Showing {filteredQuizzes.length} quiz{filteredQuizzes.length !== 1 ? 'es' : ''} for &quot;{appliedSearchQuery}&quot;
              </p>
            </motion.div>
          )}

          {/* Loading State - Show when searching or typing */}
          {(isSearching || isTyping) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-400 mb-4"></div>
              <p className="text-gray-300 text-lg">
                {isSearching ? "Searching for quizzes..." : "Loading. . ."}
              </p>
            </motion.div>
          )}
          
          {/* Quiz Grid - Only show when not searching and not typing */}
          {!isSearching && !isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6"
            >
            <TooltipProvider>
              {currentQuizzes.map((quiz, index) => (
                <motion.div
                  key={quiz.id}
                  initial="hidden"
                  animate="visible"
                  whileHover="hover"
                  whileTap="tap"
                  variants={cardVariants}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="cursor-pointer transition-all duration-300 hover:shadow-purple-100 relative bg-white/10 backdrop-blur-lg border-white/20 text-white overflow-hidden">
                    {/* Quiz Image */}
                    <div className="relative h-32 w-full overflow-hidden">
                      <Image
                        src={getQuizImage(quiz.title)}
                        alt={quiz.title}
                        fill
                        className="object-cover transition-transform duration-300 hover:scale-110"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        onError={() => {
                          // Fallback handled in the getQuizImage function
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />
                    </div>
                    <CardHeader className="pb-3 relative -mt-4 z-20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <CardTitle
                                className={`text-lg hover:text-purple-300 transition-colors duration-200 ${expandedQuizId === quiz.id ? "" : "truncate"}`}
                              >
                                {quiz.title}
                              </CardTitle>
                            </TooltipTrigger>
                            <TooltipContent className="bg-purple-600 text-white border-none shadow-lg rounded-md p-2 max-w-xs">
                              <p>{quiz.title}</p>
                            </TooltipContent>
                          </Tooltip>
                          <span className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-2 py-1 mx-1 rounded-full text-xs flex-shrink-0">
                            {quiz.difficulty_level || "Unknown"} Level
                          </span>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setExpandedQuizId(expandedQuizId === quiz.id ? null : quiz.id)
                          }}
                          className="text-gray-300 hover:text-purple-300 transition-colors"
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
                            <CardDescription className="text-sm mt-2 text-gray-300">{quiz.description}</CardDescription>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardHeader>
                    <CardContent className="pb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-300">{quiz.questions?.length || 0} Questions</span>
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
                         </TooltipProvider>
           </motion.div>
          )}

          {filteredQuizzes.length === 0 && appliedSearchQuery && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-center py-12"
            >
              <p className="text-gray-300 text-lg mb-4">No quizzes found matching &quot;{appliedSearchQuery}&quot;.</p>
                             <Button
                 onClick={() => {
                   setSearchQuery("")
                   setAppliedSearchQuery("")
                   setIsTyping(false)
                 }}
                 variant="outline"
                 className="bg-white/10 backdrop-blur-lg border-white/20 text-white hover:bg-white/20 transition-all duration-300"
               >
                 Clear Search
               </Button>
            </motion.div>
          )}
        </div>

        {/* ✅ Pagination selalu di bawah tengah */}
        {!isSearching && !isTyping && filteredQuizzes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex justify-center mt-12"
          >
            <Pagination>
              <PaginationContent className="bg-white/20 backdrop-blur-lg border border-white/30 rounded-xl p-3 flex items-center gap-2">
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    className={`text-white font-semibold px-4 py-2 rounded-lg transition ${
                      currentPage === 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-white/30 cursor-pointer"
                    }`}
                  />
                </PaginationItem>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => setCurrentPage(page)}
                      isActive={currentPage === page}
                      className={`cursor-pointer font-semibold px-4 py-2 rounded-lg transition ${
                        currentPage === page
                          ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white"
                          : "text-white hover:bg-white/30"
                      }`}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    className={`text-white font-semibold px-4 py-2 rounded-lg transition ${
                      currentPage === totalPages ? "opacity-50 cursor-not-allowed" : "hover:bg-white/30 cursor-pointer"
                    }`}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </motion.div>
        )}
      </div>

      <RulesDialog
        open={showRulesDialog}
        onOpenChange={setShowRulesDialog}
        quiz={selectedQuiz}
        onStartGame={handleCreateGame}
      />
    </>
  )
}