import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { allocateBudget } from "@/lib/engine/budget";
import { buildItinerary } from "@/lib/engine/itinerary";
import type { Mission, Profile } from "@/lib/engine/types";
import {
  dayRowsFromItinerary,
  itemRowsFromDay,
  itineraryFromRows,
  missionRowsFromMissions,
  missionsFromRows,
  profileFromTripRow,
  tripRowFromPlan,
} from "./serialize";

beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 0, 15));
});
afterAll(() => {
  vi.useRealTimers();
});

const profile: Profile = {
  adults: 2,
  kidAges: [5, 8],
  parkDays: 4,
  month: "june",
  budget: 6500,
  pace: "balanced",
  dining: "mix",
  characters: true,
  starwars: true,
  mustDos: ["Star Wars: Rise of the Resistance"],
  skyliner: false,
  priorities: ["newest", "classics"],
  assumptions: ["Balanced pace"],
};

describe("trip row round-trip", () => {
  it("preserves every engine input through tripRowFromPlan → profileFromTripRow", () => {
    const alloc = allocateBudget(profile);
    const row = tripRowFromPlan(profile, alloc);
    expect(row.resort).toBe(alloc.resort.id);
    expect(row.status).toBe("draft");
    const back = profileFromTripRow(row);
    expect(back).toMatchObject({
      adults: 2,
      kidAges: [5, 8],
      parkDays: 4,
      month: "june",
      budget: 6500,
      pace: "balanced",
      dining: "mix",
      characters: true,
      starwars: true,
      mustDos: ["Star Wars: Rise of the Resistance"],
      skyliner: false,
      priorities: ["newest", "classics"],
      assumptions: ["Balanced pace"],
    });
    // the reconstructed profile must produce the identical allocation
    const reAlloc = allocateBudget(back);
    expect(reAlloc.resort.id).toBe(alloc.resort.id);
    expect(reAlloc.room).toBe(alloc.room);
    expect(reAlloc.tickets).toBe(alloc.tickets);
    expect(reAlloc.diningCost).toBe(alloc.diningCost);
    expect(reAlloc.buffer).toBe(alloc.buffer);
  });
});

describe("itinerary round-trip", () => {
  it("preserves the full day-by-day plan through rows and back", () => {
    const itinerary = buildItinerary(profile, {});
    const days = dayRowsFromItinerary(itinerary).map((d, i) => ({
      ...d,
      itinerary_items: itemRowsFromDay(itinerary[i].items),
    }));
    const back = itineraryFromRows(days);
    expect(back).toEqual(itinerary);
  });

  it("reorders shuffled rows by day_index and position", () => {
    const itinerary = buildItinerary(profile, {});
    const days = dayRowsFromItinerary(itinerary).map((d, i) => ({
      ...d,
      itinerary_items: [...itemRowsFromDay(itinerary[i].items)].reverse(),
    }));
    const shuffled = [...days].reverse();
    expect(itineraryFromRows(shuffled)).toEqual(itinerary);
  });
});

describe("mission round-trip", () => {
  it("preserves missions through rows and back", () => {
    const missions: Mission[] = [
      { id: "crt", name: "Cinderella's Royal Table", why: "Princess dinner in the castle", window: "Apr 16", windowDays: 91, staged: "5:40 a.m. ET on window day", backups: ["Akershus (princesses)", "Crystal Palace"], status: "staged" },
      { id: "oga", name: "Oga's Cantina", why: "Galaxy's Edge cantina table", window: "Apr 16", windowDays: 91, staged: "5:40 a.m. ET on window day", backups: ["Docking Bay 7 (walk-up)"], status: "secured", securedNote: "Party of 4 · 7:40 p.m." },
    ];
    expect(missionsFromRows(missionRowsFromMissions(missions))).toEqual(missions);
  });
});
