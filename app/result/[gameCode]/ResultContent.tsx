/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useGameStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface PlayerResult {
  id: string;
  name: string;
  avatar: string;
  score: number;
  position: number;
}

export default function ResultContent({ gameCode }: { gameCode: string }) {
  const router = useRouter();
  const playerId = useGameStore.getState().playerId;
  const [playerResults, setPlayerResults] = useState<PlayerResult[]>([]);
  const [userPosition, setUserPosition] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const { playerName, playerAvatar, score, isHost, resetGame } = useGameStore();

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const { data: gameData, error: gameErr } = await supabase
          .from("games")
          .select("id")
          .eq("code", gameCode.toUpperCase())
          .single();

        if (gameErr || !gameData) {
          toast.error("Game not found");
          router.push("/");
          return;
        }

        const gameId = gameData.id;
        if (playerId && score) await supabase.from("players").update({ score }).eq("id", playerId);

        const { data: players, error } = await supabase
          .from("players")
          .select("*")
          .eq("game_id", gameId)
          .order("score", { ascending: false });

        if (error || !players) setPlayerResults([]);
        else {
          const results = players.map((p, idx) => ({
            id: p.id,
            name: p.name || "Unknown",
            avatar: p.avatar || "/default-avatar.png",
            score: p.score || 0,
            position: idx + 1,
          }));
          setPlayerResults(results);
          setUserPosition(results.findIndex((p) => p.id === playerId) + 1 || 0);
        }
      } catch (err) {
        toast.error("Failed to load results");
      } finally {
        setIsLoading(false);
      }
    };
    fetchResults();
  }, [gameCode, playerId, score, router]);

  // Pindahkan logika navigasi ke useEffect
  useEffect(() => {
    if (!isLoading) {
      const userResult = playerResults.find((p) => p.id === playerId);
      if (!userResult && !isHost) {
        router.push("/");
      }
    }
  }, [isLoading, playerResults, isHost, playerId, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white font-mono">
        Loading...
      </div>
    );
  }

  return isHost ? (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white p-6">
      <h1 className="text-4xl font-bold text-center mb-6">🏆 Final Results</h1>
      <div className="max-w-2xl mx-auto space-y-4">
        {playerResults.map((p) => (
          <div key={p.id} className="flex items-center justify-between bg-slate-700 p-4 rounded-lg">
            <div className="flex items-center gap-4">
              <span className="text-2xl font-bold">{p.position}.</span>
              <img src={p.avatar} alt={p.name} className="w-10 h-10 rounded-full object-cover" />
              <span>{p.name}</span>
            </div>
            <span className="text-xl font-bold text-yellow-400">{p.score}</span>
          </div>
        ))}
      </div>
      <div className="text-center mt-6">
        <Button onClick={() => { resetGame(); router.push("/"); }} className="bg-purple-600 hover:bg-purple-700">
          Back to Dashboard
        </Button>
      </div>
    </div>
  ) : (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800 text-white p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        <div className="bg-slate-800/80 backdrop-blur-lg border border-slate-700 rounded-lg p-6 text-center space-y-4">
          <img src={playerAvatar || "/default-avatar.png"} alt={playerName} className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-purple-500" />
          <h1 className="text-2xl font-bold">{playerName || "Unknown Player"}</h1>
          <p className="text-3xl font-bold text-purple-400">{score || 0} pts</p>
          <p className="text-xl">Position #{userPosition || "N/A"}</p>
          <Button onClick={() => { resetGame(); router.push("/"); }} className="w-full bg-purple-600 hover:bg-purple-700">
            Play Again
          </Button>
        </div>
      </motion.div>
    </div>
  );
}