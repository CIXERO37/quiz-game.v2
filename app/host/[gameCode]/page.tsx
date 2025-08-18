// app/host/[gameCode]/page.tsx
import { Suspense } from "react";
import HostContent from "./HostContent";

export const dynamic = "force-dynamic"; // ← tambahkan ini


export default function HostPage({ params }: { params: { gameCode: string } }) {
  return (
    <Suspense fallback={<p>Loading host dashboard…</p>}>
      <HostContent gameCode={params.gameCode} />
    </Suspense>
  );
}