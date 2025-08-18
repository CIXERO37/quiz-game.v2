"use client";
import { Suspense, use } from "react";
import HostContent from "./HostContent";

export const dynamic = "force-dynamic";

export default function HostPage({ params }: { params: Promise<{ gameCode: string }> }) {
  const { gameCode } = use(params);
  return (
    <Suspense fallback={<p>Loading host dashboard…</p>}>
      <HostContent gameCode={gameCode} />
    </Suspense>
  );
}