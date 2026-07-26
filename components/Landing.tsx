"use client";

import { Radar, Sparkles, Zap } from "lucide-react";
import { T } from "@/lib/theme";
import { AppleGlyph, GoogleGlyph, Stars, Wordmark } from "./atoms";

/* ============================================================
   LANDING — repositioned against DIY chaos, not agents
   ============================================================ */
export function Landing({ onSSO }: { onSSO: (provider: string) => void }) {
  return (
    <div className="min-h-screen relative wm-body" style={{ background: `radial-gradient(1200px 700px at 50% -10%, ${T.nightSoft}, ${T.night})` }}>
      <Stars />
      <div className="relative max-w-3xl mx-auto px-6 pt-8 pb-16">
        <Wordmark dark />
        <div className="mt-16 sm:mt-24 text-center wm-rise">
          <p className="text-sm font-medium tracking-widest uppercase" style={{ color: T.gold }}>
            Meet Pixie · your family's Disney companion
          </p>
          <h1 className="wm-display font-semibold mt-4 leading-tight text-white" style={{ fontSize: "clamp(2.1rem, 5.5vw, 3.6rem)" }}>
            Planning Disney takes 40 tabs,
            <br />
            three spreadsheets, and a 6 a.m. alarm.
          </h1>
          <h1 className="wm-display font-semibold mt-2" style={{ fontSize: "clamp(2.1rem, 5.5vw, 3.6rem)", color: T.gold }}>
            Or Pixie, who knows your family.
          </h1>
          <p className="mt-5 text-base max-w-xl mx-auto" style={{ color: T.dusk }}>
            Pixie learns your family, remembers everything, and quietly makes the magic happen — before, during, and after your trip. Not an app you use. A companion who plans it with you.
          </p>
        </div>
        <div className="mt-10 max-w-sm mx-auto wm-rise" style={{ animationDelay: ".15s" }}>
          <button onClick={() => onSSO("google")} className="w-full py-3.5 rounded-2xl font-semibold flex items-center justify-center gap-2.5 transition-transform hover:scale-105 active:scale-95" style={{ background: "#fff", color: "#1F2937" }}>
            <GoogleGlyph /> Continue with Google
          </button>
          <button
            onClick={() => onSSO("apple")}
            className="mt-2.5 w-full py-3.5 rounded-2xl font-semibold flex items-center justify-center gap-2.5 transition-transform hover:scale-105 active:scale-95"
            style={{ background: "#000", color: "#fff", border: "1px solid rgba(255,255,255,.2)" }}
          >
            <AppleGlyph /> Continue with Apple
          </button>
          <p className="text-center text-xs mt-3" style={{ color: T.duskDark }}>
            Free to meet Pixie and build your whole trip. No card, ever, to plan.
          </p>
        </div>

        <div className="mt-14 grid sm:grid-cols-3 gap-4">
          {[
            { icon: Sparkles, h: "Pixie knows your family", p: "Names, ages, who loves princesses, who lives for Star Wars — Pixie remembers it all and gets smarter every trip." },
            { icon: Zap, h: "Minutes, not weekends", p: "One sentence to Pixie and your whole trip appears — resort, budget, itinerary, dining, Lightning Lanes." },
            { icon: Radar, h: "Pixie never sleeps", p: "Discounts, dining drops, storms, refurbs — watched around the clock so your family never misses a thing." },
          ].map((f, i) => (
            <div key={i} className="rounded-2xl p-5 wm-rise" style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", animationDelay: `${0.2 + 0.12 * i}s` }}>
              <f.icon size={20} color={T.gold} />
              <div className="wm-display text-white font-semibold mt-3">{f.h}</div>
              <p className="text-sm mt-1" style={{ color: T.dusk }}>
                {f.p}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl p-5 text-sm" style={{ background: "rgba(124,92,255,.08)", border: `1px solid ${T.violetDeep}`, color: T.dusk }}>
          <b style={{ color: "#fff" }}>9 in 10 families plan Disney themselves</b> — across YouTube, Reddit, blogs, and Disney's own app. Pixie was built for them. Disney's app is where you tap.{" "}
          <span style={{ color: T.gold }}>Pixie is what tells you when, what, and why — then watches all of it.</span>
        </div>
        <div className="mt-4 rounded-2xl p-5 text-sm" style={{ background: "rgba(245,197,66,.07)", border: "1px solid rgba(245,197,66,.25)", color: T.dusk }}>
          <span className="font-semibold" style={{ color: T.gold }}>
            Why is it free?
          </span>{" "}
          Disney builds a ~10% agency commission into every package. Book direct and Disney keeps it; let Pixie handle the booking and Disney pays it to Pixie. Your price is identical —{" "}
          <b style={{ color: "#fff" }}>and every reservation stays in your own Disney account.</b>
        </div>
        <p className="mt-10 text-center text-xs" style={{ color: T.duskDark }}>
          Independent demo · not affiliated with The Walt Disney Company · park data and pricing illustrative.
        </p>
      </div>
    </div>
  );
}
