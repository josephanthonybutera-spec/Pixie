"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, Wand2 } from "lucide-react";
import { usd } from "@/lib/engine/format";
import { T } from "@/lib/theme";
import { Stars } from "./atoms";

export function Generating({ budget, onDone }: { budget: number; onDone: () => void }) {
  const LINES = ["Reading 40 wait-time curves…", "Choosing your resort…", `Allocating your ${usd(budget)}…`, "Sequencing rope drops…", "Staging your missions…", "Protecting nap time…"];
  const [i, setI] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setI((x) => Math.min(x + 1, LINES.length - 1)), 520);
    const d = setTimeout(onDone, 3500);
    return () => {
      clearInterval(iv);
      clearTimeout(d);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onDone]);
  return (
    <div className="min-h-screen relative flex items-center justify-center wm-body" style={{ background: `radial-gradient(1200px 700px at 50% -10%, ${T.nightSoft}, ${T.night})` }}>
      <Stars />
      <div className="relative text-center px-6">
        <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center wm-pulse" style={{ background: T.gold }}>
          <Wand2 size={28} color={T.night} />
        </div>
        <h2 className="wm-display text-white text-3xl font-semibold mt-8">Engineering your trip</h2>
        <div className="mt-6 space-y-2">
          {LINES.slice(0, i + 1).map((l, idx) => (
            <div key={idx} className="wm-rise flex items-center justify-center gap-2 text-sm" style={{ color: idx === i ? "#fff" : T.dusk }}>
              {idx < i ? <Check size={14} color={T.green} /> : <Loader2 size={14} className="animate-spin" color={T.gold} />} {l}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
