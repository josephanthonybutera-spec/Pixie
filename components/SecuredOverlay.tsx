"use client";

import { useEffect, useMemo } from "react";
import { CheckCircle2 } from "lucide-react";
import { T } from "@/lib/theme";

/* ---- SECURED ceremony ---- */
export function SecuredOverlay({ mission, onDone }: { mission: { name: string; securedNote?: string }; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, [onDone]);
  const sparks = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        dx: Math.cos((i / 16) * Math.PI * 2) * 120,
        dy: Math.sin((i / 16) * Math.PI * 2) * 120,
        delay: (i % 4) * 0.05,
      })),
    []
  );
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(14,11,30,.92)" }}>
      <div className="relative text-center px-6">
        {sparks.map((s, i) => (
          <div
            key={i}
            data-spark
            className="absolute left-1/2 top-8 w-2 h-2 rounded-full"
            style={{ background: i % 3 ? T.gold : "#fff", "--dx": `${s.dx}px`, "--dy": `${s.dy}px`, animation: `wmSpark .9s ease-out ${s.delay}s both` } as React.CSSProperties}
          />
        ))}
        <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center wm-pop" style={{ background: T.gold }}>
          <CheckCircle2 size={30} color={T.night} />
        </div>
        <div className="wm-display text-white text-3xl font-semibold mt-5 wm-rise">{mission.name}</div>
        <div className="wm-display text-2xl font-semibold mt-1 wm-rise" style={{ color: T.gold, animationDelay: ".1s" }}>
          SECURED
        </div>
        <div className="text-sm mt-2 wm-rise" style={{ color: T.dusk, animationDelay: ".2s" }}>
          {mission.securedNote}
        </div>
      </div>
    </div>
  );
}
