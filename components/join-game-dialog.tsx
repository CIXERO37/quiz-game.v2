/* eslint-disable @next/next/no-img-element */
"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { X, Users, Gamepad2, Sparkles, Star } from "lucide-react"
import { useGameStore } from "@/lib/store"
import { supabase } from "@/lib/supabase"
import { v4 as uuidv4 } from "uuid"
import { useLanguage } from "@/contexts/language-context"
// penanda
const ANIMAL_AVATARS = [
  "https://api.dicebear.com/9.x/micah/svg?seed=cat",
  "https://api.dicebear.com/9.x/micah/svg?seed=dog",
  "https://api.dicebear.com/9.x/micah/svg?seed=rabbit",
  "https://api.dicebear.com/9.x/micah/svg?seed=elephant",
  "https://api.dicebear.com/9.x/micah/svg?seed=monkey",
  "https://api.dicebear.com/9.x/micah/svg?seed=tiger",
  "https://api.dicebear.com/9.x/micah/svg?seed=panda",
  "https://api.dicebear.com/9.x/micah/svg?seed=koala",
]

const joinGameSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  gameCode: z.string().min(6, "Game code must be 6 characters").max(6, "Game code must be 6 characters"),
})

type JoinGameForm = z.infer<typeof joinGameSchema>

interface JoinGameDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialGameCode?: string
}

