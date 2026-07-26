"use client";

import { Calendar, Radar, Target, Wallet } from "lucide-react";
import type { Mission } from "@/lib/engine/types";
import { usd } from "@/lib/engine/format";
import { T } from "@/lib/theme";

/* The Status Bar — the OS heartbeat */
export function StatusBar({ ledger, missions, watchers, nextLine, lastChecked }: { ledger: number; missions: Mission[]; watchers: number; nextLine: string; lastChecked: number }) {
  const secured = missions.filter((m) => m.status === "secured").length;
  const seg = (icon: React.ReactNode, text: React.ReactNode) => (
    <span className="inline-flex items-center gap-1 whitespace-nowrap">
      {icon}
      {text}
    </span>
  );
  return (
    <div className="px-4 py-2 text-xs font-medium flex gap-3 overflow-x-auto" style={{ background: T.night2, color: "#CFC5FF", borderBottom: `1px solid ${T.violetDeep}` }}>
      {seg(
        <Wallet size={12} color={T.gold} />,
        <span>
          Protected:{" "}
          <b style={{ color: T.gold }} className="wm-tick" key={ledger}>
            {usd(ledger)}
          </b>
        </span>
      )}
      <span style={{ color: T.duskDark }}>·</span>
      {seg(
        <Target size={12} color={T.gold} />,
        <span>
          Missions: {secured} of {missions.length} secured
        </span>
      )}
      <span style={{ color: T.duskDark }}>·</span>
      {seg(
        <Radar size={12} color={T.gold} />,
        <span>
          Watching {watchers} things <span style={{ color: T.duskDark }}>(checked {lastChecked}m ago)</span>
        </span>
      )}
      <span style={{ color: T.duskDark }}>·</span>
      {seg(<Calendar size={12} color={T.gold} />, <span>Next: {nextLine}</span>)}
    </div>
  );
}
