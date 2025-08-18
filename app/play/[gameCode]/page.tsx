"use client";

import { use } from "react";
import PlayContent from "./PlayContent";

export default function PlayPage({ params }: { params: Promise<{ gameCode: string }> }) {
  const { gameCode } = use(params);
  return <PlayContent gameCode={gameCode} />;
}