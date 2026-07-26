"use client";

import type { Alloc } from "@/lib/engine/types";
import { usd } from "@/lib/engine/format";
import { T } from "@/lib/theme";

export function BudgetBar({ alloc }: { alloc: Alloc }) {
  const segs = [
    { k: "Room", v: alloc.room, c: T.violetDeep },
    { k: "Tickets", v: alloc.tickets, c: "#8A6FE8" },
    { k: "Dining", v: alloc.diningCost, c: "#C2703D" },
    { k: "Buffer", v: Math.max(0, alloc.buffer), c: T.green },
  ];
  const total = segs.reduce((s, x) => s + x.v, 0) || 1;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1" style={{ color: T.duskDark }}>
        <span>
          Budget: <b style={{ color: T.ink }}>{usd(alloc.target)}</b>
        </span>
        <span>{alloc.buffer >= 0 ? <span style={{ color: T.green }}>{usd(alloc.buffer)} buffer</span> : <span style={{ color: T.red }}>over by {usd(-alloc.buffer)}</span>}</span>
      </div>
      <div className="flex h-3 rounded-full overflow-hidden" style={{ background: T.paperEdge }}>
        {segs.map((s) => (
          <div key={s.k} style={{ width: `${(s.v / total) * 100}%`, background: s.c }} />
        ))}
      </div>
      <div className="flex gap-3 mt-1.5 flex-wrap">
        {segs.map((s) => (
          <span key={s.k} className="text-xs inline-flex items-center gap-1" style={{ color: T.duskDark }}>
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: s.c }} />
            {s.k} {usd(s.v)}
          </span>
        ))}
      </div>
    </div>
  );
}

export function BudgetBarDark({ alloc }: { alloc: Alloc }) {
  const segs = [
    { k: "Room", v: alloc.room, c: T.violet },
    { k: "Tickets", v: alloc.tickets, c: "#A78BFA" },
    { k: "Dining", v: alloc.diningCost, c: "#E0A268" },
    { k: "Buffer", v: Math.max(0, alloc.buffer), c: T.green },
  ];
  const total = segs.reduce((s, x) => s + x.v, 0) || 1;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span style={{ color: T.dusk }}>Allocated to your {usd(alloc.target)}</span>
        <span style={{ color: alloc.buffer >= 0 ? T.green : T.red }}>{alloc.buffer >= 0 ? `${usd(alloc.buffer)} buffer` : `over ${usd(-alloc.buffer)}`}</span>
      </div>
      <div className="flex h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,.12)" }}>
        {segs.map((s) => (
          <div key={s.k} style={{ width: `${(s.v / total) * 100}%`, background: s.c }} />
        ))}
      </div>
      <div className="flex gap-3 mt-1.5 flex-wrap">
        {segs.map((s) => (
          <span key={s.k} className="text-xs inline-flex items-center gap-1" style={{ color: T.dusk }}>
            <span className="w-2 h-2 rounded-full" style={{ background: s.c }} />
            {s.k} {usd(s.v)}
          </span>
        ))}
      </div>
    </div>
  );
}
