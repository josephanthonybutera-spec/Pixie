import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Sparkles, Wand2, Clock, MapPin, Utensils, Star, Zap, Moon, Sun, Users,
  Calendar, MessageCircle, Check, CheckCircle2, Shield, Send, ChevronRight,
  Loader2, ArrowRight, X, RefreshCw, Baby, PartyPopper, AlertCircle, Phone,
  Mail, Ticket, Hotel, ListChecks, Eye, Radar, Target, Wallet, ChevronDown,
  Undo2, SkipForward, CloudRain, BellRing, UserCircle2, Landmark,
  Plus, Trash2, GripVertical, ChevronUp
} from "lucide-react";

/* ============================================================
   WAYMARK OS — the AI Operating System for Disney vacations
   v2: implements the CPO audit corrections (all five pillars).
   Real: Claude brief-parsing + thread routing, deterministic
   engine (itinerary + budget allocator + storm replan).
   Simulated: bookings/SMS/time (Demo Director compresses ~6
   weeks of OS life). Illustrative pricing & park data.
   ============================================================ */

const T = {
  night: "#0E0B1E", night2: "#171233", nightSoft: "#221B45",
  violet: "#7C5CFF", violetDeep: "#5B3FA8",
  gold: "#F5C542", goldSoft: "#FBE9B7", goldDeep: "#8A6D1B",
  paper: "#FAF7F1", paperEdge: "#EFE9DD", ink: "#221E33",
  dusk: "#9A94B8", duskDark: "#6E6890",
  green: "#3FB07F", greenBg: "#EDF7F1", red: "#E2574C",
  blue: "#4E8AC9",
};

