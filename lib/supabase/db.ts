/* Thin IO layer over Supabase. Every call is best-effort: failures are
   logged and swallowed so persistence problems never break the in-memory
   demo experience. */

import type { SupabaseClient } from "@supabase/supabase-js";
import { allocateBudget, reallocate } from "@/lib/engine/budget";
import type { Alloc, DayPlan, FamilyMemory, Mission, Profile, UserProfile } from "@/lib/engine/types";
import {
  dayRowsFromItinerary,
  itemRowsFromDay,
  itineraryFromRows,
  memoryFromRow,
  memoryRowFromMemory,
  missionRowsFromMissions,
  missionsFromRows,
  profileFromTripRow,
  tripRowFromPlan,
  type ItineraryItemRow,
  type ItineraryRow,
  type MemoryRow,
  type MissionRow,
  type TripRow,
} from "./serialize";

export interface ProfileRow {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  disney_email_match: boolean;
  companion_id: string | null;
  onboarded: boolean;
}

export interface LoadedTrip {
  tripId: string;
  status: TripRow["status"];
  profile: Profile;
  alloc: Alloc;
  itinerary: DayPlan[];
  missions: Mission[];
  memory: FamilyMemory | null;
}

const warn = (op: string, error: unknown) => console.warn(`[pixie/db] ${op} failed:`, error);

export async function fetchProfile(supabase: SupabaseClient, userId: string): Promise<ProfileRow | null> {
  try {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (error) throw error;
    return (data as ProfileRow) ?? null;
  } catch (e) {
    warn("fetchProfile", e);
    return null;
  }
}

export async function upsertProfile(supabase: SupabaseClient, userId: string, p: UserProfile): Promise<void> {
  try {
    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      name: p.name,
      email: p.email,
      phone: p.phone,
      disney_email_match: p.matchDisney,
      onboarded: true,
    });
    if (error) throw error;
  } catch (e) {
    warn("upsertProfile", e);
  }
}

export async function setProfileCompanion(supabase: SupabaseClient, userId: string, companionId: string): Promise<void> {
  try {
    const { error } = await supabase.from("profiles").upsert({ id: userId, companion_id: companionId });
    if (error) throw error;
  } catch (e) {
    warn("setProfileCompanion", e);
  }
}

/** Persist a freshly generated plan: trip + per-day itineraries + items +
 *  missions, and upsert the family memory. Returns the new trip id. */
export async function saveTrip(
  supabase: SupabaseClient,
  userId: string,
  plan: { profile: Profile; alloc: Alloc; itinerary: DayPlan[]; missions: Mission[]; memory: FamilyMemory | null }
): Promise<string | null> {
  try {
    const tripRow = { ...tripRowFromPlan(plan.profile, plan.alloc), user_id: userId };
    const { data: trip, error: tripErr } = await supabase.from("trips").insert(tripRow).select("id").single();
    if (tripErr) throw tripErr;
    const tripId = (trip as { id: string }).id;

    const dayRows = dayRowsFromItinerary(plan.itinerary).map((d) => ({ ...d, trip_id: tripId, user_id: userId }));
    const { data: days, error: daysErr } = await supabase.from("itineraries").insert(dayRows).select("id, day_index");
    if (daysErr) throw daysErr;

    const idByDay = new Map((days as { id: string; day_index: number }[]).map((d) => [d.day_index, d.id]));
    const itemRows: (ItineraryItemRow & { itinerary_id: string; user_id: string })[] = [];
    plan.itinerary.forEach((d, i) => {
      const itineraryId = idByDay.get(i);
      if (!itineraryId) return;
      itemRowsFromDay(d.items).forEach((r) => itemRows.push({ ...r, itinerary_id: itineraryId, user_id: userId }));
    });
    if (itemRows.length) {
      const { error: itemsErr } = await supabase.from("itinerary_items").insert(itemRows);
      if (itemsErr) throw itemsErr;
    }

    if (plan.missions.length) {
      const missionRows = missionRowsFromMissions(plan.missions).map((m) => ({ ...m, trip_id: tripId, user_id: userId }));
      const { error: missionsErr } = await supabase.from("missions").insert(missionRows);
      if (missionsErr) throw missionsErr;
    }

    if (plan.memory) await upsertMemory(supabase, userId, plan.memory);
    return tripId;
  } catch (e) {
    warn("saveTrip", e);
    return null;
  }
}

/** Load the user's most recent trip and rebuild engine state from it.
 *  Pricing is re-derived by the engine (allocateBudget/reallocate) — the
 *  database stores inputs and the plan, never invented numbers. */
export async function loadLatestTrip(supabase: SupabaseClient, userId: string, companionId: string | null): Promise<LoadedTrip | null> {
  try {
    const { data: trip, error: tripErr } = await supabase
      .from("trips")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (tripErr) throw tripErr;
    if (!trip) return null;
    const tripRow = trip as TripRow & { id: string };

    const profile = profileFromTripRow(tripRow);
    let alloc = allocateBudget(profile);
    if (tripRow.resort && alloc.resort.id !== tripRow.resort) alloc = reallocate(profile, tripRow.resort);

    const { data: days, error: daysErr } = await supabase
      .from("itineraries")
      .select("*, itinerary_items(*)")
      .eq("trip_id", tripRow.id)
      .order("day_index", { ascending: true });
    if (daysErr) throw daysErr;

    const { data: missionRows, error: missionsErr } = await supabase.from("missions").select("*").eq("trip_id", tripRow.id);
    if (missionsErr) throw missionsErr;

    const { data: memoryRow, error: memErr } = await supabase.from("family_memory").select("*").eq("user_id", userId).maybeSingle();
    if (memErr) throw memErr;

    return {
      tripId: tripRow.id,
      status: tripRow.status,
      profile,
      alloc,
      itinerary: itineraryFromRows((days as (ItineraryRow & { itinerary_items: ItineraryItemRow[] })[]) || []),
      missions: missionsFromRows((missionRows as MissionRow[]) || []),
      memory: memoryRow ? memoryFromRow(memoryRow as MemoryRow, companionId, profile) : null,
    };
  } catch (e) {
    warn("loadLatestTrip", e);
    return null;
  }
}

export async function upsertMemory(supabase: SupabaseClient, userId: string, memory: FamilyMemory): Promise<void> {
  try {
    const { error } = await supabase.from("family_memory").upsert({ ...memoryRowFromMemory(memory), user_id: userId }, { onConflict: "user_id" });
    if (error) throw error;
  } catch (e) {
    warn("upsertMemory", e);
  }
}

/** Mark the trip booked and stage the booking task state machine. */
export async function markTripBooked(supabase: SupabaseClient, userId: string, tripId: string, tasks: { kind: string; name: string }[]): Promise<void> {
  try {
    const { error: tripErr } = await supabase.from("trips").update({ status: "booked" }).eq("id", tripId).eq("user_id", userId);
    if (tripErr) throw tripErr;
    if (tasks.length) {
      const { error: tasksErr } = await supabase
        .from("booking_tasks")
        .insert(tasks.map((t) => ({ ...t, trip_id: tripId, user_id: userId, status: "staged" })));
      if (tasksErr) throw tasksErr;
    }
  } catch (e) {
    warn("markTripBooked", e);
  }
}

export async function logEvent(supabase: SupabaseClient, userId: string, eventName: string, properties: Record<string, unknown> = {}): Promise<void> {
  try {
    const { error } = await supabase.from("events_log").insert({ user_id: userId, event_name: eventName, properties });
    if (error) throw error;
  } catch (e) {
    warn("logEvent", e);
  }
}
