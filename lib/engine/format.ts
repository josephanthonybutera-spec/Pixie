export const ageToHeight = (age: number): number => Math.min(60, Math.round(30 + age * 2.6));

export const parseHM = (s: string): number => {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
};

export const fmt = (mins: number): string => {
  let h = Math.floor(mins / 60);
  const m = mins % 60;
  const ap = h >= 12 ? "pm" : "am";
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, "0")} ${ap}`;
};

export const walkMins = (a: number, b: number): number => 4 + Math.abs(a - b) * 4;

export const usd = (n: number): string => `$${Math.round(n).toLocaleString()}`;

export const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
