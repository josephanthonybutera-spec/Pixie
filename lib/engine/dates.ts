import { MONTHS } from "./format";
import type { DerivedDates } from "./types";

export function deriveDates(monthStr: string | null | undefined, parkDays: number): DerivedDates {
  const now = new Date();
  let mi = MONTHS.findIndex((m) => (monthStr || "").toLowerCase().includes(m));
  let year = now.getFullYear();
  if (mi === -1) {
    const d = new Date(now.getTime() + 75 * 86400000);
    mi = d.getMonth();
    year = d.getFullYear();
  } else if (mi <= now.getMonth()) year += 1;
  const start = new Date(year, mi, 15);
  const nights = parkDays + 1;
  const end = new Date(start.getTime() + nights * 86400000);
  const dining = new Date(start.getTime() - 60 * 86400000);
  const ll = new Date(start.getTime() - 7 * 86400000);
  const fdate = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const daysUntil = (d: Date) => Math.max(0, Math.ceil((d.getTime() - now.getTime()) / 86400000));
  return {
    start,
    end,
    nights,
    fmtStart: fdate(start),
    fmtEnd: fdate(end),
    diningWindow: dining,
    fmtDining: fdate(dining),
    llWindow: ll,
    fmtLL: fdate(ll),
    daysToDining: daysUntil(dining),
    daysToTrip: daysUntil(start),
  };
}
