/* ============================================================
   CLAUDE LAYER — browser side.
   STEP 3: the browser never talks to Anthropic and never sees the API
   key. It calls our own /api routes; a null return means "AI layer
   unavailable" and the caller falls back to the deterministic engine —
   the same fallback behavior the prototype had.
   ============================================================ */

import type { Profile } from "@/lib/engine/types";
import type { ThreadResult } from "./types";

export async function parseBriefViaServer(text: string): Promise<Profile | null> {
  try {
    const res = await fetch("/api/brief", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return (data?.profile as Profile) ?? null;
  } catch {
    return null;
  }
}

export async function routeThreadViaServer(text: string, state: unknown, companionId: string | null): Promise<ThreadResult | null> {
  try {
    const res = await fetch("/api/thread", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, state, companionId }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return (data?.result as ThreadResult) ?? null;
  } catch {
    return null;
  }
}
