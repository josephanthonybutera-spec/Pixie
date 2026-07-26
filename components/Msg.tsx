"use client";

import { BellRing, Check, CheckCircle2, Moon, RefreshCw, UserCircle2 } from "lucide-react";
import { COMPANIONS, type Companion } from "@/lib/catalog/companions";
import type { FamilyMemory } from "@/lib/engine/types";
import { usd } from "@/lib/engine/format";
import { T } from "@/lib/theme";
import { CompAvatar } from "./atoms";
import { MemoryCard } from "./MemoryCard";
import type { Message, MsgAction } from "./types";

/* ---- Thread message renderers ---- */
export function Msg({ m, onAction, comp, memory }: { m: Message; onAction: (id: string, a: MsgAction) => void; comp?: Companion | null; memory?: FamilyMemory | null }) {
  if (m.kind === "memory" && memory && comp)
    return (
      <div className="wm-rise">
        <MemoryCard memory={memory} comp={comp} />
      </div>
    );
  if (m.kind === "companion") {
    const c = comp || COMPANIONS[3];
    return (
      <div className="flex justify-start gap-2 wm-rise">
        <CompAvatar comp={c} size={30} />
        <div className="max-w-md px-4 py-2.5 rounded-2xl text-sm" style={{ background: "#fff", color: T.ink, border: `1px solid ${c.color}44`, borderBottomLeftRadius: 6 }}>
          {m.text}
          {m.receipt && (
            <div className="mt-1 flex items-center gap-1 text-xs" style={{ color: c.color }}>
              <RefreshCw size={11} /> {m.receipt}
            </div>
          )}
        </div>
      </div>
    );
  }
  if (m.kind === "user")
    return (
      <div className="flex justify-end wm-rise">
        <div className="max-w-md px-4 py-2.5 rounded-2xl text-sm text-white" style={{ background: T.violet, borderBottomRightRadius: 6 }}>
          {m.text}
        </div>
      </div>
    );
  if (m.kind === "sys")
    return (
      <div className="flex justify-start wm-rise">
        <div className="max-w-md px-4 py-2.5 rounded-2xl text-sm" style={{ background: "#fff", color: T.ink, border: `1px solid ${T.paperEdge}`, borderBottomLeftRadius: 6 }}>
          {m.text}
          {m.receipt && (
            <div className="mt-1 flex items-center gap-1 text-xs" style={{ color: T.violetDeep }}>
              <RefreshCw size={11} /> {m.receipt}
            </div>
          )}
        </div>
      </div>
    );
  if (m.kind === "human")
    return (
      <div className="flex justify-start wm-rise">
        <div className="max-w-md px-4 py-2.5 rounded-2xl text-sm" style={{ background: "#F3ECFB", color: T.ink, border: `1px solid ${T.violetDeep}`, borderBottomLeftRadius: 6 }}>
          <div className="flex items-center gap-1.5 text-xs font-semibold mb-1" style={{ color: T.violetDeep }}>
            <UserCircle2 size={13} /> Ava · Pixie concierge
          </div>
          {m.text}
        </div>
      </div>
    );
  const tier = m.kind; // act | win | brief
  const conf =
    tier === "act"
      ? { bar: T.gold, bg: "#FFFDF4", label: m.label || "Needs you", icon: BellRing }
      : tier === "win"
        ? { bar: T.green, bg: T.greenBg, label: m.label || "Good news", icon: CheckCircle2 }
        : { bar: T.duskDark, bg: "#fff", label: m.label || "While you slept", icon: Moon };
  const I = m.icon || conf.icon;
  return (
    <div className="wm-rise rounded-2xl overflow-hidden" style={{ border: `1px solid ${T.paperEdge}`, borderLeft: `4px solid ${conf.bar}`, background: conf.bg }}>
      <div className="px-4 py-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: conf.bar }}>
          {comp ? <CompAvatar comp={comp} size={16} /> : <I size={13} />} {conf.label}
          {m.sms && (
            <span className="ml-auto normal-case font-normal" style={{ color: T.duskDark }}>
              · also sent by text
            </span>
          )}
        </div>
        {m.title && (
          <div className="wm-display font-semibold mt-1.5" style={{ color: T.ink }}>
            {m.title}
          </div>
        )}
        {m.body && (
          <div className="text-sm mt-1" style={{ color: "#57506E" }}>
            {m.body}
          </div>
        )}
        {m.delta != null && (
          <div className="wm-display text-2xl font-semibold mt-1" style={{ color: tier === "act" ? T.goldDeep : T.green }}>
            {m.delta >= 0 ? "" : "−"}
            {usd(Math.abs(m.delta))}
            {m.deltaSuffix || ""}
          </div>
        )}
        {m.actions && m.actions.length > 0 && (
          <div className="flex gap-2 mt-3">
            {m.actions.map((a, i) => (
              <button
                key={i}
                onClick={() => onAction(m.id, a)}
                className="px-4 py-2 rounded-xl text-sm font-semibold transition-transform hover:scale-105 active:scale-95"
                style={a.primary ? { background: T.night, color: T.gold } : { background: "#fff", color: T.ink, border: `1px solid ${T.paperEdge}` }}
              >
                {a.label}
              </button>
            ))}
          </div>
        )}
        {m.resolved && (
          <div className="mt-2 flex items-center gap-1.5 text-sm font-medium" style={{ color: T.green }}>
            <Check size={14} /> {m.resolved}
          </div>
        )}
      </div>
    </div>
  );
}
