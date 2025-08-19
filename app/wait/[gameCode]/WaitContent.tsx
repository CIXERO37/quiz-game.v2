/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { getPresenceChannel } from "@/lib/presence";
import { toast } from "sonner";

interface WaitContentProps {
  gameCode: string;
}

function Background() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      <div
        className="absolute inset-0 bg-[url('/images/space_bg.jpg')]"
        style={{ backgroundSize: "cover", imageRendering: "pixelated" }}
      />
    </div>
  );
}

export default function WaitContent({ gameCode }: WaitContentProps) {
  const router = useRouter();
  const { clearGame } = useGameStore();

  const [loading, setLoading] = useState(true);
  const [playerName, setPlayerName] = useState("");
  const [playerAvatar, setPlayerAvatar] = useState("");
  const [gameId, setGameId] = useState<string>("");
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdownValue, setCountdownValue] = useState(10);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("player");
    if (!stored) {
      toast.error("Player data not found");
      router.replace("/");
      return;
    }

    const { name, avatar } = JSON.parse(stored);
    setPlayerName(name);
    setPlayerAvatar(avatar);

    const fetchGame = async () => {
      const { data, error } = await supabase
        .from("games")
        .select("id, is_started, quiz_id, countdown_start_ms")
        .eq("code", gameCode.toUpperCase())
        .single();

      if (error || !data) {
        toast.error("Game not found");
        router.replace("/");
        return;
      }

      setGameId(data.id);

      // If already started, redirect immediately
      if (data.is_started) {
        router.replace(`/play/${gameCode}`);
        return;
      }

      // Sync countdown if already running
      if (data.countdown_start_ms) {
        const serverStart = data.countdown_start_ms as number;
        const elapsed = Math.floor((Date.now() - serverStart) / 1000);
        const remaining = Math.max(0, 10 - elapsed);
        setCountdownValue(remaining);
        setShowCountdown(remaining > 0);
      }

      setLoading(false);
    };

    fetchGame();
  }, [gameCode, router]);

  useEffect(() => {
    if (loading || !gameId) return;

    // Listen for countdown and start events
    const channel = supabase
      .channel("game-status")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "games", filter: `code=eq.${gameCode.toUpperCase()}` },
        (payload) => {
          // Handle countdown start
          if (payload.new.countdown_start_ms) {
            const serverStart = payload.new.countdown_start_ms as number;
            const elapsed = Math.floor((Date.now() - serverStart) / 1000);
            const remaining = Math.max(0, 10 - elapsed);
            setCountdownValue(remaining);
            setShowCountdown(remaining > 0);
          }

          // Handle quiz start
          if (payload.new.is_started) {
            setShouldRedirect(true);
          }
        }
      )
      .subscribe();

    // Fallback polling every 5 seconds
    const pollingInterval = setInterval(async () => {
      const { data } = await supabase
        .from("games")
        .select("is_started, countdown_start_ms")
        .eq("code", gameCode.toUpperCase())
        .single();
      
      if (data?.countdown_start_ms) {
        const serverStart = data.countdown_start_ms as number;
        const elapsed = Math.floor((Date.now() - serverStart) / 1000);
        const remaining = Math.max(0, 10 - elapsed);
        setCountdownValue(remaining);
        setShowCountdown(remaining > 0);
      }
      
      if (data?.is_started) {
        setShouldRedirect(true);
        clearInterval(pollingInterval);
      }
    }, 2000); // Check every 2 seconds for faster sync

    // Presence tracking
    const presenceChannel = getPresenceChannel();
    presenceChannel
      .on("presence", { event: "sync" }, () => {})
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await presenceChannel.track({
            game_id: gameId,
            name: playerName,
            avatar: playerAvatar,
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(presenceChannel);
      clearInterval(pollingInterval);
    };
  }, [loading, gameId, gameCode, playerName, playerAvatar]);

  useEffect(() => {
    if (!showCountdown) return;

    const timer = setInterval(() => {
      setCountdownValue((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setShouldRedirect(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showCountdown]);

  useEffect(() => {
    if (shouldRedirect) {
      router.replace(`/play/${gameCode}`);
    }
  }, [shouldRedirect, gameCode, router]);

  const handleExit = async () => {
    const channel = getPresenceChannel();
    await channel.untrack();
    if (gameId && playerName) {
      await supabase.from("players").delete().eq("game_id", gameId).eq("name", playerName);
    }
    clearGame?.();
    localStorage.removeItem("player");
    router.replace("/");
  };

  if (loading)
    return (
      <>
        <Background />
        <div className="relative z-10 min-h-screen flex items-center justify-center font-mono text-white">
          <div className="bg-black/70 border-4 border-white p-6 rounded-lg">
            <p>Loading...</p>
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
            <p className="text-3xl mb-6 font-bold">Game Starting!</p>
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
            <p className="text-lg mt-4 opacity-80">Get ready in {countdownValue} seconds...</p>
          </motion.div>
        </div>
      </>
    );

  return (
    <>
      <Background />
      <div className="relative z-10 flex items-center justify-center min-h-screen font-mono text-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-black/70 border-4 border-white p-8 rounded-lg shadow-[8px_8px_0px_#000] text-center max-w-sm"
        >
          <h1 className="text-2xl mb-4 drop-shadow-[2px_2px_0px_#000]">Get Ready!</h1>
          <motion.img
            src={playerAvatar}
            alt={playerName}
            className="w-32 h-32 rounded-full object-cover mx-auto mb-4 border-2 border-white"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
          />
          <p className="text-lg mb-2 drop-shadow-[1px_1px_0px_#000]">{playerName}</p>
          <p className="text-sm text-white/70 mb-6">
            Waiting to start
            <motion.span
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              ...
            </motion.span>
          </p>

          <button
            onClick={handleExit}
            className="bg-red-500 hover:bg-red-600 border-2 border-red-700 px-4 py-2 rounded-lg text-white font-bold shadow-[4px_4px_0px_#000] text-sm"
          >
            Exit Room
          </button>
        </motion.div>
      </div>
    </>
  );
}