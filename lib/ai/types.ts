import type { Pace } from "@/lib/engine/types";

export interface ThreadEdit {
  op: "set_pace" | "remove" | "add";
  day?: number;
  pace?: Pace;
  name?: string;
}

export type PreparedIntent =
  | { kind: "resort_change"; to?: string }
  | { kind: "park_hopper" }
  | { kind: "add_day" };

export interface ThreadResult {
  reply?: string;
  edits?: ThreadEdit[];
  prepared?: PreparedIntent | null;
  human?: boolean;
  tradeoffs?: boolean;
}
