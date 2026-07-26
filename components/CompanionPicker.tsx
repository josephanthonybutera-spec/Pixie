"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { COMPANIONS, compById } from "@/lib/catalog/companions";
import { T } from "@/lib/theme";
import { Stars, Wordmark } from "./atoms";

/* ============================================================
   SCREEN: Choose your companion
   ============================================================ */
export function CompanionPicker({ onPick }: { onPick: (id: string) => void }) {
  const [sel, setSel] = useState<string | null>(null);
  return (
    <div className="min-h-screen relative wm-body" style={{ background: `radial-gradient(1200px 700px at 50% -10%, ${T.nightSoft}, ${T.night})` }}>
      <Stars />
      <div className="relative max-w-2xl mx-auto px-5 pt-8 pb-16">
        <Wordmark dark />
        <div className="mt-12 text-center wm-rise">
          <p className="text-sm font-medium tracking-widest uppercase" style={{ color: T.gold }}>
            One quick thing first
          </p>
          <h1 className="wm-display font-semibold mt-3 text-white leading-tight" style={{ fontSize: "clamp(1.9rem, 5vw, 3rem)" }}>
            Give Pixie a face
            <br />
            your family will love
          </h1>
          <p className="mt-3 text-sm max-w-md mx-auto" style={{ color: T.dusk }}>
            Same Pixie, same memory — just the personality that fits your crew. You can change it anytime.
          </p>
        </div>
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {COMPANIONS.map((c) => {
            const on = sel === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setSel(c.id)}
                className="text-left rounded-2xl p-4 transition-transform active:scale-95"
                style={{ background: on ? "rgba(255,255,255,.1)" : "rgba(255,255,255,.05)", border: `2px solid ${on ? c.color : "rgba(255,255,255,.1)"}` }}
              >
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl" style={{ background: on ? c.color : "rgba(255,255,255,.07)" }}>
                    {c.glyph}
                  </div>
                  <span className="w-5 h-5 rounded-full flex items-center justify-center" style={{ border: `2px solid ${on ? c.color : "rgba(255,255,255,.25)"}`, background: on ? c.color : "transparent" }}>
                    {on && <Check size={12} color="#fff" />}
                  </span>
                </div>
                <div className="wm-display font-semibold mt-2.5 text-white">{c.name}</div>
                <div className="text-xs" style={{ color: c.color }}>
                  {c.tag}
                </div>
                <div className="text-xs mt-1" style={{ color: T.dusk }}>
                  {c.best}
                </div>
              </button>
            );
          })}
        </div>
        <button
          disabled={!sel}
          onClick={() => sel && onPick(sel)}
          className="mt-8 w-full py-4 rounded-2xl font-semibold text-lg flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
          style={{ background: T.gold, color: T.night }}
        >
          {sel ? (
            <>
              Meet {compById(sel).name} <ArrowRight size={18} />
            </>
          ) : (
            "Pick a companion to continue"
          )}
        </button>
        <p className="text-center text-xs mt-4" style={{ color: T.duskDark }}>
          Pixie remembers everything about your family — and gets more magical every trip.
        </p>
      </div>
    </div>
  );
}
