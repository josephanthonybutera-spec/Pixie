"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CloudRain, Clock, Hotel, Loader2, Moon, RefreshCw, Send, SkipForward, Target, Ticket, Utensils, Wallet, Zap } from "lucide-react";
import { compById } from "@/lib/catalog/companions";
import { PRICE } from "@/lib/catalog/price";
import { RESORTS } from "@/lib/catalog/resorts";
import { ATTR } from "@/lib/catalog/attractions";
import { askClaude, parseJson } from "@/lib/ai/client";
import { fallbackParseBrief, fallbackRoute } from "@/lib/ai/fallbacks";
import { BRIEF_SYSTEM, THREAD_SYSTEM } from "@/lib/ai/prompts";
import type { PreparedIntent, ThreadEdit, ThreadResult } from "@/lib/ai/types";
import { allocateBudget, reallocate } from "@/lib/engine/budget";
import { usd } from "@/lib/engine/format";
import { buildItinerary } from "@/lib/engine/itinerary";
import { buildMemory, companionReflection } from "@/lib/engine/memory";
import { deriveMissions } from "@/lib/engine/missions";
import { stormReplan } from "@/lib/engine/storm";
import type { Alloc, DayOverride, DayPlan, FamilyMemory, Mission, Overrides, Profile, UserProfile } from "@/lib/engine/types";
import { T } from "@/lib/theme";
import { Chip, CompAvatar } from "./atoms";
import { CompanionPicker } from "./CompanionPicker";
import { DiscoveryIntake } from "./DiscoveryIntake";
import { Generating } from "./Generating";
import { HandoffOverlay } from "./HandoffOverlay";
import { Landing } from "./Landing";
import { Msg } from "./Msg";
import { PlanSurface } from "./PlanSurface";
import { ProfileCapture } from "./ProfileCapture";
import { PulseSurface } from "./PulseSurface";
import { RecaptureOverlay } from "./RecaptureOverlay";
import { RevealCard } from "./RevealCard";
import { SecuredOverlay } from "./SecuredOverlay";
import { StatusBar } from "./StatusBar";
import type { Message, MsgAction, PreparedChange, RecaptureMsg, RecaptureState, VaultItem, Watcher } from "./types";

/* ============================================================
   APP ROOT — the OS shell, Thread logic, Demo Director
   ============================================================ */
let MID = 1;
const mid = () => `m${MID++}`;

type Screen = "landing" | "profile" | "companion" | "brief" | "gen" | "os";
type Tab = "thread" | "plan" | "pulse";
type Mode = "autopilot" | "self" | null;

interface ScriptStep {
  delay: number;
  run: () => void;
}

