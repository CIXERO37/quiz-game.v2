/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useGameStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Trophy, Medal, Crown, Star } from "lucide-react";
import { getFirstName, formatDisplayName } from "@/lib/utils";
import React from "react";

interface PlayerResult {
  id: string;
  name: string;
  avatar: string;
  score: number;
  position: number;
}

// === SMART NAME DISPLAY ===
const SmartNameDisplay = React.memo(({ 
  name, 
  maxLength = 8,
  className = "",
  multilineClassName = ""
}: {
  name: string;
  maxLength?: number;
  className?: string;
  multilineClassName?: string;
}) => {
  const { displayName, isBroken } = formatDisplayName(name, maxLength)
  
  if (isBroken) {
    return (
      <span className={`${className} ${multilineClassName} whitespace-pre-line leading-tight text-center block`}>
        {displayName}
      </span>
    )
  }
  
  return (
    <span className={className}>
      {displayName}
    </span>
  )
})
SmartNameDisplay.displayName = "SmartNameDisplay"

function Background() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      <div
        className="absolute inset-0 bg-[url('/images/space_bg.jpg')]"
        style={{ backgroundSize: "cover", imageRendering: "pixelated" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-transparent to-blue-900/20" />
    </div>
  );
}

function getPositionStyle(position: number) {
  switch (position) {
    case 1:
      return {
        bg: "bg-gradient-to-r from-yellow-500/20 to-amber-500/20",
        border: "border-yellow-500/50",
        text: "text-yellow-400",
        icon: <Crown className="w-6 h-6 text-yellow-400" />,
        glow: "shadow-yellow-500/50"
      };
    case 2:
      return {
        bg: "bg-gradient-to-r from-gray-400/20 to-slate-400/20",
        border: "border-gray-400/50",
        text: "text-gray-300",
        icon: <Medal className="w-6 h-6 text-gray-300" />,
        glow: "shadow-gray-400/50"
      };
    case 3:
      return {
        bg: "bg-gradient-to-r from-amber-600/20 to-orange-600/20",
        border: "border-amber-600/50",
        text: "text-amber-500",
        icon: <Medal className="w-6 h-6 text-amber-500" />,
        glow: "shadow-amber-600/50"
      };
    default:
      return {
        bg: "bg-slate-700/30",
        border: "border-slate-600/50",
        text: "text-slate-300",
        icon: <span className="text-xl font-bold">{position}.</span>,
        glow: "shadow-slate-600/50"
      };
  }
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

  useEffect(() => {
    if (!isLoading) {
      const userResult = playerResults.find((p) => p.id === playerId);
      if (!userResult && !isHost) {
        router.push("/");
      }
    }
  }, [isLoading, playerResults, isHost, playerId, router]);

  if (isLoading)
    return (
      <>
        <Background />
        <div className="relative z-10 min-h-screen flex items-center justify-center bg-black text-white font-mono" />
      </>
    );

  return isHost ? (
    <>
      <Background />
      <div className="relative z-10 min-h-screen p-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <div className="text-center mb-8">
            <motion.h1 
              className="text-5xl font-bold text-white mb-2 flex items-center justify-center gap-3"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <Trophy className="w-12 h-12 text-yellow-400" />
              Final Results
            </motion.h1>
            <p className="text-slate-300 text-lg">Game Code: {gameCode.toUpperCase()}</p>
          </div>

          <div className="space-y-3">
            {playerResults.map((player, index) => {
              const style = getPositionStyle(player.position);
              return (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  className={`relative overflow-hidden rounded-xl border ${style.border} ${style.bg} backdrop-blur-sm shadow-lg ${style.glow}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                  
                  <div className="relative p-4 flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      {style.icon}
                      <img 
                        src={player.avatar} 
                        alt={getFirstName(player.name)}
                        className="w-12 h-12 rounded-full object-cover border-2 border-white/20"
                      />
                    </div>
                    
                    <div className="flex-1">
                      <p className="text-white font-semibold text-lg">
                        <SmartNameDisplay 
                          name={player.name} 
                          maxLength={8}
                          className="text-white font-semibold text-lg"
                          multilineClassName="text-base leading-tight"
                        />
                      </p>
                      <p className="text-slate-300 text-sm">Score</p>
                    </div>
                    
                    <div className="text-right">
                      <p className={`text-3xl font-bold ${style.text}`}>
                        {player.score.toLocaleString()}
                      </p>
                      <p className="text-slate-400 text-sm">points</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <motion.div 
            className="text-center mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Button
              onClick={() => {
                resetGame();
                router.push("/");
              }}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              Back to Dashboard
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </>
  ) : (
    <>
      <Background />
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="max-w-md w-full"
        >
          <div className="bg-gradient-to-b from-slate-800/90 to-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 text-center space-y-6 shadow-2xl">
            <motion.div
              animate={{ 
                scale: [1, 1.05, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                repeatType: "reverse"
              }}
              className="relative inline-block"
            >
              <img
                src={playerAvatar || "/default-avatar.png"}
                alt={getFirstName(playerName)}
                className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-purple-500 shadow-lg"
              />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center"
              >
                <span className="text-sm font-bold">{userPosition}</span>
              </motion.div>
            </motion.div>

            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                <SmartNameDisplay 
                  name={playerName || "Unknown Player"} 
                  maxLength={10}
                  className="text-3xl font-bold text-white"
                  multilineClassName="text-2xl leading-tight"
                />
              </h1>
              <div className="space-y-2">
                <motion.p 
                  className="text-6xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                >
                  {score || 0}
                </motion.p>
                <p className="text-slate-300 text-lg">points</p>
              </div>
            </div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="space-y-4"
            >
              <div className="bg-slate-700/50 rounded-lg p-4">
                <p className="text-slate-300">Your Position</p>
                <p className="text-3xl font-bold text-purple-400">#{userPosition || "N/A"}</p>
              </div>
              
              <Button
                onClick={() => {
                  resetGame();
                  router.push("/");
                }}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                <Star className="w-5 h-5 mr-2 inline" />
                Play Again
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </>
  );
}