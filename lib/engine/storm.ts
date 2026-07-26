import { parseHM } from "./format";
import type { DayPlan, PlanItem } from "./types";

/* Storm replan: pull outdoor items out of the 15:00–18:00 window, swap indoor forward */
export function stormReplan(day: DayPlan): DayPlan {
  const items = day.items.map((x) => ({ ...x, tags: [...(x.tags || [])] }));
  const inWindow = (x: PlanItem) => x.time >= parseHM("14:30") && x.time <= parseHM("18:00");
  const outdoorIdx = items.findIndex((x) => inWindow(x) && x.indoor === false && (x.type === "ride" || x.type === "show"));
  const morningIndoorIdx = items.findIndex((x) => x.time < parseHM("12:00") && x.indoor && x.type === "ride");
  if (outdoorIdx > -1 && morningIndoorIdx > -1) {
    const a = items[outdoorIdx];
    const b = items[morningIndoorIdx];
    const ta = a.time;
    const tb = b.time;
    items[outdoorIdx] = { ...b, time: ta, land: b.land, tags: [...b.tags, "Moved — storm"], note: "Swapped indoors for the storm window. " + (b.note || "") };
    items[morningIndoorIdx] = { ...a, time: tb, tags: [...a.tags, "Moved — storm"], note: "Moved ahead of the 3 p.m. storm. " + (a.note || "") };
  }
  items.forEach((x) => {
    if (inWindow(x) && x.indoor) x.tags = [...new Set([...x.tags, "Storm-safe"])];
  });
  return { ...day, items, storm: true };
}