export function JoinGameDialog({ open, onOpenChange, initialGameCode = "" }: JoinGameDialogProps) {
  const { t } = useLanguage()
  const [selectedAvatar, setSelectedAvatar] = useState<string>(ANIMAL_AVATARS[0])
  const [isLoading, setIsLoading] = useState(false)

  const router = useRouter()
  const { setPlayer, setGameCode, setGameId, setQuizId, setIsHost } = useGameStore()

  const form = useForm<JoinGameForm>({
    resolver: zodResolver(joinGameSchema),
    defaultValues: {
      name: "",
      gameCode: initialGameCode,
    },
  })

  useEffect(() => {
    if (initialGameCode) {
      form.setValue("gameCode", initialGameCode)
    }
  }, [initialGameCode, form])

  const extractGameCodeFromUrl = (input: string): string => {
    try {
      // Check if input contains a URL
      if (input.includes("http") || input.includes("player?code=")) {
        const url = new URL(input.includes("http") ? input : `https://example.com/${input}`)
        const code = url.searchParams.get("code")
        if (code && code.length === 6) {
          return code.toUpperCase()
        }
      }
      // If not a URL or no valid code found, return the input as is
      return input.toUpperCase()
    } catch {
      // If URL parsing fails, return the input as is
      return input.toUpperCase()
    }
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  const onSubmit = async (data: JoinGameForm) => {
    setIsLoading(true)
    try {
      const { data: game, error: gameError } = await supabase
        .from("games")
        .select("*")
        .eq("code", data.gameCode.toUpperCase())
        .eq("status", "waiting")
        .single()

      if (gameError || !game) {
        form.setError("gameCode", { message: t('error', 'Game not found or already started') })
        return
      }

      const playerId = uuidv4()

      // Insert fresh player record
      await supabase.from("players").insert({
        id: playerId,
        game_id: game.id,
        name: data.name,
        avatar: selectedAvatar,
        score: 0,
        current_question: 0,
      })

      setPlayer(playerId, data.name, selectedAvatar)
      setGameCode(data.gameCode.toUpperCase())
      setGameId(game.id)
      setQuizId(game.quiz_id)
      setIsHost(false)

      // ✅ Simpan ke localStorage sebelum redirect
      localStorage.setItem(
        "player",
        JSON.stringify({
          id: playerId,
          name: data.name,
          avatar: selectedAvatar,
        }),
      )

      router.push(`/wait/${data.gameCode.toUpperCase()}`)
      onOpenChange(false)
    } catch (error) {
      console.error("Error joining game:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 border-0 bg-transparent">
        {/* Space Background */}
        <div className="fixed inset-0 z-0 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: "url('/images/galaxy.webp')",
            }}
          />
          
          {/* Animated space elements */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute orbit-inner">
              <div className="w-2 h-2 bg-gradient-to-br from-orange-400 to-red-500 rounded-full shadow-lg shadow-orange-400/60 border border-orange-300/30">
                <div className="w-full h-full rounded-full bg-gradient-to-tl from-transparent to-white/20"></div>
              </div>
            </div>
            <div className="absolute orbit-middle">
              <div className="w-3 h-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full shadow-lg shadow-blue-400/70 border border-blue-300/40 relative">
                <div className="w-full h-full rounded-full bg-gradient-to-tl from-transparent to-white/25"></div>
                <div className="absolute top-1 left-1 w-1 h-1 bg-green-300 rounded-full opacity-60"></div>
              </div>
            </div>
            <div className="absolute orbit-outer">
              <div className="w-4 h-4 bg-gradient-to-br from-purple-300 to-indigo-500 rounded-full shadow-lg shadow-purple-400/60 border border-purple-200/40">
                <div className="w-full h-full rounded-full bg-gradient-to-tl from-transparent to-white/20"></div>
              </div>
            </div>
          </div>

          {/* Cosmic rings */}
          <div className="absolute inset-0 flex items-center justify-center cosmic-ring-slow">
            <div className="w-80 h-80 border border-purple-300/10 rounded-full"></div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center" style={{ animation: "cosmic-ring-orbit 120s linear infinite" }}>
            <div className="w-96 h-96 border border-blue-300/8 rounded-full"></div>
          </div>

          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/40"></div>
        </div>

        {/* Glass morphism dialog content */}
        <div className="relative z-10 bg-black/20 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl">
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground z-10 text-white hover:text-cyan-300"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">{t('close', 'Close')}</span>
          </button>

          <DialogHeader className="mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 150 }}
              className="mb-4 flex justify-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500/30 to-cyan-500/30 backdrop-blur-xl rounded-2xl flex items-center justify-center border-2 border-white/40 shadow-lg shadow-purple-500/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-cyan-400/10 animate-pulse"></div>
                <Users className="w-8 h-8 text-white relative z-10" />
                <Sparkles className="absolute top-1 right-1 w-3 h-3 text-cyan-300 animate-pulse" />
                <Star className="absolute bottom-1 left-1 w-2 h-2 text-purple-300 animate-pulse" style={{ animationDelay: "1s" }} />
              </div>
            </motion.div>
            
            <DialogTitle 
              className="text-2xl font-bold text-center text-transparent bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300 bg-clip-text"
              style={{
                textShadow: "0 0 20px rgba(147, 197, 253, 0.5), 0 0 40px rgba(168, 85, 247, 0.3)",
                fontFamily: "monospace",
                imageRendering: "pixelated",
              }}
            >
              {initialGameCode ? t('joinGame', 'Join With QR') : t('joinGame', 'Join Game')}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-cyan-100 font-mono">{t('name', 'Name')}</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={t('name', 'Enter your name')} 
                        {...field} 
                        className="bg-black/30 border-cyan-400/30 text-white placeholder:text-cyan-200/60 backdrop-blur-sm focus:border-cyan-400 focus:ring-cyan-400/20 font-mono" 
                      />
                    </FormControl>
                    <FormMessage className="text-red-300" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gameCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-cyan-100 font-mono">{t('gameCode', 'Game Code')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('enterCode', 'Enter 6-digit code or paste join link')}
                        {...field}
                        onChange={(e) => {
                          const extractedCode = extractGameCodeFromUrl(e.target.value)
                          field.onChange(extractedCode)
                        }}
                        maxLength={200}
                        className="bg-black/30 border-cyan-400/30 text-white placeholder:text-cyan-200/60 backdrop-blur-sm focus:border-cyan-400 focus:ring-cyan-400/20 font-mono text-center text-lg tracking-widest"
                        readOnly={!!initialGameCode}
                      />
                    </FormControl>
                    <FormMessage className="text-red-300" />
                    {initialGameCode && <p className="text-sm text-green-400 mt-1 font-mono">✓ {t('gameCode', 'Game code use QR')}</p>}
                  </FormItem>
                )}
              />

              <div>
                <Label className="text-sm font-medium mb-3 block text-cyan-100 font-mono">{t('chooseAvatar', 'Choose Your Avatar')}</Label>
                <div className="grid grid-cols-4 gap-3 mb-3">
                  {ANIMAL_AVATARS.map((avatarUrl, index) => (
                    <motion.button
                      key={index}
                      type="button"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setSelectedAvatar(avatarUrl)}
                      className={`relative w-16 h-16 rounded-full overflow-hidden border-2 transition-all backdrop-blur-sm ${
                        selectedAvatar === avatarUrl
                          ? "border-cyan-400 ring-2 ring-cyan-400/30 shadow-lg shadow-cyan-400/20"
                          : "border-cyan-400/30 hover:border-cyan-400/60 hover:shadow-lg hover:shadow-cyan-400/10"
                      }`}
                    >
                      <img
                        src={avatarUrl || "/placeholder.svg"}
                        alt={`Animal ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {selectedAvatar === avatarUrl && (
                        <div className="absolute inset-0 bg-cyan-400/20 animate-pulse"></div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold py-3 rounded-xl shadow-lg shadow-cyan-500/30 border border-cyan-400/30 backdrop-blur-sm font-mono relative overflow-hidden"
                  style={{ imageRendering: "pixelated" }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/20 to-blue-400/20 animate-pulse"></div>
                  <span className="relative z-10">
                    {isLoading ? t('loading', 'Joining...') : t('joinGame', 'Join Game')}
                  </span>
                  <div className="absolute top-2 right-2 w-2 h-2 bg-yellow-300 rounded-full animate-ping"></div>
                </Button>
              </motion.div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
