import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { AI_MODEL } from "@/lib/ai/model";
import { parseJson } from "@/lib/ai/parse";
import { BRIEF_SYSTEM } from "@/lib/ai/prompts";

/** Parse a family's free-text trip brief into a Profile, server-side.
 *  ANTHROPIC_API_KEY lives only in this process's env — it never reaches
 *  the client. Any failure returns a non-200 and the client falls back to
 *  the deterministic parser. The LLM only maps words to the catalog; the
 *  engine derives every number from the parsed inputs. */
export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 });

  let text: unknown;
  try {
    ({ text } = await request.json());
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (typeof text !== "string" || !text.trim() || text.length > 4000) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 1000,
      system: BRIEF_SYSTEM,
      messages: [{ role: "user", content: text }],
    });
    const raw = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");
    return NextResponse.json({ ok: true, profile: parseJson(raw) });
  } catch (e) {
    console.warn("[api/brief] Claude call failed:", e);
    return NextResponse.json({ ok: false }, { status: 502 });
  }
}
