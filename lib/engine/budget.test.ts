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

describe("allocateBudget", () => {
  it("computes tickets, dining, and nights from the price table", () => {
    const a = allocateBudget(baseProfile);
    // (2 adults × $142 + 2 kids × $131) × 4 park days
    expect(a.tickets).toBe((2 * PRICE.ticketAdultPerDay + 2 * PRICE.ticketKidPerDay) * 4);
    expect(a.tickets).toBe(2184);
    // mix dining rate × (parkDays + 1) days
    expect(a.diningCost).toBe((2 * PRICE.dining.mix.a + 2 * PRICE.dining.mix.k) * 5);
    expect(a.diningCost).toBe(840);
    // nights = parkDays + 1
    expect(a.nights).toBe(5);
    expect(a.target).toBe(6500);
  });

  it("picks the most expensive resort that still leaves a non-negative buffer", () => {
    const a = allocateBudget(baseProfile);
    // Remaining room budget is 6500 − 2184 − 840 = 3476 → Polynesian (688 × 5 = 3440) fits.
    expect(a.resort.id).toBe("poly");
    expect(a.room).toBe(3440);
    expect(a.buffer).toBe(36);
    expect(a.room + a.tickets + a.diningCost + a.buffer).toBe(a.target);
  });

  it("restricts to Skyliner resorts when the family wants the Skyliner", () => {
    const a = allocateBudget({ ...baseProfile, skyliner: true });
    expect(a.resort.skyliner).toBe(true);
    // Nicest Skyliner resort that fits is the Riviera (524 × 5 = 2620).
    expect(a.resort.id).toBe("riv");
    expect(a.buffer).toBe(6500 - (2620 + 2184 + 840));
  });

  it("falls back to the cheapest resort (negative buffer) when nothing fits the budget", () => {
    const a = allocateBudget({ adults: 2, kidAges: [], parkDays: 4, month: "june", budget: 2000, dining: "quick" });
    // Cheapest option: Pop Century 189 × 5 = 945; tickets 1136; quick dining 380 → over budget.
    expect(a.resort.id).toBe("pop");
    expect(a.room).toBe(945);
    expect(a.buffer).toBe(2000 - (945 + 1136 + 380));
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
    expect(a.room).toBe(189 * 5);
    expect(a.buffer).toBe(6500 - (945 + 2184 + 840));
    // tickets and dining are untouched by a resort change
    expect(a.tickets).toBe(2184);
    expect(a.diningCost).toBe(840);
  });

  it("keeps the original resort when the id is unknown", () => {
    const a = reallocate(baseProfile, "not-a-resort");
    expect(a.resort.id).toBe("poly");
  });
});