export default function PixieApp() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [alloc, setAlloc] = useState<Alloc | null>(null);
  const [overrides, setOverrides] = useState<Overrides>({});
  const [itinerary, setItinerary] = useState<DayPlan[]>([]);
  const [tab, setTab] = useState<Tab>("thread");
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [apiOk, setApiOk] = useState(true);
  const [mode, setMode] = useState<Mode>(null); // null | 'autopilot' | 'self'
  const [missions, setMissions] = useState<Mission[]>([]);
  const [ledger, setLedger] = useState(0);
  const [ledgerLog, setLedgerLog] = useState<{ what: string; amt: number }[]>([]);
  const [vault, setVault] = useState<VaultItem[]>([]);
  const [handoff, setHandoff] = useState(false);
  const [secured, setSecured] = useState<{ name: string; securedNote?: string } | null>(null);
  const [lastChecked, setLastChecked] = useState(22);
  const [companionId, setCompanionId] = useState<string | null>(null);
  const [memory, setMemory] = useState<FamilyMemory | null>(null);
  const [ssoProvider, setSsoProvider] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [recapture, setRecapture] = useState<RecaptureState | null>(null); // abandoned-cart sequence state
  const scrollRef = useRef<HTMLDivElement>(null);
  const snapRef = useRef<{ overrides: Overrides; itinerary: DayPlan[] } | null>(null);
  const scriptRef = useRef<{ steps: ScriptStep[]; i: number; timer: ReturnType<typeof setTimeout> | null }>({ steps: [], i: 0, timer: null });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 999999, behavior: "smooth" });
  }, [msgs, busy, tab]);

  // Abandoned-trip recapture: if the family builds a trip but doesn't book, Pixie follows up (email+SMS).
  useEffect(() => {
    if (screen !== "os" || mode || !alloc || !profile || recapture) return;
    const timer = setTimeout(() => {
      if (!mode) setRecapture({ seq: recaptureSequence(profile, alloc), i: 0, revealed: false });
    }, 14000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, mode, alloc, recapture]);

  const push = (m: Omit<Message, "id">) => setMsgs((x) => [...x, { id: mid(), ...m }]);
  const resolveMsg = (id: string, resolved: string, extra: Partial<Message> = {}) => setMsgs((x) => x.map((m) => (m.id === id ? { ...m, actions: null, resolved, ...extra } : m)));

  /* ---------- Demo Director ---------- */
  const runStep: () => void = useCallback(() => {
    const s = scriptRef.current;
    if (s.i >= s.steps.length) return;
    const step = s.steps[s.i++];
    setLastChecked(2 + Math.floor(Math.random() * 7));
    step.run();
    if (s.i < s.steps.length) s.timer = setTimeout(runStep, s.steps[s.i].delay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const startScript = useCallback(
    (steps: ScriptStep[]) => {
      const s = scriptRef.current;
      if (s.timer) clearTimeout(s.timer);
      s.steps = steps;
      s.i = 0;
      s.timer = setTimeout(runStep, steps[0].delay);
    },
    [runStep]
  );
  const skipNext = () => {
    const s = scriptRef.current;
    if (s.timer) clearTimeout(s.timer);
    runStep();
  };

  const autopilotScript = useCallback(
    (p: Profile, a: Alloc): ScriptStep[] => {
      const kids = (p.kidAges || []).length;
      const youngest = (p.kidAges || []).length ? Math.min(...(p.kidAges || [])) : null;
      const princessBit = p.characters && youngest != null && youngest <= 8;
      return [
        { delay: 1800, run: () => { push({ kind: "companion", text: "Autopilot's on — I've got it from here. First confirmations land within 24 hours, right here in our thread. Change anything anytime by just telling me." }); setVault([{ name: `${a.resort.name} · ${a.nights} nights` }, { name: `${(p.adults || 2) + kids}× ${p.parkDays}-day tickets` }, { name: "Cinderella's Royal Table — Day 1 dinner" }, { name: "Lightning Lane Multi Pass — all days" }]); } },
        { delay: 5000, run: () => { push({ kind: "win", label: "Booked", icon: Hotel, sms: true, title: `${a.resort.name} — confirmed`, body: `${a.nights} nights · ${a.dates.fmtStart}–${a.dates.fmtEnd} · in your Disney account now.` }); setVault((v) => v.map((x, i) => (i === 0 ? { ...x, conf: "#WM-48213" } : x))); } },
        { delay: 5000, run: () => { push({ kind: "win", label: "Booked", icon: Ticket, sms: true, title: "Park tickets — confirmed", body: "Linked to everyone in your party. Early Entry active every morning." }); setVault((v) => v.map((x, i) => (i === 1 ? { ...x, conf: "#WM-48214" } : x))); } },
        { delay: 7000, run: () => push({ kind: "brief", title: "While you slept", body: "The crowd calendar shifted your arrival to a lighter day (5/10) — Day 1 rope drop just got easier. A refurbishment was announced for your week; your plan never included that ride. Nothing needs you." }) },
        { delay: 8000, run: () => push({ kind: "act", icon: Wallet, sms: true, title: "I caught a promotion for your family", body: "A new room offer released this morning fits your exact dates. Everything else stays exactly as you have it — want me to apply it?", delta: 427, deltaSuffix: " back", actions: [{ label: "Yes, apply it", primary: true, act: "apply427" }, { label: "Not now", act: "dismiss" }] }) },
        { delay: 9000, run: () => { setMissions((ms) => ms.map((m) => (m.id === "crt" ? { ...m, status: "attempting" as const } : m))); push({ kind: "brief", label: "Mission window open", title: "Cinderella's Royal Table — I'm in", body: "The 60-day window just opened. I'm live at 5:40 a.m. ET with backups ranked — this is the one your little one has been dreaming about." }); } },
        { delay: 4200, run: () => { const note = `Dinner in the castle · Day 1 · 5:10 p.m. · party of ${(p.adults || 2) + kids}`; setMissions((ms) => ms.map((m) => (m.id === "crt" ? { ...m, status: "secured" as const, securedNote: note } : m))); setSecured({ name: "Cinderella's Royal Table", securedNote: note }); push({ kind: "win", label: "Mission secured", icon: Target, sms: true, title: "Cinderella's Royal Table — SECURED", body: princessBit ? `${note}. Dinner inside the castle — your ${youngest}-year-old is going to remember this one forever.` : note }); setVault((v) => v.map((x) => (x.name.includes("Cinderella") ? { ...x, conf: "#WM-48302" } : x))); } },
        { delay: 9000, run: () => { setMissions((ms) => ms.map((m) => (m.id === "oga" ? { ...m, status: "hunting" as const } : m))); push({ kind: "brief", label: "Mission update", title: "Oga's Cantina — hunting", body: "First slots went in seconds, so I booked your ranked backup and set a reopening scan to run daily. Cancellations resurface constantly around the 24-hour line — I'll catch one." }); } },
        { delay: 9000, run: () => { setItinerary((it) => it.map((d, i) => (i === 1 ? stormReplan(d) : d))); push({ kind: "win", label: "Storm save", icon: CloudRain, sms: true, title: "I handled a thunderstorm before it happened", body: "Storms likely after 3 p.m. on Day 2, so I already moved your afternoon indoors — nothing lost. Peek at Plan → Day 2." }); } },
        { delay: 9000, run: () => { const note = `Party of ${(p.adults || 2) + kids} · 7:40 p.m. · caught at 11:42 p.m.`; setMissions((ms) => ms.map((m) => (m.id === "oga" ? { ...m, status: "secured" as const, securedNote: note } : m))); setSecured({ name: "Oga's Cantina", securedNote: note }); push({ kind: "win", label: "Caught overnight", icon: Moon, sms: true, title: "While you slept, a table opened. I took it.", body: "Oga's Cantina · " + note }); } },
        { delay: 8000, run: () => push({ kind: "brief", label: "Weekly heartbeat", title: "All quiet.", body: `Watching 6 things · ${a.dates.daysToTrip} days to go · nothing needs you. That's the point — I'll keep thinking about your trip so you don't have to.` }) },
      ];
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [companionId]
  );

  /* Abandoned-trip recapture: escalating email+SMS sequence tied to the trip's real urgency.
     Modeled on best-in-class ecom cart abandonment — concrete urgency beats generic nudges. */
  const recaptureSequence = (p: Profile, a: Alloc): RecaptureMsg[] => {
    const first = (userProfile?.name || "").split(" ")[0] || "there";
    const partySaver = 427;
    return [
      { at: "12 seconds later", channel: "email", subject: `${first}, your Disney trip is saved — but not booked yet`, body: `Pixie built your ${p.parkDays}-day trip to ${a.resort.name} and it's ready to go. Nothing's booked until you say so — and the reservations you want don't wait. Tap to book free, and Pixie takes it from here.`, cta: "Finish booking — free" },
      { at: "1 hour later", channel: "sms", body: `It's Pixie ✨ Your ${a.resort.name} trip is still held, but ${first}, your dining window opens in ${a.dates.daysToDining} days and the hardest reservations go in minutes. Want me to be awake for it? Book free: pixie.trip/${(userProfile?.name || "you").split(" ")[0].toLowerCase()}` },
      { at: "1 day later", channel: "email", subject: `I found $${partySaver} in savings on your trip`, body: `${first} — good news while your trip sat waiting: a room offer released that fits your exact dates and saves your family $${partySaver}. I can only lock it in on a booking I manage, and offers like this disappear fast. Book free and I'll apply it automatically.`, cta: `Book & save $${partySaver}` },
      { at: "3 days later", channel: "sms", body: `${first}, last nudge from Pixie — your dining window (Cinderella's Royal Table is on your list!) opens soon and I can't hold those seats unless your trip is booked. One free tap and I'm on it. pixie.trip/save` },
    ];
  };

  /* ---------- Actions on message buttons ---------- */
  const onAction = (id: string, a: MsgAction) => {
    if (a.act === "apply427" || a.act === "convert427after") {
      resolveMsg(id, "Applied · executed via our partner agency · verified · confirmation updated");
      setLedger((l) => l + 427);
      setLedgerLog((x) => [...x, { what: "Room offer applied", amt: 427 }]);
      setAlloc((al) => (al ? { ...al, room: al.room - 427, buffer: al.buffer + 427 } : al));
    } else if (a.act === "dismiss") resolveMsg(id, "Okay — it stays available in Pulse if you change your mind.");
    else if (a.act === "dismissSelf") resolveMsg(id, "No rush — it's held and I'm watching.");
    else if (a.act === "convert427") {
      resolveMsg(id, "Booking now…");
      beginAutopilot(true);
    } else if (a.act === "confirmChange") {
      resolveMsg(id, mode === "autopilot" ? "Preparing…" : "Draft updated instantly.");
      const ch = a.change;
      setTimeout(
        () => {
          if (!ch) return;
          if (ch.kind === "resort_change") {
            setAlloc(ch.newAlloc);
            setVault((v) => v.map((x, i) => (i === 0 ? { name: `${ch.newAlloc.resort.name} · ${ch.newAlloc.nights} nights`, conf: x.conf } : x)));
          }
          if (ch.kind === "park_hopper") setAlloc((al) => (al ? { ...al, tickets: al.tickets + ch.delta, buffer: al.buffer - ch.delta } : al));
          if (ch.kind === "add_day") {
            setProfile(ch.newProfile);
            setAlloc(ch.newAlloc);
            setItinerary(buildItinerary(ch.newProfile, overrides));
          }
          if (mode === "autopilot") resolveMsg(id, "Executed via our partner agency · verified against your plan · done.");
        },
        mode === "autopilot" ? 1600 : 50
      );
    } else if (a.act === "cancelChange") resolveMsg(id, "Cancelled — nothing changed.");
    else if (a.chipSend) send(a.chipSend);
  };

  /* ---------- Prepared-change builder (engine prices everything) ---------- */
  const buildPrepared = (prepared: PreparedIntent, p: Profile, al: Alloc): { title: string; body: string; delta: number; deltaSuffix: string; change: PreparedChange } | null => {
    if (prepared.kind === "resort_change") {
      const r =
        RESORTS.find((x) => x.name.toLowerCase().includes((prepared.to || "").toLowerCase().split(" ")[0])) ||
        RESORTS.find((x) => (prepared.to || "").toLowerCase().includes(x.name.toLowerCase().split(" ")[0]));
      if (!r) return null;
      const newAlloc = reallocate(p, r.id);
      const delta = newAlloc.room - al.room;
      return { title: `Move to ${r.name}`, body: `${r.tier} · ${r.note} · dates, tickets, dining all preserved.`, delta, deltaSuffix: delta >= 0 ? " more total" : " less total", change: { kind: "resort_change", newAlloc } };
    }
    if (prepared.kind === "park_hopper") {
      const heads = (p.adults || 2) + (p.kidAges || []).length;
      const delta = 85 * heads;
      return { title: "Upgrade to Park Hopper", body: `All ${heads} tickets · hop after 11 a.m. any day.`, delta, deltaSuffix: " more total", change: { kind: "park_hopper", delta } };
    }
    if (prepared.kind === "add_day") {
      const newProfile = { ...p, parkDays: Math.min(6, (p.parkDays || 4) + 1) };
      const newAlloc = allocateBudget(newProfile);
      const delta = (newAlloc.room + newAlloc.tickets + newAlloc.diningCost) - (al.room + al.tickets + al.diningCost);
      return { title: `Add a park day (${newProfile.parkDays} total)`, body: "One more night, tickets extended, plan re-engineered.", delta, deltaSuffix: " more total", change: { kind: "add_day", newProfile, newAlloc } };
    }
    return null;
  };

  /* ---------- Composer ---------- */
  const applyEdits = (edits: ThreadEdit[]) => {
    snapRef.current = { overrides: JSON.parse(JSON.stringify(overrides)), itinerary };
    setOverrides((prev) => {
      const next: Overrides = { ...prev };
      edits.forEach((e) => {
        const di = Math.max(0, (e.day || 1) - 1);
        const o: DayOverride = { exclude: [], include: [], ...(next[di] || {}) };
        if (e.op === "set_pace") o.pace = e.pace;
        if (e.op === "remove") {
          const at = ATTR.find((x) => x.name === e.name) || ATTR.find((x) => x.name.toLowerCase().includes((e.name || "").toLowerCase()));
          if (at) o.exclude = [...new Set([...(o.exclude || []), at.id])];
        }
        if (e.op === "add") {
          const at = ATTR.find((x) => x.name === e.name) || ATTR.find((x) => x.name.toLowerCase().includes((e.name || "").toLowerCase()));
          if (at) {
            o.include = [...new Set([...(o.include || []), at.id])];
            o.exclude = (o.exclude || []).filter((id) => id !== at.id);
          }
        }
        next[di] = o;
      });
      if (profile) setItinerary(buildItinerary(profile, next));
      return next;
    });
  };
  const undo = () => {
    const s = snapRef.current;
    if (!s) return;
    setOverrides(s.overrides);
    setItinerary(s.itinerary);
    snapRef.current = null;
    push({ kind: "companion", text: "Undone — back to the previous plan." });
  };

  const editAckRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onItineraryChange = (next: DayPlan[]) => {
    setItinerary(next);
    // Pixie acknowledges manual edits in the thread, but debounced so rapid drags don't spam.
    if (editAckRef.current) clearTimeout(editAckRef.current);
    editAckRef.current = setTimeout(() => {
      push({ kind: "companion", text: "Nice — I've saved your changes and re-flowed the timing. I'll keep your Lightning Lane picks and dining reservations lined up with your new order.", receipt: "your edits saved" });
    }, 2600);
  };

  const send = async (text: string) => {
    if (!text.trim() || busy || !alloc || !profile) return;
    push({ kind: "user", text });
    setInput("");
    setBusy(true);
    setTab("thread");
    const ctx = { alloc, profile };
    let r: ThreadResult | null = null;
    if (apiOk) {
      try {
        const state = {
          party: { adults: profile.adults, kidAges: profile.kidAges },
          parkDays: profile.parkDays,
          dates: { trip: `${alloc.dates.fmtStart}-${alloc.dates.fmtEnd}`, diningWindow: alloc.dates.fmtDining, llWindow: alloc.dates.fmtLL },
          budget: { target: alloc.target, room: Math.round(alloc.room), tickets: Math.round(alloc.tickets), dining: Math.round(alloc.diningCost), buffer: Math.round(alloc.buffer) },
          resort: alloc.resort.name,
          autopilot: mode === "autopilot",
          ledger,
          missions: missions.map((m) => ({ name: m.name, status: m.status })),
        };
        const raw = await askClaude(THREAD_SYSTEM(state, compById(companionId)), [{ role: "user", content: text }]);
        r = parseJson(raw);
      } catch {
        setApiOk(false);
      }
    }
    if (!r) r = fallbackRoute(text, ctx);

    if (r.human) {
      push({ kind: "companion", text: r.reply || "Bringing a person in." });
      setTimeout(() => push({ kind: "human", text: "Hi, I'm Ava — I've read your whole thread, so no need to repeat anything. What can I take off your plate?" }), 900);
    } else if (r.tradeoffs) {
      push({ kind: "companion", text: r.reply || "Two clean ways to free up budget:" });
      const cheaper = [...RESORTS].sort((a, b) => a.night - b.night).find((x) => x.night < alloc.resort.night);
      const opts: { label: string; chipSend: string }[] = [];
      if (cheaper) {
        const na = reallocate(profile, cheaper.id);
        opts.push({ label: `Switch to ${cheaper.name} · save ${usd(alloc.room - na.room)}`, chipSend: `Move us to ${cheaper.name}` });
      }
      const qd = PRICE.dining.quick;
      const kids = (profile.kidAges || []).length;
      const quickCost = ((profile.adults || 2) * qd.a + kids * qd.k) * ((profile.parkDays || 4) + 1);
      if (alloc.diningCost > quickCost) opts.push({ label: `Quick-service dining · save ${usd(alloc.diningCost - quickCost)}`, chipSend: "Switch us to quick-service dining" });
      push({ kind: "act", label: "Trade-offs", icon: Wallet, title: null, body: "Tap one and it's prepared — nothing changes without your confirm.", actions: opts.map((o) => ({ label: o.label, chipSend: o.chipSend })) });
    } else if (r.prepared) {
      const pc = buildPrepared(r.prepared, profile, alloc);
      if (pc)
        push({
          kind: "act",
          label: mode === "autopilot" ? "Prepared change" : "Draft change",
          icon: Hotel,
          sms: mode === "autopilot",
          title: pc.title,
          body: pc.body + (mode === "autopilot" ? " Executed by a human, verified by AI." : ""),
          delta: pc.delta,
          deltaSuffix: pc.deltaSuffix,
          actions: [{ label: "Confirm", primary: true, act: "confirmChange", change: pc.change }, { label: "Cancel", act: "cancelChange" }],
        });
      else push({ kind: "companion", text: "I couldn't match that resort — try one from the Pulse list." });
    } else if (r.edits && r.edits.length) {
      if (text.toLowerCase().includes("quick-service")) {
        const kids = (profile.kidAges || []).length;
        const qd = PRICE.dining.quick;
        const nc = ((profile.adults || 2) * qd.a + kids * qd.k) * ((profile.parkDays || 4) + 1);
        setAlloc((al) => (al ? { ...al, buffer: al.buffer + (al.diningCost - nc), diningCost: nc } : al));
      }
      applyEdits(r.edits);
      learnBehavior(text);
      push({ kind: "companion", text: r.reply || "Done.", receipt: "plan re-optimized · say “undo” to reverse" });
    } else if (/^undo/i.test(text)) {
      undo();
    } else {
      if (text.toLowerCase().includes("quick-service")) {
        const kids = (profile.kidAges || []).length;
        const qd = PRICE.dining.quick;
        const nc = ((profile.adults || 2) * qd.a + kids * qd.k) * ((profile.parkDays || 4) + 1);
        setAlloc((al) => (al ? { ...al, buffer: al.buffer + (al.diningCost - nc), diningCost: nc } : al));
        setProfile((p) => (p ? { ...p, dining: "quick" } : p));
        setItinerary(buildItinerary({ ...profile, dining: "quick" }, overrides));
        push({ kind: "companion", text: "Switched to quick-service — dining budget freed into your buffer, plan re-optimized.", receipt: "plan re-optimized" });
      } else push({ kind: "companion", text: r.reply });
    }
    setBusy(false);
  };

  /* ---------- Flow ---------- */
  const buildFromProfile = (p: Profile) => {
    if (p.starwars && !(p.mustDos || []).includes("Star Wars: Rise of the Resistance")) (p.mustDos = p.mustDos || []).push("Star Wars: Rise of the Resistance");
    const a = allocateBudget(p);
    const comp = compById(companionId);
    const firstName = (userProfile?.name || "").split(" ")[0];
    const mem = buildMemory(p, companionId, userProfile);
    setProfile(p);
    setAlloc(a);
    setItinerary(buildItinerary(p, {}));
    setMissions(deriveMissions(p, a));
    setMemory(mem);
    setMsgs([
      { id: mid(), kind: "companion", text: companionReflection(p, comp, firstName) },
      { id: mid(), kind: "memory" },
    ]);
  };
  const onBrief = async (text: string) => {
    setScreen("gen");
    let p: Profile | null = null;
    try {
      const raw = await askClaude(BRIEF_SYSTEM, [{ role: "user", content: text }]);
      p = parseJson(raw) as Profile;
      if (!p.budget) p.budget = 6500;
      if (!p.pace) p.pace = "balanced";
      if (!p.dining) p.dining = "mix";
      if (p.characters === null || p.characters === undefined) p.characters = (p.kidAges || []).some((k) => k <= 8);
    } catch {
      setApiOk(false);
      p = fallbackParseBrief(text);
    }
    buildFromProfile(p);
  };
  const onDiscoveryComplete = (p: Profile) => {
    setScreen("gen");
    buildFromProfile(p);
  };
  const onGenerated = () => setScreen("os");

  /* A behavior the companion "learns" the first time the guest edits — proves the memory grows */
  const learnBehavior = (text: string) => {
    if (!memory) return;
    let learned: string | null = null;
    const t = text.toLowerCase();
    if (/relax|slower|tired|too much/.test(t)) learned = "prefers a gentler pace — I'll lean relaxed next trip";
    else if (/more rides|commando|pack|faster/.test(t)) learned = "wants to maximize rides — I'll plan bolder next time";
    else if (/quick-service|quick service/.test(t)) learned = "likes quick meals over long sit-downs";
    else if (/skyliner|riviera|hopper|resort/.test(t)) learned = "cares about resort & transport choices";
    if (learned && !memory.behaviors.includes(learned)) {
      const l = learned;
      setMemory((m) => (m ? { ...m, behaviors: [...m.behaviors, l] } : m));
    }
  };

  const beginAutopilot = (fromConvert = false) => {
    setHandoff(true);
    if (fromConvert) setLedger(0); // ledger applies right after handoff via act resolution below
  };
  const finishHandoff = () => {
    setHandoff(false);
    setMode("autopilot");
    push({ kind: "win", label: "Autopilot on", icon: Zap, title: "I'm on it.", body: "You own everything; I do the clicking. Ask me anything, change anything with a word, and I'll bring in a human for anything irreversible — just say “talk to a person.”" });
    if (profile && alloc) startScript(autopilotScript(profile, alloc));
  };
  const dismissRecapture = () => {
    setRecapture(null);
  };

  const onAssumptionChip = (a: string) => {
    const la = a.toLowerCase();
    if (la.includes("pace")) push({ kind: "act", label: "Change pace", title: null, body: "Pick the pace for the whole trip:", actions: [{ label: "Relaxed", chipSend: "Make the whole trip relaxed" }, { label: "Commando", chipSend: "Make day 1 commando" }] });
    else if (la.includes("dining")) push({ kind: "act", label: "Change dining", title: null, body: "How should meals work?", actions: [{ label: "Quick-service (save $)", chipSend: "Switch us to quick-service dining" }, { label: "Keep the mix", act: "cancelChange" }] });
    else if (la.includes("month")) push({ kind: "companion", text: "Tell me the month — e.g. “we're going in October” — and I'll re-derive your windows and dates." });
    else push({ kind: "companion", text: `Just tell me what to change about “${a}” and I'll re-engineer around it.` });
    setTab("thread");
  };

  /* ---------- Derived ---------- */
  const watchers: Watcher[] = alloc
    ? [
        { name: "Room rate & promos", icon: Hotel, state: "no drop today", mins: lastChecked },
        { name: "Ticket offers", icon: Ticket, state: "none active", mins: lastChecked + 3 },
        { name: "Mission reopenings", icon: Utensils, state: missions.some((m) => m.status === "hunting") ? "scanning daily" : "staged", mins: lastChecked + 1 },
        { name: "Weather (trip week)", icon: CloudRain, state: itinerary.some((d) => d.storm) ? "storm handled" : "clear", mins: lastChecked + 5 },
        { name: "Refurbishments", icon: RefreshCw, state: "none affect you", mins: lastChecked + 8 },
        { name: "Park hours", icon: Clock, state: "as planned", mins: lastChecked + 2 },
      ]
    : [];
  const nextLine = alloc ? (missions.every((m) => m.status === "secured") ? `Lightning Lanes ${alloc.dates.fmtLL}` : `dining window in ${alloc.dates.daysToDining}d`) : "";

  /* ---------- Render ---------- */
  const onSSO = (provider: string) => {
    setSsoProvider(provider);
    setScreen("profile");
  };
  const onProfileDone = (p: UserProfile) => {
    setUserProfile(p);
    setScreen("companion");
  };
  const onCompanionChosen = (id: string) => {
    setCompanionId(id);
    setScreen("brief");
  };

  if (screen === "landing")
    return (
      <div className="wm-body">
        <Landing onSSO={onSSO} />
      </div>
    );
  if (screen === "profile")
    return (
      <div className="wm-body">
        <ProfileCapture ssoProvider={ssoProvider} onComplete={onProfileDone} />
      </div>
    );
  if (screen === "companion")
    return (
      <div className="wm-body">
        <CompanionPicker onPick={onCompanionChosen} />
      </div>
    );
  if (screen === "brief")
    return (
      <div className="wm-body">
        <DiscoveryIntake comp={compById(companionId)} profileName={userProfile?.name} onComplete={onDiscoveryComplete} onFreeText={onBrief} />
      </div>
    );
  if (screen === "gen")
    return (
      <div className="wm-body">
        <Generating budget={(profile && profile.budget) || 6500} onDone={onGenerated} />
      </div>
    );

  return (
    <div className="wm-body min-h-screen flex flex-col" style={{ background: T.paper }}>
      {/* Top bar */}
      <div className="px-4 py-2.5 flex items-center justify-between" style={{ background: T.night, borderBottom: `1px solid ${T.night2}` }}>
        <div className="flex items-center gap-2">
          <CompAvatar comp={compById(companionId)} size={28} />
          <div>
            <div className="text-sm font-semibold leading-tight" style={{ color: "#fff" }}>
              {compById(companionId).name}
            </div>
            <div className="text-xs leading-tight" style={{ color: T.dusk }}>
              your Disney companion
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {(["thread", "plan", "pulse"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)} className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize" style={tab === t ? { background: T.gold, color: T.night } : { color: T.dusk }}>
              {t}
            </button>
          ))}
          <span className="hidden sm:inline text-xs px-2 py-1 rounded-full ml-1" style={{ background: "rgba(255,255,255,.07)", color: T.duskDark }}>
            demo: 6 weeks compressed
          </span>
          <button onClick={skipNext} title="Next event" className="p-1.5 rounded-lg" style={{ background: "rgba(255,255,255,.07)" }}>
            <SkipForward size={13} color={T.dusk} />
          </button>
        </div>
      </div>
      <StatusBar ledger={ledger} missions={missions} watchers={6} nextLine={nextLine} lastChecked={lastChecked} />

      <div className="flex-1 overflow-hidden flex flex-col">
        {tab === "plan" && alloc && profile && (
          <div className="flex-1 overflow-y-auto">
            <PlanSurface profile={profile} itinerary={itinerary} alloc={alloc} onItineraryChange={onItineraryChange} />
          </div>
        )}
        {tab === "pulse" && (
          <div className="flex-1 overflow-y-auto">
            <PulseSurface missions={missions} watchers={watchers} ledger={ledger} ledgerLog={ledgerLog} vault={vault} autopilot={mode === "autopilot"} memory={memory} comp={compById(companionId)} />
          </div>
        )}
        {tab === "thread" && (
          <>
            <div ref={scrollRef} className="flex-1 overflow-y-auto">
              <div className="max-w-2xl mx-auto px-4 py-5 space-y-3">
                {!mode && alloc && profile && <RevealCard profile={profile} alloc={alloc} onAutopilot={() => beginAutopilot(false)} onChip={onAssumptionChip} />}
                {mode && alloc && profile && (
                  <div className="rounded-2xl px-4 py-3 flex items-center justify-between text-sm" style={{ background: "#fff", border: `1px solid ${T.paperEdge}` }}>
                    <span style={{ color: T.ink }}>
                      <b>{alloc.resort.name}</b> · {profile.parkDays} days · {alloc.dates.fmtStart}–{alloc.dates.fmtEnd}
                    </span>
                    <button onClick={() => setTab("plan")} className="text-xs font-semibold" style={{ color: T.violetDeep }}>
                      View plan →
                    </button>
                  </div>
                )}
                {msgs.map((m) => (
                  <Msg key={m.id} m={m} onAction={onAction} comp={compById(companionId)} memory={memory} />
                ))}
                {busy && (
                  <div className="flex items-center gap-2 text-xs" style={{ color: T.duskDark }}>
                    <Loader2 size={12} className="animate-spin" /> thinking…
                  </div>
                )}
              </div>
            </div>
            <div className="px-4 pb-4 pt-2" style={{ background: T.paper }}>
              <div className="max-w-2xl mx-auto">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {["When does our dining window open?", "Can I save money?", "Make Day 2 more relaxed", "Move us to the Riviera", mode === "autopilot" ? "Add another park day" : "Talk to a person"].map((c) => (
                    <Chip key={c} label={c} onClick={() => send(c)} />
                  ))}
                </div>
                <div className="flex gap-2 items-center rounded-2xl px-4 py-1.5" style={{ background: "#fff", border: `1px solid ${T.paperEdge}` }}>
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send(input)}
                    placeholder="Ask anything · change anything"
                    className="flex-1 bg-transparent outline-none text-sm py-2"
                    style={{ color: T.ink }}
                  />
                  <button onClick={() => send(input)} className="p-2 rounded-xl" style={{ background: T.gold }}>
                    <Send size={15} color={T.night} />
                  </button>
                </div>
                <p className="text-center text-xs mt-2" style={{ color: T.duskDark }}>
                  {apiOk ? "Live AI · numbers come from the engine, never the model" : "Offline mode · deterministic engine only"} · illustrative demo
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {handoff && <HandoffOverlay onDone={finishHandoff} />}
      {secured && <SecuredOverlay mission={secured} onDone={() => setSecured(null)} />}
      {recapture && !mode && (
        <RecaptureOverlay
          data={recapture}
          comp={compById(companionId)}
          onStep={() => setRecapture((r) => (r ? { ...r, i: Math.min(r.i + 1, r.seq.length - 1) } : r))}
          onBook={() => {
            setRecapture(null);
            beginAutopilot(false);
          }}
          onClose={dismissRecapture}
        />
      )}
    </div>
  );
}
