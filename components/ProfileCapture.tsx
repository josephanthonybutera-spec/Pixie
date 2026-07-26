"use client";

import { useState } from "react";
import { ArrowRight, Check, CheckCircle2, Mail, Phone, UserCircle2, type LucideIcon } from "lucide-react";
import type { UserProfile } from "@/lib/engine/types";
import { T } from "@/lib/theme";
import { Stars, Wordmark } from "./atoms";

export function ProfileCapture({ ssoProvider, onComplete }: { ssoProvider: string | null; onComplete: (p: UserProfile) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [matchDisney, setMatchDisney] = useState(true);
  const ready = name.trim() && email.includes("@");
  const fields: { v: string; set: (v: string) => void; ph: string; icon: LucideIcon; type: string }[] = [
    { v: name, set: setName, ph: "Your name", icon: UserCircle2, type: "text" },
    { v: email, set: setEmail, ph: "Email", icon: Mail, type: "email" },
    { v: phone, set: setPhone, ph: "Mobile number", icon: Phone, type: "tel" },
  ];
  return (
    <div className="min-h-screen relative wm-body" style={{ background: `radial-gradient(1200px 700px at 50% -10%, ${T.nightSoft}, ${T.night})` }}>
      <Stars />
      <div className="relative max-w-md mx-auto px-5 pt-8 pb-16">
        <Wordmark dark />
        <div className="mt-10 wm-rise">
          <div className="flex items-center gap-2 text-xs font-medium" style={{ color: T.green }}>
            <CheckCircle2 size={14} /> Signed in with {ssoProvider === "apple" ? "Apple" : "Google"}
          </div>
          <h1 className="wm-display text-white font-semibold mt-3 leading-tight" style={{ fontSize: "clamp(1.7rem, 5vw, 2.4rem)" }}>
            Let's introduce your family to Pixie.
          </h1>
          <p className="mt-2 text-sm" style={{ color: T.dusk }}>
            Just the basics so Pixie can start learning who you are — and reach you the moment something matters.
          </p>
        </div>
        <div className="mt-7 space-y-3">
          {fields.map((f, i) => (
            <div key={i} className="flex items-center gap-3 rounded-2xl px-4 py-3.5 wm-rise" style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)", animationDelay: `${0.05 * i}s` }}>
              <f.icon size={17} color={T.dusk} />
              <input value={f.v} onChange={(e) => f.set(e.target.value)} placeholder={f.ph} type={f.type} className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-gray-500" />
            </div>
          ))}
        </div>
        <button
          onClick={() => setMatchDisney((v) => !v)}
          className="mt-4 w-full text-left rounded-2xl p-4 flex items-start gap-3 transition-colors"
          style={{ background: matchDisney ? "rgba(245,197,66,.1)" : "rgba(255,255,255,.04)", border: `1px solid ${matchDisney ? "rgba(245,197,66,.4)" : "rgba(255,255,255,.12)"}` }}
        >
          <span className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5" style={{ background: matchDisney ? T.gold : "transparent", border: `2px solid ${matchDisney ? T.gold : "rgba(255,255,255,.3)"}` }}>
            {matchDisney && <Check size={13} color={T.night} />}
          </span>
          <span>
            <span className="text-sm font-semibold" style={{ color: "#fff" }}>
              This is the same email I use on My Disney Experience
            </span>
            <span className="block text-xs mt-0.5" style={{ color: T.dusk }}>
              Important: matching it lets Pixie line up your plans, dining, and Lightning Lanes with your real Disney account — so everything stays in your hands.
            </span>
          </span>
        </button>
        <button
          disabled={!ready}
          onClick={() => onComplete({ name, email, phone, matchDisney, ssoProvider })}
          className="mt-6 w-full py-4 rounded-2xl font-semibold text-lg flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
          style={{ background: T.gold, color: T.night }}
        >
          Meet Pixie <ArrowRight size={18} />
        </button>
        <p className="text-center text-xs mt-4" style={{ color: T.duskDark }}>
          We'll only text or email you about your trip — windows, savings, and the moments that matter. Illustrative demo.
        </p>
      </div>
    </div>
  );
}
