"use client";

import { useMemo } from "react";
import { Sparkles } from "lucide-react";
import type { Companion } from "@/lib/catalog/companions";
import { T } from "@/lib/theme";

export const Stars = () => {
  const stars = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        left: (i * 37) % 100,
        top: (i * 53) % 100,
        s: 1 + ((i * 7) % 3),
        d: 2 + ((i * 13) % 40) / 10,
        delay: ((i * 11) % 30) / 10,
      })),
    []
  );
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map((st, i) => (
        <div
          key={i}
          data-star
          className="absolute rounded-full"
          style={{ left: `${st.left}%`, top: `${st.top}%`, width: st.s, height: st.s, background: i % 6 === 0 ? T.gold : "#fff", animation: `wmTwinkle ${st.d}s ease-in-out ${st.delay}s infinite` }}
        />
      ))}
    </div>
  );
};

export const Wordmark = ({ dark }: { dark?: boolean }) => (
  <div className="flex items-center gap-2">
    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: dark ? T.gold : T.violetDeep }}>
      <Sparkles size={15} color={dark ? T.night : "#fff"} />
    </div>
    <span className="wm-display text-lg font-semibold tracking-tight" style={{ color: dark ? "#fff" : T.ink }}>
      Pixie
    </span>
  </div>
);

export const Chip = ({ label, onClick, dark, gold }: { label: string; onClick?: () => void; dark?: boolean; gold?: boolean }) => (
  <button
    onClick={onClick}
    className="wm-body px-3 py-1.5 rounded-full text-sm font-medium transition-transform hover:scale-105 active:scale-95"
    style={gold ? { background: T.gold, color: T.night } : dark ? { background: "rgba(124,92,255,.16)", color: "#CFC5FF", border: "1px solid rgba(124,92,255,.45)" } : { background: "#fff", color: T.violetDeep, border: `1px solid ${T.paperEdge}` }}
  >
    {label}
  </button>
);

/* Companion avatar bubble */
export const CompAvatar = ({ comp, size = 28 }: { comp: Companion; size?: number }) => (
  <div className="rounded-full flex items-center justify-center shrink-0" style={{ width: size, height: size, background: comp.color, fontSize: size * 0.5 }}>
    {comp.glyph}
  </div>
);

export const GoogleGlyph = () => (
  <svg width="16" height="16" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.4 30.1 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.3 17.6 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.1 5.3-4.6 6.9l7.1 5.5C43.2 37.4 46.1 31.5 46.1 24.5z" />
    <path fill="#FBBC05" d="M10.4 28.3c-.5-1.4-.8-2.9-.8-4.3s.3-3 .8-4.3l-7.8-6.1C.9 16.5 0 20.1 0 24s.9 7.5 2.6 10.4l7.8-6.1z" />
    <path fill="#34A853" d="M24 48c6.1 0 11.3-2 15-5.5l-7.1-5.5c-2 1.3-4.5 2.1-7.9 2.1-6.4 0-11.7-3.8-13.6-9.3l-7.8 6.1C6.5 42.6 14.6 48 24 48z" />
  </svg>
);

export const AppleGlyph = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="#fff">
    <path d="M17.05 12.04c-.03-2.9 2.37-4.29 2.48-4.36-1.35-1.98-3.45-2.25-4.2-2.28-1.79-.18-3.49 1.05-4.4 1.05-.9 0-2.3-1.03-3.79-1-1.95.03-3.75 1.13-4.75 2.88-2.03 3.52-.52 8.73 1.45 11.59.96 1.4 2.11 2.97 3.61 2.91 1.45-.06 2-.94 3.75-.94 1.74 0 2.24.94 3.77.91 1.56-.03 2.54-1.42 3.49-2.83 1.1-1.62 1.55-3.19 1.58-3.27-.04-.02-3.03-1.16-3.06-4.61zM14.13 3.6c.8-.97 1.34-2.31 1.19-3.6-1.15.05-2.54.77-3.36 1.73-.74.85-1.39 2.22-1.21 3.53 1.28.1 2.59-.65 3.38-1.66z" />
  </svg>
);
