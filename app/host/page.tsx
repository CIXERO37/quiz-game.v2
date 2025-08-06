// app/host/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Copy, Play, Users, QrCode, Clock, X, UsersRound } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useGameStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { fetchQuizzes } from "@/lib/dummy-data";
import { toast, Toaster } from "sonner";
import Image from "next/image";
import { Progress } from "@/components/ui/progress";
import type { Quiz } from "@/lib/types";

// Pixel Button Component
function PixelButton({
  color = "blue",
  size = "md",
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  color?: string;
  size?: string;
}) {
  const colorStyles: Record<string, string> = {
    red: "bg-red-500 border-red-700 text-white hover:bg-red-600 active:bg-red-700",
    green: "bg-green-500 border-green-700 text-white hover:bg-green-600 active:bg-green-700",
    blue: "bg-blue-500 border-blue-700 text-white hover:bg-blue-600 active:bg-blue-700",
    yellow: "bg-yellow-400 border-yellow-600 text-black hover:bg-yellow-500 active:bg-yellow-600",
    gray: "bg-gray-500 border-gray-700 text-white hover:bg-gray-600 active:bg-gray-700",
  };

  const sizeStyles: Record<string, string> = {
    sm: "px-3 py-2 text-xs",
    md: "px-4 py-3 text-sm",
    lg: "px-6 py-4 text-base",
  };

  return (
    <button
      className={`border-2 font-mono uppercase tracking-wide shadow-[4px_4px_0px_rgba(0,0,0,0.8)] active:shadow-[2px_2px_0px_rgba(0,0,0,0.8)] active:translate-x-[2px] active:translate-y-[2px] transition-all ${colorStyles[color]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

interface PlayerProgress {
  id: string;
  name: string;
  avatar: string;
  score: number;
  currentQuestion: number;
  totalQuestions: number;
  isActive: boolean;
}

export default function HostPage() {
  const [showQR, setShowQR] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [playerProgress, setPlayerProgress] = useState<PlayerProgress[]>([]);
  const [quizStarted, setQuizStarted] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const { gameCode, gameId, quizId, players, setPlayers } = useGameStore();
  const joinUrl = typeof window !== "undefined" ? `${window.location.origin}?code=${gameCode}` : "";

  // Load quiz
  useEffect(() => {
    if (!quizId || !gameId || !gameCode) {
      toast.error("Missing quiz or game data.");
      router.push("/");
      return;
    }

    const loadQuiz = async () => {
      setLoading(true);
      try {
        const quizzes = await fetchQuizzes();
        const found = quizzes.find((q) => q.id === quizId);
        if (!found) {
          toast.error("Quiz not found.");
          router.push("/");
        } else {
          setQuiz(found);
        }
      } catch {
        toast.error("Failed to load quiz.");
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    loadQuiz();
  }, [quizId, gameId, gameCode, router]);

  // Fetch players
  const fetchPlayers = useCallback(async () => {
    if (!gameId) return;
    const { data, error } = await supabase.from("players").select("*").eq("game_id", gameId);
    if (!error && data) {
      setPlayers(data);
    }
  }, [gameId, setPlayers]);

  // Fetch player progress
  const updatePlayerProgress = useCallback(async () => {
    if (!gameId || !quiz) return;

    // 🔁 Ambil SEMUA jawaban (termasuk mini-game question_index = -1)
    const { data: answers, error } = await supabase
      .from("player_answers")
      .select("player_id, question_index, is_correct, points_earned")
      .eq("game_id", gameId);

    if (!error && answers) {
      const { data: playersData } = await supabase.from("players").select("*").eq("game_id", gameId);

      const progressMap = new Map<string, PlayerProgress>();

      playersData?.forEach((player) => {
        const playerAnswers = answers.filter((a) => a.player_id === player.id);

        // Total skor = semua poin (soal kuis + mini-game)
        const score = playerAnswers.reduce((sum, a) => sum + (a.points_earned || 0), 0);

        // Hanya hitung soal kuis nyata (bukan mini-game)
        const quizAnswers = playerAnswers.filter((a) => a.question_index >= 0);
        const currentQuestion = quizAnswers.length;

        progressMap.set(player.id, {
          id: player.id,
          name: player.name,
          avatar: player.avatar || "/placeholder.svg",
          score,
          currentQuestion,
          totalQuestions: quiz.questions.length,
          isActive: currentQuestion < quiz.questions.length,
        });
      });

      setPlayerProgress(Array.from(progressMap.values()));

      // Jika sudah ada pemain yang menyelesaikan semua soal, selesaikan game
      const sudahAdaYangSelesai = Array.from(progressMap.values()).some(
        (p) => p.currentQuestion >= quiz.questions.length
      );
      if (sudahAdaYangSelesai && !showLeaderboard) {
        supabase.from("games").update({ is_started: false, finished: true }).eq("id", gameId);
      }
    }
  }, [gameId, quiz, showLeaderboard]);

  // Listen to game & players changes
  useEffect(() => {
    if (!gameId) return;

    const gameSubscription = supabase
      .channel("game_status")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "games", filter: `id=eq.${gameId}` }, (payload) => {
        if (payload.new.finished) {
          setQuizStarted(false);
          setShowLeaderboard(true);
          toast.success("🎉 Quiz ended! Showing leaderboard...");
        }
      })
      .subscribe();

    const playersSubscription = supabase
      .channel("players")
      .on("postgres_changes", { event: "*", schema: "public", table: "players", filter: `game_id=eq.${gameId}` }, () => {
        fetchPlayers();
        updatePlayerProgress();
      })
      .subscribe();

    const answersSubscription = supabase
      .channel("player_answers")
      .on("postgres_changes", { event: "*", schema: "public", table: "player_answers", filter: `game_id=eq.${gameId}` }, () => {
        updatePlayerProgress();
      })
      .subscribe();

    fetchPlayers();
    updatePlayerProgress();

    return () => {
      supabase.removeChannel(gameSubscription);
      supabase.removeChannel(playersSubscription);
      supabase.removeChannel(answersSubscription);
    };
  }, [gameId, fetchPlayers, updatePlayerProgress]);

  const copyGameCode = () => {
    navigator.clipboard.writeText(gameCode);
    setCopied(true);
    toast.success("✅ Game code copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const startQuiz = async () => {
    if (players.length === 0) {
      toast.error("❌ No players have joined yet!");
      return;
    }

    setIsStarting(true);
    try {
      await supabase.from("games").update({ is_started: true }).eq("id", gameId);
      setQuizStarted(true);
      toast.success("🚀 Quiz started!");
    } catch {
      toast.error("❌ Failed to start quiz");
    } finally {
      setIsStarting(false);
    }
  };

  const endQuiz = async () => {
    try {
      await supabase.from("games").update({ is_started: false, finished: true }).eq("id", gameId);
      toast.success("🏁 Quiz ended!");
      setQuizStarted(false);
      setShowLeaderboard(true);
    } catch {
      toast.error("❌ Failed to end quiz");
    }
  };

  // Podium Leaderboard
  const PodiumLeaderboard = () => {
    const sortedPlayers = [...playerProgress].sort((a, b) => b.score - a.score);
    const first = sortedPlayers[0] || { name: "No Player", score: 0, avatar: "/placeholder.svg" };
    const second = sortedPlayers[1] || { name: "No Player", score: 0, avatar: "/placeholder.svg" };
    const third = sortedPlayers[2] || { name: "No Player", score: 0, avatar: "/placeholder.svg" };
    const remainingPlayers = sortedPlayers.slice(3);

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen flex items-center justify-center p-4">
        <div className="relative w-full max-w-5xl">
          <motion.h1
            className="text-5xl md:text-6xl font-bold text-center mb-12 text-yellow-300 drop-shadow-[4px_4px_0px_#000]"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", duration: 0.8 }}
          >
            🏆 CHAMPIONS 🏆
          </motion.h1>

          <div className="flex items-end justify-center gap-4 md:gap-8">
            <motion.div className="relative" initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 100 }}>
              <motion.div className="relative mb-4" animate={{ y: [0, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-b from-gray-300 to-gray-500 rounded-full border-4 border-gray-400 shadow-lg">
                  <Image src={second.avatar} alt={second.name} width={128} height={128} className="w-full h-full rounded-full object-cover" priority />
                </div>
                <div className="absolute -top-3 -right-3 w-10 h-10 md:w-12 md:h-12 bg-gray-400 rounded-full flex items-center justify-center text-xl md:text-2xl">🥈</div>
              </motion.div>
              <div className="bg-gradient-to-t from-gray-500 to-gray-300 w-32 md:w-48 h-28 md:h-32 rounded-t-lg border-4 border-gray-400 shadow-lg">
                <div className="text-center pt-2 md:pt-4">
                  <p className="font-bold text-sm md:text-lg text-gray-800 drop-shadow">{second.name}</p>
                  <p className="text-lg md:text-2xl font-bold text-gray-700">{second.score} points</p>
                </div>
              </div>
            </motion.div>

            <motion.div className="relative" initial={{ y: 200, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1, type: "spring", stiffness: 100 }}>
              <motion.div className="relative mb-4" animate={{ y: [0, -15, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                <div className="w-32 h-32 md:w-40 md:h-40 bg-gradient-to-b from-yellow-200 to-yellow-600 rounded-full border-4 border-yellow-400 shadow-2xl">
                  <Image src={first.avatar} alt={first.name} width={160} height={160} className="w-full h-full rounded-full object-cover" priority />
                </div>
                <div className="absolute -top-4 -right-4 w-12 h-12 md:w-16 md:h-16 bg-yellow-400 rounded-full flex items-center justify-center text-2xl md:text-3xl">🥇</div>
              </motion.div>
              <div className="bg-gradient-to-t from-yellow-600 to-yellow-300 w-40 md:w-56 h-36 md:h-40 rounded-t-lg border-4 border-yellow-400 shadow-2xl">
                <div className="text-center pt-4 md:pt-8">
                  <p className="font-bold text-base md:text-xl text-yellow-900 drop-shadow">{first.name}</p>
                  <p className="text-xl md:text-3xl font-bold text-yellow-800">{first.score} points</p>
                </div>
              </div>
            </motion.div>

            <motion.div className="relative" initial={{ y: 150, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3, type: "spring", stiffness: 100 }}>
              <motion.div className="relative mb-4" animate={{ y: [0, -8, 0] }} transition={{ duration: 2.5, repeat: Infinity }}>
                <div className="w-24 h-24 md:w-28 md:h-28 bg-gradient-to-b from-orange-300 to-orange-700 rounded-full border-4 border-orange-500 shadow-lg">
                  <Image src={third.avatar} alt={third.name} width={112} height={112} className="w-full h-full rounded-full object-cover" priority />
                </div>
                <div className="absolute -top-3 -right-3 w-10 h-10 md:w-12 md:h-12 bg-orange-500 rounded-full flex items-center justify-center text-xl md:text-2xl">🥉</div>
              </motion.div>
              <div className="bg-gradient-to-t from-orange-700 to-orange-300 w-32 md:w-40 h-20 md:h-24 rounded-t-lg border-4 border-orange-500 shadow-lg">
                <div className="text-center pt-1 md:pt-2">
                  <p className="font-bold text-sm md:text-lg text-orange-900 drop-shadow">{third.name}</p>
                  <p className="text-base md:text-xl font-bold text-orange-800">{third.score} points</p>
                </div>
              </div>
            </motion.div>
          </div>

          {remainingPlayers.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-8 bg-white/10 border-2 border-white/20 rounded-lg p-4 max-h-64 overflow-y-auto">
              <h2 className="text-lg font-bold mb-3 text-white">Other Rankings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {remainingPlayers.map((player, index) => (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="flex items-center gap-3 bg-white/5 rounded p-3"
                  >
                    <span className="text-yellow-300 font-bold w-8">{index + 4}th</span>
                    <Image src={player.avatar} alt={player.name} width={40} height={40} className="rounded-full border-2 border-white/30 object-cover" />
                    <div className="flex-1">
                      <p className="font-bold text-white">{player.name}</p>
                      <p className="text-sm text-white/70">{player.score} points</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          <motion.div className="text-center mt-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
            <PixelButton color="blue" className="text-base md:text-lg px-6 py-3 md:px-8 md:py-4" onClick={() => router.push("/")}>
              Back to Dashboard
            </PixelButton>
          </motion.div>
        </div>
      </motion.div>
    );
  };

  if (loading)
    return (
      <div className="fixed inset-0 bg-[#87CEEB] flex items-center justify-center font-mono text-white">
        <div className="text-white font-mono text-lg">Loading quiz...</div>
      </div>
    );

  if (!quiz)
    return (
      <div className="fixed inset-0 bg-[#87CEEB] flex items-center justify-center font-mono text-white">
        <div className="bg-white/10 border-2 border-white/30 p-8 text-center font-mono text-white rounded-lg">
          <p className="mb-4">Quiz not found.</p>
          <PixelButton onClick={() => router.push("/")}>Back</PixelButton>
        </div>
      </div>
    );

  return (
    <>
      <div className="fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[#87CEEB]" style={{ imageRendering: "pixelated" }} />
        <div className="absolute bottom-0 w-full h-1/3 bg-[#8B4513]" style={{ imageRendering: "pixelated" }}>
          <div className="absolute top-0 w-full h-6 bg-[#228B22]" style={{ imageRendering: "pixelated" }} />
        </div>
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 min-h-screen font-mono text-white">
        {showLeaderboard ? (
          <PodiumLeaderboard />
        ) : !quizStarted ? (
          <div className="grid lg:grid-cols-3 gap-8">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <div className="bg-white/10 border-2 border-white/20 p-6 rounded-lg">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <QrCode className="w-5 h-5" /> Game Code
                </h2>
                <div className="text-center">
                  <div className="text-3xl font-mono font-bold bg-white text-black rounded py-4 px-4 mb-4">{gameCode}</div>
                  <div className="flex gap-2 justify-center">
                    <PixelButton color="blue" size="sm" onClick={copyGameCode} disabled={copied}>
                      {copied ? "✅ Copied!" : "📋 Copy Code"}
                    </PixelButton>
                    <PixelButton color="yellow" size="sm" onClick={() => setShowQR(!showQR)}>
                      📱 QR
                    </PixelButton>
                  </div>
                  <div className="flex justify-center mt-4">
                    <PixelButton color="red" size="sm" onClick={() => setShowExitModal(true)}>
                      ❌ Exit Game
                    </PixelButton>
                  </div>
                </div>

                {showQR && (
                  <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-4 rounded-lg mt-4">
                    <QRCodeSVG value={joinUrl} size={200} className="mx-auto" />
                  </motion.div>
                )}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2">
              <div className="bg-white/10 border-2 border-white/20 p-6 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <Users className="w-5 h-5" /> Players ({players.length})
                  </h2>
                  <PixelButton color="green" onClick={startQuiz} disabled={players.length === 0 || isStarting}>
                    <Play className="w-4 h-4 inline-block mr-2" /> Start Quiz
                  </PixelButton>
                </div>

                {players.length === 0 ? (
                  <div className="text-center py-12 text-white/60">
                    <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Waiting for players to join...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {players.map((player, index) => (
                      <motion.div
                        key={player.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white/10 rounded-lg p-4 flex items-center gap-3"
                      >
                        <Image
                          src={player.avatar || "/placeholder.svg"}
                          alt={player.name}
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-full border-2 border-white/30 object-cover"
                        />
                        <div className="flex-1">
                          <h3 className="font-bold">{player.name}</h3>
                          <p className="text-sm text-white/70">Ready</p>
                        </div>
                        <span className="text-green-400 text-xs">✔</span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="space-y-8">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="bg-white/10 border-2 border-white/20 p-6 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Clock className="w-5 h-5" />
                  <span className="text-lg">Quiz - Game {gameCode}</span>
                </div>
                <PixelButton color="red" onClick={endQuiz}>
                  ⏹ End Quiz
                </PixelButton>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/10 border-2 border-white/20 rounded-lg p-4">
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                <UsersRound className="w-5 h-5" /> Players Progress
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {playerProgress.map((p) => (
                  <motion.div
                    key={p.id}
                    layout
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col gap-3 bg-white/5 rounded p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Image src={p.avatar} alt={p.name} width={40} height={40} className="rounded-full border-2 border-white/30 object-cover" />
                      <div className="flex-1">
                        <p className="font-bold">{p.name}</p>
                        <p className="text-sm text-white/70">{p.score} pts</p>
                      </div>
                      <p className="text-sm text-white/70">
                        Q {p.currentQuestion}/{p.totalQuestions}
                      </p>
                    </div>
                    <Progress value={(p.currentQuestion / p.totalQuestions) * 100} className="w-full" />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        <AnimatePresence>
          {showExitModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 pointer-events-auto"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="bg-[#1a1a2e] border-4 border-white font-mono text-white p-6 rounded-lg shadow-[8px_8px_0px_#000] max-w-sm w-full mx-4 pointer-events-auto"
              >
                <h2 className="text-lg mb-4 text-center">Are you sure?</h2>
                <p className="text-sm mb-6 text-center">Progress will be lost if you exit.</p>
                <div className="flex justify-center gap-4">
                  <PixelButton color="gray" size="sm" onClick={() => setShowExitModal(false)}>
                    Cancel
                  </PixelButton>
                  <PixelButton color="red" size="sm" onClick={() => router.push("/")}>
                    Confirm Exit
                  </PixelButton>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            fontFamily: "Press Start 2P",
            fontSize: "12px",
            background: "#222",
            color: "#fff",
            border: "2px solid #fff",
          },
        }}
      />
    </>
  );
}