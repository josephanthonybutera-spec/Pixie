"use client";

import { Check, Sparkles, Wand2 } from "lucide-react";
import type { Alloc, Profile } from "@/lib/engine/types";
import { T } from "@/lib/theme";
import { Chip } from "./atoms";
import { BudgetBarDark } from "./BudgetBar";

/* ---- The Reveal card (pinned NBA pre-autopilot) ---- */
export function RevealCard({ profile, alloc, onAutopilot, onChip }: { profile: Profile; alloc: Alloc; onAutopilot: () => void; onChip: (a: string) => void }) {
  return (
    <div className="wm-pop rounded-3xl overflow-hidden" style={{ background: `linear-gradient(165deg, ${T.night2}, ${T.night})`, border: `1px solid ${T.violetDeep}` }}>
      <div className="p-5">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase" style={{ color: T.gold }}>
          <Wand2 size={13} /> Your trip, engineered
        </div>
        <div className="wm-display text-white text-2xl font-semibold mt-2 leading-snug">
          {alloc.resort.name} · {profile.parkDays} park days · {alloc.dates.fmtStart}–{alloc.dates.fmtEnd}
        </div>
        <div className="text-sm mt-1" style={{ color: T.dusk }}>
          {alloc.resort.tier} · {alloc.resort.note}
        </div>
        <div className="rounded-2xl p-3 mt-3" style={{ background: "rgba(255,255,255,.05)" }}>
          <BudgetBarDark alloc={alloc} />
        </div>
        {(profile.assumptions?.length ?? 0) > 0 && (
          <div className="mt-3">
            <div className="text-xs mb-1.5" style={{ color: T.duskDark }}>
              We assumed — tap to change:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(profile.assumptions || []).map((a, i) => (
                <Chip key={i} dark label={a} onClick={() => onChip(a)} />
              ))}
            </div>
          </div>
        )}
        <button onClick={onAutopilot} className="wm-pulse w-full py-4 rounded-2xl font-semibold text-lg flex items-center justify-center gap-2 mt-4" style={{ background: T.gold, color: T.night }}>
          <Sparkles size={18} /> Book Now For Free
        </button>
        <div className="text-xs mt-3 space-y-1" style={{ color: T.dusk }}>
          <div className="flex items-center gap-1.5">
            <Check size={12} color={T.green} /> Every reservation stays in <b style={{ color: "#fff" }}>your own</b> Disney account — you're always in control
          </div>
          <div className="flex items-center gap-1.5">
            <Check size={12} color={T.green} /> Same price as booking direct — Disney pays Pixie the built-in commission
          </div>
          <div className="flex items-center gap-1.5">
            <Check size={12} color={T.green} /> Change anything, anytime, just by telling Pixie
          </div>
        </div>
      </div>
    </div>
  );
}
