import { Suspense } from "react"
import PlayContent from "./PlayContent"

export default function PlayPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-black text-white font-mono">
          <div className="bg-black/70 border-4 border-white p-6 rounded-lg">
            <p>Loading quiz...</p>
          </div>
        </div>
      }
    >
      <PlayContent />
    </Suspense>
  )
}