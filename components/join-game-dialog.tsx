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
import { X } from "lucide-react"
import { useGameStore } from "@/lib/store"
import { supabase } from "@/lib/supabase"
import { v4 as uuidv4 } from "uuid"

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
        form.setError("gameCode", { message: "Game not found or already started" })
        return
      }

      const playerId = uuidv4()
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
      <DialogContent className="max-w-md bg-white/95 backdrop-blur-lg border border-white/20">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground z-10"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {initialGameCode ? "Join With QR" : "Join Game"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your name" {...field} className="bg-white/80 border-gray-200" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gameCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Game Code</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter 6-digit code or paste join link"
                      {...field}
                      onChange={(e) => {
                        const extractedCode = extractGameCodeFromUrl(e.target.value)
                        field.onChange(extractedCode)
                      }}
                      maxLength={200} // Increased to allow full URLs to be pasted
                      className="bg-white/80 border-gray-200 font-mono text-center text-lg tracking-widest"
                      readOnly={!!initialGameCode}
                    />
                  </FormControl>
                  <FormMessage />
                  {initialGameCode && <p className="text-sm text-green-600 mt-1">✓ Game code use QR</p>}
                </FormItem>
              )}
            />

            <div>
              <Label className="text-sm font-medium mb-3 block">Choose Your Avatar</Label>
              <div className="grid grid-cols-4 gap-3 mb-3">
                {ANIMAL_AVATARS.map((avatarUrl, index) => (
                  <motion.button
                    key={index}
                    type="button"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSelectedAvatar(avatarUrl)}
                    className={`relative w-16 h-16 rounded-full overflow-hidden border-2 transition-all ${
                      selectedAvatar === avatarUrl
                        ? "border-purple-500 ring-2 ring-purple-200"
                        : "border-gray-200 hover:border-purple-300"
                    }`}
                  >
                    <img
                      src={avatarUrl || "/placeholder.svg"}
                      alt={`Animal ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </motion.button>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-xl shadow-lg"
            >
              {isLoading ? "Joining..." : "Join Game"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
