export interface Companion {
  id: string;
  name: string;
  glyph: string;
  color: string;
  tag: string;
  voice: string;
  best: string;
}

export const COMPANIONS: Companion[] = [
  { id: "tink", name: "Tinker Bell", glyph: "✨", color: "#48C79A", tag: "Playful & quick", voice: "bright, a little cheeky, loves a clever shortcut", best: "Great with young dreamers and fast-moving days" },
  { id: "godmother", name: "Fairy Godmother", glyph: "🪄", color: "#B57BE0", tag: "Warm & reassuring", voice: "calm, gentle, quietly makes worries disappear", best: "Perfect for first-timers who want their hand held" },
  { id: "genie", name: "Genie", glyph: "🧞", color: "#4E8AC9", tag: "Big energy, big ideas", voice: "enthusiastic, funny, treats every wish as the mission", best: "For families who want it all and want it now" },
  { id: "mickey", name: "Mickey", glyph: "🐭", color: "#E2574C", tag: "Classic & kind", voice: "friendly, upbeat, the steady host of the whole trip", best: "The all-rounder — loved by every age" },
  { id: "belle", name: "Belle", glyph: "📖", color: "#F0A93B", tag: "Thoughtful planner", voice: "curious, detail-loving, remembers the little things", best: "For families who love the story behind every choice" },
  { id: "buzz", name: "Buzz", glyph: "🚀", color: "#6C6FE8", tag: "Mission-focused", voice: "confident, precise, to infinity and beyond schedule", best: "For thrill-seekers and commando-pace crews" },
];

export const compById = (id?: string | null): Companion =>
  COMPANIONS.find((c) => c.id === id) || COMPANIONS[3];