const FONT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,440;9..144,600;9..144,700&family=Outfit:wght@300;400;500;600;700&display=swap');
.wm-display { font-family: 'Fraunces', Georgia, serif; }
.wm-body { font-family: 'Outfit', system-ui, sans-serif; }
@keyframes wmTwinkle { 0%,100%{opacity:.15} 50%{opacity:.9} }
@keyframes wmRise { from{opacity:0; transform:translateY(14px)} to{opacity:1; transform:translateY(0)} }
@keyframes wmPop { 0%{transform:scale(.6);opacity:0} 70%{transform:scale(1.08)} 100%{transform:scale(1);opacity:1} }
@keyframes wmPulse { 0%,100%{box-shadow:0 0 0 0 rgba(245,197,66,.35)} 50%{box-shadow:0 0 0 10px rgba(245,197,66,0)} }
@keyframes wmSlideRight { from{opacity:1; transform:translateX(0)} to{opacity:0; transform:translateX(90px)} }
@keyframes wmSpark { 0%{transform:translate(0,0) scale(1); opacity:1} 100%{transform:translate(var(--dx),var(--dy)) scale(.3); opacity:0} }
@keyframes wmTickUp { from{transform:translateY(8px); opacity:0} to{transform:translateY(0); opacity:1} }
.wm-rise { animation: wmRise .5s ease both; }
.wm-pop { animation: wmPop .35s ease both; }
.wm-pulse { animation: wmPulse 2.4s ease-in-out infinite; }
.wm-tick { animation: wmTickUp .4s ease both; }
@media (prefers-reduced-motion: reduce) {
  .wm-rise,.wm-pop,.wm-pulse,.wm-tick,[data-star],[data-spark],[data-chore]{ animation:none !important; }
}
`;

/* ---------- Park catalog (illustrative demo ground truth) ---------- */
const PARKS = {
  MK: { name: "Magic Kingdom", open: "9:00", night: "Happily Ever After (fireworks)", lands: ["Main Street", "Adventureland", "Frontierland", "Liberty Square", "Fantasyland", "Tomorrowland"] },
  EP: { name: "EPCOT", open: "9:00", night: "Luminous — The Symphony of Us", lands: ["World Celebration", "World Discovery", "World Nature", "World Showcase"] },
  HS: { name: "Hollywood Studios", open: "8:30", night: "Fantasmic!", lands: ["Hollywood Blvd", "Sunset Blvd", "Toy Story Land", "Galaxy's Edge", "Echo Lake"] },
  AK: { name: "Animal Kingdom", open: "8:00", night: null, lands: ["Discovery Island", "Pandora", "Africa", "Asia"] },
};

const ATTR = [
  { id: "7dmt", park: "MK", name: "Seven Dwarfs Mine Train", land: 4, type: "ride", h: 38, wait: [45, 85, 70], dur: 6, ll: "SP", kid: 5, thrill: 2, indoor: false },
  { id: "tron", park: "MK", name: "TRON Lightcycle / Run", land: 5, type: "ride", h: 48, wait: [50, 80, 65], dur: 5, ll: "SP", kid: 2, thrill: 5, indoor: true },
  { id: "space", park: "MK", name: "Space Mountain", land: 5, type: "ride", h: 44, wait: [35, 60, 45], dur: 6, ll: "MP", kid: 2, thrill: 4, indoor: true },
  { id: "btm", park: "MK", name: "Big Thunder Mountain Railroad", land: 2, type: "ride", h: 40, wait: [25, 50, 35], dur: 6, ll: "MP", kid: 3, thrill: 3, indoor: false },
  { id: "tiana", park: "MK", name: "Tiana's Bayou Adventure", land: 2, type: "ride", h: 40, wait: [40, 75, 55], dur: 11, ll: "MP", kid: 4, thrill: 3, indoor: false },
  { id: "pan", park: "MK", name: "Peter Pan's Flight", land: 4, type: "ride", h: 0, wait: [35, 60, 50], dur: 4, ll: "MP", kid: 5, thrill: 0, indoor: true },
  { id: "hm", park: "MK", name: "Haunted Mansion", land: 3, type: "ride", h: 0, wait: [20, 45, 35], dur: 8, ll: "MP", kid: 3, thrill: 1, indoor: true },
  { id: "potc", park: "MK", name: "Pirates of the Caribbean", land: 1, type: "ride", h: 0, wait: [15, 35, 25], dur: 9, ll: "MP", kid: 4, thrill: 1, indoor: true },
  { id: "jc", park: "MK", name: "Jungle Cruise", land: 1, type: "ride", h: 0, wait: [30, 60, 45], dur: 10, ll: "MP", kid: 4, thrill: 0, indoor: false },
  { id: "buzz", park: "MK", name: "Buzz Lightyear's Space Ranger Spin", land: 5, type: "ride", h: 0, wait: [15, 35, 25], dur: 5, ll: "MP", kid: 5, thrill: 0, indoor: true },
  { id: "iasw", park: "MK", name: "\u201Cit's a small world\u201D", land: 4, type: "ride", h: 0, wait: [10, 25, 20], dur: 11, ll: "MP", kid: 5, thrill: 0, indoor: true },
  { id: "pooh", park: "MK", name: "The Many Adventures of Winnie the Pooh", land: 4, type: "ride", h: 0, wait: [15, 35, 25], dur: 4, ll: "MP", kid: 5, thrill: 0, indoor: true },
  { id: "mickeymeet", park: "MK", name: "Meet Mickey at Town Square Theater", land: 0, type: "char", h: 0, wait: [20, 40, 30], dur: 10, ll: null, kid: 5, thrill: 0, indoor: true },
  { id: "princess", park: "MK", name: "Princess Fairytale Hall", land: 4, type: "char", h: 0, wait: [25, 45, 35], dur: 10, ll: null, kid: 5, thrill: 0, indoor: true },
  { id: "parade", park: "MK", name: "Festival of Fantasy Parade", land: 0, type: "show", h: 0, wait: [0, 0, 0], dur: 15, ll: null, kid: 5, thrill: 0, at: "15:00", indoor: false },
  { id: "gotg", park: "EP", name: "Guardians of the Galaxy: Cosmic Rewind", land: 1, type: "ride", h: 42, wait: [55, 90, 75], dur: 4, ll: "SP", kid: 2, thrill: 5, indoor: true },
  { id: "tt", park: "EP", name: "Test Track", land: 1, type: "ride", h: 40, wait: [40, 70, 55], dur: 5, ll: "MP", kid: 3, thrill: 4, indoor: false },
  { id: "frozen", park: "EP", name: "Frozen Ever After", land: 3, type: "ride", h: 0, wait: [40, 70, 55], dur: 5, ll: "MP", kid: 5, thrill: 0, indoor: true },
  { id: "remy", park: "EP", name: "Remy's Ratatouille Adventure", land: 3, type: "ride", h: 0, wait: [35, 65, 50], dur: 5, ll: "MP", kid: 5, thrill: 0, indoor: true },
  { id: "soarin", park: "EP", name: "Soarin' Around the World", land: 2, type: "ride", h: 40, wait: [25, 50, 40], dur: 6, ll: "MP", kid: 4, thrill: 1, indoor: true },
  { id: "sse", park: "EP", name: "Spaceship Earth", land: 0, type: "ride", h: 0, wait: [10, 25, 20], dur: 15, ll: "MP", kid: 3, thrill: 0, indoor: true },
  { id: "nemo", park: "EP", name: "The Seas with Nemo & Friends", land: 2, type: "ride", h: 0, wait: [5, 15, 10], dur: 5, ll: null, kid: 5, thrill: 0, indoor: true },
  { id: "turtle", park: "EP", name: "Turtle Talk with Crush", land: 2, type: "show", h: 0, wait: [10, 15, 10], dur: 15, ll: null, kid: 5, thrill: 0, indoor: true },
  { id: "rise", park: "HS", name: "Star Wars: Rise of the Resistance", land: 3, type: "ride", h: 40, wait: [60, 95, 80], dur: 18, ll: "SP", kid: 3, thrill: 4, indoor: true },
  { id: "falcon", park: "HS", name: "Millennium Falcon: Smugglers Run", land: 3, type: "ride", h: 38, wait: [30, 55, 45], dur: 5, ll: "MP", kid: 4, thrill: 3, indoor: true },
  { id: "slinky", park: "HS", name: "Slinky Dog Dash", land: 2, type: "ride", h: 38, wait: [50, 85, 70], dur: 2, ll: "MP", kid: 5, thrill: 3, indoor: false },
  { id: "tsm", park: "HS", name: "Toy Story Mania!", land: 2, type: "ride", h: 0, wait: [30, 55, 45], dur: 8, ll: "MP", kid: 5, thrill: 0, indoor: true },
  { id: "tot", park: "HS", name: "The Twilight Zone Tower of Terror", land: 1, type: "ride", h: 40, wait: [35, 65, 50], dur: 8, ll: "MP", kid: 2, thrill: 5, indoor: true },
  { id: "rnrc", park: "HS", name: "Rock 'n' Roller Coaster", land: 1, type: "ride", h: 48, wait: [40, 70, 55], dur: 2, ll: "MP", kid: 2, thrill: 5, indoor: true },
  { id: "mmrr", park: "HS", name: "Mickey & Minnie's Runaway Railway", land: 0, type: "ride", h: 0, wait: [35, 65, 50], dur: 5, ll: "MP", kid: 5, thrill: 1, indoor: true },
  { id: "frozensing", park: "HS", name: "Frozen Sing-Along Celebration", land: 4, type: "show", h: 0, wait: [0, 0, 0], dur: 30, ll: null, kid: 5, thrill: 0, at: "14:30", indoor: true },
  { id: "fop", park: "AK", name: "Avatar Flight of Passage", land: 1, type: "ride", h: 44, wait: [65, 95, 80], dur: 6, ll: "SP", kid: 3, thrill: 4, indoor: true },
  { id: "navi", park: "AK", name: "Na'vi River Journey", land: 1, type: "ride", h: 0, wait: [40, 70, 55], dur: 5, ll: "MP", kid: 5, thrill: 0, indoor: true },
  { id: "safari", park: "AK", name: "Kilimanjaro Safaris", land: 2, type: "ride", h: 0, wait: [30, 60, 40], dur: 22, ll: "MP", kid: 5, thrill: 0, indoor: false },
  { id: "everest", park: "AK", name: "Expedition Everest", land: 3, type: "ride", h: 44, wait: [25, 50, 40], dur: 4, ll: "MP", kid: 2, thrill: 4, indoor: false },
  { id: "kali", park: "AK", name: "Kali River Rapids", land: 3, type: "ride", h: 38, wait: [20, 45, 35], dur: 5, ll: "MP", kid: 4, thrill: 2, indoor: false },
  { id: "lionking", park: "AK", name: "Festival of the Lion King", land: 2, type: "show", h: 0, wait: [0, 0, 0], dur: 30, ll: null, kid: 5, thrill: 0, at: "13:00", indoor: true },
];

const DINING = [
  { id: "crt", park: "MK", name: "Cinderella's Royal Table", char: true, diff: 3, kid: 5 },
  { id: "bog", park: "MK", name: "Be Our Guest Restaurant", char: false, diff: 3, kid: 4 },
  { id: "crystal", park: "MK", name: "The Crystal Palace (character buffet)", char: true, diff: 2, kid: 5 },
  { id: "ltt", park: "MK", name: "Liberty Tree Tavern", char: false, diff: 1, kid: 3 },
  { id: "space220", park: "EP", name: "Space 220 Restaurant", char: false, diff: 3, kid: 3 },
  { id: "garden", park: "EP", name: "Garden Grill (character)", char: true, diff: 2, kid: 5 },
  { id: "akershus", park: "EP", name: "Akershus Royal Banquet Hall (princesses)", char: true, diff: 2, kid: 5 },
  { id: "oga", park: "HS", name: "Oga's Cantina", char: false, diff: 3, kid: 3 },
  { id: "scifi", park: "HS", name: "Sci-Fi Dine-In Theater", char: false, diff: 2, kid: 4 },
  { id: "50s", park: "HS", name: "50's Prime Time Caf\u00E9", char: false, diff: 2, kid: 4 },
  { id: "tusker", park: "AK", name: "Tusker House (character buffet)", char: true, diff: 2, kid: 5 },
  { id: "yak", park: "AK", name: "Yak & Yeti Restaurant", char: false, diff: 1, kid: 3 },
];

/* ---------- Resorts + illustrative pricing ---------- */
const RESORTS = [
  { id: "pop", name: "Pop Century", tier: "Value", night: 189, transport: "Skyliner", skyliner: true, note: "Skyliner to EPCOT + Hollywood Studios" },
  { id: "aoa", name: "Art of Animation", tier: "Value", night: 262, transport: "Skyliner", skyliner: true, note: "Family suites; Skyliner station shared with Pop" },
  { id: "cbr", name: "Caribbean Beach", tier: "Moderate", night: 284, transport: "Skyliner", skyliner: true, note: "Skyliner hub — two parks without a bus" },
  { id: "por", name: "Port Orleans Riverside", tier: "Moderate", night: 268, transport: "Bus + boat", skyliner: false, note: "Boat to Disney Springs" },
  { id: "coro", name: "Coronado Springs", tier: "Moderate", night: 256, transport: "Bus", skyliner: false, note: "Quietest moderate; great pool" },
  { id: "wl", name: "Wilderness Lodge", tier: "Deluxe", night: 462, transport: "Boat to MK", skyliner: false, note: "Boat to Magic Kingdom" },
  { id: "akl", name: "Animal Kingdom Lodge", tier: "Deluxe", night: 478, transport: "Bus", skyliner: false, note: "Savanna views from the room" },
  { id: "riv", name: "Riviera Resort", tier: "Deluxe", night: 524, transport: "Skyliner", skyliner: true, note: "Skyliner + rooftop fireworks views" },
  { id: "bc", name: "Beach Club", tier: "Deluxe", night: 562, transport: "Walk to EPCOT", skyliner: false, note: "Walk to EPCOT; best pool on property" },
  { id: "contemp", name: "Contemporary", tier: "Deluxe", night: 642, transport: "Walk to MK + monorail", skyliner: false, note: "Walk to Magic Kingdom" },
  { id: "poly", name: "Polynesian Village", tier: "Deluxe", night: 688, transport: "Monorail", skyliner: false, note: "Monorail loop; fireworks from the beach" },
];

const PRICE = {
  ticketAdultPerDay: 142, ticketKidPerDay: 131,
  dining: { table: { a: 78, k: 36 }, mix: { a: 56, k: 28 }, quick: { a: 38, k: 22 } },
};

/* ============================================================
   ENGINE — deterministic core (itinerary, budget, dates, storm)
   ============================================================ */
const ageToHeight = (age) => Math.min(60, Math.round(30 + age * 2.6));
const parseHM = (s) => { const [h, m] = s.split(":").map(Number); return h * 60 + m; };
const fmt = (mins) => { let h = Math.floor(mins / 60), m = mins % 60; const ap = h >= 12 ? "pm" : "am"; h = h % 12 || 12; return `${h}:${String(m).padStart(2, "0")} ${ap}`; };
const walkMins = (a, b) => 4 + Math.abs(a - b) * 4;
const usd = (n) => `$${Math.round(n).toLocaleString()}`;
const MONTHS = ["january","february","march","april","may","june","july","august","september","october","november","december"];

function deriveDates(monthStr, parkDays) {
  const now = new Date();
  let mi = MONTHS.findIndex((m) => (monthStr || "").toLowerCase().includes(m));
  let year = now.getFullYear();
  if (mi === -1) { const d = new Date(now.getTime() + 75 * 86400000); mi = d.getMonth(); year = d.getFullYear(); }
  else if (mi <= now.getMonth()) year += 1;
  const start = new Date(year, mi, 15);
  const nights = parkDays + 1;
  const end = new Date(start.getTime() + nights * 86400000);
  const dining = new Date(start.getTime() - 60 * 86400000);
  const ll = new Date(start.getTime() - 7 * 86400000);
  const fdate = (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const daysUntil = (d) => Math.max(0, Math.ceil((d - now) / 86400000));
  return { start, end, nights, fmtStart: fdate(start), fmtEnd: fdate(end), diningWindow: dining, fmtDining: fdate(dining), llWindow: ll, fmtLL: fdate(ll), daysToDining: daysUntil(dining), daysToTrip: daysUntil(start) };
}

function allocateBudget(profile) {
  const kids = (profile.kidAges || []).length;
  const adults = profile.adults || 2;
  const dates = deriveDates(profile.month, profile.parkDays || 4);
  const nights = dates.nights;
  const tickets = (adults * PRICE.ticketAdultPerDay + kids * PRICE.ticketKidPerDay) * (profile.parkDays || 4);
  const dRate = PRICE.dining[profile.dining || "mix"] || PRICE.dining.mix;
  const diningCost = (adults * dRate.a + kids * dRate.k) * ((profile.parkDays || 4) + 1);
  const target = profile.budget || 6500;
  const wantsSky = !!profile.skyliner;
  const pool = [...RESORTS].sort((a, b) => b.night - a.night);
  let resort = null;
  // pick the nicest resort whose total still leaves a small positive buffer (spend close to target)
  for (const r of pool) {
    if (wantsSky && !r.skyliner) continue;
    const room = r.night * nights;
    const buffer = target - (room + tickets + diningCost);
    if (buffer >= 0) { resort = r; break; }
  }
  if (!resort) resort = wantsSky ? [...RESORTS].filter((r) => r.skyliner).sort((a, b) => a.night - b.night)[0] : RESORTS[0];
  const room = resort.night * nights;
  const buffer = target - (room + tickets + diningCost);
  return { resort, room, tickets, diningCost, buffer, target, nights, dates };
}
function reallocate(profile, resortId) {
  const base = allocateBudget(profile);
  const resort = RESORTS.find((r) => r.id === resortId) || base.resort;
  const room = resort.night * base.nights;
  const buffer = base.target - (room + base.tickets + base.diningCost);
  return { ...base, resort, room, buffer };
}

function assignParks(profile) {
  const n = Math.max(1, Math.min(6, profile.parkDays || 4));
  const young = (profile.kidAges || []).some((a) => a <= 6);
  const seqs = { 1: ["MK"], 2: ["MK", "HS"], 3: young ? ["MK", "AK", "HS"] : ["MK", "HS", "EP"], 4: ["MK", "EP", "HS", "AK"], 5: ["MK", "HS", "EP", "AK", "MK"], 6: ["MK", "EP", "HS", "AK", "MK", "EP"] };
  let seq = seqs[n].slice();
  const need = new Set((profile.mustDos || []).map((nm) => (ATTR.find((a) => a.name === nm) || {}).park).filter(Boolean));
  need.forEach((p) => { if (!seq.includes(p)) seq[seq.length - 1] = p; });
  return seq;
}

function buildDay(parkKey, profile, ov = {}) {
  const park = PARKS[parkKey];
  const kidAges = profile.kidAges || [];
  const young = kidAges.some((a) => a <= 6);
  const minH = kidAges.length ? Math.min(...kidAges.map(ageToHeight)) : 99;
  const pace = ov.pace || profile.pace || "balanced";
  const rideTarget = pace === "commando" ? 9 : pace === "relaxed" ? 5 : 7;
  const exclude = new Set(ov.exclude || []);
  const include = new Set(ov.include || []);
  const must = new Set(profile.mustDos || []);

  const pool = ATTR.filter((a) => a.park === parkKey && !exclude.has(a.id));
  const prios = new Set(profile.priorities || []); // newest | classics | thrills | gentle | characters
  const scored = pool.map((a) => {
    const cannot = a.h > 0 && kidAges.length > 0 && minH < a.h;
    let s = 2 + a.kid * (young ? 1.1 : 0.4) + a.thrill * (young ? 0.15 : 0.7);
    // ride-priority intent (the 90%: seasoned guests with a specific mission this trip)
    const isNewHeadliner = a.ll === "SP"; // Single Pass = the newest, highest-demand attractions
    const isClassic = a.thrill <= 1 && a.kid >= 3 && !isNewHeadliner; // gentle, beloved, been-there-forever
    const isThrill = a.thrill >= 4;
    const isGentle = a.h === 0 && a.thrill <= 1;
    if (prios.has("newest") && isNewHeadliner) s += 5;
    if (prios.has("classics") && isClassic) s += 4;
    if (prios.has("thrills") && isThrill) s += 5;
    if (prios.has("gentle") && isGentle) s += 4;
    if (prios.has("thrills") && a.thrill <= 1) s -= 1.5; // thrill-seekers deprioritize slow rides
    if (prios.has("gentle") && a.thrill >= 4) s -= 3; // gentle crews skip the intense stuff
    if (must.has(a.name)) s += 6;
    if (include.has(a.id)) s += 8;
    if ((profile.characters || prios.has("characters")) && a.type === "char") s += 3;
    if (cannot) s -= young ? 3.5 : 0;
    return { ...a, s, cannot };
  });
  const rides = scored.filter((a) => a.type === "ride").sort((x, y) => y.s - x.s).slice(0, rideTarget + 2);
  const shows = scored.filter((a) => a.type === "show").sort((x, y) => y.s - x.s).slice(0, young ? 2 : 1);
  const chars = profile.characters ? scored.filter((a) => a.type === "char").sort((x, y) => y.s - x.s).slice(0, 1) : [];
  const byDelta = [...rides].sort((x, y) => (y.wait[1] - y.wait[0]) - (x.wait[1] - x.wait[0]));
  const rope = byDelta.slice(0, pace === "relaxed" ? 2 : 3);
  const rest = rides.filter((r) => !rope.includes(r));

  const items = [];
  let t = parseHM(park.open) - 30, lastLand = 0;
  const push = (it) => items.push({ tags: [], ...it });

  push({ type: "tip", time: t, name: "Early Theme Park Entry", note: "Resort guests get in 30 minutes early — the plan is built around it.", land: "", dur: 0 });
  rope.sort((a, b) => a.land - b.land || (b.wait[1] - b.wait[0]) - (a.wait[1] - a.wait[0]));
  rope.forEach((r) => {
    t += walkMins(lastLand, r.land); lastLand = r.land;
    const wait = Math.round(r.wait[0] * 0.55);
    push({ type: "ride", time: t, name: r.name, land: park.lands[r.land], dur: r.dur + wait, indoor: r.indoor, note: `Standby jumps from ~${r.wait[0]} to ~${r.wait[1]} min by midday — this is a rope-drop anchor.`, tags: r.cannot ? ["Rider Switch"] : [] });
    t += r.dur + wait + 5;
  });
  rest.splice(0, 2).sort((a, b) => Math.abs(a.land - lastLand) - Math.abs(b.land - lastLand)).forEach((r) => {
    t += walkMins(lastLand, r.land); lastLand = r.land;
    const wait = Math.round(((r.wait[0] + r.wait[1]) / 2) * 0.8);
    push({ type: "ride", time: t, name: r.name, land: park.lands[r.land], dur: r.dur + wait, indoor: r.indoor, note: `Clustered in ${park.lands[r.land]} to cut backtracking.`, tags: r.cannot ? ["Rider Switch"] : [] });
    t += r.dur + wait + 5;
  });

  const wantTable = (profile.dining || "mix") !== "quick";
  let lunch = null, dinner = null;
  if (wantTable) {
    const opts = DINING.filter((d) => d.park === parkKey).sort((a, b) => (b.kid * (young ? 1 : 0.4) + (profile.characters && b.char ? 3 : 0)) - (a.kid * (young ? 1 : 0.4) + (profile.characters && a.char ? 3 : 0)));
    lunch = opts[0]; dinner = opts.find((d) => d !== lunch) || opts[1];
  }
  t = Math.max(t, parseHM("11:45"));
  if (lunch) { push({ type: "meal", time: t, name: lunch.name, land: "Table service", dur: 65, indoor: true, note: lunch.diff >= 3 ? "Books out at the 60-day mark — staged for the second your window opens." : "Locked at your 60-day dining window.", tags: lunch.char ? ["Characters"] : [] }); t += 70; }
  else { push({ type: "meal", time: t, name: "Quick-service lunch", land: "Mobile order", dur: 40, indoor: true, note: "Mobile order 30 min ahead — skip the line entirely.", tags: [] }); t += 45; }

  if (young && pace !== "commando") { push({ type: "break", time: t, name: "Resort break — pool + nap", land: "Your resort", dur: 120, indoor: true, note: "The secret weapon. Everyone returns human for the evening.", tags: [] }); t += 130; }

  [...shows, ...chars].forEach((s) => {
    const at = s.at ? parseHM(s.at) : t; t = Math.max(t, at);
    push({ type: s.type === "char" ? "char" : "show", time: t, name: s.name, land: park.lands[s.land], dur: s.dur + 10, indoor: s.indoor !== false, note: s.type === "char" ? "Shortest character line of the day is mid-afternoon." : "A seat during the heat peak.", tags: [] });
    t += s.dur + 15;
  });
  rest.slice(0, 2).forEach((r) => {
    t += walkMins(lastLand, r.land); lastLand = r.land;
    const wait = r.ll ? 12 : Math.round(r.wait[1] * 0.7);
    push({ type: "ride", time: t, name: r.name, land: park.lands[r.land], dur: r.dur + wait, indoor: r.indoor, note: r.ll ? "Lightning Lane return window — walk on." : "Waits dip as dinner crowds form.", tags: r.cannot ? ["Rider Switch"] : [] });
    t += r.dur + wait + 5;
  });
  t = Math.max(t, parseHM("17:45"));
  if (dinner) { push({ type: "meal", time: t, name: dinner.name, land: "Table service", dur: 70, indoor: true, note: "Reserved at your 60-day window.", tags: dinner.char ? ["Characters"] : [] }); t += 75; }
  const headliner = rest.find((r) => r.ll === "SP") || rest[2];
  if (headliner) {
    t += walkMins(lastLand, headliner.land); lastLand = headliner.land;
    push({ type: "ride", time: t, name: headliner.name, land: park.lands[headliner.land], dur: headliner.dur + 15, indoor: headliner.indoor, note: headliner.ll === "SP" ? "Single Pass return — the headliner without the 90-minute line." : "Evening waits drop 30–40% after dinner.", tags: headliner.cannot ? ["Rider Switch"] : [] });
    t += headliner.dur + 20;
  }
  if (park.night) { t = Math.max(t, parseHM("20:45")); push({ type: "night", time: t, name: park.night, land: "Viewing spot staked 25 min early", dur: 20, indoor: false, note: "Every day ends on a high note — peak-end rule.", tags: [] }); }

  const mpPicks = rides.filter((r) => r.ll === "MP").sort((a, b) => b.wait[1] - a.wait[1]).slice(0, 3).map((r) => r.name);
  const sp = rides.find((r) => r.ll === "SP");
  return { park: parkKey, parkName: park.name, items, storm: false, ll: { mp: mpPicks, sp: sp ? sp.name : null } };
}

function buildItinerary(profile, overrides = {}) {
  return assignParks(profile).map((p, i) => { const ov = overrides[i] || {}; return buildDay(ov.park || p, profile, ov); });
}

/* Re-flow times sequentially after a manual reorder, preserving each item's duration
   and any fixed showtimes. Keeps the plan coherent when the guest drags things around. */
function reflowTimes(items) {
  const out = items.map((x) => ({ ...x }));
  let t = null;
  for (let i = 0; i < out.length; i++) {
    const it = out[i];
    if (it.type === "tip") { if (t == null) t = it.time; continue; }
    if (t == null) t = it.time;
    it.time = t;
    t += (it.dur || 30) + 5;
  }
  return out;
}
/* Build a plan item from a catalog attraction for manual "add" */
function makePlanItem(attr, park) {
  const midWait = attr.type === "ride" ? Math.round((attr.wait[0] + attr.wait[1]) / 2 * 0.8) : 0;
  return {
    type: attr.type === "char" ? "char" : attr.type === "show" ? "show" : "ride",
    time: parseHM("12:00"), name: attr.name, land: park.lands[attr.land] || "",
    dur: (attr.dur || 10) + midWait, indoor: attr.indoor, tags: ["Added by you"],
    note: "You added this one — I slotted it in and kept the day flowing.",
    _id: attr.id,
  };
}

/* Storm replan: pull outdoor items out of the 15:00–18:00 window, swap indoor forward */
function stormReplan(day) {
  const items = day.items.map((x) => ({ ...x, tags: [...(x.tags || [])] }));
  const inWindow = (x) => x.time >= parseHM("14:30") && x.time <= parseHM("18:00");
  const outdoorIdx = items.findIndex((x) => inWindow(x) && x.indoor === false && (x.type === "ride" || x.type === "show"));
  const morningIndoorIdx = items.findIndex((x) => x.time < parseHM("12:00") && x.indoor && x.type === "ride");
  if (outdoorIdx > -1 && morningIndoorIdx > -1) {
    const a = items[outdoorIdx], b = items[morningIndoorIdx];
    const ta = a.time, tb = b.time; const la = a.land, lb = b.land;
    items[outdoorIdx] = { ...b, time: ta, land: la === b.land ? b.land : b.land, tags: [...b.tags, "Moved — storm"], note: "Swapped indoors for the storm window. " + b.note };
    items[morningIndoorIdx] = { ...a, time: tb, tags: [...a.tags, "Moved — storm"], note: "Moved ahead of the 3 p.m. storm. " + a.note };
  }
  items.forEach((x) => { if (inWindow(x) && x.indoor) x.tags = [...new Set([...x.tags, "Storm-safe"])]; });
  return { ...day, items, storm: true };
}

/* Missions derived from the family, not from us */
function deriveMissions(profile, alloc) {
  const ms = [];
  const young = (profile.kidAges || []).some((a) => a <= 8);
  if (profile.characters && young) ms.push({ id: "crt", name: "Cinderella's Royal Table", why: "Princess dinner in the castle", window: alloc.dates.fmtDining, windowDays: alloc.dates.daysToDining, staged: "5:40 a.m. ET on window day", backups: ["Akershus (princesses)", "Crystal Palace"], status: "staged" });
  if ((profile.mustDos || []).includes("Star Wars: Rise of the Resistance") || profile.starwars) ms.push({ id: "oga", name: "Oga's Cantina", why: "Galaxy's Edge cantina table", window: alloc.dates.fmtDining, windowDays: alloc.dates.daysToDining, staged: "5:40 a.m. ET on window day", backups: ["Docking Bay 7 (walk-up)", "Evening slot scan"], status: "staged" });
  ms.push({ id: "llday1", name: "Lightning Lane Multi Pass — all days", why: "Pre-staged picks per park", window: alloc.dates.fmtLL, windowDays: Math.max(0, alloc.dates.daysToTrip - 7), staged: "7 days before check-in, at open", backups: ["Day-of refresh strategy"], status: "staged" });
  return ms.slice(0, 3);
}

/* ============================================================
   CLAUDE LAYER — brief parsing + thread routing (real, with fallbacks)
   ============================================================ */
async function askClaude(system, messages) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, system, messages }),
  });
  const data = await res.json();
  if (!data || !data.content) throw new Error("no content");
  return data.content.filter((c) => c.type === "text").map((c) => c.text).join("\n");
}
const parseJson = (t) => { const c = t.replace(/```json|```/g, "").trim(); return JSON.parse(c.slice(c.indexOf("{"), c.lastIndexOf("}") + 1)); };
const RIDE_NAMES = ATTR.filter((a) => a.type === "ride").map((a) => a.name).join("; ");
const RESORT_LIST = RESORTS.map((r) => `${r.name} (${r.tier}${r.skyliner ? ", Skyliner" : ""})`).join("; ");

const BRIEF_SYSTEM = `Parse a family's Disney World trip brief into JSON. Never invent facts. Ride names must come ONLY from: ${RIDE_NAMES}. Map loose references ("Star Wars ride" -> "Star Wars: Rise of the Resistance"; "the mine train" -> "Seven Dwarfs Mine Train").
Output ONLY: {"adults":int,"kidAges":int[],"parkDays":int(1-6),"month":string|null,"budget":int|null(USD total),"pace":"relaxed"|"balanced"|"commando"|null,"mustDos":string[],"characters":bool|null,"starwars":bool,"dining":"table"|"quick"|"mix"|null,"skyliner":bool,"assumptions":string[] (each thing you had to assume, short: e.g. "Balanced pace","June travel","Table+quick dining mix")}`;

function fallbackParseBrief(text) {
  const W = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
  const raw = text.toLowerCase();
  const t = raw.replace(/\b(one|two|three|four|five|six|seven|eight|nine|ten)\b/g, (w) => W[w]);
  // ages: explicit "X-year-old" OR an "ages 4, 7 and 9" list
  let kids = [...raw.matchAll(/(\d{1,2})[- ]?(?:year[- ]?old|yo|yr)/g)].map((m) => +m[1]).filter((n) => n < 18);
  const ageList = raw.match(/ages?\s+([\d,\sand]+)/);
  if (ageList) { const nums = ageList[1].split(/[^\d]+/).filter(Boolean).map(Number).filter((n) => n > 0 && n < 18); if (nums.length) kids = [...new Set([...kids, ...nums])]; }
  const adults = (t.match(/(\d+)\s*adults?/) || [])[1];
  const fam = (t.match(/family of (\d+)/) || [])[1];
  const days = (t.match(/(\d+)\s*(?:park\s*)?days?/) || [])[1];
  const budget = (t.match(/\$\s?([\d,]+)/) || [])[1];
  const month = MONTHS.find((m) => t.includes(m));
  const p = {
    adults: adults ? +adults : fam ? Math.max(1, +fam - kids.length) : 2,
    kidAges: kids, parkDays: days ? Math.min(6, +days) : 4, month: month || null,
    budget: budget ? +budget.replace(/,/g, "") : 6500,
    pace: /relax|slow/.test(t) ? "relaxed" : /commando|pack/.test(t) ? "commando" : null,
    mustDos: [], characters: /princess|character|mickey/.test(t) ? true : null,
    starwars: /star wars|galaxy/.test(t), dining: /quick/.test(t) ? "quick" : null,
    skyliner: /skyliner/.test(t), assumptions: [],
  };
  if (p.starwars) p.mustDos.push("Star Wars: Rise of the Resistance");
  if (/mine train|seven dwarfs/.test(t)) p.mustDos.push("Seven Dwarfs Mine Train");
  const A = [];
  if (!p.pace) { p.pace = "balanced"; A.push("Balanced pace"); }
  if (!p.month) A.push("Travel month estimated");
  if (!p.dining) { p.dining = "mix"; A.push("Table + quick dining mix"); }
  if (p.characters === null) { p.characters = kids.some((k) => k <= 8); if (p.characters) A.push("Character meets on"); }
  if (!budget) A.push("Budget $6,500 assumed");
  p.assumptions = A;
  return p;
}

const THREAD_SYSTEM = (state, companion) => `You ARE ${companion ? companion.name : "the family's"} — their family's personal Disney vacation companion (personality: ${companion ? companion.voice : "warm, expert"}). Speak in first person as ${companion ? companion.name : "their companion"}, warm and personal, like you know this family. Max 2 sentences. You NEVER invent prices, availability, wait times, or attractions — the engine owns numbers; you own words. Stay lightly in character but never break the actual facts in state.
LIVE TRIP STATE (ground truth — answer read questions ONLY from this): ${JSON.stringify(state)}
Catalog rides: ${RIDE_NAMES}. Resorts: ${RESORT_LIST}.
Lanes: (read) answer from state. (write-safe) plan edits via "edits". (write-real) anything touching money/real reservations via "prepared" intent — do NOT state a price; the engine prices it.
Respond ONLY JSON: {"reply":string, "edits":[{"op":"set_pace","day":n,"pace":..}|{"op":"remove","day":n,"name":exact}|{"op":"add","day":n,"name":exact}], "prepared":{"kind":"resort_change","to":resort name}|{"kind":"park_hopper"}|{"kind":"add_day"}|null, "human":bool (true only if they ask for a person), "tradeoffs":bool (true if they asked how to save money)}`;

function fallbackRoute(text, ctx) {
  const t = text.toLowerCase();
  const out = { reply: "", edits: [], prepared: null, human: false, tradeoffs: false };
  const day = +(t.match(/day\s*(\d)/) || [])[1] || 1;
  if (/human|person|agent|someone real/.test(t)) { out.human = true; return out; }
  if (/save money|cheaper|cut cost|reduce/.test(t)) { out.tradeoffs = true; out.reply = "Here are the two cleanest ways to free up budget without touching the magic:"; return out; }
  if (/balance|total|cost|budget/.test(t)) { out.reply = `Your total is ${usd(ctx.alloc.target)} with ${usd(Math.max(0, ctx.alloc.buffer))} unallocated buffer — room ${usd(ctx.alloc.room)}, tickets ${usd(ctx.alloc.tickets)}, dining ${usd(ctx.alloc.diningCost)}.`; return out; }
  if (/window|60 day|dining open/.test(t)) { out.reply = `Your dining window opens ${ctx.alloc.dates.fmtDining} — we're staged for 5:40 a.m. ET that morning. Lightning Lane Multi Pass opens ${ctx.alloc.dates.fmtLL}.`; return out; }
  if (/hopper/.test(t)) { out.prepared = { kind: "park_hopper" }; return out; }
  const rm = t.match(/(?:remove|skip|drop)\s+([a-z' :\u2014-]+)/); if (rm) { const hit = ATTR.find((a) => a.name.toLowerCase().includes(rm[1].trim().slice(0, 9))); if (hit) { out.edits.push({ op: "remove", day, name: hit.name }); out.reply = "Done — that day is re-optimized without it."; return out; } }
  const ad = t.match(/add\s+([a-z' :\u2014-]+?)(?:\s+to\b|$)/); if (ad) { const hit = ATTR.find((a) => a.name.toLowerCase().includes(ad[1].trim().slice(0, 9))); if (hit) { out.edits.push({ op: "add", day, name: hit.name }); out.reply = "Added and re-sequenced."; return out; } }
  if (/relax|slower|too much|tired/.test(t)) { out.edits.push({ op: "set_pace", day, pace: "relaxed" }); out.reply = `Day ${day} is now relaxed — fewer rides, longer break.`; return out; }
  const mv = t.match(/(?:move|switch|change).{0,20}(?:to|into)\s+([a-z' ]+)/); if (mv) { const r = RESORTS.find((x) => x.name.toLowerCase().includes(mv[1].trim().split(" ")[0])); if (r) { out.prepared = { kind: "resort_change", to: r.name }; return out; } }
  out.reply = "I can answer anything about your trip, edit the plan instantly, or prepare real changes — try \u201Cwhen does our dining window open?\u201D or \u201Cmove us to the Riviera.\u201D";
  return out;
}

/* ============================================================
   ATOMS
   ============================================================ */
const Stars = () => {
  const stars = useMemo(() => Array.from({ length: 40 }, (_, i) => ({ left: (i * 37) % 100, top: (i * 53) % 100, s: 1 + ((i * 7) % 3), d: 2 + ((i * 13) % 40) / 10, delay: ((i * 11) % 30) / 10 })), []);
  return <div className="absolute inset-0 overflow-hidden pointer-events-none">{stars.map((st, i) => (
    <div key={i} data-star className="absolute rounded-full" style={{ left: `${st.left}%`, top: `${st.top}%`, width: st.s, height: st.s, background: i % 6 === 0 ? T.gold : "#fff", animation: `wmTwinkle ${st.d}s ease-in-out ${st.delay}s infinite` }} />
  ))}</div>;
};
const Wordmark = ({ dark }) => (
  <div className="flex items-center gap-2">
    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: dark ? T.gold : T.violetDeep }}><Sparkles size={15} color={dark ? T.night : "#fff"} /></div>
    <span className="wm-display text-lg font-semibold tracking-tight" style={{ color: dark ? "#fff" : T.ink }}>Pixie</span>
  </div>
);
const Chip = ({ label, onClick, dark, gold }) => (
  <button onClick={onClick} className="wm-body px-3 py-1.5 rounded-full text-sm font-medium transition-transform hover:scale-105 active:scale-95"
    style={gold ? { background: T.gold, color: T.night } : dark ? { background: "rgba(124,92,255,.16)", color: "#CFC5FF", border: "1px solid rgba(124,92,255,.45)" } : { background: "#fff", color: T.violetDeep, border: `1px solid ${T.paperEdge}` }}>{label}</button>
);

/* The Status Bar — the OS heartbeat */
function StatusBar({ ledger, missions, watchers, nextLine, lastChecked }) {
  const secured = missions.filter((m) => m.status === "secured").length;
  const seg = (icon, text) => (
    <span className="inline-flex items-center gap-1 whitespace-nowrap">{icon}{text}</span>
  );
  return (
    <div className="px-4 py-2 text-xs font-medium flex gap-3 overflow-x-auto" style={{ background: T.night2, color: "#CFC5FF", borderBottom: `1px solid ${T.violetDeep}` }}>
      {seg(<Wallet size={12} color={T.gold} />, <span>Protected: <b style={{ color: T.gold }} className="wm-tick" key={ledger}>{usd(ledger)}</b></span>)}
      <span style={{ color: T.duskDark }}>·</span>
      {seg(<Target size={12} color={T.gold} />, <span>Missions: {secured} of {missions.length} secured</span>)}
      <span style={{ color: T.duskDark }}>·</span>
      {seg(<Radar size={12} color={T.gold} />, <span>Watching {watchers} things <span style={{ color: T.duskDark }}>(checked {lastChecked}m ago)</span></span>)}
      <span style={{ color: T.duskDark }}>·</span>
      {seg(<Calendar size={12} color={T.gold} />, <span>Next: {nextLine}</span>)}
    </div>
  );
}

function BudgetBar({ alloc }) {
  const segs = [
    { k: "Room", v: alloc.room, c: T.violetDeep },
    { k: "Tickets", v: alloc.tickets, c: "#8A6FE8" },
    { k: "Dining", v: alloc.diningCost, c: "#C2703D" },
    { k: "Buffer", v: Math.max(0, alloc.buffer), c: T.green },
  ];
  const total = segs.reduce((s, x) => s + x.v, 0) || 1;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1" style={{ color: T.duskDark }}>
        <span>Budget: <b style={{ color: T.ink }}>{usd(alloc.target)}</b></span>
        <span>{alloc.buffer >= 0 ? <span style={{ color: T.green }}>{usd(alloc.buffer)} buffer</span> : <span style={{ color: T.red }}>over by {usd(-alloc.buffer)}</span>}</span>
      </div>
      <div className="flex h-3 rounded-full overflow-hidden" style={{ background: T.paperEdge }}>
        {segs.map((s) => <div key={s.k} style={{ width: `${(s.v / total) * 100}%`, background: s.c }} />)}
      </div>
      <div className="flex gap-3 mt-1.5 flex-wrap">{segs.map((s) => (
        <span key={s.k} className="text-xs inline-flex items-center gap-1" style={{ color: T.duskDark }}>
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: s.c }} />{s.k} {usd(s.v)}
        </span>
      ))}</div>
    </div>
  );
}

/* ============================================================
   SURFACES — Thread, Plan, Pulse + overlays
   ============================================================ */
const ITEM_META = {
  ride: { icon: Zap, color: T.violetDeep }, meal: { icon: Utensils, color: "#C2703D" },
  break: { icon: Moon, color: T.blue }, show: { icon: Star, color: "#B0892B" },
  char: { icon: PartyPopper, color: "#C05B8E" }, night: { icon: Sparkles, color: T.violetDeep },
  tip: { icon: Sun, color: "#8A8F5A" },
};

/* ---- Thread message renderers ---- */
function Msg({ m, onAction, comp, memory }) {
  if (m.kind === "memory" && memory && comp) return (
    <div className="wm-rise"><MemoryCard memory={memory} comp={comp} /></div>
  );
  if (m.kind === "companion") {
    const c = comp || COMPANIONS[3];
    return (
      <div className="flex justify-start gap-2 wm-rise">
        <CompAvatar comp={c} size={30} />
        <div className="max-w-md px-4 py-2.5 rounded-2xl text-sm" style={{ background: "#fff", color: T.ink, border: `1px solid ${c.color}44`, borderBottomLeftRadius: 6 }}>
          {m.text}{m.receipt && <div className="mt-1 flex items-center gap-1 text-xs" style={{ color: c.color }}><RefreshCw size={11} /> {m.receipt}</div>}
        </div>
      </div>
    );
  }
  if (m.kind === "user") return (
    <div className="flex justify-end wm-rise"><div className="max-w-md px-4 py-2.5 rounded-2xl text-sm text-white" style={{ background: T.violet, borderBottomRightRadius: 6 }}>{m.text}</div></div>
  );
  if (m.kind === "sys") return (
    <div className="flex justify-start wm-rise"><div className="max-w-md px-4 py-2.5 rounded-2xl text-sm" style={{ background: "#fff", color: T.ink, border: `1px solid ${T.paperEdge}`, borderBottomLeftRadius: 6 }}>
      {m.text}{m.receipt && <div className="mt-1 flex items-center gap-1 text-xs" style={{ color: T.violetDeep }}><RefreshCw size={11} /> {m.receipt}</div>}
    </div></div>
  );
  if (m.kind === "human") return (
    <div className="flex justify-start wm-rise"><div className="max-w-md px-4 py-2.5 rounded-2xl text-sm" style={{ background: "#F3ECFB", color: T.ink, border: `1px solid ${T.violetDeep}`, borderBottomLeftRadius: 6 }}>
      <div className="flex items-center gap-1.5 text-xs font-semibold mb-1" style={{ color: T.violetDeep }}><UserCircle2 size={13} /> Ava · Pixie concierge</div>{m.text}
    </div></div>
  );
  const tier = m.kind; // act | win | brief
  const conf = tier === "act" ? { bar: T.gold, bg: "#FFFDF4", label: m.label || "Needs you", icon: BellRing }
    : tier === "win" ? { bar: T.green, bg: T.greenBg, label: m.label || "Good news", icon: CheckCircle2 }
    : { bar: T.duskDark, bg: "#fff", label: m.label || "While you slept", icon: Moon };
  const I = m.icon || conf.icon;
  return (
    <div className="wm-rise rounded-2xl overflow-hidden" style={{ border: `1px solid ${T.paperEdge}`, borderLeft: `4px solid ${conf.bar}`, background: conf.bg }}>
      <div className="px-4 py-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: conf.bar }}>{comp ? <CompAvatar comp={comp} size={16} /> : <I size={13} />} {conf.label}{m.sms && <span className="ml-auto normal-case font-normal" style={{ color: T.duskDark }}>· also sent by text</span>}</div>
        {m.title && <div className="wm-display font-semibold mt-1.5" style={{ color: T.ink }}>{m.title}</div>}
        {m.body && <div className="text-sm mt-1" style={{ color: "#57506E" }}>{m.body}</div>}
        {m.delta != null && <div className="wm-display text-2xl font-semibold mt-1" style={{ color: tier === "act" ? T.goldDeep : T.green }}>{m.delta >= 0 ? "" : "−"}{usd(Math.abs(m.delta))}{m.deltaSuffix || ""}</div>}
        {m.actions && m.actions.length > 0 && (
          <div className="flex gap-2 mt-3">{m.actions.map((a, i) => (
            <button key={i} onClick={() => onAction(m.id, a)} className="px-4 py-2 rounded-xl text-sm font-semibold transition-transform hover:scale-105 active:scale-95"
              style={a.primary ? { background: T.night, color: T.gold } : { background: "#fff", color: T.ink, border: `1px solid ${T.paperEdge}` }}>{a.label}</button>
          ))}</div>
        )}
        {m.resolved && <div className="mt-2 flex items-center gap-1.5 text-sm font-medium" style={{ color: T.green }}><Check size={14} /> {m.resolved}</div>}
      </div>
    </div>
  );
}

/* ---- The Reveal card (pinned NBA pre-autopilot) ---- */
function RevealCard({ profile, alloc, onAutopilot, onChip }) {
  return (
    <div className="wm-pop rounded-3xl overflow-hidden" style={{ background: `linear-gradient(165deg, ${T.night2}, ${T.night})`, border: `1px solid ${T.violetDeep}` }}>
      <div className="p-5">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase" style={{ color: T.gold }}><Wand2 size={13} /> Your trip, engineered</div>
        <div className="wm-display text-white text-2xl font-semibold mt-2 leading-snug">{alloc.resort.name} · {profile.parkDays} park days · {alloc.dates.fmtStart}–{alloc.dates.fmtEnd}</div>
        <div className="text-sm mt-1" style={{ color: T.dusk }}>{alloc.resort.tier} · {alloc.resort.note}</div>
        <div className="rounded-2xl p-3 mt-3" style={{ background: "rgba(255,255,255,.05)" }}><BudgetBarDark alloc={alloc} /></div>
        {profile.assumptions?.length > 0 && (
          <div className="mt-3">
            <div className="text-xs mb-1.5" style={{ color: T.duskDark }}>We assumed — tap to change:</div>
            <div className="flex flex-wrap gap-1.5">{profile.assumptions.map((a, i) => <Chip key={i} dark label={a} onClick={() => onChip(a)} />)}</div>
          </div>
        )}
        <button onClick={onAutopilot} className="wm-pulse w-full py-4 rounded-2xl font-semibold text-lg flex items-center justify-center gap-2 mt-4" style={{ background: T.gold, color: T.night }}>
          <Sparkles size={18} /> Book Now For Free
        </button>
        <div className="text-xs mt-3 space-y-1" style={{ color: T.dusk }}>
          <div className="flex items-center gap-1.5"><Check size={12} color={T.green} /> Every reservation stays in <b style={{ color: "#fff" }}>your own</b> Disney account — you're always in control</div>
          <div className="flex items-center gap-1.5"><Check size={12} color={T.green} /> Same price as booking direct — Disney pays Pixie the built-in commission</div>
          <div className="flex items-center gap-1.5"><Check size={12} color={T.green} /> Change anything, anytime, just by telling Pixie</div>
        </div>
      </div>
    </div>
  );
}
function BudgetBarDark({ alloc }) {
  const segs = [{ k: "Room", v: alloc.room, c: T.violet }, { k: "Tickets", v: alloc.tickets, c: "#A78BFA" }, { k: "Dining", v: alloc.diningCost, c: "#E0A268" }, { k: "Buffer", v: Math.max(0, alloc.buffer), c: T.green }];
  const total = segs.reduce((s, x) => s + x.v, 0) || 1;
  return (<div>
    <div className="flex justify-between text-xs mb-1"><span style={{ color: T.dusk }}>Allocated to your {usd(alloc.target)}</span><span style={{ color: alloc.buffer >= 0 ? T.green : T.red }}>{alloc.buffer >= 0 ? `${usd(alloc.buffer)} buffer` : `over ${usd(-alloc.buffer)}`}</span></div>
    <div className="flex h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,.12)" }}>{segs.map((s) => <div key={s.k} style={{ width: `${(s.v / total) * 100}%`, background: s.c }} />)}</div>
    <div className="flex gap-3 mt-1.5 flex-wrap">{segs.map((s) => <span key={s.k} className="text-xs inline-flex items-center gap-1" style={{ color: T.dusk }}><span className="w-2 h-2 rounded-full" style={{ background: s.c }} />{s.k} {usd(s.v)}</span>)}</div>
  </div>);
}

/* ---- Plan surface (editable) ---- */
function PlanSurface({ profile, itinerary, alloc, onItineraryChange }) {
  const [day, setDay] = useState(0);
  const [open, setOpen] = useState(null);
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const d = itinerary[day];
  const parkKey = d.park;
  const park = PARKS[parkKey];

  const commit = (newItems) => {
    const next = itinerary.map((dd, i) => (i === day ? { ...dd, items: newItems } : dd));
    onItineraryChange(next);
  };
  const move = (idx, dir) => {
    const items = [...d.items];
    const j = idx + dir;
    if (j < 0 || j >= items.length) return;
    [items[idx], items[j]] = [items[j], items[idx]];
    commit(reflowTimes(items));
  };
  const remove = (idx) => { commit(reflowTimes(d.items.filter((_, i) => i !== idx))); };
  const addAttr = (attr) => {
    const item = makePlanItem(attr, park);
    // insert near a sensible midpoint, then reflow
    const items = [...d.items];
    const insertAt = Math.min(items.length, Math.max(1, Math.floor(items.length / 2)));
    items.splice(insertAt, 0, item);
    commit(reflowTimes(items));
    setAdding(false);
  };

  const presentIds = new Set(d.items.map((x) => x.name));
  const addable = ATTR.filter((a) => a.park === parkKey && !presentIds.has(a.name) && (a.type === "ride" || a.type === "show" || a.type === "char"));

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="rounded-2xl p-4 mb-4" style={{ background: "#fff", border: `1px solid ${T.paperEdge}` }}><BudgetBar alloc={alloc} /></div>
      <div className="flex gap-2 overflow-x-auto pb-1">{itinerary.map((dd, i) => (
        <button key={i} onClick={() => { setDay(i); setEditing(false); setAdding(false); }} className="px-3.5 py-2 rounded-xl text-sm font-semibold whitespace-nowrap"
          style={i === day ? { background: T.violetDeep, color: "#fff" } : { background: "#fff", color: T.ink, border: `1px solid ${T.paperEdge}` }}>
          Day {i + 1} · {dd.parkName}{dd.storm ? " ⛈" : ""}
        </button>))}
      </div>

      {/* edit toolbar */}
      <div className="flex items-center justify-between mt-4 mb-1">
        <div className="text-sm font-semibold" style={{ color: T.ink }}>{editing ? "Reorder, remove, or add — it's your plan" : `Day ${day + 1} · ${park.name}`}</div>
        <div className="flex items-center gap-2">
          {editing && <button onClick={() => setAdding((v) => !v)} className="text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1" style={{ background: adding ? T.violetDeep : "#fff", color: adding ? "#fff" : T.violetDeep, border: `1px solid ${T.violetDeep}` }}><Plus size={13} /> Add</button>}
          <button onClick={() => { setEditing((v) => !v); setAdding(false); setOpen(null); }} className="text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1"
            style={editing ? { background: T.gold, color: T.night } : { background: "#fff", color: T.ink, border: `1px solid ${T.paperEdge}` }}>
            {editing ? <><Check size={13} /> Done</> : <><GripVertical size={13} /> Edit plan</>}
          </button>
        </div>
      </div>

      {/* add picker */}
      {adding && (
        <div className="rounded-2xl p-3 mb-3 wm-rise" style={{ background: "#fff", border: `1px solid ${T.violetDeep}` }}>
          <div className="text-xs font-semibold mb-2" style={{ color: T.duskDark }}>Add to {park.name} — tap to drop it in</div>
          <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
            {addable.map((a) => (
              <button key={a.id} onClick={() => addAttr(a)} className="text-xs px-2.5 py-1.5 rounded-full flex items-center gap-1 transition-transform active:scale-95" style={{ background: "#F3ECFB", color: T.violetDeep }}>
                <Plus size={11} /> {a.name}{a.ll === "SP" && <span className="ml-0.5 px-1 rounded" style={{ background: T.goldSoft, color: T.goldDeep, fontSize: 9 }}>NEW</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="relative">
        {!editing && <div className="absolute left-4 top-2 bottom-2 w-px" style={{ background: T.paperEdge }} />}
        <div className="space-y-2.5">{d.items.map((it, i) => {
          const M = ITEM_META[it.type] || ITEM_META.ride; const key = `${day}-${i}`;
          const isFirst = i === 0, isLast = i === d.items.length - 1;
          return (
            <div key={key} className={`relative wm-rise ${editing ? "pl-0" : "pl-12"}`} style={{ animationDelay: `${Math.min(i * 0.03, 0.3)}s` }}>
              {!editing && <div className="absolute left-0 top-1.5 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#fff", border: `2px solid ${M.color}` }}><M.icon size={14} color={M.color} /></div>}
              <div className="rounded-2xl p-3.5 flex items-start gap-2" style={{ background: "#fff", border: `1px solid ${it.tags?.includes("Added by you") ? T.violetDeep : T.paperEdge}` }}>
                {editing && (
                  <div className="flex flex-col items-center gap-0.5 pt-0.5">
                    <button onClick={() => move(i, -1)} disabled={isFirst} className="p-1 rounded-md disabled:opacity-25" style={{ background: "#F3ECFB" }}><ChevronUp size={14} color={T.violetDeep} /></button>
                    <button onClick={() => move(i, 1)} disabled={isLast} className="p-1 rounded-md disabled:opacity-25" style={{ background: "#F3ECFB" }}><ChevronDown size={14} color={T.violetDeep} /></button>
                  </div>
                )}
                <button onClick={() => !editing && setOpen(open === key ? null : key)} className="flex-1 text-left min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="font-semibold text-sm" style={{ color: T.ink }}>{it.name}</div>
                    <div className="text-sm font-semibold tabular-nums" style={{ color: T.violetDeep }}>{fmt(it.time)}</div>
                  </div>
                  <div className="text-xs mt-0.5 flex items-center gap-2 flex-wrap" style={{ color: T.duskDark }}>
                    {it.land}{it.dur ? ` · ~${it.dur} min` : ""}
                    {(it.tags || []).map((tg) => <span key={tg} className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: /torm/.test(tg) ? "#E8F1FA" : tg.includes("Added") ? "#EAF5EF" : "#F3ECFB", color: /torm/.test(tg) ? T.blue : tg.includes("Added") ? T.green : T.violetDeep }}>{tg}</span>)}
                    {!editing && <span className="ml-auto inline-flex items-center gap-0.5" style={{ color: T.duskDark }}>why <ChevronDown size={12} style={{ transform: open === key ? "rotate(180deg)" : "none" }} /></span>}
                  </div>
                  {open === key && !editing && <div className="text-sm mt-2 pt-2 wm-rise" style={{ color: "#57506E", borderTop: `1px dashed ${T.paperEdge}` }}><span className="font-semibold" style={{ color: T.violetDeep }}>Pixie's math: </span>{it.note}</div>}
                </button>
                {editing && it.type !== "tip" && (
                  <button onClick={() => remove(i)} className="p-1.5 rounded-lg self-center" style={{ background: "#FBEDED" }}><Trash2 size={14} color={T.red} /></button>
                )}
              </div>
            </div>
          );
        })}</div>
      </div>

      {editing && (
        <div className="mt-3 rounded-xl p-3 text-xs flex items-center gap-2" style={{ background: "#F3ECFB", color: T.violetDeep }}>
          <Sparkles size={13} /> Times re-flow automatically as you reorder. Pixie keeps your Lightning Lane and dining strategy in sync when you're done.
        </div>
      )}

      {!editing && (
        <div className="rounded-2xl p-4 mt-4" style={{ background: "#fff", border: `1px solid ${T.paperEdge}` }}>
          <div className="flex items-center gap-2 font-semibold text-sm" style={{ color: T.ink }}><Zap size={15} color={T.gold} /> Day {day + 1} Lightning Lane plan</div>
          <div className="mt-2 space-y-1.5">
            {d.ll.mp.map((n, i) => <div key={i} className="flex items-center gap-2 text-sm" style={{ color: "#57506E" }}><span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "#F3ECFB", color: T.violetDeep }}>{i + 1}</span>{n}<span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: "#F3ECFB", color: T.violetDeep }}>Multi Pass</span></div>)}
            {d.ll.sp && <div className="flex items-center gap-2 text-sm" style={{ color: "#57506E" }}><span className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: T.goldSoft }}><Star size={11} color={T.goldDeep} /></span>{d.ll.sp}<span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: T.goldSoft, color: T.goldDeep }}>Single Pass</span></div>}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---- Pulse surface ---- */
