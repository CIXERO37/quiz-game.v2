// app/result/[gameCode]/page.tsx
import ResultContent from "./ResultContent";
import { Suspense } from "react";

interface PageProps {
  params: Promise<{ gameCode: string }>;
}

export default async function ResultPage({ params }: PageProps) {
  const { gameCode } = await params;   // <-- await di sini

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center font-mono text-white bg-black">
          <p>Loading result...</p>
        </div>
      }
    >
      <ResultContent gameCode={gameCode} />
    </Suspense>
  );
}