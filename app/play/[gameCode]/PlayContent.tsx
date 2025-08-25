
"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { Clock } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import SpaceDodge from "@/components/space-dodge"
import { useGameStore } from "@/lib/store"
import { supabase } from "@/lib/supabase"
import type { Quiz, Question } from "@/lib/types"
import Image from "next/image"
import { toast } from "sonner"

function PixelButton({
  children,
  color = "blue",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  color?: "blue" | "green" | "red" | "yellow"
}) {
  const colorStyles = {
    blue: "bg-blue-500 border-blue-700 text-white hover:bg-blue-600 active:bg-blue-700",
    green: "bg-green-500 border-green-700 text-white hover:bg-green-600 active:bg-green-700",
    red: "bg-red-500 border-red-700 text-white hover:bg-red-600 active:bg-red-700",
    yellow: "bg-yellow-400 border-yellow-600 text-black hover:bg-yellow-500 active:bg-yellow-600",
  }

  return (
    <button
      className={`border-2 font-mono uppercase tracking-wide shadow-[4px_4px_0px_rgba(0,0,0,0.8)] active:shadow-[2px_2px_0px_rgba(0,0,0,0.8)] active:translate-x-[2px] active:translate-y-[2px] transition-all ${colorStyles[color]} px-4 py-3 text-sm w-full ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

interface PlayContentProps {
  gameCode: string
}

export default function PlayContent({ gameCode }: PlayContentProps) {
  const router = useRouter()
  const { currentQuestion, score, correctAnswers, setCurrentQuestion, addScore, incrementCorrectAnswers, setGameId, gameId, playerId, setCorrectAnswers, setScore } =
    useGameStore()

  const [timeLeft, setTimeLeft] = useState(0)
  const [selectedChoiceId, setSelectedChoiceId] = useState<number | null>(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [isQuizStarted, setIsQuizStarted] = useState(false)
  const [shouldNavigate, setShouldNavigate] = useState(false)
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [showMiniGame, setShowMiniGame] = useState(false)
  const [gameSettings, setGameSettings] = useState<{ timeLimit: number; questionCount: number } | null>(null)
  const [allQuestions, setAllQuestions] = useState<Question[]>([])
  const [progressRestored, setProgressRestored] = useState(false)
  const [storeHydrated, setStoreHydrated] = useState(false)
  const [sessionSeed, setSessionSeed] = useState<number | null>(null)

  // Seeded RNG (mulberry32) and Fisher-Yates shuffle for stable per-session randomness
  const createRng = useCallback((seed: number) => {
    let t = seed >>> 0
    return () => {
      t += 0x6D2B79F5
      let r = Math.imul(t ^ (t >>> 15), 1 | t)
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296
    }
  }, [])

  const seededShuffle = useCallback(<T,>(arr: T[], seed: number): T[] => {
    const rng = createRng(seed)
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }, [createRng])

  // Function to regenerate questions and choices with a seeded shuffle
  const regenerateQuestionsWithSeed = useCallback((seed: number, quizData: any, questionCount: number) => {
    const shuffledQuestions = seededShuffle(quizData.questions || [], seed).slice(0, questionCount)
    return shuffledQuestions.map((q: any, idx: number) => {
      // derive a sub-seed for choices to reduce correlation with question order
      const choiceSeed = seed + (q.id || idx) * 101
      return {
        ...q,
        choices: seededShuffle(q.choices || [], choiceSeed),
      }
    })
  }, [seededShuffle])

  useEffect(() => {
    const fetchGame = async () => {
      if (!gameCode || typeof gameCode !== "string") {
        console.error("Invalid game code:", gameCode);
        toast.error("Invalid game code!");
        router.replace("/");
        return;
      }

      const { data: gameData, error: gameErr } = await supabase
        .from("games")
        .select("id, quiz_id, time_limit, question_count, is_started, quiz_start_time")
        .eq("code", gameCode.toUpperCase())
        .single()

      if (gameErr || !gameData) {
        console.error("Game fetch error:", gameErr?.message, gameErr?.details);
        toast.error("Game not found!");
        router.replace("/");
        return;
      }

      setGameId(gameData.id); // Set gameId ke store
      setGameSettings({
        timeLimit: gameData.time_limit,
        questionCount: gameData.question_count,
      });
      setTimeLeft(gameData.time_limit);

      const { data: quizData, error: quizErr } = await supabase
        .from("quizzes")
        .select(`
          *,
          questions (
            id,
            question,
            question_image_url,
            question_image_alt,
            choices (
              id,
              choice_text,
              choice_image_url,
              choice_image_alt,
              is_correct
            )
          )
        `)
        .eq("id", gameData.quiz_id)
        .single()

      if (quizErr || !quizData) {
        console.error("Quiz fetch error:", quizErr?.message, quizErr?.details);
        toast.error("Quiz not found!");
        router.replace("/");
        return;
      }

      setQuiz(quizData as Quiz);

      // Build a per-session seed key; include quiz_start_time so each new session reshuffles
      const sessionKey = `session-seed-${gameData.id}-${playerId}-${gameData.quiz_start_time || "nostart"}`
      const existingSeed = typeof window !== "undefined" ? localStorage.getItem(sessionKey) : null;
      let seed: number;
      
      if (existingSeed) {
        // Use existing seed for consistency across refreshes
        seed = parseInt(existingSeed);
        setSessionSeed(seed);
        console.log(`Using existing session seed: ${seed}`);
      } else {
        // Create unique seed for each session and player (tied to quiz_start_time when available)
        const base = `${gameData.id}-${playerId || 'anonymous'}-${gameData.quiz_start_time || Date.now()}`
        seed = base.split('').reduce((a: number, b: string) => a + b.charCodeAt(0), 0)
        // Store the session seed for consistency within the same session
        setSessionSeed(seed);
        if (typeof window !== "undefined") localStorage.setItem(sessionKey, seed.toString());
        console.log(`Created new session seed: ${seed}`);
      }
      
      // Generate questions using the seed
      const shuffled = regenerateQuestionsWithSeed(seed, quizData, gameData.question_count);
      setAllQuestions(shuffled);

      if (gameData.is_started) {
        setIsQuizStarted(true);
      } else {
        setIsQuizStarted(false);
      }
      
      setLoading(false);
    }

    fetchGame();
  }, [gameCode, router, setCurrentQuestion, setGameId, playerId, regenerateQuestionsWithSeed]);

  // Check when store is hydrated and restore progress
  useEffect(() => {
    if (!storeHydrated && !loading && gameId && playerId && isQuizStarted) {
      setStoreHydrated(true);
      
      // Now restore progress from database
      const restoreProgress = async () => {
        try {
          // Fetch current session start time
          const { data: gameSession, error: gameTimeErr } = await supabase
            .from("games")
            .select("quiz_start_time")
            .eq("id", gameId)
            .single()

          if (gameTimeErr) {
            console.error("Error fetching quiz_start_time:", gameTimeErr)
          }

          const startAt = gameSession?.quiz_start_time || null

          // Build answers query scoped to this session
          let answersQuery = supabase
            .from("player_answers")
            .select("question_index, points_earned, is_correct, created_at")
            .eq("game_id", gameId)
            .eq("player_id", playerId)
            .order("question_index", { ascending: true })

          if (startAt) {
            answersQuery = answersQuery.gte("created_at", startAt)
          }

          const { data: playerAnswers, error: answersError } = await answersQuery

          if (answersError) {
            console.error("Error fetching player answers:", answersError);
            setProgressRestored(true);
          } else if (playerAnswers && playerAnswers.length > 0) {
            // Determine progress from normal questions only (>= 0)
            const normalAnswers = playerAnswers.filter(a => (a.question_index ?? -1) >= 0)
            const lastAnsweredIndex = normalAnswers.length > 0 ? Math.max(...normalAnswers.map(a => a.question_index)) : -1;
            const nextQuestion = lastAnsweredIndex + 1;
            
            if (nextQuestion < (gameSettings?.questionCount || 15)) {
              setCurrentQuestion(nextQuestion);
              console.log(`Restored progress: player at question ${nextQuestion}/${gameSettings?.questionCount}`);
              // Correct count from normal answers only
              const correctCount = normalAnswers.filter(answer => answer.is_correct).length;
              setCorrectAnswers(correctCount);
              // Authoritative score from players table
              const { data: playerRow } = await supabase
                .from("players")
                .select("score")
                .eq("id", playerId)
                .single()
              if (playerRow?.score !== undefined && playerRow?.score !== null) {
                setScore(playerRow.score)
              }
              setProgressRestored(true);
            } else {
              router.replace(`/result/${gameCode}`);
              return;
            }
          } else {
            // Sync score even if no answers captured in this session
            const { data: playerRow } = await supabase
              .from("players")
              .select("score")
              .eq("id", playerId)
              .single()
            if (playerRow?.score !== undefined && playerRow?.score !== null) {
              setScore(playerRow.score)
            }
            setProgressRestored(true);
          }
        } catch (error) {
          console.error("Error restoring progress:", error);
          setProgressRestored(true);
        }
      };

      restoreProgress();
    }
  }, [storeHydrated, loading, gameId, playerId, isQuizStarted, gameSettings?.questionCount, setCurrentQuestion, setScore, setCorrectAnswers, router, gameCode]);

  // Monitor player leaving the page and clean up
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (gameId && playerId) {
        try {
          // Mark player as inactive or remove them
          await supabase
            .from("players")
            .update({ 
              current_question: -1 // Mark as inactive
            })
            .eq("id", playerId)
            .eq("game_id", gameId)
        } catch (error) {
          console.error("Error marking player as inactive on leave:", error)
        }
      }
    }

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'hidden' && gameId && playerId) {
        try {
          // Mark player as inactive when they switch tabs
          await supabase
            .from("players")
            .update({ 
              current_question: -1 // Mark as inactive
            })
            .eq("id", playerId)
            .eq("game_id", gameId)
        } catch (error) {
          console.error("Error marking player as inactive on visibility change:", error)
        }
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [gameId, playerId])

  useEffect(() => {
    if (!gameCode) return;

    const channel = supabase
      .channel("game-start")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "games", filter: `code=eq.${gameCode.toUpperCase()}` },
        (payload) => {
          if (payload.new.is_started && !isQuizStarted) {
            setIsQuizStarted(true);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameCode, isQuizStarted]);

  useEffect(() => {
    if (!gameCode) return;

    const channel = supabase
      .channel("game-finished")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "games", filter: `code=eq.${gameCode.toUpperCase()}` },
        (payload) => {
          if (payload.new.finished) {
            router.replace(`/result/${gameCode}`);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameCode, router]);

  // Timer sinkron dengan server
  useEffect(() => {
    if (!isQuizStarted || !gameSettings) return;

    let unsub = () => {};
    (async () => {
      const { data, error } = await supabase
        .from("games")
        .select("quiz_start_time, time_limit")
        .eq("code", gameCode.toUpperCase())
        .single();

      if (error || !data?.quiz_start_time) {
        console.error("Timer fetch error:", error?.message, error?.details);
        return;
      }

      const start = new Date(data.quiz_start_time).getTime();
      const limitMs = data.time_limit * 1000;

      const tick = () => {
        const remain = Math.max(0, start + limitMs - Date.now());
        setTimeLeft(Math.floor(remain / 1000));
        if (remain <= 0) {
          setShouldNavigate(true);
        }
      };

      tick();
      const iv = setInterval(tick, 1000);
      unsub = () => clearInterval(iv);
    })();

    return unsub;
  }, [isQuizStarted, gameSettings, gameCode]);

  const question = allQuestions[currentQuestion];

  const getChoiceLabel = (index: number) => String.fromCharCode(65 + index);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAnswerSelect = async (choice: {
    id: number;
    choice_text: string | null;
    is_correct: boolean;
  }) => {
    if (isAnswered || !question) return;

    setSelectedChoiceId(choice.id);
    setIsAnswered(true);
    const correct = choice.is_correct;
    setIsCorrect(correct);

    let earnedPoints = 0;
    if (correct) {
      earnedPoints = 10;
      addScore(earnedPoints);
      incrementCorrectAnswers();
    }

    try {
      // Validasi ID
      if (!gameId || !playerId) {
        console.error("Missing gameId or playerId:", { gameId, playerId });
        toast.error("Invalid game or player data!");
        router.replace("/");
        return;
      }

      // Debug: Log data yang akan diinsert
      const dataToInsert = {
        game_id: gameId,
        player_id: playerId,
        question_index: currentQuestion,
        points_earned: earnedPoints,
        is_correct: correct,
      };
      console.log("Inserting to player_answers:", JSON.stringify(dataToInsert, null, 2));

      // Insert ke player_answers
      const { error: insertError } = await supabase.from("player_answers").insert(dataToInsert);
      if (insertError) {
        console.error("Supabase insert error:", insertError.message, insertError.details, insertError.hint);
        throw insertError;
      }

      // Update player score jika jawaban benar
      if (correct) {
        const { data: player, error: playerError } = await supabase
          .from("players")
          .select("score")
          .eq("id", playerId)
          .single();

        if (playerError) {
          console.error("Player fetch error:", playerError.message, playerError.details);
          throw playerError;
        }

        if (player) {
          const newScore = (player.score || 0) + earnedPoints;
          const { error: updateError } = await supabase
            .from("players")
            .update({ score: newScore })
            .eq("id", playerId);

          if (updateError) {
            console.error("Player update error:", updateError.message, updateError.details);
            throw updateError;
          }
        }
      }

      // Cek jika semua soal selesai
      if (currentQuestion + 1 >= gameSettings!.questionCount) {
        const { data: gameData, error: gameError } = await supabase
          .from("games")
          .select("id")
          .eq("code", gameCode.toUpperCase())
          .single();

        if (gameError) {
          console.error("Game fetch error:", gameError.message, gameError.details);
          throw gameError;
        }

        if (gameData) {
          const { error: updateError } = await supabase
            .from("games")
            .update({
              finished: true,
              is_started: false,
            })
            .eq("id", gameData.id);

          if (updateError) {
            console.error("Game update error:", updateError.message, updateError.details);
            throw updateError;
          }
        }
      }
    } catch (error: any) {
      console.error("Error updating answer and score:", error.message, error.details, error.hint);
      toast.error(`Failed to save answer: ${error.message}`);
      return;
    }

    setShowResult(true);

    setTimeout(
      () => {
        setShowResult(false);
        setIsAnswered(false);
        setSelectedChoiceId(null);
        if (correct && (correctAnswers + 1) % 3 === 0) {
          setShowMiniGame(true);
        } else if (currentQuestion + 1 < gameSettings!.questionCount) {
          setCurrentQuestion(currentQuestion + 1);
        } else {
          // Clean up session seed when game ends
          if (gameId && playerId) {
            localStorage.removeItem(`session-seed-${gameId}-${playerId}`);
          }
          router.replace(`/result/${gameCode}`);
        }
      },
      correct ? 400 : 600,
    );
  };

  const handleMiniGameComplete = async (score: number) => {
    try {
      // Validasi ID
      if (!gameId || !playerId) {
        console.error("Missing gameId or playerId for mini-game:", { gameId, playerId });
        toast.error("Invalid game or player data!");
        router.replace("/");
        return;
      }

      // Debug: Log data yang akan diinsert
      const dataToInsert = {
        game_id: gameId,
        player_id: playerId,
        question_index: -1,
        points_earned: score,
        is_correct: false, // Mini-game tidak punya konsep benar/salah
      };
      console.log("Inserting mini-game score to player_answers:", JSON.stringify(dataToInsert, null, 2));

      // Add mini-game points ke player score
      const { data: player, error: playerError } = await supabase
        .from("players")
        .select("score")
        .eq("id", playerId)
        .single();

      if (playerError) {
        console.error("Player fetch error:", playerError.message, playerError.details);
        throw playerError;
      }

      if (player) {
        const newScore = (player.score || 0) + score;
        const { error: updateError } = await supabase
          .from("players")
          .update({ score: newScore })
          .eq("id", playerId);

        if (updateError) {
          console.error("Player update error:", updateError.message, updateError.details);
          throw updateError;
        }

        // Record mini-game bonus
        const { error: insertError } = await supabase.from("player_answers").insert(dataToInsert);
        if (insertError) {
          console.error("Supabase insert error (mini-game):", insertError.message, insertError.details, insertError.hint);
          throw insertError;
        }
      }
    } catch (error: any) {
      console.error("Error saving mini-game score:", error.message, error.details, error.hint);
      toast.error(`Failed to save mini-game score: ${error.message}`);
    }

    addScore(score);
    setShowMiniGame(false);
    if (currentQuestion + 1 < gameSettings!.questionCount) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Clean up session seed when game ends
      if (gameId && playerId) {
        localStorage.removeItem(`session-seed-${gameId}-${playerId}`);
      }
      router.replace(`/result/${gameCode}`);
    }
  };

  if (loading || !gameSettings || (isQuizStarted && !progressRestored))
    return (
      <>
        <Background />
        <div className="relative z-10 min-h-screen flex items-center justify-center font-mono text-white">
          <div className="bg-black/70 border-4 border-white p-6 rounded-lg">
            <p>Loading quiz...</p>
          </div>
        </div>
      </>
    );

  if (!quiz || !question)
    return (
      <>
        <Background />
        <div className="relative z-10 min-h-screen flex items-center justify-center font-mono text-white">
          <div className="bg-black/70 border-4 border-red-500 p-6 rounded-lg">
            <p>Quiz not found or invalid quiz ID.</p>
            <button onClick={() => router.replace("/")} className="mt-4 px-4 py-2 bg-red-600 rounded">
              Go Home
            </button>
          </div>
        </div>
      </>
    );

  if (!isQuizStarted)
    return (
      <>
        <Background />
        <div className="relative z-10 min-h-screen flex items-center justify-center font-mono text-white">
          <div className="bg-black/70 border-4 border-white p-6 rounded-lg">
            <p>Waiting for host to start...</p>
          </div>
        </div>
      </>
    );

  return (
    <>
      <Background />
      <div className="relative z-10 min-h-screen flex items-center justify-center font-mono text-white">
        <AnimatePresence>{showMiniGame && <SpaceDodge onComplete={handleMiniGameComplete} />}</AnimatePresence>

        <div className="w-full max-w-4xl mx-auto p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="text-lg">
              Score: <span className="font-bold text-yellow-300">{score}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span className="text-lg">{formatTime(timeLeft)}</span>
            </div>
          </div>

          <div className="mb-2 flex items-center justify-between text-sm text-white/70">
            <span>Progress: {currentQuestion}/{gameSettings.questionCount}</span>
            <span>{Math.round((currentQuestion / gameSettings.questionCount) * 100)}%</span>
          </div>
          <Progress value={(currentQuestion / gameSettings.questionCount) * 100} className="mb-6" />

          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white/10 border-4 border-white/20 p-6 rounded-lg mb-6"
          >
            <h2 className="text-xl mb-4">
              Question {currentQuestion + 1} of {gameSettings.questionCount}
            </h2>
            {question.question_image_url && (
              <div className="mb-6 flex justify-center">
                <Image
                  src={question.question_image_url || "/images/placeholder.svg"}
                  alt={question.question_image_alt || "Gambar soal"}
                  width={300}
                  height={200}
                  sizes="(max-width: 768px) 100vw, 300px"
                  priority
                  className="max-w-full max-h-64 object-contain rounded-lg border-2 border-white/20"
                  style={{ imageRendering: "pixelated" }}
                />
              </div>
            )}
            <p className="text-lg mb-6">{question.question}</p>

            <div
              className={`grid ${question.choices.length === 3 ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"} gap-4`}
            >
              {question.choices.map((choice, index) => {
                const isSelected = selectedChoiceId === choice.id;
                const isRight = choice.is_correct;
                let buttonColor: "blue" | "green" | "red" = "blue";

                if (isAnswered) {
                  if (isRight) buttonColor = "green";
                  else if (isSelected && !isRight) buttonColor = "red";
                }

                return (
                  <PixelButton
                    key={choice.id}
                    color={buttonColor}
                    disabled={isAnswered}
                    onClick={() => handleAnswerSelect(choice)}
                    className={`${isAnswered ? "cursor-not-allowed" : ""} ${isAnswered && !isSelected ? "opacity-50" : ""} text-left`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-lg bg-black/30 px-2 py-1 rounded border border-white/20 min-w-[32px] text-center">
                        {String.fromCharCode(65 + index)}
                      </span>
                      <div className="flex-1 flex items-center gap-3">
                        {choice.choice_image_url && (
                          <Image
                            src={choice.choice_image_url || "/images/placeholder.svg"}
                            alt={choice.choice_image_alt || "Pilihan jawaban"}
                            width={48}
                            height={48}
                            sizes="48px"
                            className="w-12 h-12 object-contain rounded border border-white/20"
                            style={{ imageRendering: "pixelated" }}
                          />
                        )}
                        {choice.choice_text && <span className="flex-1">{choice.choice_text}</span>}
                      </div>
                    </div>
                  </PixelButton>
                );
              })}
            </div>

            <AnimatePresence>
              {showResult && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="mt-6 text-center"
                >
                  <div className={`text-2xl font-bold ${isCorrect ? "text-green-400" : "text-red-400"}`}>
                    {isCorrect ? "✅ Correct!" : "❌ Wrong!"}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </>
  );
}

function Background() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      <div
        className="absolute inset-0 bg-[url('/images/space_bg.jpg')]"
        style={{ backgroundSize: "cover", imageRendering: "pixelated" }}
      />
      <div className="absolute inset-0 bg-black/40" />
    </div>
  );
}