function PulseSurface({ missions, watchers, ledger, ledgerLog, vault, autopilot, memory, comp }) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      {memory && comp && <MemoryCard memory={memory} comp={comp} />}
      <div className="rounded-2xl p-4" style={{ background: `linear-gradient(160deg, ${T.night2}, ${T.night})`, border: `1px solid ${T.violetDeep}` }}>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest" style={{ color: T.gold }}><Wallet size={13} /> Savings Ledger</div>
        <div className="wm-display text-4xl font-semibold mt-1 wm-tick" key={ledger} style={{ color: T.gold }}>{usd(ledger)}</div>
        <div className="text-xs" style={{ color: T.dusk }}>protected so far · only goes up</div>
        {ledgerLog.length > 0 && <div className="mt-2 space-y-1">{ledgerLog.map((l, i) => <div key={i} className="text-xs flex justify-between" style={{ color: "#CFC5FF" }}><span>{l.what}</span><span style={{ color: T.gold }}>+{usd(l.amt)}</span></div>)}</div>}
      </div>

      <div>
        <div className="flex items-center gap-2 font-semibold text-sm mb-2" style={{ color: T.ink }}><Target size={15} color={T.violetDeep} /> Missions</div>
        <div className="space-y-2.5">{missions.map((m) => {
          const st = m.status;
          const stConf = st === "secured" ? { c: T.green, bg: T.greenBg, label: "SECURED" } : st === "hunting" ? { c: "#B0892B", bg: "#FFF9E8", label: "HUNTING — scanning daily" } : st === "attempting" ? { c: T.violetDeep, bg: "#F3ECFB", label: "AT THE WINDOW NOW" } : { c: T.blue, bg: "#EFF5FB", label: `STAGED · window ${m.window}` };
          return (
            <div key={m.id} className="rounded-2xl p-4" style={{ background: "#fff", border: `1px solid ${T.paperEdge}`, borderLeft: `4px solid ${stConf.c}` }}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold text-sm" style={{ color: T.ink }}>{m.name}</div>
                  <div className="text-xs" style={{ color: T.duskDark }}>{m.why}</div>
                </div>
                <span className="text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap" style={{ background: stConf.bg, color: stConf.c }}>{stConf.label}</span>
              </div>
              <div className="text-xs mt-2" style={{ color: "#57506E" }}>
                {st === "secured" ? <span className="inline-flex items-center gap-1"><CheckCircle2 size={12} color={T.green} /> {m.securedNote}</span>
                  : <>Our plan: staged {m.staged} · backups: {m.backups.join(", ")}{st === "hunting" && " · cancellations resurface constantly — we catch reopenings"}</>}
              </div>
            </div>
          );
        })}</div>
      </div>

      <div>
        <div className="flex items-center gap-2 font-semibold text-sm mb-2" style={{ color: T.ink }}><Radar size={15} color={T.violetDeep} /> Watching for you</div>
        <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${T.paperEdge}` }}>
          {watchers.map((w, i) => (
            <div key={w.name} className="px-4 py-2.5 flex items-center justify-between text-sm" style={{ background: i % 2 ? "#fff" : "#FBF8F2", borderTop: i ? `1px solid ${T.paperEdge}` : "none" }}>
              <span className="flex items-center gap-2" style={{ color: T.ink }}><w.icon size={14} color={T.violetDeep} />{w.name}</span>
              <span className="text-xs" style={{ color: T.duskDark }}>{w.state} · checked {w.mins}m ago</span>
            </div>
          ))}
        </div>
      </div>

      {autopilot && vault.length > 0 && (
        <div>
          <div className="flex items-center gap-2 font-semibold text-sm mb-2" style={{ color: T.ink }}><Landmark size={15} color={T.violetDeep} /> Reservation vault — yours, always</div>
          <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${T.paperEdge}` }}>
            {vault.map((v, i) => (
              <div key={i} className="px-4 py-2.5 flex items-center justify-between text-sm" style={{ background: i % 2 ? "#fff" : "#FBF8F2", borderTop: i ? `1px solid ${T.paperEdge}` : "none" }}>
                <span style={{ color: T.ink }}>{v.name}</span>
                <span className="text-xs font-mono" style={{ color: v.conf ? T.green : T.duskDark }}>{v.conf || "pending window"}</span>
              </div>
            ))}
          </div>
          <p className="text-xs mt-2" style={{ color: T.duskDark }}>Every confirmation lives in your own Disney account. Say the word in the Thread to change any of it.</p>
        </div>
      )}
    </div>
  );
}

