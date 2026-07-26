"use client";

import { useEffect, useState } from "react";
import { Check, Clock } from "lucide-react";
import { T } from "@/lib/theme";

/* ---- Handoff overlay (13 → 0) ---- */
const CHORES = [
  "Book the resort room",
  "Buy park tickets",
  "Set the 60-day dining alarm",
  "Chase Cinderella's Royal Table",
  "Back-up dining plan",
  "Stage Lightning Lane picks",
  "Book Multi Pass at 7 days",
  "Watch for room discounts",
  "Watch for ticket promos",
  "Track ride refurbishments",
  "Watch the weather window",
  "Re-plan if anything breaks",
  "Confirm everything twice",
];

export function HandoffOverlay({ onDone }: { onDone: () => void }) {
  const [moved, setMoved] = useState(0);
  useEffect(() => {
    const iv = setInterval(
      () =>
        setMoved((m) => {
          if (m >= CHORES.length) {
            clearInterval(iv);
            setTimeout(onDone, 1100);
            return m;
          }
          return m + 1;
        }),
      160
    );
    return () => clearInterval(iv);
  }, [onDone]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(14,11,30,.92)", backdropFilter: "blur(6px)" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-5">
          <div className="wm-display text-white text-2xl font-semibold">The Handoff</div>
          <div className="text-sm mt-1" style={{ color: T.dusk }}>
            You had <b style={{ color: "#fff" }}>13</b> things to do. You now have{" "}
            <b className="wm-tick" key={moved} style={{ color: T.gold }}>
              {Math.max(0, 13 - moved)}
            </b>
            .
          </div>
        </div>
        <div className="space-y-1.5">
          {CHORES.map((c, i) => (
            <div
              key={c}
              data-chore
              className="px-3 py-2 rounded-xl text-sm flex items-center gap-2"
              style={{
                background: i < moved ? "rgba(63,176,127,.12)" : "rgba(255,255,255,.06)",
                color: i < moved ? T.green : "#EDEAF7",
                border: `1px solid ${i < moved ? "rgba(63,176,127,.4)" : "rgba(255,255,255,.1)"}`,
                transition: "all .3s ease",
              }}
            >
              {i < moved ? <Check size={14} /> : <Clock size={14} color={T.dusk} />} {c}{" "}
              {i < moved && (
                <span className="ml-auto text-xs" style={{ color: T.green }}>
                  → Pixie
                </span>
              )}
            </div>
          ))}
        </div>
        {moved >= CHORES.length && (
          <div className="text-center mt-5 wm-pop">
            <div className="wm-display text-xl font-semibold" style={{ color: T.gold }}>
              We're on it.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
