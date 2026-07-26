import type { Alloc, Mission, Profile } from "./types";

/* Missions derived from the family, not from us */
export function deriveMissions(profile: Profile, alloc: Alloc): Mission[] {
  const ms: Mission[] = [];
  const young = (profile.kidAges || []).some((a) => a <= 8);
  if (profile.characters && young)
    ms.push({ id: "crt", name: "Cinderella's Royal Table", why: "Princess dinner in the castle", window: alloc.dates.fmtDining, windowDays: alloc.dates.daysToDining, staged: "5:40 a.m. ET on window day", backups: ["Akershus (princesses)", "Crystal Palace"], status: "staged" });
  if ((profile.mustDos || []).includes("Star Wars: Rise of the Resistance") || profile.starwars)
    ms.push({ id: "oga", name: "Oga's Cantina", why: "Galaxy's Edge cantina table", window: alloc.dates.fmtDining, windowDays: alloc.dates.daysToDining, staged: "5:40 a.m. ET on window day", backups: ["Docking Bay 7 (walk-up)", "Evening slot scan"], status: "staged" });
  ms.push({ id: "llday1", name: "Lightning Lane Multi Pass — all days", why: "Pre-staged picks per park", window: alloc.dates.fmtLL, windowDays: Math.max(0, alloc.dates.daysToTrip - 7), staged: "7 days before check-in, at open", backups: ["Day-of refresh strategy"], status: "staged" });
  return ms.slice(0, 3);
}
