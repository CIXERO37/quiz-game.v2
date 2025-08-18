"use client";

import { use } from "react";
import WaitContent from "./WaitContent";

export default function WaitPage({ params }: { params: Promise<{ gameCode: string }> }) {
  const { gameCode } = use(params);
  return <WaitContent gameCode={gameCode} />;
}