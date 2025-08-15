import { Suspense } from "react"
import ResultContent from "./ResultContent"

export default function ResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-black text-white font-mono">
          <p>Loading result...</p>
        </div>
      }
      // komen
    >
      <ResultContent />
    </Suspense>
  )
}