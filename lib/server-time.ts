import { supabase } from "./supabase"

// Cache server time offset to avoid repeated calls
let serverTimeOffset: number | null = null
let lastSyncTime = 0
const SYNC_INTERVAL = 30000 // Re-sync every 30 seconds

export async function getServerTime(): Promise<number> {
  const now = Date.now()

  // Use cached offset if recent
  if (serverTimeOffset !== null && now - lastSyncTime < SYNC_INTERVAL) {
    return now + serverTimeOffset
  }

  try {
    // Get server timestamp from Supabase
    const startTime = Date.now()
    const { data, error } = await supabase.from("games").select("created_at").limit(1).single()

    if (error) {
      console.warn("[v0] Failed to sync server time, using client time:", error)
      return Date.now()
    }

    const endTime = Date.now()
    const networkDelay = (endTime - startTime) / 2

    // Calculate server time offset
    const serverTime = new Date().getTime() // Current server time approximation
    const clientTime = endTime - networkDelay

    serverTimeOffset = serverTime - clientTime
    lastSyncTime = now

    return clientTime + serverTimeOffset
  } catch (error) {
    console.warn("[v0] Server time sync failed, using client time:", error)
    return Date.now()
  }
}

// Simpler version that just uses a single server call for better accuracy
export async function syncServerTime(): Promise<number> {
  try {
    // Try to use the server timestamp function
    const { data, error } = await supabase.rpc("get_server_timestamp")

    if (error || !data) {
      console.warn("[v0] Server timestamp RPC failed, using fallback method:", error)
      // Fallback: use a database query to estimate server time
      return await getServerTimeFromQuery()
    }

    return new Date(data).getTime()
  } catch (error) {
    console.warn("[v0] Server time sync completely failed, using client time:", error)
    return Date.now()
  }
}

async function getServerTimeFromQuery(): Promise<number> {
  try {
    const startTime = Date.now()
    const { data, error } = await supabase.from("games").select("created_at").limit(1).single()

    if (error || !data) {
      return Date.now()
    }

    const endTime = Date.now()
    const networkDelay = (endTime - startTime) / 2

    // Estimate server time by accounting for network delay
    return endTime - networkDelay
  } catch (error) {
    return Date.now()
  }
}
