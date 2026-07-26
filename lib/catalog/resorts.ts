/* ============================================================
   WALT DISNEY WORLD RESORTS — real properties with 2026 rack-rate
   ranges for the standard room category, from public sources
   (mousesavers.com and touringplans.com 2026 rate charts; anchors:
   Pop Century std from $213, Art of Animation Little Mermaid std from
   $251, Wilderness Lodge std from $558, moderates ~$290–475/night).
   Updated: July 2026. High ends are peak/holiday editorial estimates —
   verify against the rate charts when updating.

   `night` is the representative mid-season nightly rate the engine
   uses for budget math; `range` is the honest public low–high spread.
   ============================================================ */

export type ResortTier = "Value" | "Moderate" | "Deluxe";

export interface Resort {
  id: string;
  name: string;
  tier: ResortTier;
  /** representative mid-season nightly rack rate (standard room) */
  night: number;
  /** 2026 rack-rate range for the standard room, low–high per night */
  range: [number, number];
  transport: string;
  skyliner: boolean;
  note: string;
}

export const RESORTS: Resort[] = [
  { id: "pop", name: "Pop Century", tier: "Value", night: 280, range: [213, 390], transport: "Skyliner", skyliner: true, note: "Skyliner to EPCOT + Hollywood Studios" },
  { id: "aoa", name: "Art of Animation", tier: "Value", night: 320, range: [251, 450], transport: "Skyliner", skyliner: true, note: "Little Mermaid rooms; family suites cost roughly double" },
  { id: "cbr", name: "Caribbean Beach", tier: "Moderate", night: 365, range: [290, 475], transport: "Skyliner", skyliner: true, note: "Skyliner hub — two parks without a bus" },
  { id: "por", name: "Port Orleans Riverside", tier: "Moderate", night: 355, range: [285, 470], transport: "Bus + boat", skyliner: false, note: "Boat to Disney Springs" },
  { id: "coro", name: "Coronado Springs", tier: "Moderate", night: 345, range: [275, 460], transport: "Bus", skyliner: false, note: "Quietest moderate; great pool" },
  { id: "wl", name: "Wilderness Lodge", tier: "Deluxe", night: 690, range: [558, 950], transport: "Boat to MK", skyliner: false, note: "Boat to Magic Kingdom" },
  { id: "akl", name: "Animal Kingdom Lodge", tier: "Deluxe", night: 705, range: [570, 980], transport: "Bus", skyliner: false, note: "Savanna views from the room" },
  { id: "riv", name: "Riviera Resort", tier: "Deluxe", night: 780, range: [640, 1100], transport: "Skyliner", skyliner: true, note: "Skyliner + rooftop fireworks views" },
  { id: "bc", name: "Beach Club", tier: "Deluxe", night: 790, range: [640, 1130], transport: "Walk to EPCOT", skyliner: false, note: "Walk to EPCOT; best pool on property" },
  { id: "contemp", name: "Contemporary", tier: "Deluxe", night: 810, range: [650, 1200], transport: "Walk to MK + monorail", skyliner: false, note: "Walk to Magic Kingdom" },
  { id: "poly", name: "Polynesian Village", tier: "Deluxe", night: 840, range: [680, 1250], transport: "Monorail", skyliner: false, note: "Monorail loop; fireworks from the beach" },
];
