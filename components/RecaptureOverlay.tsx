"use client";

import { BellRing, Phone, Sparkles } from "lucide-react";
import type { Companion } from "@/lib/catalog/companions";
import { T } from "@/lib/theme";
import { CompAvatar } from "./atoms";
import type { RecaptureState } from "./types";

/* ---- Abandoned-trip recapture overlay (email + SMS follow-ups) ---- */
export function RecaptureOverlay({ data, comp, onStep, onBook, onClose }: { data: RecaptureState; comp: Companion; onStep: () => void; onBook: () => void; onClose: () => void }) {
  const shown = data.seq.slice(0, data.i + 1);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(14,11,30,.93)", backdropFilter: "blur(6px)" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-4 wm-rise">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full" style={{ background: "rgba(245,197,66,.14)", color: T.gold }}>
            <BellRing size={13} /> You left without booking — so Pixie followed up
          </div>
          <p className="text-xs mt-2" style={{ color: T.dusk }}>
            This is the recapture sequence a family would receive. Compressed for the demo.
          </p>
        </div>
        <div className="space-y-2.5 max-h-[52vh] overflow-y-auto px-1">
          {shown.map((m, i) => (
            <div key={i} className="wm-rise">
              {m.channel === "email" ? (
                <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: `1px solid ${T.paperEdge}` }}>
                  <div className="px-4 py-2 flex items-center gap-2" style={{ background: "#F6F2EA", borderBottom: `1px solid ${T.paperEdge}` }}>
                    <CompAvatar comp={comp} size={22} />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate" style={{ color: T.ink }}>
                        Pixie
                      </div>
                      <div className="text-xs truncate" style={{ color: T.duskDark }}>
                        {m.subject}
                      </div>
                    </div>
                    <span className="ml-auto text-xs whitespace-nowrap" style={{ color: T.duskDark }}>
                      {m.at}
                    </span>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-sm" style={{ color: "#57506E" }}>
                      {m.body}
                    </p>
                    <button onClick={onBook} className="mt-3 px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: T.night, color: T.gold }}>
                      {m.cta}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <CompAvatar comp={comp} size={26} />
                  <div>
                    <div className="px-3.5 py-2.5 rounded-2xl text-sm" style={{ background: "#E8F0FE", color: "#1F2937", borderBottomLeftRadius: 6, maxWidth: 300 }}>
                      {m.body}
                    </div>
                    <div className="text-xs mt-1 flex items-center gap-1" style={{ color: T.dusk }}>
                      <Phone size={10} /> SMS · {m.at}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-2">
          <button onClick={onBook} className="wm-pulse w-full py-3.5 rounded-2xl font-semibold text-lg flex items-center justify-center gap-2" style={{ background: T.gold, color: T.night }}>
            <Sparkles size={17} /> Book Now For Free
          </button>
          {data.i < data.seq.length - 1 ? (
            <button onClick={onStep} className="w-full py-2.5 rounded-xl text-sm font-medium" style={{ background: "rgba(255,255,255,.07)", color: T.dusk, border: "1px solid rgba(255,255,255,.15)" }}>
              Still waiting… show the next follow-up →
            </button>
          ) : (
            <div className="text-center text-xs" style={{ color: T.duskDark }}>
              4 touches over 3 days · each tied to a real deadline on their trip
            </div>
          )}
          <button onClick={onClose} className="w-full py-2 text-xs" style={{ color: T.duskDark }}>
            Dismiss (back to plan)
          </button>
        </div>
      </div>
    </div>
  );
}
