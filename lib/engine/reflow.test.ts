import { describe, expect, it } from "vitest";
import { reflowTimes } from "./itinerary";
import type { PlanItem } from "./types";

const item = (over: Partial<PlanItem>): PlanItem => ({
  type: "ride",
  time: 0,
  name: "x",
  land: "",
  dur: 0,
  tags: [],
  ...over,
});

describe("reflowTimes", () => {
  it("chains items sequentially from the leading tip's time with 5-minute gaps", () => {
    const items = [
      item({ type: "tip", time: 510, name: "Early Entry", dur: 0 }),
      item({ name: "A", time: 900, dur: 20 }),
      item({ name: "B", time: 0, dur: 45 }),
      item({ type: "meal", name: "C", time: 700, dur: 65 }),
    ];
    const out = reflowTimes(items);
    expect(out.map((x) => x.time)).toEqual([510, 510, 535, 585]);
    // durations are preserved
    expect(out.map((x) => x.dur)).toEqual([0, 20, 45, 65]);
  });

  it("starts from the first item's own time when there is no tip", () => {
    const out = reflowTimes([item({ name: "A", time: 600, dur: 20 }), item({ name: "B", time: 0, dur: 10 })]);
    expect(out[0].time).toBe(600);
    expect(out[1].time).toBe(625);
  });

  it("defaults a missing duration to 30 minutes when advancing the clock", () => {
    const out = reflowTimes([item({ name: "A", time: 600, dur: 0 }), item({ name: "B", time: 0, dur: 10 })]);
    // dur 0 is falsy → treated as 30, plus the 5-minute gap
    expect(out[1].time).toBe(635);
  });

  it("leaves a mid-list tip's time untouched and does not advance the clock for it", () => {
    const items = [item({ name: "A", time: 600, dur: 20 }), item({ type: "tip", time: 510, name: "tip", dur: 0 }), item({ name: "B", time: 0, dur: 10 })];
    const out = reflowTimes(items);
    expect(out[0].time).toBe(600);
    expect(out[1].time).toBe(510); // tip untouched
    expect(out[2].time).toBe(625); // continues from A, ignoring the tip
  });

  it("recomputes times after a reorder while preserving durations", () => {
    const a = item({ name: "A", time: 540, dur: 20 });
    const b = item({ name: "B", time: 565, dur: 45 });
    const swapped = reflowTimes([b, a]);
    expect(swapped[0]).toMatchObject({ name: "B", time: 565, dur: 45 });
    expect(swapped[1]).toMatchObject({ name: "A", time: 615, dur: 20 });
  });

  it("does not mutate the input items", () => {
    const orig = [item({ type: "tip", time: 510 }), item({ name: "A", time: 900, dur: 20 })];
    reflowTimes(orig);
    expect(orig[1].time).toBe(900);
  });

  it("returns an empty array for an empty plan", () => {
    expect(reflowTimes([])).toEqual([]);
  });
});
