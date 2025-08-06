// app/play/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import SpaceDodge from "@/components/space-dodge";
import { useGameStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { fetchQuizzes, DUMMY_QUIZZES } from "@/lib/dummy-data";
import { toast } from "sonner";
import type { Quiz } from "@/lib/types";

// Tombol gaya pixel
function PixelButton({
  children,
  color = "blue",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  color?: "blue" | "green" | "red" | "yellow";
}) {
  const colorStyles = {
    blue: "bg-blue-500 border-blue-700 text-white hover:bg-blue-600 active:bg-blue-700",
    green: "bg-green-500 border-green-700 text-white hover:bg-green-600 active:bg-green-700",
    red: "bg-red-500 border-red-700 text-white hover:bg-red-600 active:bg-red-700",
    yellow: "bg-yellow-400 border-yellow-600 text-black hover:bg-yellow-500 active:bg-yellow-600",
  };

  return (
    <button
      className={`border-2 font-mono uppercase tracking-wide shadow-[4px_4px_0px_rgba(0,0,0,0.8)] active:shadow-[2px_2px_0px_rgba(0,0,0,0.8)] active:translate-x-[2px] active:translate-y-[2px] transition-all ${colorStyles[color]} px-4 py-3 text-sm w-full ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default function PlayPage() {
  const [timeLeft, setTimeLeft] = useState(300);
  const [selectedChoiceId, setSelectedChoiceId] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isQuizStarted, setIsQuizStarted] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdownValue, setCountdownValue] = useState(10);
  const [shouldNavigate, setShouldNavigate] = useState(false);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMiniGame, setShowMiniGame] = useState(false);

  const router = useRouter();
  const {
    gameId,
    playerId,
    quizId,
    currentQuestion,
    score,
    correctAnswers,
    setCurrentQuestion,
    addScore,
    incrementCorrectAnswers,
  } = useGameStore();

  // Load quiz
  useEffect(() => {
    const loadQuiz = async () => {
      await fetchQuizzes();
      const found = DUMMY_QUIZZES.find((q) => q.id === quizId);
      setQuiz(found || null);
      setCurrentQuestion(0);
      setLoading(false);
    };

    if (!gameId || !quizId) {
      router.replace("/");
      return;
    }

    loadQuiz();
  }, [gameId, quizId, router, setCurrentQuestion]);

  // 🔥 Listener untuk redirect ketika host selesaikan kuis
  useEffect(() => {
    if (!gameId || loading) return;

    const channel = supabase
      .channel("game-finished")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "games", filter: `id=eq.${gameId}` },
        (payload) => {
          if (payload.new.finished) {
            router.replace("/result");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId, loading, router]);

  // Cek apakah host sudah mulai kuis
  useEffect(() => {
    if (!gameId || loading) return;

    const checkStart = async () => {
      const { data } = await supabase.from("games").select("is_started").eq("id", gameId).single();
      if (data?.is_started && !isQuizStarted && !showCountdown) {
        setShowCountdown(true);
      }
    };

    const interval = setInterval(checkStart, 1000);
    return () => clearInterval(interval);
  }, [gameId, isQuizStarted, showCountdown, loading]);

  // Countdown 10 detik sebelum mulai
  useEffect(() => {
    if (!showCountdown) return;
    const timer = setInterval(() => {
      setCountdownValue((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setShowCountdown(false);
          setIsQuizStarted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [showCountdown]);

  // Timer kuis
  useEffect(() => {
    if (!isQuizStarted || !quiz) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          setShouldNavigate(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isQuizStarted, quiz]);

  // Redirect otomatis
  useEffect(() => {
    if (shouldNavigate) router.replace("/result");
  }, [shouldNavigate, router]);

  // Acak pertanyaan
  const shuffledQuestions = useMemo(() => {
    if (!quiz) return [];
    return [...quiz.questions].sort(() => Math.random() - 0.5);
  }, [quiz]);

  const question = shuffledQuestions[currentQuestion];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Fungsi saat pemain memilih jawaban
  const handleAnswerSelect = async (choice: {
    id: number;
    choice_text: string;
    is_correct: boolean;
  }) => {
    if (isAnswered || !question) return;
    setSelectedChoiceId(choice.id);
    setIsAnswered(true);
    const correct = choice.is_correct;
    setIsCorrect(correct);

    await supabase.from("player_answers").insert({
      player_id: playerId,
      game_id: gameId,
      question_index: currentQuestion,
      is_correct: correct,
      points_earned: correct ? 100 : 0,
    });

    if (correct) {
      addScore(100);
      incrementCorrectAnswers();
    }

    setShowResult(true);

    setTimeout(() => {
      if (correct && (correctAnswers + 1) % 3 === 0) {
        setShowMiniGame(true);
      } else {
        nextQuestion();
      }
    }, 2000);
  };

  const nextQuestion = async () => {
    if (!question || !quiz) return;

    // 🔥 Jika ini soal terakhir: tandai game selesai
    if (currentQuestion >= shuffledQuestions.length - 1) {
      await supabase.from("games").update({ finished: true, is_started: false }).eq("id", gameId);
      setShouldNavigate(true);
      return;
    }

    setCurrentQuestion(currentQuestion + 1);
    setSelectedChoiceId(null);
    setIsAnswered(false);
    setShowResult(false);
    setIsCorrect(false);
  };

  const handleMiniGameComplete = (miniScore: number) => {
    addScore(miniScore);
    setShowMiniGame(false);
    nextQuestion();
  };

  const Background = () => (
    <div className="fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-[#87CEEB]" style={{ imageRendering: "pixelated" }} />
      <div className="absolute bottom-0 w-full h-1/3 bg-[#8B4513]" style={{ imageRendering: "pixelated" }}>
        <div className="absolute top-0 w-full h-6 bg-[#228B22]" style={{ imageRendering: "pixelated" }} />
      </div>
      <div className="absolute inset-0 bg-black/40" />
    </div>
  );

  if (loading)
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

  if (showCountdown)
    return (
      <>
        <Background />
        <div className="relative z-10 min-h-screen flex items-center justify-center font-mono text-white">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-black/80 border-4 border-white p-12 rounded-lg text-center"
          >
            <p className="text-3xl mb-6 font-bold">Quiz Starting!</p>
            <motion.div
              key={countdownValue}
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
              className="text-9xl font-bold text-yellow-300"
              style={{ textShadow: "4px 4px 0px #000" }}
            >
              {countdownValue}
            </motion.div>
            <p className="text-lg mt-4 opacity-80">Get ready! Quiz starts in {countdownValue} seconds...</p>
          </motion.div>
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
        <AnimatePresence>
          {showMiniGame && <SpaceDodge onComplete={handleMiniGameComplete} />}
        </AnimatePresence>

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

          <Progress value={((currentQuestion + 1) / shuffledQuestions.length) * 100} className="mb-6" />

          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white/10 border-4 border-white/20 p-6 rounded-lg mb-6"
          >
            <h2 className="text-xl mb-4">Question {currentQuestion + 1}</h2>
            <p className="text-lg mb-6">{question.question}</p>

            <div className={`grid ${question.choices.length === 3 ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"} gap-4`}>
              {question.choices.map((choice) => {
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
                    className={`${isAnswered ? "cursor-not-allowed" : ""} ${isAnswered && !isSelected ? "opacity-50" : ""}`}
                  >
                    {choice.choice_text}
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