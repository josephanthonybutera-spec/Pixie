import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { allocateBudget, reallocate } from "./budget";
import { PRICE } from "@/lib/catalog/price";
import type { Profile } from "./types";

// deriveDates (used inside allocateBudget) reads the current date, so pin the
// clock to keep resort selection and nights deterministic.
beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 0, 15)); // Jan 15, 2026
});
afterAll(() => {
  vi.useRealTimers();
});

const baseProfile: Profile = {
  adults: 2,
  kidAges: [5, 8],
  parkDays: 4,
  month: "june",
  budget: 6500,
  dining: "mix",
};

// derived from the real-data catalog: tickets (2×$140 + 2×$132) × 4 days,
// mix dining (2×$62 + 2×$30) × 5 days
const BASE_TICKETS = (2 * PRICE.ticketAdultPerDay + 2 * PRICE.ticketKidPerDay) * 4;
const BASE_DINING = (2 * PRICE.dining.mix.a + 2 * PRICE.dining.mix.k) * 5;

describe("allocateBudget", () => {
  it("computes tickets, dining, and nights from the price table", () => {
    const a = allocateBudget(baseProfile);
    expect(a.tickets).toBe(BASE_TICKETS);
    expect(a.tickets).toBe(2176);
    expect(a.diningCost).toBe(BASE_DINING);
    expect(a.diningCost).toBe(920);
    // nights = parkDays + 1
    expect(a.nights).toBe(5);
    expect(a.target).toBe(6500);
  });

  it("picks the most expensive resort that still leaves a non-negative buffer", () => {
    const a = allocateBudget(baseProfile);
    // Room budget is 6500 − 2176 − 920 = 3404 → Caribbean Beach ($365 × 5 =
    // $1,825) is the priciest fit; every Deluxe is over.
    expect(a.resort.id).toBe("cbr");
    expect(a.room).toBe(365 * 5);
    expect(a.buffer).toBe(6500 - (1825 + BASE_TICKETS + BASE_DINING));
    expect(a.room + a.tickets + a.diningCost + a.buffer).toBe(a.target);
  });

  it("restricts to Skyliner resorts when the family wants the Skyliner", () => {
    // At $9,000 the unrestricted pick is the Polynesian; requiring the
    // Skyliner routes to the Riviera instead.
    const rich = { ...baseProfile, budget: 9000 };
    expect(allocateBudget(rich).resort.id).toBe("poly");
    const sky = allocateBudget({ ...rich, skyliner: true });
    expect(sky.resort.skyliner).toBe(true);
    expect(sky.resort.id).toBe("riv");
    expect(sky.buffer).toBe(9000 - (780 * 5 + BASE_TICKETS + BASE_DINING));
  });

  it("falls back to the cheapest resort (negative buffer) when nothing fits the budget", () => {
    const a = allocateBudget({ adults: 2, kidAges: [], parkDays: 4, month: "june", budget: 2000, dining: "quick" });
    // Cheapest option: Pop Century $280 × 5 = $1,400; tickets $1,120; quick dining $400.
    expect(a.resort.id).toBe("pop");
    expect(a.room).toBe(280 * 5);
    expect(a.buffer).toBe(2000 - (1400 + 2 * PRICE.ticketAdultPerDay * 4 + 2 * PRICE.dining.quick.a * 5));
    expect(a.buffer).toBeLessThan(0);
  });

  it("falls back to the cheapest Skyliner resort when Skyliner is required and nothing fits", () => {
    const a = allocateBudget({ adults: 2, kidAges: [], parkDays: 4, month: "june", budget: 2000, dining: "quick", skyliner: true });
    expect(a.resort.skyliner).toBe(true);
    expect(a.resort.id).toBe("pop");
  });

  it("applies engine defaults for missing fields (2 adults, 4 days, $6,500, mix dining)", () => {
    const a = allocateBudget({});
    expect(a.target).toBe(6500);
    expect(a.nights).toBe(5);
    expect(a.tickets).toBe(2 * PRICE.ticketAdultPerDay * 4);
    expect(a.diningCost).toBe(2 * PRICE.dining.mix.a * 5);
  });
});

describe("reallocate", () => {
  it("re-prices the room for the requested resort and recomputes the buffer", () => {
    const a = reallocate(baseProfile, "pop");
    expect(a.resort.id).toBe("pop");
    expect(a.room).toBe(280 * 5);
    expect(a.buffer).toBe(6500 - (1400 + BASE_TICKETS + BASE_DINING));
    // tickets and dining are untouched by a resort change
    expect(a.tickets).toBe(BASE_TICKETS);
    expect(a.diningCost).toBe(BASE_DINING);
  });

  it("keeps the original resort when the id is unknown", () => {
    const a = reallocate(baseProfile, "not-a-resort");
    expect(a.resort.id).toBe("cbr");
  });
});
