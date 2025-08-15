import { Suspense } from "react"
import HostContent from "./HostContent"

export default function HostPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-black text-white font-mono">
          <p>Loading host dashboard...</p>
        </div>
      }
    >
      <HostContent />
    </Suspense>
  )
}