/* ---- Handoff overlay (13 → 0) ---- */
const CHORES = ["Book the resort room", "Buy park tickets", "Set the 60-day dining alarm", "Chase Cinderella's Royal Table", "Back-up dining plan", "Stage Lightning Lane picks", "Book Multi Pass at 7 days", "Watch for room discounts", "Watch for ticket promos", "Track ride refurbishments", "Watch the weather window", "Re-plan if anything breaks", "Confirm everything twice"];
function HandoffOverlay({ onDone }) {
  const [moved, setMoved] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setMoved((m) => { if (m >= CHORES.length) { clearInterval(iv); setTimeout(onDone, 1100); return m; } return m + 1; }), 160);
    return () => clearInterval(iv);
  }, [onDone]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(14,11,30,.92)", backdropFilter: "blur(6px)" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-5">
          <div className="wm-display text-white text-2xl font-semibold">The Handoff</div>
          <div className="text-sm mt-1" style={{ color: T.dusk }}>You had <b style={{ color: "#fff" }}>13</b> things to do. You now have <b className="wm-tick" key={moved} style={{ color: T.gold }}>{Math.max(0, 13 - moved)}</b>.</div>
        </div>
        <div className="space-y-1.5">{CHORES.map((c, i) => (
          <div key={c} data-chore className="px-3 py-2 rounded-xl text-sm flex items-center gap-2"
            style={{ background: i < moved ? "rgba(63,176,127,.12)" : "rgba(255,255,255,.06)", color: i < moved ? T.green : "#EDEAF7", border: `1px solid ${i < moved ? "rgba(63,176,127,.4)" : "rgba(255,255,255,.1)"}`, transition: "all .3s ease" }}>
            {i < moved ? <Check size={14} /> : <Clock size={14} color={T.dusk} />} {c} {i < moved && <span className="ml-auto text-xs" style={{ color: T.green }}>→ Pixie</span>}
          </div>
        ))}</div>
        {moved >= CHORES.length && <div className="text-center mt-5 wm-pop"><div className="wm-display text-xl font-semibold" style={{ color: T.gold }}>We're on it.</div></div>}
      </div>
    </div>
  );
}

/* ---- SECURED ceremony ---- */
function SecuredOverlay({ mission, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2600); return () => clearTimeout(t); }, [onDone]);
  const sparks = useMemo(() => Array.from({ length: 16 }, (_, i) => ({ dx: Math.cos((i / 16) * Math.PI * 2) * 120, dy: Math.sin((i / 16) * Math.PI * 2) * 120, delay: (i % 4) * 0.05 })), []);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(14,11,30,.92)" }}>
      <div className="relative text-center px-6">
        {sparks.map((s, i) => <div key={i} data-spark className="absolute left-1/2 top-8 w-2 h-2 rounded-full" style={{ background: i % 3 ? T.gold : "#fff", "--dx": `${s.dx}px`, "--dy": `${s.dy}px`, animation: `wmSpark .9s ease-out ${s.delay}s both` }} />)}
        <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center wm-pop" style={{ background: T.gold }}><CheckCircle2 size={30} color={T.night} /></div>
        <div className="wm-display text-white text-3xl font-semibold mt-5 wm-rise">{mission.name}</div>
        <div className="wm-display text-2xl font-semibold mt-1 wm-rise" style={{ color: T.gold, animationDelay: ".1s" }}>SECURED</div>
        <div className="text-sm mt-2 wm-rise" style={{ color: T.dusk, animationDelay: ".2s" }}>{mission.securedNote}</div>
      </div>
    </div>
  );
}

