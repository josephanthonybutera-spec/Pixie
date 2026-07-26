/* ============================================================
   CLAUDE LAYER — brief parsing + thread routing (real, with fallbacks)
   STEP 1 NOTE: ported as-is from the prototype — the browser calls the
   Anthropic API directly and falls back to the deterministic engine when
   the call fails. STEP 3 moves this behind /app/api routes so the API key
   never reaches the client.
   ============================================================ */

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function askClaude(system: string, messages: ChatMessage[]): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, system, messages }),
  });
  const data = await res.json();
  if (!data || !data.content) throw new Error("no content");
  return data.content
    .filter((c: { type: string }) => c.type === "text")
    .map((c: { text: string }) => c.text)
    .join("\n");
}

export const parseJson = (t: string) => {
  const c = t.replace(/```json|```/g, "").trim();
  return JSON.parse(c.slice(c.indexOf("{"), c.lastIndexOf("}") + 1));
};
