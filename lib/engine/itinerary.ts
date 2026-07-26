import { ATTR, type Attraction } from "@/lib/catalog/attractions";
import { DINING, type DiningVenue } from "@/lib/catalog/dining";
import { PARKS, type Park, type ParkKey } from "@/lib/catalog/parks";
import { ageToHeight, parseHM, walkMins } from "./format";
import type { DayOverride, DayPlan, Overrides, PlanItem, Profile } from "./types";

type ScoredAttraction = Attraction & { s: number; cannot: boolean };

export function assignParks(profile: Profile): ParkKey[] {
  const n = Math.max(1, Math.min(6, profile.parkDays || 4));
  const young = (profile.kidAges || []).some((a) => a <= 6);
  const seqs: Record<number, ParkKey[]> = {
    1: ["MK"],
    2: ["MK", "HS"],
    3: young ? ["MK", "AK", "HS"] : ["MK", "HS", "EP"],
    4: ["MK", "EP", "HS", "AK"],
    5: ["MK", "HS", "EP", "AK", "MK"],
    6: ["MK", "EP", "HS", "AK", "MK", "EP"],
  };
  const seq = seqs[n].slice();
  const need = new Set(
    (profile.mustDos || [])
      .map((nm) => ATTR.find((a) => a.name === nm)?.park)
      .filter((p): p is ParkKey => Boolean(p))
  );
  need.forEach((p) => {
    if (!seq.includes(p)) seq[seq.length - 1] = p;
  });
  return seq;
}

