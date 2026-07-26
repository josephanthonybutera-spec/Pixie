"use client";

import { Sparkles } from "lucide-react";
import type { Companion } from "@/lib/catalog/companions";
import type { FamilyMemory } from "@/lib/engine/types";
import { T } from "@/lib/theme";
import { CompAvatar } from "./atoms";

/* "What your companion knows" — the memory made visible */
export function MemoryCard({ memory, comp, dark }: { memory: FamilyMemory; comp: Companion; dark?: boolean }) {
  const chips = memory.facts;
  return (
    <div className="rounded-2xl p-4" style={dark ? { background: "rgba(255,255,255,.05)", border: `1px solid ${comp.color}55` } : { background: "#fff", border: `1px solid ${T.paperEdge}` }}>
      <div className="flex items-center gap-2 mb-2">
        <CompAvatar comp={comp} size={24} />
        <div className="text-sm font-semibold" style={{ color: dark ? "#fff" : T.ink }}>
          What {comp.name} knows about your family
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {chips.map((f, i) => (
          <span key={i} className="text-xs px-2.5 py-1 rounded-full inline-flex items-center gap-1" style={{ background: dark ? "rgba(255,255,255,.07)" : "#F3ECFB", color: dark ? "#CFC5FF" : T.violetDeep }}>
            <span style={{ opacity: 0.7 }}>{f.k}:</span> <b>{f.v}</b>
          </span>
        ))}
      </div>
      {memory.behaviors.length > 0 && (
        <div className="mt-2.5 pt-2.5" style={{ borderTop: `1px dashed ${dark ? "rgba(255,255,255,.12)" : T.paperEdge}` }}>
          <div className="text-xs font-semibold mb-1" style={{ color: dark ? T.dusk : T.duskDark }}>
            Learned while planning:
          </div>
          {memory.behaviors.map((b, i) => (
            <div key={i} className="text-xs flex items-center gap-1.5 wm-tick" style={{ color: dark ? "#CFC5FF" : "#57506E" }}>
              <Sparkles size={11} color={comp.color} /> {b}
            </div>
          ))}
        </div>
      )}
      <div className="text-xs mt-2.5" style={{ color: T.duskDark }}>
        Trips planned together: {memory.tripsPlanned} · gets smarter every year
      </div>
    </div>
  );
}
