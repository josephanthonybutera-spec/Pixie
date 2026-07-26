import { ATTR } from "@/lib/catalog/attractions";
import { RESORTS } from "@/lib/catalog/resorts";
import { MONTHS, usd } from "@/lib/engine/format";
import type { Alloc, Profile } from "@/lib/engine/types";
import type { ThreadResult } from "./types";

export function fallbackParseBrief(text: string): Profile {
  const W: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
  const raw = text.toLowerCase();
  const t = raw.replace(/\b(one|two|three|four|five|six|seven|eight|nine|ten)\b/g, (w) => String(W[w]));
  // ages: explicit "X-year-old" OR an "ages 4, 7 and 9" list
  let kids = [...raw.matchAll(/(\d{1,2})[- ]?(?:year[- ]?old|yo|yr)/g)].map((m) => +m[1]).filter((n) => n < 18);
  const ageList = raw.match(/ages?\s+([\d,\sand]+)/);
  if (ageList) {
    const nums = ageList[1].split(/[^\d]+/).filter(Boolean).map(Number).filter((n) => n > 0 && n < 18);
    if (nums.length) kids = [...new Set([...kids, ...nums])];
  }
  const adults = (t.match(/(\d+)\s*adults?/) || [])[1];
  const fam = (t.match(/family of (\d+)/) || [])[1];
  const days = (t.match(/(\d+)\s*(?:park\s*)?days?/) || [])[1];
  const budget = (t.match(/\$\s?([\d,]+)/) || [])[1];
  const month = MONTHS.find((m) => t.includes(m));
  const p: Profile = {
    adults: adults ? +adults : fam ? Math.max(1, +fam - kids.length) : 2,
    kidAges: kids,
    parkDays: days ? Math.min(6, +days) : 4,
    month: month || null,
    budget: budget ? +budget.replace(/,/g, "") : 6500,
    pace: /relax|slow/.test(t) ? "relaxed" : /commando|pack/.test(t) ? "commando" : null,
    mustDos: [],
    characters: /princess|character|mickey/.test(t) ? true : null,
    starwars: /star wars|galaxy/.test(t),
    dining: /quick/.test(t) ? "quick" : null,
    skyliner: /skyliner/.test(t),
    assumptions: [],
  };
  if (p.starwars) p.mustDos!.push("Star Wars: Rise of the Resistance");
  if (/mine train|seven dwarfs/.test(t)) p.mustDos!.push("Seven Dwarfs Mine Train");
  const A: string[] = [];
  if (!p.pace) { p.pace = "balanced"; A.push("Balanced pace"); }
  if (!p.month) A.push("Travel month estimated");
  if (!p.dining) { p.dining = "mix"; A.push("Table + quick dining mix"); }
  if (p.characters === null) {
    p.characters = kids.some((k) => k <= 8);
    if (p.characters) A.push("Character meets on");
  }
  if (!budget) A.push("Budget $6,500 assumed");
  p.assumptions = A;
  return p;
}

export function fallbackRoute(text: string, ctx: { alloc: Alloc; profile: Profile }): ThreadResult {
  const t = text.toLowerCase();
  const out: ThreadResult = { reply: "", edits: [], prepared: null, human: false, tradeoffs: false };
  const day = +((t.match(/day\s*(\d)/) || [])[1] ?? NaN) || 1;
  if (/human|person|agent|someone real/.test(t)) { out.human = true; return out; }
  if (/save money|cheaper|cut cost|reduce/.test(t)) { out.tradeoffs = true; out.reply = "Here are the two cleanest ways to free up budget without touching the magic:"; return out; }
  if (/balance|total|cost|budget/.test(t)) { out.reply = `Your total is ${usd(ctx.alloc.target)} with ${usd(Math.max(0, ctx.alloc.buffer))} unallocated buffer — room ${usd(ctx.alloc.room)}, tickets ${usd(ctx.alloc.tickets)}, dining ${usd(ctx.alloc.diningCost)}.`; return out; }
  if (/window|60 day|dining open/.test(t)) { out.reply = `Your dining window opens ${ctx.alloc.dates.fmtDining} — we're staged for 5:40 a.m. ET that morning. Lightning Lane Multi Pass opens ${ctx.alloc.dates.fmtLL}.`; return out; }
  if (/hopper/.test(t)) { out.prepared = { kind: "park_hopper" }; return out; }
  const rm = t.match(/(?:remove|skip|drop)\s+([a-z' :—-]+)/);
  if (rm) {
    const hit = ATTR.find((a) => a.name.toLowerCase().includes(rm[1].trim().slice(0, 9)));
    if (hit) { out.edits!.push({ op: "remove", day, name: hit.name }); out.reply = "Done — that day is re-optimized without it."; return out; }
  }
  const ad = t.match(/add\s+([a-z' :—-]+?)(?:\s+to\b|$)/);
  if (ad) {
    const hit = ATTR.find((a) => a.name.toLowerCase().includes(ad[1].trim().slice(0, 9)));
    if (hit) { out.edits!.push({ op: "add", day, name: hit.name }); out.reply = "Added and re-sequenced."; return out; }
  }
  if (/relax|slower|too much|tired/.test(t)) { out.edits!.push({ op: "set_pace", day, pace: "relaxed" }); out.reply = `Day ${day} is now relaxed — fewer rides, longer break.`; return out; }
  const mv = t.match(/(?:move|switch|change).{0,20}(?:to|into)\s+([a-z' ]+)/);
  if (mv) {
    const r = RESORTS.find((x) => x.name.toLowerCase().includes(mv[1].trim().split(" ")[0]));
    if (r) { out.prepared = { kind: "resort_change", to: r.name }; return out; }
  }
  out.reply = "I can answer anything about your trip, edit the plan instantly, or prepare real changes — try “when does our dining window open?” or “move us to the Riviera.”";
  return out;
}
