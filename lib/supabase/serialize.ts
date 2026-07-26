/* Pure mappers between engine state and database rows — no IO here, so the
   round-trips are unit-testable without a live Supabase. */

import type { Alloc, DayPlan, DiningStyle, FamilyMemory, MemoryFact, Mission, MissionStatus, Pace, PlanItem, PlanItemType, Priority, Profile } from "@/lib/engine/types";
import type { ParkKey } from "@/lib/catalog/parks";

export interface TripParty {
  adults?: number;
  kid_ages?: number[];
  characters?: boolean | null;
  starwars?: boolean;
  must_dos?: string[];
  skyliner?: boolean;
  assumptions?: string[];
}

export interface TripRow {
  id?: string;
  user_id?: string;
  party: TripParty;
  park_days: number;
  month: string | null;
  budget: number | null;
  pace: Pace | null;
  dining: DiningStyle | null;
  priorities: string[];
  resort: string | null;
  status: "draft" | "booked" | "archived";
}

export interface ItineraryRow {
  id?: string;
  trip_id?: string;
  user_id?: string;
  day_index: number;
  park: ParkKey;
  park_name: string;
  storm: boolean;
  ll: { mp: string[]; sp: string | null };
}

export interface ItineraryItemRow {
  id?: string;
  itinerary_id?: string;
  user_id?: string;
  position: number;
  type: PlanItemType;
  time_min: number;
  name: string;
  land: string;
  dur_min: number;
  indoor: boolean | null;
  note: string | null;
  tags: string[];
}

export interface MissionRow {
  id?: string;
  trip_id?: string;
  user_id?: string;
  mission_key: string;
  name: string;
  why: string | null;
  status: MissionStatus;
  window: string | null;
  window_days: number | null;
  staged: string | null;
  backups: string[];
  secured_note: string | null;
}

export interface MemoryRow {
  id?: string;
  user_id?: string;
  facts: MemoryFact[];
  behaviors: string[];
  trips_planned: number;
}

export function tripRowFromPlan(profile: Profile, alloc: Alloc): TripRow {
  return {
    party: {
      adults: profile.adults,
      kid_ages: profile.kidAges,
      characters: profile.characters,
      starwars: profile.starwars,
      must_dos: profile.mustDos,
      skyliner: profile.skyliner,
      assumptions: profile.assumptions,
    },
    park_days: profile.parkDays || 4,
    month: profile.month ?? null,
    budget: profile.budget ?? null,
    pace: profile.pace ?? null,
    dining: profile.dining ?? null,
    priorities: profile.priorities || [],
    resort: alloc.resort.id,
    status: "draft",
  };
}

export function profileFromTripRow(row: TripRow): Profile {
  const party = row.party || {};
  return {
    adults: party.adults,
    kidAges: party.kid_ages,
    characters: party.characters,
    starwars: party.starwars,
    mustDos: party.must_dos,
    skyliner: party.skyliner,
    assumptions: party.assumptions ?? [],
    parkDays: row.park_days,
    month: row.month,
    budget: row.budget,
    pace: row.pace,
    dining: row.dining,
    priorities: (row.priorities || []) as Priority[],
  };
}

export function dayRowsFromItinerary(itinerary: DayPlan[]): ItineraryRow[] {
  return itinerary.map((d, i) => ({
    day_index: i,
    park: d.park,
    park_name: d.parkName,
    storm: d.storm,
    ll: d.ll,
  }));
}

export function itemRowsFromDay(items: PlanItem[]): ItineraryItemRow[] {
  return items.map((it, i) => ({
    position: i,
    type: it.type,
    time_min: it.time,
    name: it.name,
    land: it.land,
    dur_min: it.dur,
    indoor: it.indoor ?? null,
    note: it.note ?? null,
    tags: it.tags || [],
  }));
}

export function itineraryFromRows(days: (ItineraryRow & { itinerary_items: ItineraryItemRow[] })[]): DayPlan[] {
  return [...days]
    .sort((a, b) => a.day_index - b.day_index)
    .map((d) => ({
      park: d.park,
      parkName: d.park_name,
      storm: d.storm,
      ll: { mp: d.ll?.mp || [], sp: d.ll?.sp ?? null },
      items: [...(d.itinerary_items || [])]
        .sort((a, b) => a.position - b.position)
        .map((r) => ({
          type: r.type,
          time: r.time_min,
          name: r.name,
          land: r.land,
          dur: r.dur_min,
          indoor: r.indoor ?? undefined,
          note: r.note ?? undefined,
          tags: r.tags || [],
        })),
    }));
}

export function missionRowsFromMissions(missions: Mission[]): MissionRow[] {
  return missions.map((m) => ({
    mission_key: m.id,
    name: m.name,
    why: m.why ?? null,
    status: m.status,
    window: m.window ?? null,
    window_days: m.windowDays ?? null,
    staged: m.staged ?? null,
    backups: m.backups || [],
    secured_note: m.securedNote ?? null,
  }));
}

export function missionsFromRows(rows: MissionRow[]): Mission[] {
  return rows.map((r) => ({
    id: r.mission_key,
    name: r.name,
    why: r.why ?? "",
    status: r.status,
    window: r.window ?? "",
    windowDays: r.window_days ?? 0,
    staged: r.staged ?? "",
    backups: r.backups || [],
    securedNote: r.secured_note ?? undefined,
  }));
}

export function memoryRowFromMemory(memory: FamilyMemory): Omit<MemoryRow, "id" | "user_id"> {
  return {
    facts: memory.facts,
    behaviors: memory.behaviors,
    trips_planned: memory.tripsPlanned,
  };
}

export function memoryFromRow(row: MemoryRow, companionId: string | null, profile: Profile): FamilyMemory {
  return {
    companionId,
    family: {
      adults: profile.adults,
      kids: (profile.kidAges || []).map((age, i) => ({ age, label: `Child ${i + 1}` })),
    },
    facts: row.facts || [],
    behaviors: row.behaviors || [],
    tripsPlanned: row.trips_planned ?? 1,
  };
}
