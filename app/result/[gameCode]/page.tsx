import ResultContent from "./ResultContent"; // Import dari folder yang sama
import { Suspense } from "react";

export default function ResultPage({ params }: { params: { gameCode: string } }) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-mono text-white bg-black"><p>Loading result...</p></div>}>
      <ResultContent gameCode={params.gameCode} />
    </Suspense>
  );
}