export type ResortTier = "Value" | "Moderate" | "Deluxe";

export interface Resort {
  id: string;
  name: string;
  tier: ResortTier;
  night: number;
  transport: string;
  skyliner: boolean;
  note: string;
}

/* ---------- Resorts + illustrative pricing ---------- */
export const RESORTS: Resort[] = [
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