/* ============================================================
   LANDING — repositioned against DIY chaos, not agents
   ============================================================ */
function Landing({ onSSO }) {
  return (
    <div className="min-h-screen relative wm-body" style={{ background: `radial-gradient(1200px 700px at 50% -10%, ${T.nightSoft}, ${T.night})` }}>
      <Stars />
      <div className="relative max-w-3xl mx-auto px-6 pt-8 pb-16">
        <Wordmark dark />
        <div className="mt-16 sm:mt-24 text-center wm-rise">
          <p className="text-sm font-medium tracking-widest uppercase" style={{ color: T.gold }}>Meet Pixie · your family's Disney companion</p>
          <h1 className="wm-display font-semibold mt-4 leading-tight text-white" style={{ fontSize: "clamp(2.1rem, 5.5vw, 3.6rem)" }}>
            Planning Disney takes 40 tabs,<br />three spreadsheets, and a 6 a.m. alarm.
          </h1>
          <h1 className="wm-display font-semibold mt-2" style={{ fontSize: "clamp(2.1rem, 5.5vw, 3.6rem)", color: T.gold }}>Or Pixie, who knows your family.</h1>
          <p className="mt-5 text-base max-w-xl mx-auto" style={{ color: T.dusk }}>
            Pixie learns your family, remembers everything, and quietly makes the magic happen — before, during, and after your trip. Not an app you use. A companion who plans it with you.
          </p>
        </div>
        <div className="mt-10 max-w-sm mx-auto wm-rise" style={{ animationDelay: ".15s" }}>
          <button onClick={() => onSSO("google")} className="w-full py-3.5 rounded-2xl font-semibold flex items-center justify-center gap-2.5 transition-transform hover:scale-105 active:scale-95" style={{ background: "#fff", color: "#1F2937" }}>
            <GoogleGlyph /> Continue with Google
          </button>
          <button onClick={() => onSSO("apple")} className="mt-2.5 w-full py-3.5 rounded-2xl font-semibold flex items-center justify-center gap-2.5 transition-transform hover:scale-105 active:scale-95" style={{ background: "#000", color: "#fff", border: "1px solid rgba(255,255,255,.2)" }}>
            <AppleGlyph /> Continue with Apple
          </button>
          <p className="text-center text-xs mt-3" style={{ color: T.duskDark }}>Free to meet Pixie and build your whole trip. No card, ever, to plan.</p>
        </div>

        <div className="mt-14 grid sm:grid-cols-3 gap-4">
          {[
            { icon: Sparkles, h: "Pixie knows your family", p: "Names, ages, who loves princesses, who lives for Star Wars — Pixie remembers it all and gets smarter every trip." },
            { icon: Zap, h: "Minutes, not weekends", p: "One sentence to Pixie and your whole trip appears — resort, budget, itinerary, dining, Lightning Lanes." },
            { icon: Radar, h: "Pixie never sleeps", p: "Discounts, dining drops, storms, refurbs — watched around the clock so your family never misses a thing." },
          ].map((f, i) => (
            <div key={i} className="rounded-2xl p-5 wm-rise" style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", animationDelay: `${0.2 + 0.12 * i}s` }}>
              <f.icon size={20} color={T.gold} />
              <div className="wm-display text-white font-semibold mt-3">{f.h}</div>
              <p className="text-sm mt-1" style={{ color: T.dusk }}>{f.p}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl p-5 text-sm" style={{ background: "rgba(124,92,255,.08)", border: `1px solid ${T.violetDeep}`, color: T.dusk }}>
          <b style={{ color: "#fff" }}>9 in 10 families plan Disney themselves</b> — across YouTube, Reddit, blogs, and Disney's own app. Pixie was built for them. Disney's app is where you tap. <span style={{ color: T.gold }}>Pixie is what tells you when, what, and why — then watches all of it.</span>
        </div>
        <div className="mt-4 rounded-2xl p-5 text-sm" style={{ background: "rgba(245,197,66,.07)", border: "1px solid rgba(245,197,66,.25)", color: T.dusk }}>
          <span className="font-semibold" style={{ color: T.gold }}>Why is it free?</span> Disney builds a ~10% agency commission into every package. Book direct and Disney keeps it; let Pixie handle the booking and Disney pays it to Pixie. Your price is identical — <b style={{ color: "#fff" }}>and every reservation stays in your own Disney account.</b>
        </div>
        <p className="mt-10 text-center text-xs" style={{ color: T.duskDark }}>Independent demo · not affiliated with The Walt Disney Company · park data and pricing illustrative.</p>
      </div>
    </div>
  );
}

const GoogleGlyph = () => (<svg width="16" height="16" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.4 30.1 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.3 17.6 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.1 5.3-4.6 6.9l7.1 5.5C43.2 37.4 46.1 31.5 46.1 24.5z"/><path fill="#FBBC05" d="M10.4 28.3c-.5-1.4-.8-2.9-.8-4.3s.3-3 .8-4.3l-7.8-6.1C.9 16.5 0 20.1 0 24s.9 7.5 2.6 10.4l7.8-6.1z"/><path fill="#34A853" d="M24 48c6.1 0 11.3-2 15-5.5l-7.1-5.5c-2 1.3-4.5 2.1-7.9 2.1-6.4 0-11.7-3.8-13.6-9.3l-7.8 6.1C6.5 42.6 14.6 48 24 48z"/></svg>);
const AppleGlyph = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="#fff"><path d="M17.05 12.04c-.03-2.9 2.37-4.29 2.48-4.36-1.35-1.98-3.45-2.25-4.2-2.28-1.79-.18-3.49 1.05-4.4 1.05-.9 0-2.3-1.03-3.79-1-1.95.03-3.75 1.13-4.75 2.88-2.03 3.52-.52 8.73 1.45 11.59.96 1.4 2.11 2.97 3.61 2.91 1.45-.06 2-.94 3.75-.94 1.74 0 2.24.94 3.77.91 1.56-.03 2.54-1.42 3.49-2.83 1.1-1.62 1.55-3.19 1.58-3.27-.04-.02-3.03-1.16-3.06-4.61zM14.13 3.6c.8-.97 1.34-2.31 1.19-3.6-1.15.05-2.54.77-3.36 1.73-.74.85-1.39 2.22-1.21 3.53 1.28.1 2.59-.65 3.38-1.66z"/></svg>);

function ProfileCapture({ ssoProvider, onComplete }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [matchDisney, setMatchDisney] = useState(true);
  const ready = name.trim() && email.includes("@");
  return (
    <div className="min-h-screen relative wm-body" style={{ background: `radial-gradient(1200px 700px at 50% -10%, ${T.nightSoft}, ${T.night})` }}>
      <Stars />
      <div className="relative max-w-md mx-auto px-5 pt-8 pb-16">
        <Wordmark dark />
        <div className="mt-10 wm-rise">
          <div className="flex items-center gap-2 text-xs font-medium" style={{ color: T.green }}>
            <CheckCircle2 size={14} /> Signed in with {ssoProvider === "apple" ? "Apple" : "Google"}
          </div>
          <h1 className="wm-display text-white font-semibold mt-3 leading-tight" style={{ fontSize: "clamp(1.7rem, 5vw, 2.4rem)" }}>Let's introduce your family to Pixie.</h1>
          <p className="mt-2 text-sm" style={{ color: T.dusk }}>Just the basics so Pixie can start learning who you are — and reach you the moment something matters.</p>
        </div>
        <div className="mt-7 space-y-3">
          {[
            { v: name, set: setName, ph: "Your name", icon: UserCircle2, type: "text" },
            { v: email, set: setEmail, ph: "Email", icon: Mail, type: "email" },
            { v: phone, set: setPhone, ph: "Mobile number", icon: Phone, type: "tel" },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-3 rounded-2xl px-4 py-3.5 wm-rise" style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)", animationDelay: `${0.05 * i}s` }}>
              <f.icon size={17} color={T.dusk} />
              <input value={f.v} onChange={(e) => f.set(e.target.value)} placeholder={f.ph} type={f.type} className="flex-1 bg-transparent outline-none text-sm text-white placeholder-gray-500" />
            </div>
          ))}
        </div>
        <button onClick={() => setMatchDisney((v) => !v)} className="mt-4 w-full text-left rounded-2xl p-4 flex items-start gap-3 transition-colors"
          style={{ background: matchDisney ? "rgba(245,197,66,.1)" : "rgba(255,255,255,.04)", border: `1px solid ${matchDisney ? "rgba(245,197,66,.4)" : "rgba(255,255,255,.12)"}` }}>
          <span className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: matchDisney ? T.gold : "transparent", border: `2px solid ${matchDisney ? T.gold : "rgba(255,255,255,.3)"}` }}>{matchDisney && <Check size={13} color={T.night} />}</span>
          <span>
            <span className="text-sm font-semibold" style={{ color: "#fff" }}>This is the same email I use on My Disney Experience</span>
            <span className="block text-xs mt-0.5" style={{ color: T.dusk }}>Important: matching it lets Pixie line up your plans, dining, and Lightning Lanes with your real Disney account — so everything stays in your hands.</span>
          </span>
        </button>
        <button disabled={!ready} onClick={() => onComplete({ name, email, phone, matchDisney, ssoProvider })}
          className="mt-6 w-full py-4 rounded-2xl font-semibold text-lg flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
          style={{ background: T.gold, color: T.night }}>
          Meet Pixie <ArrowRight size={18} />
        </button>
        <p className="text-center text-xs mt-4" style={{ color: T.duskDark }}>We'll only text or email you about your trip — windows, savings, and the moments that matter. Illustrative demo.</p>
      </div>
    </div>
  );
}

