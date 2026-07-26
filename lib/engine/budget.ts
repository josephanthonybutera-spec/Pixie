import { PRICE } from "@/lib/catalog/price";
import { RESORTS, type Resort } from "@/lib/catalog/resorts";
import { deriveDates } from "./dates";
import type { Alloc, Profile } from "./types";

export function allocateBudget(profile: Profile): Alloc {
  const kids = (profile.kidAges || []).length;
  const adults = profile.adults || 2;
  const dates = deriveDates(profile.month, profile.parkDays || 4);
  const nights = dates.nights;
  const tickets = (adults * PRICE.ticketAdultPerDay + kids * PRICE.ticketKidPerDay) * (profile.parkDays || 4);
  const dRate = PRICE.dining[profile.dining || "mix"] || PRICE.dining.mix;
  const diningCost = (adults * dRate.a + kids * dRate.k) * ((profile.parkDays || 4) + 1);
  const target = profile.budget || 6500;
  const wantsSky = !!profile.skyliner;
  const pool = [...RESORTS].sort((a, b) => b.night - a.night);
  let resort: Resort | null = null;
  // pick the nicest resort whose total still leaves a small positive buffer (spend close to target)
  for (const r of pool) {
    if (wantsSky && !r.skyliner) continue;
    const room = r.night * nights;
    const buffer = target - (room + tickets + diningCost);
    if (buffer >= 0) {
      resort = r;
      break;
    }
  }
  if (!resort) resort = wantsSky ? [...RESORTS].filter((r) => r.skyliner).sort((a, b) => a.night - b.night)[0] : RESORTS[0];
  const room = resort.night * nights;
  const buffer = target - (room + tickets + diningCost);
  return { resort, room, tickets, diningCost, buffer, target, nights, dates };
}

export function reallocate(profile: Profile, resortId: string): Alloc {
  const base = allocateBudget(profile);
  const resort = RESORTS.find((r) => r.id === resortId) || base.resort;
  const room = resort.night * base.nights;
  const buffer = base.target - (room + base.tickets + base.diningCost);
  return { ...base, resort, room, buffer };
}
