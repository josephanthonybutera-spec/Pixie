import type { DiningStyle, Pace, Priority, Profile } from "./types";

/** Working state accumulated while the discovery intake runs. Underscore keys
 *  are temporary flags that normalizeState folds into the final Profile. */
export interface IntakeState {
  adults?: number;
  kidAges?: number[];
  parkDays?: number;
  month?: string;
  budget?: number;
  pace?: Pace;
  dining?: DiningStyle;
  characters?: boolean;
  starwars?: boolean;
  mustDos?: string[];
  priorities?: Priority[];
  assumptions?: string[];
  _kidBand?: "young" | "big" | "none" | "mixed";
  _sw?: boolean;
  _thrill?: boolean;
  _magic?: boolean;
  _pNew?: boolean;
  _pClassic?: boolean;
  _pThrill?: boolean;
  _pGentle?: boolean;
  _note?: string;
}

export function normalizeState(s: IntakeState): Profile {
  const p: IntakeState = { ...s };
  if (p._kidBand && (!p.kidAges || !p.kidAges.length)) {
    // if they skipped ages, infer a reasonable default from band
    if (!p.kidAges) p.kidAges = p._kidBand === "young" ? [5] : p._kidBand === "big" ? [10] : p._kidBand === "mixed" ? [5, 10] : [];
  }
  if (!p.kidAges) p.kidAges = [];
  p.adults = p.adults || 2;
  p.parkDays = p.parkDays || 4;
  p.month = p.month || "October";
  p.pace = p.pace || "balanced";
  p.dining = p.dining || "mix";
  p.budget = p.budget || 6500;
  if (p.characters === undefined) p.characters = p.kidAges.some((a) => a <= 8);
  p.starwars = !!p.starwars;
  const prio: Priority[] = [];
  if (p._pNew) prio.push("newest");
  if (p._pClassic) prio.push("classics");
  if (p._pThrill) prio.push("thrills");
  if (p._pGentle) prio.push("gentle");
  if (p._thrill && !prio.includes("thrills")) prio.push("thrills");
  p.priorities = prio;
  p.mustDos = p.mustDos || [];
  if (p.starwars && !p.mustDos.includes("Star Wars: Rise of the Resistance")) p.mustDos.push("Star Wars: Rise of the Resistance");
  p.assumptions = [];
  return p;
}