export function buildDay(parkKey: ParkKey, profile: Profile, ov: DayOverride = {}): DayPlan {
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
  const prios = new Set<string>(profile.priorities || []); // newest | classics | thrills | gentle | characters
  const scored: ScoredAttraction[] = pool.map((a) => {
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

  const items: PlanItem[] = [];
  let t = parseHM(park.open) - 30;
  let lastLand = 0;
  const push = (it: Omit<PlanItem, "tags"> & { tags?: string[] }) => items.push({ tags: [], ...it });

  push({ type: "tip", time: t, name: "Early Theme Park Entry", note: "Resort guests get in 30 minutes early — the plan is built around it.", land: "", dur: 0 });
  rope.sort((a, b) => a.land - b.land || (b.wait[1] - b.wait[0]) - (a.wait[1] - a.wait[0]));
  rope.forEach((r) => {
    t += walkMins(lastLand, r.land);
    lastLand = r.land;
    const wait = Math.round(r.wait[0] * 0.55);
    push({ type: "ride", time: t, name: r.name, land: park.lands[r.land], dur: r.dur + wait, indoor: r.indoor, note: `Standby jumps from ~${r.wait[0]} to ~${r.wait[1]} min by midday — this is a rope-drop anchor.`, tags: r.cannot ? ["Rider Switch"] : [] });
    t += r.dur + wait + 5;
  });
  rest.splice(0, 2).sort((a, b) => Math.abs(a.land - lastLand) - Math.abs(b.land - lastLand)).forEach((r) => {
    t += walkMins(lastLand, r.land);
    lastLand = r.land;
    const wait = Math.round(((r.wait[0] + r.wait[1]) / 2) * 0.8);
    push({ type: "ride", time: t, name: r.name, land: park.lands[r.land], dur: r.dur + wait, indoor: r.indoor, note: `Clustered in ${park.lands[r.land]} to cut backtracking.`, tags: r.cannot ? ["Rider Switch"] : [] });
    t += r.dur + wait + 5;
  });

  const wantTable = (profile.dining || "mix") !== "quick";
  let lunch: DiningVenue | null = null;
  let dinner: DiningVenue | null = null;
  if (wantTable) {
    const opts = DINING.filter((d) => d.park === parkKey).sort(
      (a, b) =>
        (b.kid * (young ? 1 : 0.4) + (profile.characters && b.char ? 3 : 0)) -
        (a.kid * (young ? 1 : 0.4) + (profile.characters && a.char ? 3 : 0))
    );
    lunch = opts[0];
    dinner = opts.find((d) => d !== lunch) || opts[1];
  }
  t = Math.max(t, parseHM("11:45"));
  if (lunch) {
    push({ type: "meal", time: t, name: lunch.name, land: "Table service", dur: 65, indoor: true, note: lunch.diff >= 3 ? "Books out at the 60-day mark — staged for the second your window opens." : "Locked at your 60-day dining window.", tags: lunch.char ? ["Characters"] : [] });
    t += 70;
  } else {
    push({ type: "meal", time: t, name: "Quick-service lunch", land: "Mobile order", dur: 40, indoor: true, note: "Mobile order 30 min ahead — skip the line entirely.", tags: [] });
    t += 45;
  }

  if (young && pace !== "commando") {
    push({ type: "break", time: t, name: "Resort break — pool + nap", land: "Your resort", dur: 120, indoor: true, note: "The secret weapon. Everyone returns human for the evening.", tags: [] });
    t += 130;
  }

  [...shows, ...chars].forEach((s) => {
    const at = s.at ? parseHM(s.at) : t;
    t = Math.max(t, at);
    push({ type: s.type === "char" ? "char" : "show", time: t, name: s.name, land: park.lands[s.land], dur: s.dur + 10, indoor: s.indoor !== false, note: s.type === "char" ? "Shortest character line of the day is mid-afternoon." : "A seat during the heat peak.", tags: [] });
    t += s.dur + 15;
  });
  rest.slice(0, 2).forEach((r) => {
    t += walkMins(lastLand, r.land);
    lastLand = r.land;
    const wait = r.ll ? 12 : Math.round(r.wait[1] * 0.7);
    push({ type: "ride", time: t, name: r.name, land: park.lands[r.land], dur: r.dur + wait, indoor: r.indoor, note: r.ll ? "Lightning Lane return window — walk on." : "Waits dip as dinner crowds form.", tags: r.cannot ? ["Rider Switch"] : [] });
    t += r.dur + wait + 5;
  });
  t = Math.max(t, parseHM("17:45"));
  if (dinner) {
    push({ type: "meal", time: t, name: dinner.name, land: "Table service", dur: 70, indoor: true, note: "Reserved at your 60-day window.", tags: dinner.char ? ["Characters"] : [] });
    t += 75;
  }
  const headliner = rest.find((r) => r.ll === "SP") || rest[2];
  if (headliner) {
    t += walkMins(lastLand, headliner.land);
    lastLand = headliner.land;
    push({ type: "ride", time: t, name: headliner.name, land: park.lands[headliner.land], dur: headliner.dur + 15, indoor: headliner.indoor, note: headliner.ll === "SP" ? "Single Pass return — the headliner without the 90-minute line." : "Evening waits drop 30–40% after dinner.", tags: headliner.cannot ? ["Rider Switch"] : [] });
    t += headliner.dur + 20;
  }
  if (park.night) {
    t = Math.max(t, parseHM("20:45"));
    push({ type: "night", time: t, name: park.night, land: "Viewing spot staked 25 min early", dur: 20, indoor: false, note: "Every day ends on a high note — peak-end rule.", tags: [] });
  }

  const mpPicks = rides.filter((r) => r.ll === "MP").sort((a, b) => b.wait[1] - a.wait[1]).slice(0, 3).map((r) => r.name);
  const sp = rides.find((r) => r.ll === "SP");
  return { park: parkKey, parkName: park.name, items, storm: false, ll: { mp: mpPicks, sp: sp ? sp.name : null } };
}

export function buildItinerary(profile: Profile, overrides: Overrides = {}): DayPlan[] {
  return assignParks(profile).map((p, i) => {
    const ov = overrides[i] || {};
    return buildDay(ov.park || p, profile, ov);
  });
}

/* Re-flow times sequentially after a manual reorder, preserving each item's duration
   and any fixed showtimes. Keeps the plan coherent when the guest drags things around. */
export function reflowTimes(items: PlanItem[]): PlanItem[] {
  const out = items.map((x) => ({ ...x }));
  let t: number | null = null;
  for (let i = 0; i < out.length; i++) {
    const it = out[i];
    if (it.type === "tip") {
      if (t == null) t = it.time;
      continue;
    }
    if (t == null) t = it.time;
    it.time = t;
    t += (it.dur || 30) + 5;
  }
  return out;
}

/* Build a plan item from a catalog attraction for manual "add" */
export function makePlanItem(attr: Attraction, park: Park): PlanItem {
  const midWait = attr.type === "ride" ? Math.round(((attr.wait[0] + attr.wait[1]) / 2) * 0.8) : 0;
  return {
    type: attr.type === "char" ? "char" : attr.type === "show" ? "show" : "ride",
    time: parseHM("12:00"),
    name: attr.name,
    land: park.lands[attr.land] || "",
    dur: (attr.dur || 10) + midWait,
    indoor: attr.indoor,
    tags: ["Added by you"],
    note: "You added this one — I slotted it in and kept the day flowing.",
    _id: attr.id,
  };
}
