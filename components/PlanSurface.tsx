"use client";

import { useState } from "react";
import { Check, ChevronDown, ChevronUp, GripVertical, Moon, PartyPopper, Plus, Sparkles, Star, Sun, Trash2, Utensils, Zap, type LucideIcon } from "lucide-react";
import { ATTR, type Attraction } from "@/lib/catalog/attractions";
import { PARKS } from "@/lib/catalog/parks";
import { makePlanItem, reflowTimes } from "@/lib/engine/itinerary";
import { fmt } from "@/lib/engine/format";
import type { Alloc, DayPlan, PlanItem, PlanItemType, Profile } from "@/lib/engine/types";
import { T } from "@/lib/theme";
import { BudgetBar } from "./BudgetBar";

const ITEM_META: Record<PlanItemType, { icon: LucideIcon; color: string }> = {
  ride: { icon: Zap, color: T.violetDeep },
  meal: { icon: Utensils, color: "#C2703D" },
  break: { icon: Moon, color: T.blue },
  show: { icon: Star, color: "#B0892B" },
  char: { icon: PartyPopper, color: "#C05B8E" },
  night: { icon: Sparkles, color: T.violetDeep },
  tip: { icon: Sun, color: "#8A8F5A" },
};

/* ---- Plan surface (editable) ---- */
export function PlanSurface({ profile, itinerary, alloc, onItineraryChange }: { profile: Profile; itinerary: DayPlan[]; alloc: Alloc; onItineraryChange: (next: DayPlan[]) => void }) {
  const [day, setDay] = useState(0);
  const [open, setOpen] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const d = itinerary[day];
  const parkKey = d.park;
  const park = PARKS[parkKey];

  const commit = (newItems: PlanItem[]) => {
    const next = itinerary.map((dd, i) => (i === day ? { ...dd, items: newItems } : dd));
    onItineraryChange(next);
  };
  const move = (idx: number, dir: number) => {
    const items = [...d.items];
    const j = idx + dir;
    if (j < 0 || j >= items.length) return;
    [items[idx], items[j]] = [items[j], items[idx]];
    commit(reflowTimes(items));
  };
  const remove = (idx: number) => {
    commit(reflowTimes(d.items.filter((_, i) => i !== idx)));
  };
  const addAttr = (attr: Attraction) => {
    const item = makePlanItem(attr, park);
    // insert near a sensible midpoint, then reflow
    const items = [...d.items];
    const insertAt = Math.min(items.length, Math.max(1, Math.floor(items.length / 2)));
    items.splice(insertAt, 0, item);
    commit(reflowTimes(items));
    setAdding(false);
  };

  const presentIds = new Set(d.items.map((x) => x.name));
  const addable = ATTR.filter((a) => a.park === parkKey && !presentIds.has(a.name) && (a.type === "ride" || a.type === "show" || a.type === "char"));

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="rounded-2xl p-4 mb-4" style={{ background: "#fff", border: `1px solid ${T.paperEdge}` }}>
        <BudgetBar alloc={alloc} />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {itinerary.map((dd, i) => (
          <button
            key={i}
            onClick={() => {
              setDay(i);
              setEditing(false);
              setAdding(false);
            }}
            className="px-3.5 py-2 rounded-xl text-sm font-semibold whitespace-nowrap"
            style={i === day ? { background: T.violetDeep, color: "#fff" } : { background: "#fff", color: T.ink, border: `1px solid ${T.paperEdge}` }}
          >
            Day {i + 1} · {dd.parkName}
            {dd.storm ? " ⛈" : ""}
          </button>
        ))}
      </div>

      {/* edit toolbar */}
      <div className="flex items-center justify-between mt-4 mb-1">
        <div className="text-sm font-semibold" style={{ color: T.ink }}>
          {editing ? "Reorder, remove, or add — it's your plan" : `Day ${day + 1} · ${park.name}`}
        </div>
        <div className="flex items-center gap-2">
          {editing && (
            <button
              onClick={() => setAdding((v) => !v)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1"
              style={{ background: adding ? T.violetDeep : "#fff", color: adding ? "#fff" : T.violetDeep, border: `1px solid ${T.violetDeep}` }}
            >
              <Plus size={13} /> Add
            </button>
          )}
          <button
            onClick={() => {
              setEditing((v) => !v);
              setAdding(false);
              setOpen(null);
            }}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1"
            style={editing ? { background: T.gold, color: T.night } : { background: "#fff", color: T.ink, border: `1px solid ${T.paperEdge}` }}
          >
            {editing ? (
              <>
                <Check size={13} /> Done
              </>
            ) : (
              <>
                <GripVertical size={13} /> Edit plan
              </>
            )}
          </button>
        </div>
      </div>

      {/* add picker */}
      {adding && (
        <div className="rounded-2xl p-3 mb-3 wm-rise" style={{ background: "#fff", border: `1px solid ${T.violetDeep}` }}>
          <div className="text-xs font-semibold mb-2" style={{ color: T.duskDark }}>
            Add to {park.name} — tap to drop it in
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
            {addable.map((a) => (
              <button key={a.id} onClick={() => addAttr(a)} className="text-xs px-2.5 py-1.5 rounded-full flex items-center gap-1 transition-transform active:scale-95" style={{ background: "#F3ECFB", color: T.violetDeep }}>
                <Plus size={11} /> {a.name}
                {a.ll === "SP" && (
                  <span className="ml-0.5 px-1 rounded" style={{ background: T.goldSoft, color: T.goldDeep, fontSize: 9 }}>
                    NEW
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="relative">
        {!editing && <div className="absolute left-4 top-2 bottom-2 w-px" style={{ background: T.paperEdge }} />}
        <div className="space-y-2.5">
          {d.items.map((it, i) => {
            const M = ITEM_META[it.type] || ITEM_META.ride;
            const key = `${day}-${i}`;
            const isFirst = i === 0,
              isLast = i === d.items.length - 1;
            return (
              <div key={key} className={`relative wm-rise ${editing ? "pl-0" : "pl-12"}`} style={{ animationDelay: `${Math.min(i * 0.03, 0.3)}s` }}>
                {!editing && (
                  <div className="absolute left-0 top-1.5 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#fff", border: `2px solid ${M.color}` }}>
                    <M.icon size={14} color={M.color} />
                  </div>
                )}
                <div className="rounded-2xl p-3.5 flex items-start gap-2" style={{ background: "#fff", border: `1px solid ${it.tags?.includes("Added by you") ? T.violetDeep : T.paperEdge}` }}>
                  {editing && (
                    <div className="flex flex-col items-center gap-0.5 pt-0.5">
                      <button onClick={() => move(i, -1)} disabled={isFirst} className="p-1 rounded-md disabled:opacity-25" style={{ background: "#F3ECFB" }}>
                        <ChevronUp size={14} color={T.violetDeep} />
                      </button>
                      <button onClick={() => move(i, 1)} disabled={isLast} className="p-1 rounded-md disabled:opacity-25" style={{ background: "#F3ECFB" }}>
                        <ChevronDown size={14} color={T.violetDeep} />
                      </button>
                    </div>
                  )}
                  <button onClick={() => !editing && setOpen(open === key ? null : key)} className="flex-1 text-left min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="font-semibold text-sm" style={{ color: T.ink }}>
                        {it.name}
                      </div>
                      <div className="text-sm font-semibold tabular-nums" style={{ color: T.violetDeep }}>
                        {fmt(it.time)}
                      </div>
                    </div>
                    <div className="text-xs mt-0.5 flex items-center gap-2 flex-wrap" style={{ color: T.duskDark }}>
                      {it.land}
                      {it.dur ? ` · ~${it.dur} min` : ""}
                      {(it.tags || []).map((tg) => (
                        <span
                          key={tg}
                          className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ background: /torm/.test(tg) ? "#E8F1FA" : tg.includes("Added") ? "#EAF5EF" : "#F3ECFB", color: /torm/.test(tg) ? T.blue : tg.includes("Added") ? T.green : T.violetDeep }}
                        >
                          {tg}
                        </span>
                      ))}
                      {!editing && (
                        <span className="ml-auto inline-flex items-center gap-0.5" style={{ color: T.duskDark }}>
                          why <ChevronDown size={12} style={{ transform: open === key ? "rotate(180deg)" : "none" }} />
                        </span>
                      )}
                    </div>
                    {open === key && !editing && (
                      <div className="text-sm mt-2 pt-2 wm-rise" style={{ color: "#57506E", borderTop: `1px dashed ${T.paperEdge}` }}>
                        <span className="font-semibold" style={{ color: T.violetDeep }}>
                          Pixie's math:{" "}
                        </span>
                        {it.note}
                      </div>
                    )}
                  </button>
                  {editing && it.type !== "tip" && (
                    <button onClick={() => remove(i)} className="p-1.5 rounded-lg self-center" style={{ background: "#FBEDED" }}>
                      <Trash2 size={14} color={T.red} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {editing && (
        <div className="mt-3 rounded-xl p-3 text-xs flex items-center gap-2" style={{ background: "#F3ECFB", color: T.violetDeep }}>
          <Sparkles size={13} /> Times re-flow automatically as you reorder. Pixie keeps your Lightning Lane and dining strategy in sync when you're done.
        </div>
      )}

      {!editing && (
        <div className="rounded-2xl p-4 mt-4" style={{ background: "#fff", border: `1px solid ${T.paperEdge}` }}>
          <div className="flex items-center gap-2 font-semibold text-sm" style={{ color: T.ink }}>
            <Zap size={15} color={T.gold} /> Day {day + 1} Lightning Lane plan
          </div>
          <div className="mt-2 space-y-1.5">
            {d.ll.mp.map((n, i) => (
              <div key={i} className="flex items-center gap-2 text-sm" style={{ color: "#57506E" }}>
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "#F3ECFB", color: T.violetDeep }}>
                  {i + 1}
                </span>
                {n}
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: "#F3ECFB", color: T.violetDeep }}>
                  Multi Pass
                </span>
              </div>
            ))}
            {d.ll.sp && (
              <div className="flex items-center gap-2 text-sm" style={{ color: "#57506E" }}>
                <span className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: T.goldSoft }}>
                  <Star size={11} color={T.goldDeep} />
                </span>
                {d.ll.sp}
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: T.goldSoft, color: T.goldDeep }}>
                  Single Pass
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <p className="text-center text-xs mt-4" style={{ color: T.duskDark }}>
        Wait times by{" "}
        <a href="https://queue-times.com" target="_blank" rel="noreferrer" className="underline">
          Queue-Times.com
        </a>
      </p>
    </div>
  );
}
