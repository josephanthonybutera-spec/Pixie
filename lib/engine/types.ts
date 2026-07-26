import type { ParkKey } from "@/lib/catalog/parks";
import type { Resort } from "@/lib/catalog/resorts";

export type Pace = "relaxed" | "balanced" | "commando";
export type DiningStyle = "table" | "quick" | "mix";
export type Priority = "newest" | "classics" | "thrills" | "gentle";

/** The family's trip brief. Fields stay optional because both the LLM parse
 *  and the fallback parser can return partial data — the engine defaults
 *  everything defensively. */
export interface Profile {
  adults?: number;
  kidAges?: number[];
  parkDays?: number;
  month?: string | null;
  budget?: number | null;
  pace?: Pace | null;
  mustDos?: string[];
  characters?: boolean | null;
  starwars?: boolean;
  dining?: DiningStyle | null;
  skyliner?: boolean;
  priorities?: Priority[];
  assumptions?: string[];
  _note?: string;
}

export interface DerivedDates {
  start: Date;
  end: Date;
  nights: number;
  fmtStart: string;
  fmtEnd: string;
  diningWindow: Date;
  fmtDining: string;
  llWindow: Date;
  fmtLL: string;
  daysToDining: number;
  daysToTrip: number;
}

export interface Alloc {
  resort: Resort;
  room: number;
  tickets: number;
  diningCost: number;
  buffer: number;
  target: number;
  nights: number;
  dates: DerivedDates;
}

export type PlanItemType = "tip" | "ride" | "meal" | "break" | "show" | "char" | "night";

export interface PlanItem {
  type: PlanItemType;
  /** minutes since midnight */
  time: number;
  name: string;
  land: string;
  dur: number;
  indoor?: boolean;
  note?: string;
  tags: string[];
  _id?: string;
}

export interface DayPlan {
  park: ParkKey;
  parkName: string;
  items: PlanItem[];
  storm: boolean;
  ll: { mp: string[]; sp: string | null };
}

export interface DayOverride {
  park?: ParkKey;
  pace?: Pace;
  exclude?: string[];
  include?: string[];
}

export type Overrides = Record<number, DayOverride>;

export type MissionStatus = "staged" | "attempting" | "hunting" | "secured";

export interface Mission {
  id: string;
  name: string;
  why: string;
  window: string;
  windowDays: number;
  staged: string;
  backups: string[];
  status: MissionStatus;
  securedNote?: string;
}

export interface MemoryFact {
  k: string;
  v: string;
  src: string;
}

export interface FamilyMemory {
  companionId: string | null;
  family: { adults?: number; kids: { age: number; label: string }[]; name?: string };
  facts: MemoryFact[];
  behaviors: string[];
  tripsPlanned: number;
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  matchDisney: boolean;
  ssoProvider: string | null;
}
