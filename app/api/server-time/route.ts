import { NextResponse } from "next/server"

export async function GET() {
  try {
    return NextResponse.json({
      timestamp: Date.now(),
      iso: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Server time API error:", error)
    return NextResponse.json({ error: "Failed to get server time" }, { status: 500 })
  }
}
