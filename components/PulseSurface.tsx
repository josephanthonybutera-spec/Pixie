"use client";

import { CheckCircle2, Landmark, Radar, Target, Wallet } from "lucide-react";
import type { Companion } from "@/lib/catalog/companions";
import type { FamilyMemory, Mission } from "@/lib/engine/types";
import { usd } from "@/lib/engine/format";
import { T } from "@/lib/theme";
import { MemoryCard } from "./MemoryCard";
import type { VaultItem, Watcher } from "./types";

/* ---- Pulse surface ---- */
export function PulseSurface({
  missions,
  watchers,
  ledger,
  ledgerLog,
  vault,
  autopilot,
  memory,
  comp,
}: {
  missions: Mission[];
  watchers: Watcher[];
  ledger: number;
  ledgerLog: { what: string; amt: number }[];
  vault: VaultItem[];
  autopilot: boolean;
  memory: FamilyMemory | null;
  comp: Companion;
}) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      {memory && comp && <MemoryCard memory={memory} comp={comp} />}
      <div className="rounded-2xl p-4" style={{ background: `linear-gradient(160deg, ${T.night2}, ${T.night})`, border: `1px solid ${T.violetDeep}` }}>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest" style={{ color: T.gold }}>
          <Wallet size={13} /> Savings Ledger
        </div>
        <div className="wm-display text-4xl font-semibold mt-1 wm-tick" key={ledger} style={{ color: T.gold }}>
          {usd(ledger)}
        </div>
        <div className="text-xs" style={{ color: T.dusk }}>
          protected so far · only goes up
        </div>
        {ledgerLog.length > 0 && (
          <div className="mt-2 space-y-1">
            {ledgerLog.map((l, i) => (
              <div key={i} className="text-xs flex justify-between" style={{ color: "#CFC5FF" }}>
                <span>{l.what}</span>
                <span style={{ color: T.gold }}>+{usd(l.amt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center gap-2 font-semibold text-sm mb-2" style={{ color: T.ink }}>
          <Target size={15} color={T.violetDeep} /> Missions
        </div>
        <div className="space-y-2.5">
          {missions.map((m) => {
            const st = m.status;
            const stConf =
              st === "secured"
                ? { c: T.green, bg: T.greenBg, label: "SECURED" }
                : st === "hunting"
                  ? { c: "#B0892B", bg: "#FFF9E8", label: "HUNTING — scanning daily" }
                  : st === "attempting"
                    ? { c: T.violetDeep, bg: "#F3ECFB", label: "AT THE WINDOW NOW" }
                    : { c: T.blue, bg: "#EFF5FB", label: `STAGED · window ${m.window}` };
            return (
              <div key={m.id} className="rounded-2xl p-4" style={{ background: "#fff", border: `1px solid ${T.paperEdge}`, borderLeft: `4px solid ${stConf.c}` }}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-sm" style={{ color: T.ink }}>
                      {m.name}
                    </div>
                    <div className="text-xs" style={{ color: T.duskDark }}>
                      {m.why}
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap" style={{ background: stConf.bg, color: stConf.c }}>
                    {stConf.label}
                  </span>
                </div>
                <div className="text-xs mt-2" style={{ color: "#57506E" }}>
                  {st === "secured" ? (
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 size={12} color={T.green} /> {m.securedNote}
                    </span>
                  ) : (
                    <>
                      Our plan: staged {m.staged} · backups: {m.backups.join(", ")}
                      {st === "hunting" && " · cancellations resurface constantly — we catch reopenings"}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 font-semibold text-sm mb-2" style={{ color: T.ink }}>
          <Radar size={15} color={T.violetDeep} /> Watching for you
        </div>
        <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${T.paperEdge}` }}>
          {watchers.map((w, i) => (
            <div key={w.name} className="px-4 py-2.5 flex items-center justify-between text-sm" style={{ background: i % 2 ? "#fff" : "#FBF8F2", borderTop: i ? `1px solid ${T.paperEdge}` : "none" }}>
              <span className="flex items-center gap-2" style={{ color: T.ink }}>
                <w.icon size={14} color={T.violetDeep} />
                {w.name}
              </span>
              <span className="text-xs" style={{ color: T.duskDark }}>
                {w.state} · checked {w.mins}m ago
              </span>
            </div>
          ))}
        </div>
      </div>

      {autopilot && vault.length > 0 && (
        <div>
          <div className="flex items-center gap-2 font-semibold text-sm mb-2" style={{ color: T.ink }}>
            <Landmark size={15} color={T.violetDeep} /> Reservation vault — yours, always
          </div>
          <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${T.paperEdge}` }}>
            {vault.map((v, i) => (
              <div key={i} className="px-4 py-2.5 flex items-center justify-between text-sm" style={{ background: i % 2 ? "#fff" : "#FBF8F2", borderTop: i ? `1px solid ${T.paperEdge}` : "none" }}>
                <span style={{ color: T.ink }}>{v.name}</span>
                <span className="text-xs font-mono" style={{ color: v.conf ? T.green : T.duskDark }}>
                  {v.conf || "pending window"}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs mt-2" style={{ color: T.duskDark }}>
            Every confirmation lives in your own Disney account. Say the word in the Thread to change any of it.
          </p>
        </div>
      )}
    </div>
  );
}
