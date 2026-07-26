/* ============================================================
   LIVE WAIT TIMES — Queue-Times.com (free, no key).
   Their license requires attribution — "Wait times by Queue-Times.com"
   is rendered in the app footer and Plan surface.

   Server-side only for the fetch (see app/api/wait-times/route.ts);
   the matching and scaling helpers are pure and unit-tested.
   ============================================================ */

import { ATTR, type Attraction } from "@/lib/catalog/attractions";
import type { ParkKey } from "@/lib/catalog/parks";

/** Queue-Times park ids for the four WDW parks, from
 *  https://queue-times.com/parks.json */
export const QT_PARK_IDS: Record<ParkKey, number> = { MK: 6, EP: 5, HS: 7, AK: 8 };

export const QT_ATTRIBUTION = "Wait times by Queue-Times.com";
export const QT_URL = "https://queue-times.com";

export interface QTRide {
  id: number;
  name: string;
  is_open: boolean;
  wait_time: number;
}

interface QTParkResponse {
  lands?: { id: number; name: string; rides?: QTRide[] }[];
  rides?: QTRide[];
}

export interface LiveWaitsPayload {
  /** catalog attraction id -> current standby wait in minutes (open rides only) */
  waits: Record<string, number>;
  /** Queue-Times ride names we could not match to the catalog, prefixed by park */
  unmatched: string[];
  fetchedAt: string;
  attribution: string;
}

/** Normalize a ride name for fuzzy matching: lowercase, straighten curly
 *  quotes, strip ™/®, diacritics, and punctuation. */
export const normalizeRideName = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[“”„]/g, '"')
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Match Queue-Times rides to our catalog for one park.
 *  Pass 1: exact normalized name. Pass 2: containment either way (handles
 *  "Rock 'n' Roller Coaster Starring Aerosmith" -> "Rock 'n' Roller
 *  Coaster", "Expedition Everest - Legend of the Forbidden Mountain" ->
 *  "Expedition Everest"). Each catalog ride is claimed at most once. */
export function matchParkWaits(park: ParkKey, liveRides: QTRide[]): { byId: Record<string, QTRide>; unmatched: string[] } {
  const cat = ATTR.filter((a) => a.park === park && a.type === "ride").map((a) => ({ a, n: normalizeRideName(a.name) }));
  const claimed = new Set<string>();
  const byId: Record<string, QTRide> = {};
  const unmatched: string[] = [];
  for (const ride of liveRides) {
    const n = normalizeRideName(ride.name);
    if (!n) continue;
    let hit = cat.find((c) => !claimed.has(c.a.id) && c.n === n);
    if (!hit)
      hit = cat.find(
        (c) => !claimed.has(c.a.id) && Math.min(c.n.length, n.length) >= 6 && (c.n.includes(n) || n.includes(c.n))
      );
    if (hit) {
      claimed.add(hit.a.id);
      byId[hit.a.id] = ride;
    } else {
      unmatched.push(ride.name);
    }
  }
  return { byId, unmatched };
}

/** Anchor a ride's editorial [rope drop, midday, evening] curve to a live
 *  "right now" wait: the live number becomes the midday level and the
 *  morning/evening points keep the ride's own day-shape. Pure. */
export function applyLiveWait(a: Attraction, liveMinutes: number): Attraction {
  if (a.type !== "ride" || a.wait[1] <= 0) return a;
  const scale = (x: number) => Math.max(5, Math.round((x / a.wait[1]) * liveMinutes));
  return { ...a, wait: [scale(a.wait[0]), Math.max(5, Math.round(liveMinutes)), scale(a.wait[2])] };
}

const CACHE_TTL_MS = 5 * 60 * 1000; // be a good citizen: 5-minute cache
let cache: { at: number; payload: LiveWaitsPayload } | null = null;

/** Fetch live waits for all four parks (server-side). Best-effort: parks
 *  that fail are skipped; returns null only when nothing was reachable so
 *  callers fall back to the catalog's editorial estimates. */
export async function fetchLiveWaits(): Promise<LiveWaitsPayload | null> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.payload;

  const results = await Promise.allSettled(
    (Object.entries(QT_PARK_IDS) as [ParkKey, number][]).map(async ([park, id]) => {
      const res = await fetch(`https://queue-times.com/parks/${id}/queue_times.json`, {
        next: { revalidate: 300 },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error(`queue-times ${park} -> ${res.status}`);
      const data = (await res.json()) as QTParkResponse;
      const rides = [...(data.lands || []).flatMap((l) => l.rides || []), ...(data.rides || [])];
      return { park, rides };
    })
  );

  const waits: Record<string, number> = {};
  const unmatched: string[] = [];
  let anyOk = false;
  for (const r of results) {
    if (r.status !== "fulfilled") {
      console.warn("[wait-times] park fetch failed:", r.reason);
      continue;
    }
    anyOk = true;
    const m = matchParkWaits(r.value.park, r.value.rides);
    for (const [attractionId, ride] of Object.entries(m.byId)) {
      if (ride.is_open) waits[attractionId] = ride.wait_time;
    }
    unmatched.push(...m.unmatched.map((n) => `${r.value.park}: ${n}`));
  }
  if (!anyOk) return null;

  if (unmatched.length) console.warn("[wait-times] unmatched Queue-Times rides:", unmatched.join(" | "));
  const payload: LiveWaitsPayload = {
    waits,
    unmatched,
    fetchedAt: new Date().toISOString(),
    attribution: QT_ATTRIBUTION,
  };
  cache = { at: Date.now(), payload };
  return payload;
}
