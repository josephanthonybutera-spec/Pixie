import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { compById } from "@/lib/catalog/companions";
import { AI_MODEL } from "@/lib/ai/model";
import { parseJson } from "@/lib/ai/parse";
import { THREAD_SYSTEM } from "@/lib/ai/prompts";

/** Route a thread message, server-side. The client sends the engine-owned
 *  trip state; the model only writes words and structured intents — it is
 *  told never to invent prices, waits, or availability, and every prepared
 *  change is re-priced by the engine on the client. Failures return non-200
 *  and the client falls back to the deterministic router. */
export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 });

  let body: { text?: unknown; state?: unknown; companionId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const { text, state, companionId } = body;
  if (typeof text !== "string" || !text.trim() || text.length > 4000) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (state == null || typeof state !== "object" || JSON.stringify(state).length > 20000) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 1000,
      system: THREAD_SYSTEM(state, compById(typeof companionId === "string" ? companionId : null)),
      messages: [{ role: "user", content: text }],
    });
    const raw = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");
    return NextResponse.json({ ok: true, result: parseJson(raw) });
  } catch (e) {
    console.warn("[api/thread] Claude call failed:", e);
    return NextResponse.json({ ok: false }, { status: 502 });
  }
}
