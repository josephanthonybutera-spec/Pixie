import type { LucideIcon } from "lucide-react";
import type { Alloc, Profile } from "@/lib/engine/types";

/** A fully-priced change the engine prepared; confirmed via a message action. */
export type PreparedChange =
  | { kind: "resort_change"; newAlloc: Alloc }
  | { kind: "park_hopper"; delta: number }
  | { kind: "add_day"; newProfile: Profile; newAlloc: Alloc };

export interface MsgAction {
  label: string;
  primary?: boolean;
  act?: string;
  change?: PreparedChange;
  chipSend?: string;
}

export type MsgKind = "companion" | "user" | "sys" | "human" | "memory" | "act" | "win" | "brief";

export interface Message {
  id: string;
  kind: MsgKind;
  text?: string;
  receipt?: string;
  label?: string | null;
  icon?: LucideIcon;
  sms?: boolean;
  title?: string | null;
  body?: string;
  delta?: number | null;
  deltaSuffix?: string;
  actions?: MsgAction[] | null;
  resolved?: string;
}

export interface Watcher {
  name: string;
  icon: LucideIcon;
  state: string;
  mins: number;
}

export interface VaultItem {
  name: string;
  conf?: string;
}

export interface RecaptureMsg {
  at: string;
  channel: "email" | "sms";
  subject?: string;
  body: string;
  cta?: string;
}

export interface RecaptureState {
  seq: RecaptureMsg[];
  i: number;
  revealed: boolean;
}
