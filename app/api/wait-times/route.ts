import { NextResponse } from "next/server";
import { fetchLiveWaits } from "@/lib/wait-times";

/** Live standby waits keyed by catalog attraction id. Cached ~5 minutes
 *  (module cache + Next data cache + CDN s-maxage) so we never hammer
 *  Queue-Times. On total failure the client keeps the catalog estimates. */
export async function GET() {
  const payload = await fetchLiveWaits();
  if (!payload) return NextResponse.json({ ok: false }, { status: 502 });
  return NextResponse.json(
    { ok: true, ...payload },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
  );
}
