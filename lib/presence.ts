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
    await presenceChannel.untrack()
    await presenceChannel.unsubscribe()
    presenceChannel = null
  }
}
