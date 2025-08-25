import { supabase } from "./supabase"

let presenceChannel: any = null

export function getPresenceChannel() {
  if (!presenceChannel) {
    presenceChannel = supabase.channel("game-presence", {
      config: {
        presence: {
          key: "players",
        },
      },
    })
  }
  return presenceChannel
}

export function initializePresence(gameCode: string, playerData: { name: string; avatar: string }) {
  const channel = getPresenceChannel()

  channel.subscribe(async (status: string) => {
    if (status === "SUBSCRIBED") {
      await channel.track({
        gameCode,
        playerName: playerData.name,
        playerAvatar: playerData.avatar,
        online_at: new Date().toISOString(),
      })
    }
  })

  return channel
}

export async function cleanupPresence() {
  if (presenceChannel) {
    try {
      console.log("[v0] Cleaning up presence channel...")
      await presenceChannel.untrack()
      await presenceChannel.unsubscribe()
      presenceChannel = null
      console.log("[v0] Presence channel cleaned up successfully")
    } catch (error) {
      console.error("[v0] Error cleaning up presence channel:", error)
      // Force cleanup even if there's an error
      presenceChannel = null
    }
  }
}
