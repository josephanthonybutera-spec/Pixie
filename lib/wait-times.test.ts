import { describe, expect, it } from "vitest";
import { ATTR } from "@/lib/catalog/attractions";
import { applyLiveWait, matchParkWaits, normalizeRideName, type QTRide } from "./wait-times";

const ride = (name: string, wait = 30, open = true): QTRide => ({ id: Math.abs(name.length), name, is_open: open, wait_time: wait });

describe("normalizeRideName", () => {
  it("strips punctuation, curly quotes, and trademark marks", () => {
    expect(normalizeRideName("“it's a small world”")).toBe("it s a small world");
    expect(normalizeRideName("The Twilight Zone Tower of Terror™")).toBe("the twilight zone tower of terror");
    expect(normalizeRideName("Na'vi River Journey")).toBe("na vi river journey");
  });
});

describe("matchParkWaits", () => {
  it("matches exact names and Queue-Times naming variants", () => {
    const { byId, unmatched } = matchParkWaits("HS", [
      ride("Star Wars: Rise of the Resistance", 90),
      ride("Rock 'n' Roller Coaster Starring Aerosmith", 45), // longer official name
      ride("Slinky Dog Dash", 75),
      ride("Alien Swirling Saucers", 20), // not in our catalog
    ]);
    expect(byId["rise"]?.wait_time).toBe(90);
    expect(byId["rnrc"]?.wait_time).toBe(45);
    expect(byId["slinky"]?.wait_time).toBe(75);
    expect(unmatched).toEqual(["Alien Swirling Saucers"]);
  });

  it("handles subtitle and shortened variants via containment", () => {
    const { byId } = matchParkWaits("AK", [ride("Expedition Everest - Legend of the Forbidden Mountain", 40)]);
    expect(byId["everest"]?.wait_time).toBe(40);
    const ep = matchParkWaits("EP", [ride("Soarin'", 35)]);
    expect(ep.byId["soarin"]?.wait_time).toBe(35);
  });

  it("reports every unmatched ride so the catalog can be fixed", () => {
    const { unmatched } = matchParkWaits("MK", [ride("Tomorrowland Speedway"), ride("Mad Tea Party")]);
    expect(unmatched).toEqual(["Tomorrowland Speedway", "Mad Tea Party"]);
  });
});

describe("applyLiveWait", () => {
  it("anchors the midday level to the live wait and keeps the day-shape", () => {
    const sevenDwarfs = ATTR.find((a) => a.id === "7dmt")!; // wait [45, 85, 70]
    const live = applyLiveWait(sevenDwarfs, 170); // 2× the editorial midday
    expect(live.wait).toEqual([90, 170, 140]);
    // original is untouched (pure)
    expect(sevenDwarfs.wait).toEqual([45, 85, 70]);
  });

  it("floors scaled waits at 5 minutes", () => {
    const pirates = ATTR.find((a) => a.id === "potc")!; // wait [15, 35, 25]
    expect(applyLiveWait(pirates, 0).wait).toEqual([5, 5, 5]);
  });

  it("leaves shows untouched (no meaningful midday wait)", () => {
    const parade = ATTR.find((a) => a.id === "parade")!;
    expect(applyLiveWait(parade, 60)).toBe(parade);
  });
});
