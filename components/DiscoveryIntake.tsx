"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Loader2, Send, Sparkles } from "lucide-react";
import type { Companion } from "@/lib/catalog/companions";
import { DISCOVERY, type DiscoveryOption } from "@/lib/discovery";
import { normalizeState, type IntakeState } from "@/lib/engine/intake";
import { usd } from "@/lib/engine/format";
import type { Profile } from "@/lib/engine/types";
import { T } from "@/lib/theme";
import { CompAvatar, Stars } from "./atoms";

export function DiscoveryIntake({ comp, profileName, onComplete, onFreeText }: { comp: Companion; profileName?: string; onComplete: (p: Profile) => void; onFreeText: (text: string) => void }) {
  const first = (profileName || "").split(" ")[0];
  const [state, setState] = useState<IntakeState>({});
  const [history, setHistory] = useState<{ role: "pixie" | "user"; text: string }[]>([]);
  const [multiSel, setMultiSel] = useState<number[]>([]);
  const [typing, setTyping] = useState(false);
  const [typed, setTyped] = useState("");
  const [showType, setShowType] = useState(false);
  const [oneShot, setOneShot] = useState("");
  const [showOneShot, setShowOneShot] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // find the next applicable step from an index
  const nextApplicable = (from: number, s: IntakeState) => {
    let i = from;
    while (i < DISCOVERY.length) {
      const st = DISCOVERY[i];
      if (!st.showIf || st.showIf(s)) return i;
      i++;
    }
    return DISCOVERY.length;
  };
  const [curIdx, setCurIdx] = useState(() => nextApplicable(0, {}));

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 999999, behavior: "smooth" });
  }, [history, curIdx, typing]);

  const learnedFacts = () => {
    const f: string[] = [];
    if (state.adults) f.push(`${state.adults} adult${state.adults > 1 ? "s" : ""}${state.kidAges?.length ? ` + ${state.kidAges.length} kid${state.kidAges.length > 1 ? "s" : ""}` : ""}`);
    if (state.kidAges?.length) f.push(`ages ${state.kidAges.join(", ")}`);
    if (state.parkDays) f.push(`${state.parkDays} park days`);
    if (state.month) f.push(state.month);
    if (state.characters) f.push("loves characters");
    if (state.starwars) f.push("Star Wars fan");
    const pl: string[] = [];
    if (state._pNew) pl.push("newest rides");
    if (state._pClassic) pl.push("the classics");
    if (state._pThrill) pl.push("big thrills");
    if (state._pGentle) pl.push("gentle rides");
    if (pl.length) f.push(pl.join(" + "));
    if (state.pace) f.push(`${state.pace} pace`);
    if (state.dining) f.push(state.dining === "table" ? "sit-down dining" : state.dining === "quick" ? "quick dining" : "mixed dining");
    if (state.budget) f.push(usd(state.budget));
    return f;
  };

  const step = DISCOVERY[curIdx];

  const advance = (newState: IntakeState, answerLabel: string) => {
    const q = step.q(first);
    setHistory((h) => [...h, { role: "pixie", text: q }, { role: "user", text: answerLabel }]);
    setMultiSel([]);
    setShowType(false);
    setTyped("");
    const ni = nextApplicable(curIdx + 1, newState);
    setState(newState);
    if (ni >= DISCOVERY.length) {
      setTyping(true);
      setHistory((h) => [...h, { role: "pixie", text: `Amazing — I've got everything I need${first ? `, ${first}` : ""}. Building your family's trip now…` }]);
      setTimeout(() => onComplete(normalizeState(newState)), 1400);
    } else {
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        setCurIdx(ni);
      }, 650);
    }
  };

  const pickSingle = (opt: DiscoveryOption) => advance({ ...state, ...(opt.set || {}) }, opt.label);
  const toggleMulti = (_opt: DiscoveryOption, i: number) => setMultiSel((m) => (m.includes(i) ? m.filter((x) => x !== i) : [...m, i]));
  const confirmMulti = () => {
    if (step.key === "ages") {
      const ages = multiSel.map((i) => step.options[i].add).filter((n): n is number => n != null);
      advance({ ...state, kidAges: ages }, ages.length ? `Ages ${ages.join(", ")}` : "No kids");
    } else {
      let ns: IntakeState = { ...state };
      multiSel.forEach((i) => {
        ns = { ...ns, ...(step.options[i].set || {}) };
      });
      advance(ns, multiSel.map((i) => step.options[i].label).join(", ") || "Surprise us");
    }
  };
  const submitTyped = () => {
    if (!typed.trim()) return;
    advance({ ...state, _note: (state._note || "") + " " + typed }, typed);
  };

  return (
    <div className="min-h-screen relative wm-body flex flex-col" style={{ background: `radial-gradient(1200px 700px at 50% -10%, ${T.nightSoft}, ${T.night})` }}>
      <Stars />
      <div className="relative max-w-xl w-full mx-auto px-4 pt-6 flex-1 flex flex-col" style={{ minHeight: 0 }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CompAvatar comp={comp} size={30} />
            <div>
              <div className="text-sm font-semibold text-white leading-tight">{comp.name}</div>
              <div className="text-xs leading-tight" style={{ color: T.dusk }}>
                planning your trip with you
              </div>
            </div>
          </div>
          <button onClick={() => setShowOneShot((v) => !v)} className="text-xs px-3 py-1.5 rounded-full" style={{ background: "rgba(255,255,255,.07)", color: T.dusk, border: "1px solid rgba(255,255,255,.14)" }}>
            I'll just tell you everything
          </button>
        </div>

        {showOneShot && (
          <div className="mt-3 rounded-2xl p-2 flex gap-2 wm-rise" style={{ background: "rgba(255,255,255,.07)", border: `1px solid ${comp.color}` }}>
            <input
              value={oneShot}
              onChange={(e) => setOneShot(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && oneShot.trim() && onFreeText(oneShot)}
              placeholder="Family of four, 5 days, princess 6-yo, Star Wars 10-yo, $6,500"
              className="flex-1 bg-transparent outline-none text-sm px-3 py-2 text-white placeholder:text-gray-500"
            />
            <button onClick={() => oneShot.trim() && onFreeText(oneShot)} className="px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: T.gold, color: T.night }}>
              Build it
            </button>
          </div>
        )}

        {/* progress */}
        <div className="mt-3 flex gap-1">
          {DISCOVERY.map((_, i) => (
            <div key={i} className="flex-1 h-1 rounded-full" style={{ background: i <= curIdx ? comp.color : "rgba(255,255,255,.12)" }} />
          ))}
        </div>

        {/* conversation */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 space-y-3" style={{ minHeight: 0 }}>
          {history.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} gap-2 wm-rise`}>
              {m.role === "pixie" && <CompAvatar comp={comp} size={26} />}
              <div
                className="max-w-sm px-4 py-2.5 rounded-2xl text-sm"
                style={m.role === "user" ? { background: comp.color, color: "#fff", borderBottomRightRadius: 6 } : { background: "#fff", color: T.ink, border: `1px solid ${comp.color}33`, borderBottomLeftRadius: 6 }}
              >
                {m.text}
              </div>
            </div>
          ))}
          {/* current question */}
          {!typing && step && (
            <div className="flex justify-start gap-2 wm-rise">
              <CompAvatar comp={comp} size={26} />
              <div className="max-w-sm px-4 py-2.5 rounded-2xl text-sm" style={{ background: "#fff", color: T.ink, border: `1px solid ${comp.color}33`, borderBottomLeftRadius: 6 }}>
                {step.q(first)}
              </div>
            </div>
          )}
          {typing && (
            <div className="flex items-center gap-2 text-sm ml-9" style={{ color: T.dusk }}>
              <Loader2 size={13} className="animate-spin" /> {comp.name} is typing…
            </div>
          )}
        </div>

        {/* answer controls */}
        {!typing && step && (
          <div className="pb-5 wm-rise">
            {!showType ? (
              <>
                {/* NOTE: preserved prototype quirk — step.type always holds the free-text
                    placeholder (never "single"), so every step renders the multi-select UI. */}
                {(step.type as string) === "single" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {step.options.map((o, i) => (
                      <button
                        key={i}
                        onClick={() => pickSingle(o)}
                        className="text-left px-4 py-3 rounded-2xl text-sm font-medium transition-transform hover:scale-[1.02] active:scale-95 flex items-center gap-2"
                        style={{ background: "rgba(255,255,255,.06)", color: "#EDEAF7", border: "1px solid rgba(255,255,255,.15)" }}
                      >
                        <span className="w-4 h-4 rounded-full shrink-0" style={{ border: `2px solid ${comp.color}` }} />
                        {o.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      {step.options.map((o, i) => {
                        const on = multiSel.includes(i);
                        return (
                          <button
                            key={i}
                            onClick={() => toggleMulti(o, i)}
                            className="text-left px-4 py-3 rounded-2xl text-sm font-medium transition-transform active:scale-95 flex items-center gap-2"
                            style={{ background: on ? `${comp.color}22` : "rgba(255,255,255,.06)", color: "#EDEAF7", border: `1px solid ${on ? comp.color : "rgba(255,255,255,.15)"}` }}
                          >
                            <span className="w-4 h-4 rounded-md shrink-0 flex items-center justify-center" style={{ background: on ? comp.color : "transparent", border: `2px solid ${on ? comp.color : "rgba(255,255,255,.3)"}` }}>
                              {on && <Check size={11} color="#fff" />}
                            </span>
                            {o.label}
                          </button>
                        );
                      })}
                    </div>
                    <button onClick={confirmMulti} className="mt-2 w-full py-3 rounded-2xl font-semibold" style={{ background: T.gold, color: T.night }}>
                      {multiSel.length ? "Continue" : step.key === "loves" ? "Surprise us" : "Skip"} <ArrowRight size={15} className="inline" />
                    </button>
                  </>
                )}
                <button onClick={() => setShowType(true)} className="mt-2 text-xs mx-auto block" style={{ color: T.dusk }}>
                  …or type my own answer
                </button>
              </>
            ) : (
              <div className="rounded-2xl p-2 flex gap-2" style={{ background: "rgba(255,255,255,.07)", border: `1px solid ${comp.color}` }}>
                <input
                  autoFocus
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitTyped()}
                  placeholder={step.type}
                  className="flex-1 bg-transparent outline-none text-sm px-3 py-2 text-white placeholder:text-gray-500"
                />
                <button onClick={submitTyped} className="p-2 rounded-xl" style={{ background: T.gold }}>
                  <Send size={15} color={T.night} />
                </button>
              </div>
            )}
            {/* live "learning" rail */}
            {learnedFacts().length > 0 && (
              <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                <span className="text-xs" style={{ color: T.duskDark }}>
                  <Sparkles size={11} color={comp.color} className="inline" /> {comp.name} is learning:
                </span>
                {learnedFacts().map((f, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 rounded-full wm-tick" style={{ background: "rgba(255,255,255,.07)", color: "#CFC5FF" }}>
                    {f}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
