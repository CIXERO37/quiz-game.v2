import { Suspense } from "react"
import WaitContent from "./WaitContent"

export default function WaitPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-black text-white font-mono">
          <p>Loading waiting room...</p>
        </div>
      }
    >
      <WaitContent />
    </Suspense>
  )
}