function Generating({ budget, onDone }) {
  const LINES = ["Reading 40 wait-time curves…", "Choosing your resort…", `Allocating your ${usd(budget)}…`, "Sequencing rope drops…", "Staging your missions…", "Protecting nap time…"];
  const [i, setI] = useState(0);
  useEffect(() => { const iv = setInterval(() => setI((x) => Math.min(x + 1, LINES.length - 1)), 520); const d = setTimeout(onDone, 3500); return () => { clearInterval(iv); clearTimeout(d); }; }, [onDone]);
  return (
    <div className="min-h-screen relative flex items-center justify-center wm-body" style={{ background: `radial-gradient(1200px 700px at 50% -10%, ${T.nightSoft}, ${T.night})` }}>
      <Stars />
      <div className="relative text-center px-6">
        <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center wm-pulse" style={{ background: T.gold }}><Wand2 size={28} color={T.night} /></div>
        <h2 className="wm-display text-white text-3xl font-semibold mt-8">Engineering your trip</h2>
        <div className="mt-6 space-y-2">{LINES.slice(0, i + 1).map((l, idx) => (
          <div key={idx} className="wm-rise flex items-center justify-center gap-2 text-sm" style={{ color: idx === i ? "#fff" : T.dusk }}>
            {idx < i ? <Check size={14} color={T.green} /> : <Loader2 size={14} className="animate-spin" color={T.gold} />} {l}
          </div>))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   COMPANION LAYER — personality, memory, voice
   The avatar is packaging; the MEMORY is the product.
   ============================================================ */
const COMPANIONS = [
  { id: "tink", name: "Tinker Bell", glyph: "\u2728", color: "#48C79A", tag: "Playful & quick", voice: "bright, a little cheeky, loves a clever shortcut", best: "Great with young dreamers and fast-moving days" },
  { id: "godmother", name: "Fairy Godmother", glyph: "\uD83E\uDE84", color: "#B57BE0", tag: "Warm & reassuring", voice: "calm, gentle, quietly makes worries disappear", best: "Perfect for first-timers who want their hand held" },
  { id: "genie", name: "Genie", glyph: "\uD83E\uDDDE", color: "#4E8AC9", tag: "Big energy, big ideas", voice: "enthusiastic, funny, treats every wish as the mission", best: "For families who want it all and want it now" },
  { id: "mickey", name: "Mickey", glyph: "\uD83D\uDC2D", color: "#E2574C", tag: "Classic & kind", voice: "friendly, upbeat, the steady host of the whole trip", best: "The all-rounder — loved by every age" },
  { id: "belle", name: "Belle", glyph: "\uD83D\uDCD6", color: "#F0A93B", tag: "Thoughtful planner", voice: "curious, detail-loving, remembers the little things", best: "For families who love the story behind every choice" },
  { id: "buzz", name: "Buzz", glyph: "\uD83D\uDE80", color: "#6C6FE8", tag: "Mission-focused", voice: "confident, precise, to infinity and beyond schedule", best: "For thrill-seekers and commando-pace crews" },
];
const compById = (id) => COMPANIONS.find((c) => c.id === id) || COMPANIONS[3];

/* Family memory — the competitive moat, made tangible in-session */
function buildMemory(profile, companionId, userProfile) {
  const kids = (profile.kidAges || []).map((age, i) => ({ age, label: `Child ${i + 1}` }));
  const facts = [];
  const young = (profile.kidAges || []).some((a) => a <= 6);
  const fam = (userProfile?.name || "").split(" ").slice(-1)[0];
  if (fam) facts.push({ k: "family", v: `the ${fam}s`, src: "your profile" });
  if (profile.characters && young) facts.push({ k: "loves", v: "princess & character experiences", src: "your brief" });
  if (profile.starwars) facts.push({ k: "loves", v: "Star Wars / Galaxy's Edge", src: "your brief" });
  const prioLabel = { newest: "newest & most popular", classics: "the classics", thrills: "big thrills", gentle: "gentle rides" };
  if ((profile.priorities || []).length) facts.push({ k: "this trip", v: profile.priorities.map((x) => prioLabel[x]).join(", "), src: "you told me" });
  facts.push({ k: "pace", v: `${profile.pace} days`, src: "you chose" });
  facts.push({ k: "dining", v: profile.dining === "table" ? "sit-down meals" : profile.dining === "quick" ? "quick & easy meals" : "a mix of dining", src: "you chose" });
  if (young) facts.push({ k: "learned", v: "young kids \u2014 afternoon breaks protect the evenings", src: "inferred" });
  facts.push({ k: "budget", v: usd(profile.budget || 6500), src: "your brief" });
  if (userProfile?.matchDisney) facts.push({ k: "linked", v: "My Disney Experience account", src: "your profile" });
  return {
    companionId,
    family: { adults: profile.adults, kids, name: fam },
    facts,
    behaviors: [],
    tripsPlanned: 1,
  };
}
/* A short, first-session reflection that proves the companion "gets" the family */
function companionReflection(profile, comp, firstName) {
  const kids = profile.kidAges || [];
  const bits = [];
  if (profile.characters && kids.some((a) => a <= 8)) bits.push("a little one who's going to lose it (the good way) when they meet a princess");
  if (profile.starwars) bits.push("someone who's counting down to Galaxy's Edge");
  if (profile.pace === "relaxed") bits.push("a family that would rather savor than sprint");
  if (profile.pace === "commando") bits.push("a crew that wants to squeeze every drop out of every day");
  if (!bits.length) bits.push("a family that wants this done right");
  const list = bits.length > 1 ? bits.slice(0, -1).join(", ") + ", and " + bits.slice(-1) : bits[0];
  const hi = firstName ? `Okay ${firstName} \u2014` : "Okay \u2014";
  return `${hi} I think I've got you. You're ${list}. I'll remember all of it, and I'll get smarter about your family every trip. Here's what I've engineered so far:`;
}

/* ============================================================
   SCREEN: Choose your companion
   ============================================================ */
function CompanionPicker({ onPick }) {
  const [sel, setSel] = useState(null);
  return (
    <div className="min-h-screen relative wm-body" style={{ background: `radial-gradient(1200px 700px at 50% -10%, ${T.nightSoft}, ${T.night})` }}>
      <Stars />
      <div className="relative max-w-2xl mx-auto px-5 pt-8 pb-16">
        <Wordmark dark />
        <div className="mt-12 text-center wm-rise">
          <p className="text-sm font-medium tracking-widest uppercase" style={{ color: T.gold }}>One quick thing first</p>
          <h1 className="wm-display font-semibold mt-3 text-white leading-tight" style={{ fontSize: "clamp(1.9rem, 5vw, 3rem)" }}>Give Pixie a face<br />your family will love</h1>
          <p className="mt-3 text-sm max-w-md mx-auto" style={{ color: T.dusk }}>
            Same Pixie, same memory — just the personality that fits your crew. You can change it anytime.
          </p>
        </div>
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {COMPANIONS.map((c) => {
            const on = sel === c.id;
            return (
              <button key={c.id} onClick={() => setSel(c.id)} className="text-left rounded-2xl p-4 transition-transform active:scale-95"
                style={{ background: on ? "rgba(255,255,255,.1)" : "rgba(255,255,255,.05)", border: `2px solid ${on ? c.color : "rgba(255,255,255,.1)"}` }}>
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl" style={{ background: on ? c.color : "rgba(255,255,255,.07)" }}>{c.glyph}</div>
                  <span className="w-5 h-5 rounded-full flex items-center justify-center" style={{ border: `2px solid ${on ? c.color : "rgba(255,255,255,.25)"}`, background: on ? c.color : "transparent" }}>{on && <Check size={12} color="#fff" />}</span>
                </div>
                <div className="wm-display font-semibold mt-2.5 text-white">{c.name}</div>
                <div className="text-xs" style={{ color: c.color }}>{c.tag}</div>
                <div className="text-xs mt-1" style={{ color: T.dusk }}>{c.best}</div>
              </button>
            );
          })}
        </div>
        <button disabled={!sel} onClick={() => onPick(sel)} className="mt-8 w-full py-4 rounded-2xl font-semibold text-lg flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
          style={{ background: T.gold, color: T.night }}>
          {sel ? <>Meet {compById(sel).name} <ArrowRight size={18} /></> : "Pick a companion to continue"}
        </button>
        <p className="text-center text-xs mt-4" style={{ color: T.duskDark }}>Pixie remembers everything about your family — and gets more magical every trip.</p>
      </div>
    </div>
  );
}

/* Companion avatar bubble */
const CompAvatar = ({ comp, size = 28 }) => (
  <div className="rounded-full flex items-center justify-center flex-shrink-0" style={{ width: size, height: size, background: comp.color, fontSize: size * 0.5 }}>{comp.glyph}</div>
);

/* ============================================================
   DISCOVERY INTAKE — Pixie runs a warm "sales discovery" chat.
   One question at a time, tappable multiple-choice (ChatGPT-style),
   with a type-your-own escape and a one-sentence shortcut.
   Answers become live "learned" facts to build the known-feeling.
   ============================================================ */
const DISCOVERY = [
  {
    key: "party", q: (n) => `So excited to plan this with you${n ? `, ${n}` : ""}! First — who's coming on this magical trip?`,
    type: "single", options: [
      { label: "2 adults + young kids", set: { adults: 2, _kidBand: "young" } },
      { label: "2 adults + big kids", set: { adults: 2, _kidBand: "big" } },
      { label: "Just the 2 of us", set: { adults: 2, kidAges: [], _kidBand: "none" } },
      { label: "Big group (6+)", set: { adults: 4, _kidBand: "mixed" } },
    ], type: "e.g. 2 adults, kids 4 and 7", learn: "who's coming",
  },
  {
    key: "ages", q: () => "Love it. How old are the kids? (Tap all that fit — this shapes everything.)",
    type: "multi", showIf: (s) => s._kidBand && s._kidBand !== undefined && (s.kidAges === undefined || s.kidAges.length === 0) && s._kidBand !== "none",
    options: [
      { label: "Under 3", add: 2 }, { label: "3–5", add: 4 }, { label: "6–8", add: 7 },
      { label: "9–12", add: 10 }, { label: "Teens", add: 15 },
    ], type: "e.g. 4, 7, and 10", learn: "kids' ages",
  },
  {
    key: "days", q: () => "Perfect. How many days will you be in the parks?",
    type: "single", options: [
      { label: "3 days", set: { parkDays: 3 } }, { label: "4 days", set: { parkDays: 4 } },
      { label: "5 days", set: { parkDays: 5 } }, { label: "6+ days", set: { parkDays: 6 } },
    ], type: "e.g. 5 days", learn: "trip length",
  },
  {
    key: "when", q: () => "When are you hoping to go? (This sets your crowd strategy and booking windows.)",
    type: "single", options: [
      { label: "Spring (Mar–May)", set: { month: "April" } }, { label: "Summer (Jun–Aug)", set: { month: "June" } },
      { label: "Fall (Sep–Nov)", set: { month: "October" } }, { label: "Winter/Holidays", set: { month: "December" } },
    ], type: "e.g. early October", learn: "travel dates",
  },
  {
    key: "loves", q: () => "Now the fun part — what is your crew most excited for? (Tap all that apply.)",
    type: "multi", options: [
      { label: "Meeting princesses & characters", set: { characters: true } },
      { label: "Star Wars / Galaxy's Edge", set: { starwars: true, _sw: true } },
      { label: "Big thrill rides", set: { _thrill: true } },
      { label: "The magic & the shows", set: { _magic: true } },
    ], type: "e.g. my daughter loves Elsa, my son wants Star Wars", learn: "what everyone loves",
  },
  {
    key: "priorities", q: () => "When it comes to rides, what does this trip need to deliver? (Tap all that matter — this is where I really tailor your days.)",
    type: "multi", options: [
      { label: "The newest & most popular", set: { _pNew: true } },
      { label: "The classics we love", set: { _pClassic: true } },
      { label: "Big thrills & coasters", set: { _pThrill: true } },
      { label: "Gentle & kid-friendly", set: { _pGentle: true } },
    ], type: "e.g. all the new stuff, plus the classics for grandma", learn: "ride priorities",
  },
  {
    key: "pace", q: () => "How does your family like to tour? Be honest — it's the difference between a great day and a meltdown.",
    type: "single", options: [
      { label: "Relaxed — savor it, breaks matter", set: { pace: "relaxed" } },
      { label: "Balanced — a bit of everything", set: { pace: "balanced" } },
      { label: "Commando — maximize every minute", set: { pace: "commando" } },
    ], type: "describe your ideal day", learn: "your pace",
  },
  {
    key: "dining", q: () => "And meals — how do you like to eat in the parks?",
    type: "single", options: [
      { label: "Sit-down & character meals", set: { dining: "table" } },
      { label: "Quick & easy, more ride time", set: { dining: "quick" } },
      { label: "A mix of both", set: { dining: "mix" } },
    ], type: "e.g. one character breakfast, rest quick", learn: "dining style",
  },
  {
    key: "budget", q: () => "Last one, and then I'll build your whole trip — what's your target budget? (I'll fit everything to it, to the dollar.)",
    type: "single", options: [
      { label: "Around $5,000", set: { budget: 5000 } }, { label: "Around $6,500", set: { budget: 6500 } },
      { label: "Around $9,000", set: { budget: 9000 } }, { label: "$12,000+", set: { budget: 12000 } },
    ], type: "e.g. $7,500", learn: "your budget",
  },
];

function normalizeState(s) {
  const p = { ...s };
  if (p._kidBand && (!p.kidAges || !p.kidAges.length)) {
    // if they skipped ages, infer a reasonable default from band
    if (!p.kidAges) p.kidAges = p._kidBand === "young" ? [5] : p._kidBand === "big" ? [10] : p._kidBand === "mixed" ? [5, 10] : [];
  }
  if (!p.kidAges) p.kidAges = [];
  p.adults = p.adults || 2;
  p.parkDays = p.parkDays || 4;
  p.month = p.month || "October";
  p.pace = p.pace || "balanced";
  p.dining = p.dining || "mix";
  p.budget = p.budget || 6500;
  if (p.characters === undefined) p.characters = p.kidAges.some((a) => a <= 8);
  p.starwars = !!p.starwars;
  const prio = [];
  if (p._pNew) prio.push("newest");
  if (p._pClassic) prio.push("classics");
  if (p._pThrill) prio.push("thrills");
  if (p._pGentle) prio.push("gentle");
  if (p._thrill && !prio.includes("thrills")) prio.push("thrills");
  p.priorities = prio;
  p.mustDos = p.mustDos || [];
  if (p.starwars && !p.mustDos.includes("Star Wars: Rise of the Resistance")) p.mustDos.push("Star Wars: Rise of the Resistance");
  p.assumptions = [];
  return p;
}

function DiscoveryIntake({ comp, profileName, onComplete, onFreeText }) {
  const first = (profileName || "").split(" ")[0];
  const [stepIdx, setStepIdx] = useState(0);
  const [state, setState] = useState({});
  const [history, setHistory] = useState([]); // {role, text}
  const [multiSel, setMultiSel] = useState([]);
  const [typing, setTyping] = useState(false);
  const [typed, setTyped] = useState("");
  const [showType, setShowType] = useState(false);
  const [oneShot, setOneShot] = useState("");
  const [showOneShot, setShowOneShot] = useState(false);
  const scrollRef = useRef(null);

  // find the next applicable step from an index
  const nextApplicable = (from, s) => {
    let i = from;
    while (i < DISCOVERY.length) { const st = DISCOVERY[i]; if (!st.showIf || st.showIf(s)) return i; i++; }
    return DISCOVERY.length;
  };
  const [curIdx, setCurIdx] = useState(() => nextApplicable(0, {}));

  useEffect(() => { scrollRef.current?.scrollTo({ top: 999999, behavior: "smooth" }); }, [history, curIdx, typing]);

  const learned = []; // derived below for the live memory rail
  const learnedFacts = () => {
    const f = [];
    if (state.adults) f.push(`${state.adults} adult${state.adults > 1 ? "s" : ""}${state.kidAges?.length ? ` + ${state.kidAges.length} kid${state.kidAges.length > 1 ? "s" : ""}` : ""}`);
    if (state.kidAges?.length) f.push(`ages ${state.kidAges.join(", ")}`);
    if (state.parkDays) f.push(`${state.parkDays} park days`);
    if (state.month) f.push(state.month);
    if (state.characters) f.push("loves characters");
    if (state.starwars) f.push("Star Wars fan");
    const pl = [];
    if (state._pNew) pl.push("newest rides"); if (state._pClassic) pl.push("the classics");
    if (state._pThrill) pl.push("big thrills"); if (state._pGentle) pl.push("gentle rides");
    if (pl.length) f.push(pl.join(" + "));
    if (state.pace) f.push(`${state.pace} pace`);
    if (state.dining) f.push(state.dining === "table" ? "sit-down dining" : state.dining === "quick" ? "quick dining" : "mixed dining");
    if (state.budget) f.push(usd(state.budget));
    return f;
  };

  const step = DISCOVERY[curIdx];

  const advance = (newState, answerLabel, learnPhrase) => {
    const q = step.q(first);
    setHistory((h) => [...h, { role: "pixie", text: q }, { role: "user", text: answerLabel }]);
    setMultiSel([]); setShowType(false); setTyped("");
    const ni = nextApplicable(curIdx + 1, newState);
    setState(newState);
    if (ni >= DISCOVERY.length) {
      setTyping(true);
      setHistory((h) => [...h, { role: "pixie", text: `Amazing — I've got everything I need${first ? `, ${first}` : ""}. Building your family's trip now…` }]);
      setTimeout(() => onComplete(normalizeState(newState)), 1400);
    } else {
      setTyping(true);
      setTimeout(() => { setTyping(false); setCurIdx(ni); }, 650);
    }
  };

  const pickSingle = (opt) => advance({ ...state, ...(opt.set || {}) }, opt.label, step.learn);
  const toggleMulti = (opt, i) => setMultiSel((m) => (m.includes(i) ? m.filter((x) => x !== i) : [...m, i]));
  const confirmMulti = () => {
    if (step.key === "ages") {
      const ages = multiSel.map((i) => step.options[i].add);
      advance({ ...state, kidAges: ages }, ages.length ? `Ages ${ages.join(", ")}` : "No kids", step.learn);
    } else {
      let ns = { ...state };
      multiSel.forEach((i) => { ns = { ...ns, ...(step.options[i].set || {}) }; });
      advance(ns, multiSel.map((i) => step.options[i].label).join(", ") || "Surprise us", step.learn);
    }
  };
  const submitTyped = () => { if (!typed.trim()) return; advance({ ...state, _note: (state._note || "") + " " + typed }, typed, step.learn); };

  return (
    <div className="min-h-screen relative wm-body flex flex-col" style={{ background: `radial-gradient(1200px 700px at 50% -10%, ${T.nightSoft}, ${T.night})` }}>
      <Stars />
      <div className="relative max-w-xl w-full mx-auto px-4 pt-6 flex-1 flex flex-col" style={{ minHeight: 0 }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2"><CompAvatar comp={comp} size={30} /><div><div className="text-sm font-semibold text-white leading-tight">{comp.name}</div><div className="text-xs leading-tight" style={{ color: T.dusk }}>planning your trip with you</div></div></div>
          <button onClick={() => setShowOneShot((v) => !v)} className="text-xs px-3 py-1.5 rounded-full" style={{ background: "rgba(255,255,255,.07)", color: T.dusk, border: "1px solid rgba(255,255,255,.14)" }}>I'll just tell you everything</button>
        </div>

        {showOneShot && (
          <div className="mt-3 rounded-2xl p-2 flex gap-2 wm-rise" style={{ background: "rgba(255,255,255,.07)", border: `1px solid ${comp.color}` }}>
            <input value={oneShot} onChange={(e) => setOneShot(e.target.value)} onKeyDown={(e) => e.key === "Enter" && oneShot.trim() && onFreeText(oneShot)}
              placeholder="Family of four, 5 days, princess 6-yo, Star Wars 10-yo, $6,500" className="flex-1 bg-transparent outline-none text-sm px-3 py-2 text-white placeholder-gray-500" />
            <button onClick={() => oneShot.trim() && onFreeText(oneShot)} className="px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: T.gold, color: T.night }}>Build it</button>
          </div>
        )}

        {/* progress */}
        <div className="mt-3 flex gap-1">
          {DISCOVERY.map((_, i) => <div key={i} className="flex-1 h-1 rounded-full" style={{ background: i <= curIdx ? comp.color : "rgba(255,255,255,.12)" }} />)}
        </div>

        {/* conversation */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 space-y-3" style={{ minHeight: 0 }}>
          {history.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} gap-2 wm-rise`}>
              {m.role === "pixie" && <CompAvatar comp={comp} size={26} />}
              <div className="max-w-sm px-4 py-2.5 rounded-2xl text-sm" style={m.role === "user"
                ? { background: comp.color, color: "#fff", borderBottomRightRadius: 6 }
                : { background: "#fff", color: T.ink, border: `1px solid ${comp.color}33`, borderBottomLeftRadius: 6 }}>{m.text}</div>
            </div>
          ))}
          {/* current question */}
          {!typing && step && (
            <div className="flex justify-start gap-2 wm-rise">
              <CompAvatar comp={comp} size={26} />
              <div className="max-w-sm px-4 py-2.5 rounded-2xl text-sm" style={{ background: "#fff", color: T.ink, border: `1px solid ${comp.color}33`, borderBottomLeftRadius: 6 }}>{step.q(first)}</div>
            </div>
          )}
          {typing && <div className="flex items-center gap-2 text-sm ml-9" style={{ color: T.dusk }}><Loader2 size={13} className="animate-spin" /> {comp.name} is typing…</div>}
        </div>

        {/* answer controls */}
        {!typing && step && (
          <div className="pb-5 wm-rise">
            {!showType ? (
              <>
                {step.type === "single" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {step.options.map((o, i) => (
                      <button key={i} onClick={() => pickSingle(o)} className="text-left px-4 py-3 rounded-2xl text-sm font-medium transition-transform hover:scale-[1.02] active:scale-95 flex items-center gap-2"
                        style={{ background: "rgba(255,255,255,.06)", color: "#EDEAF7", border: "1px solid rgba(255,255,255,.15)" }}>
                        <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ border: `2px solid ${comp.color}` }} />{o.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      {step.options.map((o, i) => {
                        const on = multiSel.includes(i);
                        return (
                          <button key={i} onClick={() => toggleMulti(o, i)} className="text-left px-4 py-3 rounded-2xl text-sm font-medium transition-transform active:scale-95 flex items-center gap-2"
                            style={{ background: on ? `${comp.color}22` : "rgba(255,255,255,.06)", color: "#EDEAF7", border: `1px solid ${on ? comp.color : "rgba(255,255,255,.15)"}` }}>
                            <span className="w-4 h-4 rounded-md flex-shrink-0 flex items-center justify-center" style={{ background: on ? comp.color : "transparent", border: `2px solid ${on ? comp.color : "rgba(255,255,255,.3)"}` }}>{on && <Check size={11} color="#fff" />}</span>{o.label}
                          </button>
                        );
                      })}
                    </div>
                    <button onClick={confirmMulti} className="mt-2 w-full py-3 rounded-2xl font-semibold" style={{ background: T.gold, color: T.night }}>
                      {multiSel.length ? "Continue" : (step.key === "loves" ? "Surprise us" : "Skip")} <ArrowRight size={15} className="inline" />
                    </button>
                  </>
                )}
                <button onClick={() => setShowType(true)} className="mt-2 text-xs mx-auto block" style={{ color: T.dusk }}>…or type my own answer</button>
              </>
            ) : (
              <div className="rounded-2xl p-2 flex gap-2" style={{ background: "rgba(255,255,255,.07)", border: `1px solid ${comp.color}` }}>
                <input autoFocus value={typed} onChange={(e) => setTyped(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submitTyped()}
                  placeholder={step.type} className="flex-1 bg-transparent outline-none text-sm px-3 py-2 text-white placeholder-gray-500" />
                <button onClick={submitTyped} className="p-2 rounded-xl" style={{ background: T.gold }}><Send size={15} color={T.night} /></button>
              </div>
            )}
            {/* live "learning" rail */}
            {learnedFacts().length > 0 && (
              <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                <span className="text-xs" style={{ color: T.duskDark }}><Sparkles size={11} color={comp.color} className="inline" /> {comp.name} is learning:</span>
                {learnedFacts().map((f, i) => <span key={i} className="text-xs px-2 py-0.5 rounded-full wm-tick" style={{ background: "rgba(255,255,255,.07)", color: "#CFC5FF" }}>{f}</span>)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* "What your companion knows" — the memory made visible */
function MemoryCard({ memory, comp, dark }) {
  const chips = memory.facts;
  return (
    <div className="rounded-2xl p-4" style={dark ? { background: "rgba(255,255,255,.05)", border: `1px solid ${comp.color}55` } : { background: "#fff", border: `1px solid ${T.paperEdge}` }}>
      <div className="flex items-center gap-2 mb-2">
        <CompAvatar comp={comp} size={24} />
        <div className="text-sm font-semibold" style={{ color: dark ? "#fff" : T.ink }}>What {comp.name} knows about your family</div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {chips.map((f, i) => (
          <span key={i} className="text-xs px-2.5 py-1 rounded-full inline-flex items-center gap-1" style={{ background: dark ? "rgba(255,255,255,.07)" : "#F3ECFB", color: dark ? "#CFC5FF" : T.violetDeep }}>
            <span style={{ opacity: 0.7 }}>{f.k}:</span> <b>{f.v}</b>
          </span>
        ))}
      </div>
      {memory.behaviors.length > 0 && (
        <div className="mt-2.5 pt-2.5" style={{ borderTop: `1px dashed ${dark ? "rgba(255,255,255,.12)" : T.paperEdge}` }}>
          <div className="text-xs font-semibold mb-1" style={{ color: dark ? T.dusk : T.duskDark }}>Learned while planning:</div>
          {memory.behaviors.map((b, i) => (
            <div key={i} className="text-xs flex items-center gap-1.5 wm-tick" style={{ color: dark ? "#CFC5FF" : "#57506E" }}><Sparkles size={11} color={comp.color} /> {b}</div>
          ))}
        </div>
      )}
      <div className="text-xs mt-2.5" style={{ color: dark ? T.duskDark : T.duskDark }}>Trips planned together: {memory.tripsPlanned} \u00B7 gets smarter every year</div>
    </div>
  );
}

/* ---- Abandoned-trip recapture overlay (email + SMS follow-ups) ---- */
function RecaptureOverlay({ data, comp, onStep, onBook, onClose }) {
  const shown = data.seq.slice(0, data.i + 1);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(14,11,30,.93)", backdropFilter: "blur(6px)" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-4 wm-rise">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full" style={{ background: "rgba(245,197,66,.14)", color: T.gold }}>
            <BellRing size={13} /> You left without booking — so Pixie followed up
          </div>
          <p className="text-xs mt-2" style={{ color: T.dusk }}>This is the recapture sequence a family would receive. Compressed for the demo.</p>
        </div>
        <div className="space-y-2.5 max-h-[52vh] overflow-y-auto px-1">
          {shown.map((m, i) => (
            <div key={i} className="wm-rise">
              {m.channel === "email" ? (
                <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: `1px solid ${T.paperEdge}` }}>
                  <div className="px-4 py-2 flex items-center gap-2" style={{ background: "#F6F2EA", borderBottom: `1px solid ${T.paperEdge}` }}>
                    <CompAvatar comp={comp} size={22} />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate" style={{ color: T.ink }}>Pixie</div>
                      <div className="text-xs truncate" style={{ color: T.duskDark }}>{m.subject}</div>
                    </div>
                    <span className="ml-auto text-xs whitespace-nowrap" style={{ color: T.duskDark }}>{m.at}</span>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-sm" style={{ color: "#57506E" }}>{m.body}</p>
                    <button onClick={onBook} className="mt-3 px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: T.night, color: T.gold }}>{m.cta}</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <CompAvatar comp={comp} size={26} />
                  <div>
                    <div className="px-3.5 py-2.5 rounded-2xl text-sm" style={{ background: "#E8F0FE", color: "#1F2937", borderBottomLeftRadius: 6, maxWidth: 300 }}>{m.body}</div>
                    <div className="text-xs mt-1 flex items-center gap-1" style={{ color: T.dusk }}><Phone size={10} /> SMS · {m.at}</div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-2">
          <button onClick={onBook} className="wm-pulse w-full py-3.5 rounded-2xl font-semibold text-lg flex items-center justify-center gap-2" style={{ background: T.gold, color: T.night }}>
            <Sparkles size={17} /> Book Now For Free
          </button>
          {data.i < data.seq.length - 1 ? (
            <button onClick={onStep} className="w-full py-2.5 rounded-xl text-sm font-medium" style={{ background: "rgba(255,255,255,.07)", color: T.dusk, border: "1px solid rgba(255,255,255,.15)" }}>
              Still waiting… show the next follow-up →
            </button>
          ) : (
            <div className="text-center text-xs" style={{ color: T.duskDark }}>4 touches over 3 days · each tied to a real deadline on their trip</div>
          )}
          <button onClick={onClose} className="w-full py-2 text-xs" style={{ color: T.duskDark }}>Dismiss (back to plan)</button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   APP ROOT — the OS shell, Thread logic, Demo Director
   ============================================================ */
let MID = 1; const mid = () => `m${MID++}`;

export default function PixieApp() {
  const [screen, setScreen] = useState("landing");
  const [profile, setProfile] = useState(null);
  const [alloc, setAlloc] = useState(null);
  const [overrides, setOverrides] = useState({});
  const [itinerary, setItinerary] = useState([]);
  const [tab, setTab] = useState("thread");
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [apiOk, setApiOk] = useState(true);
  const [mode, setMode] = useState(null); // null | 'autopilot' | 'self'
  const [missions, setMissions] = useState([]);
  const [ledger, setLedger] = useState(0);
  const [ledgerLog, setLedgerLog] = useState([]);
  const [vault, setVault] = useState([]);
  const [handoff, setHandoff] = useState(false);
  const [secured, setSecured] = useState(null);
  const [lastChecked, setLastChecked] = useState(22);
  const [companionId, setCompanionId] = useState(null);
  const [memory, setMemory] = useState(null);
  const [ssoProvider, setSsoProvider] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [recapture, setRecapture] = useState(null); // abandoned-cart sequence state
  const scrollRef = useRef(null);
  const snapRef = useRef(null);
  const scriptRef = useRef({ steps: [], i: 0, timer: null });

  useEffect(() => { scrollRef.current?.scrollTo({ top: 999999, behavior: "smooth" }); }, [msgs, busy, tab]);

  // Abandoned-trip recapture: if the family builds a trip but doesn't book, Pixie follows up (email+SMS).
  useEffect(() => {
    if (screen !== "os" || mode || !alloc || recapture) return;
    const timer = setTimeout(() => { if (!mode) setRecapture({ seq: recaptureSequence(profile, alloc), i: 0, revealed: false }); }, 14000);
    return () => clearTimeout(timer);
  }, [screen, mode, alloc, recapture]);

  const push = (m) => setMsgs((x) => [...x, { id: mid(), ...m }]);
  const resolveMsg = (id, resolved, extra = {}) => setMsgs((x) => x.map((m) => (m.id === id ? { ...m, actions: null, resolved, ...extra } : m)));

  /* ---------- Demo Director ---------- */
  const runStep = useCallback(() => {
    const s = scriptRef.current;
    if (s.i >= s.steps.length) return;
    const step = s.steps[s.i++];
    setLastChecked(2 + Math.floor(Math.random() * 7));
    step.run();
    if (s.i < s.steps.length) s.timer = setTimeout(runStep, s.steps[s.i].delay);
  }, []);
  const startScript = useCallback((steps) => {
    const s = scriptRef.current;
    if (s.timer) clearTimeout(s.timer);
    s.steps = steps; s.i = 0;
    s.timer = setTimeout(runStep, steps[0].delay);
  }, [runStep]);
  const skipNext = () => { const s = scriptRef.current; if (s.timer) clearTimeout(s.timer); runStep(); };

  const autopilotScript = useCallback((p, a) => {
    const kids = (p.kidAges || []).length;
    const comp = compById(companionId);
    const youngest = (p.kidAges || []).length ? Math.min(...p.kidAges) : null;
    const princessBit = (p.characters && youngest != null && youngest <= 8);
    return [
      { delay: 1800, run: () => { push({ kind: "companion", text: "Autopilot's on — I've got it from here. First confirmations land within 24 hours, right here in our thread. Change anything anytime by just telling me." }); setVault([{ name: `${a.resort.name} · ${a.nights} nights` }, { name: `${p.adults + kids}× ${p.parkDays}-day tickets` }, { name: "Cinderella's Royal Table — Day 1 dinner" }, { name: "Lightning Lane Multi Pass — all days" }]); } },
      { delay: 5000, run: () => { push({ kind: "win", label: "Booked", icon: Hotel, sms: true, title: `${a.resort.name} — confirmed`, body: `${a.nights} nights · ${a.dates.fmtStart}–${a.dates.fmtEnd} · in your Disney account now.` }); setVault((v) => v.map((x, i) => (i === 0 ? { ...x, conf: "#WM-48213" } : x))); } },
      { delay: 5000, run: () => { push({ kind: "win", label: "Booked", icon: Ticket, sms: true, title: "Park tickets — confirmed", body: "Linked to everyone in your party. Early Entry active every morning." }); setVault((v) => v.map((x, i) => (i === 1 ? { ...x, conf: "#WM-48214" } : x))); } },
      { delay: 7000, run: () => push({ kind: "brief", title: "While you slept", body: "The crowd calendar shifted your arrival to a lighter day (5/10) — Day 1 rope drop just got easier. A refurbishment was announced for your week; your plan never included that ride. Nothing needs you." }) },
      { delay: 8000, run: () => push({ kind: "act", icon: Wallet, sms: true, title: "I caught a promotion for your family", body: "A new room offer released this morning fits your exact dates. Everything else stays exactly as you have it — want me to apply it?", delta: 427, deltaSuffix: " back", actions: [{ label: "Yes, apply it", primary: true, act: "apply427" }, { label: "Not now", act: "dismiss" }] }) },
      { delay: 9000, run: () => { setMissions((ms) => ms.map((m) => (m.id === "crt" ? { ...m, status: "attempting" } : m))); push({ kind: "brief", label: "Mission window open", title: "Cinderella's Royal Table — I'm in", body: "The 60-day window just opened. I'm live at 5:40 a.m. ET with backups ranked — this is the one your little one has been dreaming about." }); } },
      { delay: 4200, run: () => { const note = `Dinner in the castle · Day 1 · 5:10 p.m. · party of ${p.adults + kids}`; setMissions((ms) => ms.map((m) => (m.id === "crt" ? { ...m, status: "secured", securedNote: note } : m))); setSecured({ name: "Cinderella's Royal Table", securedNote: note }); push({ kind: "win", label: "Mission secured", icon: Target, sms: true, title: "Cinderella's Royal Table — SECURED", body: princessBit ? `${note}. Dinner inside the castle — your ${youngest}-year-old is going to remember this one forever.` : note }); setVault((v) => v.map((x) => (x.name.includes("Cinderella") ? { ...x, conf: "#WM-48302" } : x))); } },
      { delay: 9000, run: () => { setMissions((ms) => ms.map((m) => (m.id === "oga" ? { ...m, status: "hunting" } : m))); push({ kind: "brief", label: "Mission update", title: "Oga's Cantina — hunting", body: "First slots went in seconds, so I booked your ranked backup and set a reopening scan to run daily. Cancellations resurface constantly around the 24-hour line — I'll catch one." }); } },
      { delay: 9000, run: () => { setItinerary((it) => it.map((d, i) => (i === 1 ? stormReplan(d) : d))); push({ kind: "win", label: "Storm save", icon: CloudRain, sms: true, title: "I handled a thunderstorm before it happened", body: "Storms likely after 3 p.m. on Day 2, so I already moved your afternoon indoors — nothing lost. Peek at Plan → Day 2." }); } },
      { delay: 9000, run: () => { const note = `Party of ${p.adults + kids} · 7:40 p.m. · caught at 11:42 p.m.`; setMissions((ms) => ms.map((m) => (m.id === "oga" ? { ...m, status: "secured", securedNote: note } : m))); setSecured({ name: "Oga's Cantina", securedNote: note }); push({ kind: "win", label: "Caught overnight", icon: Moon, sms: true, title: "While you slept, a table opened. I took it.", body: "Oga's Cantina · " + note }); } },
      { delay: 8000, run: () => push({ kind: "brief", label: "Weekly heartbeat", title: "All quiet.", body: `Watching 6 things · ${a.dates.daysToTrip} days to go · nothing needs you. That's the point — I'll keep thinking about your trip so you don't have to.` }) },
    ];
  }, [companionId]);

  /* Abandoned-trip recapture: escalating email+SMS sequence tied to the trip's real urgency.
     Modeled on best-in-class ecom cart abandonment — concrete urgency beats generic nudges. */
  const recaptureSequence = (p, a) => {
    const first = (userProfile?.name || "").split(" ")[0] || "there";
    const partySaver = 427;
    return [
      { at: "12 seconds later", channel: "email", subject: `${first}, your Disney trip is saved — but not booked yet`, body: `Pixie built your ${p.parkDays}-day trip to ${a.resort.name} and it's ready to go. Nothing's booked until you say so — and the reservations you want don't wait. Tap to book free, and Pixie takes it from here.`, cta: "Finish booking — free" },
      { at: "1 hour later", channel: "sms", body: `It's Pixie ✨ Your ${a.resort.name} trip is still held, but ${first}, your dining window opens in ${a.dates.daysToDining} days and the hardest reservations go in minutes. Want me to be awake for it? Book free: pixie.trip/${(userProfile?.name || "you").split(" ")[0].toLowerCase()}` },
      { at: "1 day later", channel: "email", subject: `I found $${partySaver} in savings on your trip`, body: `${first} — good news while your trip sat waiting: a room offer released that fits your exact dates and saves your family $${partySaver}. I can only lock it in on a booking I manage, and offers like this disappear fast. Book free and I'll apply it automatically.`, cta: `Book & save $${partySaver}` },
      { at: "3 days later", channel: "sms", body: `${first}, last nudge from Pixie — your dining window (Cinderella's Royal Table is on your list!) opens soon and I can't hold those seats unless your trip is booked. One free tap and I'm on it. pixie.trip/save` },
    ];
  };

  /* ---------- Actions on message buttons ---------- */
  const onAction = (id, a) => {
    if (a.act === "apply427" || a.act === "convert427after") {
      resolveMsg(id, "Applied · executed via our partner agency · verified · confirmation updated");
      setLedger((l) => l + 427); setLedgerLog((x) => [...x, { what: "Room offer applied", amt: 427 }]);
      setAlloc((al) => ({ ...al, room: al.room - 427, buffer: al.buffer + 427 }));
    } else if (a.act === "dismiss") resolveMsg(id, "Okay — it stays available in Pulse if you change your mind.");
    else if (a.act === "dismissSelf") resolveMsg(id, "No rush — it's held and I'm watching.");
    else if (a.act === "convert427") { resolveMsg(id, "Booking now…"); beginAutopilot(true); }
    else if (a.act === "confirmChange") {
      resolveMsg(id, mode === "autopilot" ? "Preparing…" : "Draft updated instantly.");
      const ch = a.change;
      setTimeout(() => {
        if (ch.kind === "resort_change") { setAlloc(ch.newAlloc); setVault((v) => v.map((x, i) => (i === 0 ? { name: `${ch.newAlloc.resort.name} · ${ch.newAlloc.nights} nights`, conf: x.conf } : x))); }
        if (ch.kind === "park_hopper") setAlloc((al) => ({ ...al, tickets: al.tickets + ch.delta, buffer: al.buffer - ch.delta }));
        if (ch.kind === "add_day") { setProfile(ch.newProfile); setAlloc(ch.newAlloc); setItinerary(buildItinerary(ch.newProfile, overrides)); }
        if (mode === "autopilot") resolveMsg(id, "Executed via our partner agency · verified against your plan · done.");
      }, mode === "autopilot" ? 1600 : 50);
    } else if (a.act === "cancelChange") resolveMsg(id, "Cancelled — nothing changed.");
    else if (a.chipSend) send(a.chipSend);
  };

  /* ---------- Prepared-change builder (engine prices everything) ---------- */
  const buildPrepared = (prepared, p, al) => {
    if (prepared.kind === "resort_change") {
      const r = RESORTS.find((x) => x.name.toLowerCase().includes((prepared.to || "").toLowerCase().split(" ")[0])) || RESORTS.find((x) => (prepared.to || "").toLowerCase().includes(x.name.toLowerCase().split(" ")[0]));
      if (!r) return null;
      const newAlloc = reallocate(p, r.id);
      const delta = newAlloc.room - al.room;
      return { title: `Move to ${r.name}`, body: `${r.tier} · ${r.note} · dates, tickets, dining all preserved.`, delta, deltaSuffix: delta >= 0 ? " more total" : " less total", change: { kind: "resort_change", newAlloc } };
    }
    if (prepared.kind === "park_hopper") {
      const heads = (p.adults || 2) + (p.kidAges || []).length;
      const delta = 85 * heads;
      return { title: "Upgrade to Park Hopper", body: `All ${heads} tickets · hop after 11 a.m. any day.`, delta, deltaSuffix: " more total", change: { kind: "park_hopper", delta } };
    }
    if (prepared.kind === "add_day") {
      const newProfile = { ...p, parkDays: Math.min(6, (p.parkDays || 4) + 1) };
      const newAlloc = allocateBudget(newProfile);
      const delta = (newAlloc.room + newAlloc.tickets + newAlloc.diningCost) - (al.room + al.tickets + al.diningCost);
      return { title: `Add a park day (${newProfile.parkDays} total)`, body: "One more night, tickets extended, plan re-engineered.", delta, deltaSuffix: " more total", change: { kind: "add_day", newProfile, newAlloc } };
    }
    return null;
  };

  /* ---------- Composer ---------- */
  const applyEdits = (edits) => {
    snapRef.current = { overrides: JSON.parse(JSON.stringify(overrides)), itinerary };
    setOverrides((prev) => {
      const next = { ...prev };
      edits.forEach((e) => {
        const di = Math.max(0, (e.day || 1) - 1);
        const o = { exclude: [], include: [], ...(next[di] || {}) };
        if (e.op === "set_pace") o.pace = e.pace;
        if (e.op === "remove") { const at = ATTR.find((x) => x.name === e.name) || ATTR.find((x) => x.name.toLowerCase().includes((e.name || "").toLowerCase())); if (at) o.exclude = [...new Set([...o.exclude, at.id])]; }
        if (e.op === "add") { const at = ATTR.find((x) => x.name === e.name) || ATTR.find((x) => x.name.toLowerCase().includes((e.name || "").toLowerCase())); if (at) { o.include = [...new Set([...o.include, at.id])]; o.exclude = o.exclude.filter((id) => id !== at.id); } }
        next[di] = o;
      });
      setItinerary(buildItinerary(profile, next));
      return next;
    });
  };
  const undo = () => { const s = snapRef.current; if (!s) return; setOverrides(s.overrides); setItinerary(s.itinerary); snapRef.current = null; push({ kind: "companion", text: "Undone — back to the previous plan." }); };

  const editAckRef = useRef(null);
  const onItineraryChange = (next) => {
    setItinerary(next);
    // Pixie acknowledges manual edits in the thread, but debounced so rapid drags don't spam.
    if (editAckRef.current) clearTimeout(editAckRef.current);
    editAckRef.current = setTimeout(() => {
      push({ kind: "companion", text: "Nice — I've saved your changes and re-flowed the timing. I'll keep your Lightning Lane picks and dining reservations lined up with your new order.", receipt: "your edits saved" });
    }, 2600);
  };

  const send = async (text) => {
    if (!text.trim() || busy || !alloc) return;
    push({ kind: "user", text }); setInput(""); setBusy(true); setTab("thread");
    const ctx = { alloc, profile };
    let r = null;
    if (apiOk) {
      try {
        const state = { party: { adults: profile.adults, kidAges: profile.kidAges }, parkDays: profile.parkDays, dates: { trip: `${alloc.dates.fmtStart}-${alloc.dates.fmtEnd}`, diningWindow: alloc.dates.fmtDining, llWindow: alloc.dates.fmtLL }, budget: { target: alloc.target, room: Math.round(alloc.room), tickets: Math.round(alloc.tickets), dining: Math.round(alloc.diningCost), buffer: Math.round(alloc.buffer) }, resort: alloc.resort.name, autopilot: mode === "autopilot", ledger, missions: missions.map((m) => ({ name: m.name, status: m.status })) };
        const raw = await askClaude(THREAD_SYSTEM(state, compById(companionId)), [{ role: "user", content: text }]);
        r = parseJson(raw);
      } catch (e) { setApiOk(false); }
    }
    if (!r) r = fallbackRoute(text, ctx);

    if (r.human) {
      push({ kind: "companion", text: r.reply || "Bringing a person in." });
      setTimeout(() => push({ kind: "human", text: "Hi, I'm Ava — I've read your whole thread, so no need to repeat anything. What can I take off your plate?" }), 900);
    } else if (r.tradeoffs) {
      push({ kind: "companion", text: r.reply || "Two clean ways to free up budget:" });
      const cheaper = [...RESORTS].sort((a, b) => a.night - b.night).find((x) => x.night < alloc.resort.night);
      const opts = [];
      if (cheaper) { const na = reallocate(profile, cheaper.id); opts.push({ label: `Switch to ${cheaper.name} · save ${usd(alloc.room - na.room)}`, chipSend: `Move us to ${cheaper.name}` }); }
      const qd = PRICE.dining.quick; const kids = (profile.kidAges || []).length;
      const quickCost = ((profile.adults * qd.a + kids * qd.k) * (profile.parkDays + 1));
      if (alloc.diningCost > quickCost) opts.push({ label: `Quick-service dining · save ${usd(alloc.diningCost - quickCost)}`, chipSend: "Switch us to quick-service dining" });
      push({ kind: "act", label: "Trade-offs", icon: Wallet, title: null, body: "Tap one and it's prepared — nothing changes without your confirm.", actions: opts.map((o) => ({ label: o.label, chipSend: o.chipSend })) });
    } else if (r.prepared) {
      const pc = buildPrepared(r.prepared, profile, alloc);
      if (pc) push({ kind: "act", label: mode === "autopilot" ? "Prepared change" : "Draft change", icon: Hotel, sms: mode === "autopilot", title: pc.title, body: pc.body + (mode === "autopilot" ? " Executed by a human, verified by AI." : ""), delta: pc.delta, deltaSuffix: pc.deltaSuffix, actions: [{ label: "Confirm", primary: true, act: "confirmChange", change: pc.change }, { label: "Cancel", act: "cancelChange" }] });
      else push({ kind: "companion", text: "I couldn't match that resort — try one from the Pulse list." });
    } else if (r.edits && r.edits.length) {
      if (text.toLowerCase().includes("quick-service")) { const kids = (profile.kidAges || []).length; const qd = PRICE.dining.quick; const nc = (profile.adults * qd.a + kids * qd.k) * (profile.parkDays + 1); setAlloc((al) => ({ ...al, buffer: al.buffer + (al.diningCost - nc), diningCost: nc })); }
      applyEdits(r.edits);
      learnBehavior(text);
      push({ kind: "companion", text: r.reply || "Done.", receipt: "plan re-optimized · say \u201Cundo\u201D to reverse" });
    } else if (/^undo/i.test(text)) { undo(); }
    else {
      if (text.toLowerCase().includes("quick-service")) { const kids = (profile.kidAges || []).length; const qd = PRICE.dining.quick; const nc = (profile.adults * qd.a + kids * qd.k) * (profile.parkDays + 1); setAlloc((al) => ({ ...al, buffer: al.buffer + (al.diningCost - nc), diningCost: nc })); setProfile((p) => ({ ...p, dining: "quick" })); setItinerary(buildItinerary({ ...profile, dining: "quick" }, overrides)); push({ kind: "companion", text: "Switched to quick-service — dining budget freed into your buffer, plan re-optimized.", receipt: "plan re-optimized" }); }
      else push({ kind: "companion", text: r.reply });
    }
    setBusy(false);
  };

  /* ---------- Flow ---------- */
  const buildFromProfile = (p) => {
    if (p.starwars && !p.mustDos.includes("Star Wars: Rise of the Resistance")) p.mustDos.push("Star Wars: Rise of the Resistance");
    const a = allocateBudget(p);
    const comp = compById(companionId);
    const firstName = (userProfile?.name || "").split(" ")[0];
    const mem = buildMemory(p, companionId, userProfile);
    setProfile(p); setAlloc(a); setItinerary(buildItinerary(p, {})); setMissions(deriveMissions(p, a)); setMemory(mem);
    setMsgs([
      { id: mid(), kind: "companion", text: companionReflection(p, comp, firstName) },
      { id: mid(), kind: "memory" },
    ]);
  };
  const onBrief = async (text) => {
    setScreen("gen");
    let p = null;
    try { const raw = await askClaude(BRIEF_SYSTEM, [{ role: "user", content: text }]); p = parseJson(raw); if (!p.budget) p.budget = 6500; if (!p.pace) p.pace = "balanced"; if (!p.dining) p.dining = "mix"; if (p.characters === null || p.characters === undefined) p.characters = (p.kidAges || []).some((k) => k <= 8); }
    catch (e) { setApiOk(false); p = fallbackParseBrief(text); }
    buildFromProfile(p);
  };
  const onDiscoveryComplete = (p) => { setScreen("gen"); buildFromProfile(p); };
  const onGenerated = () => setScreen("os");

  /* A behavior the companion "learns" the first time the guest edits — proves the memory grows */
  const learnBehavior = (text) => {
    if (!memory) return;
    let learned = null;
    const t = text.toLowerCase();
    if (/relax|slower|tired|too much/.test(t)) learned = "prefers a gentler pace — I'll lean relaxed next trip";
    else if (/more rides|commando|pack|faster/.test(t)) learned = "wants to maximize rides — I'll plan bolder next time";
    else if (/quick-service|quick service/.test(t)) learned = "likes quick meals over long sit-downs";
    else if (/skyliner|riviera|hopper|resort/.test(t)) learned = "cares about resort & transport choices";
    if (learned && !memory.behaviors.includes(learned)) setMemory((m) => ({ ...m, behaviors: [...m.behaviors, learned] }));
  };

  const beginAutopilot = (fromConvert = false) => {
    setHandoff(true);
    if (fromConvert) setLedger(0); // ledger applies right after handoff via act resolution below
  };
  const finishHandoff = () => {
    setHandoff(false); setMode("autopilot");
    push({ kind: "win", label: "Autopilot on", icon: Zap, title: "I'm on it.", body: "You own everything; I do the clicking. Ask me anything, change anything with a word, and I'll bring in a human for anything irreversible — just say \u201Ctalk to a person.\u201D" });
    startScript(autopilotScript(profile, alloc));
  };
  const dismissRecapture = () => { setRecapture(null); };

  const onAssumptionChip = (a) => {
    const la = a.toLowerCase();
    if (la.includes("pace")) push({ kind: "act", label: "Change pace", title: null, body: "Pick the pace for the whole trip:", actions: [{ label: "Relaxed", chipSend: "Make the whole trip relaxed" }, { label: "Commando", chipSend: "Make day 1 commando" }] });
    else if (la.includes("dining")) push({ kind: "act", label: "Change dining", title: null, body: "How should meals work?", actions: [{ label: "Quick-service (save $)", chipSend: "Switch us to quick-service dining" }, { label: "Keep the mix", act: "cancelChange" }] });
    else if (la.includes("month")) push({ kind: "companion", text: "Tell me the month — e.g. \u201Cwe're going in October\u201D — and I'll re-derive your windows and dates." });
    else push({ kind: "companion", text: `Just tell me what to change about \u201C${a}\u201D and I'll re-engineer around it.` });
    setTab("thread");
  };

  /* ---------- Derived ---------- */
  const watchers = alloc ? [
    { name: "Room rate & promos", icon: Hotel, state: "no drop today", mins: lastChecked },
    { name: "Ticket offers", icon: Ticket, state: "none active", mins: lastChecked + 3 },
    { name: "Mission reopenings", icon: Utensils, state: missions.some((m) => m.status === "hunting") ? "scanning daily" : "staged", mins: lastChecked + 1 },
    { name: "Weather (trip week)", icon: CloudRain, state: itinerary.some((d) => d.storm) ? "storm handled" : "clear", mins: lastChecked + 5 },
    { name: "Refurbishments", icon: RefreshCw, state: "none affect you", mins: lastChecked + 8 },
    { name: "Park hours", icon: Clock, state: "as planned", mins: lastChecked + 2 },
  ] : [];
  const nextLine = alloc ? (missions.every((m) => m.status === "secured") ? `Lightning Lanes ${alloc.dates.fmtLL}` : `dining window in ${alloc.dates.daysToDining}d`) : "";

  /* ---------- Render ---------- */
  const onSSO = (provider) => { setSsoProvider(provider); setScreen("profile"); };
  const onProfileDone = (p) => { setUserProfile(p); setScreen("companion"); };
  const onCompanionChosen = (id) => { setCompanionId(id); setScreen("brief"); };

  if (screen === "landing") return (<div className="wm-body"><style>{FONT_CSS}</style><Landing onSSO={onSSO} /></div>);
  if (screen === "profile") return (<div className="wm-body"><style>{FONT_CSS}</style><ProfileCapture ssoProvider={ssoProvider} onComplete={onProfileDone} /></div>);
  if (screen === "companion") return (<div className="wm-body"><style>{FONT_CSS}</style><CompanionPicker onPick={onCompanionChosen} /></div>);
  if (screen === "brief") return (<div className="wm-body"><style>{FONT_CSS}</style><DiscoveryIntake comp={compById(companionId)} profileName={userProfile?.name} onComplete={onDiscoveryComplete} onFreeText={onBrief} /></div>);
  if (screen === "gen") return (<div className="wm-body"><style>{FONT_CSS}</style><Generating budget={(profile && profile.budget) || 6500} onDone={onGenerated} /></div>);

  return (
    <div className="wm-body min-h-screen flex flex-col" style={{ background: T.paper }}>
      <style>{FONT_CSS}</style>
      {/* Top bar */}
      <div className="px-4 py-2.5 flex items-center justify-between" style={{ background: T.night, borderBottom: `1px solid ${T.night2}` }}>
        <div className="flex items-center gap-2">
          <CompAvatar comp={compById(companionId)} size={28} />
          <div>
            <div className="text-sm font-semibold leading-tight" style={{ color: "#fff" }}>{compById(companionId).name}</div>
            <div className="text-xs leading-tight" style={{ color: T.dusk }}>your Disney companion</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {["thread", "plan", "pulse"].map((t) => (
            <button key={t} onClick={() => setTab(t)} className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize"
              style={tab === t ? { background: T.gold, color: T.night } : { color: T.dusk }}>{t}</button>
          ))}
          <span className="hidden sm:inline text-xs px-2 py-1 rounded-full ml-1" style={{ background: "rgba(255,255,255,.07)", color: T.duskDark }}>demo: 6 weeks compressed</span>
          <button onClick={skipNext} title="Next event" className="p-1.5 rounded-lg" style={{ background: "rgba(255,255,255,.07)" }}><SkipForward size={13} color={T.dusk} /></button>
        </div>
      </div>
      <StatusBar ledger={ledger} missions={missions} watchers={6} nextLine={nextLine} lastChecked={lastChecked} />

      <div className="flex-1 overflow-hidden flex flex-col">
        {tab === "plan" && <div className="flex-1 overflow-y-auto"><PlanSurface profile={profile} itinerary={itinerary} alloc={alloc} onItineraryChange={onItineraryChange} /></div>}
        {tab === "pulse" && <div className="flex-1 overflow-y-auto"><PulseSurface missions={missions} watchers={watchers} ledger={ledger} ledgerLog={ledgerLog} vault={vault} autopilot={mode === "autopilot"} memory={memory} comp={compById(companionId)} /></div>}
        {tab === "thread" && (
          <>
            <div ref={scrollRef} className="flex-1 overflow-y-auto">
              <div className="max-w-2xl mx-auto px-4 py-5 space-y-3">
                {!mode && alloc && <RevealCard profile={profile} alloc={alloc} onAutopilot={() => beginAutopilot(false)} onChip={onAssumptionChip} />}
                {mode && alloc && (
                  <div className="rounded-2xl px-4 py-3 flex items-center justify-between text-sm" style={{ background: "#fff", border: `1px solid ${T.paperEdge}` }}>
                    <span style={{ color: T.ink }}><b>{alloc.resort.name}</b> · {profile.parkDays} days · {alloc.dates.fmtStart}–{alloc.dates.fmtEnd}</span>
                    <button onClick={() => setTab("plan")} className="text-xs font-semibold" style={{ color: T.violetDeep }}>View plan →</button>
                  </div>
                )}
                {msgs.map((m) => <Msg key={m.id} m={m} onAction={onAction} comp={compById(companionId)} memory={memory} />)}
                {busy && <div className="flex items-center gap-2 text-xs" style={{ color: T.duskDark }}><Loader2 size={12} className="animate-spin" /> thinking…</div>}
              </div>
            </div>
            <div className="px-4 pb-4 pt-2" style={{ background: T.paper }}>
              <div className="max-w-2xl mx-auto">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {["When does our dining window open?", "Can I save money?", "Make Day 2 more relaxed", "Move us to the Riviera", mode === "autopilot" ? "Add another park day" : "Talk to a person"].map((c) => <Chip key={c} label={c} onClick={() => send(c)} />)}
                </div>
                <div className="flex gap-2 items-center rounded-2xl px-4 py-1.5" style={{ background: "#fff", border: `1px solid ${T.paperEdge}` }}>
                  <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send(input)}
                    placeholder="Ask anything · change anything" className="flex-1 bg-transparent outline-none text-sm py-2" style={{ color: T.ink }} />
                  <button onClick={() => send(input)} className="p-2 rounded-xl" style={{ background: T.gold }}><Send size={15} color={T.night} /></button>
                </div>
                <p className="text-center text-xs mt-2" style={{ color: T.duskDark }}>{apiOk ? "Live AI · numbers come from the engine, never the model" : "Offline mode · deterministic engine only"} · illustrative demo</p>
              </div>
            </div>
          </>
        )}
      </div>

      {handoff && <HandoffOverlay onDone={finishHandoff} />}
      {secured && <SecuredOverlay mission={secured} onDone={() => setSecured(null)} />}
      {recapture && !mode && <RecaptureOverlay data={recapture} comp={compById(companionId)}
        onStep={() => setRecapture((r) => ({ ...r, i: Math.min(r.i + 1, r.seq.length - 1) }))}
        onBook={() => { setRecapture(null); beginAutopilot(false); }}
        onClose={dismissRecapture} />}
    </div>
  );
}
