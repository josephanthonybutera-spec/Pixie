import type { IntakeState } from "@/lib/engine/intake";

/* ============================================================
   DISCOVERY INTAKE — Pixie runs a warm "sales discovery" chat.
   One question at a time, tappable multiple-choice (ChatGPT-style),
   with a type-your-own escape and a one-sentence shortcut.
   Answers become live "learned" facts to build the known-feeling.
   ============================================================ */

export interface DiscoveryOption {
  label: string;
  set?: Partial<IntakeState>;
  /** for the "ages" step: the representative age this band adds */
  add?: number;
}

export interface DiscoveryStep {
  key: string;
  q: (firstName?: string) => string;
  /** Placeholder for the type-your-own input. In the prototype each step
   *  declared `type` twice ("single"/"multi" and then this example string);
   *  the second declaration won, so at runtime every step rendered the
   *  multi-select UI with this string as the input placeholder. Preserved
   *  as-is — do not "fix" this back to single/multi without expecting a
   *  behavior change. */
  type: string;
  showIf?: (s: IntakeState) => boolean;
  options: DiscoveryOption[];
  learn: string;
}

export const DISCOVERY: DiscoveryStep[] = [
  {
    key: "party",
    q: (n) => `So excited to plan this with you${n ? `, ${n}` : ""}! First — who's coming on this magical trip?`,
    options: [
      { label: "2 adults + young kids", set: { adults: 2, _kidBand: "young" } },
      { label: "2 adults + big kids", set: { adults: 2, _kidBand: "big" } },
      { label: "Just the 2 of us", set: { adults: 2, kidAges: [], _kidBand: "none" } },
      { label: "Big group (6+)", set: { adults: 4, _kidBand: "mixed" } },
    ],
    type: "e.g. 2 adults, kids 4 and 7",
    learn: "who's coming",
  },
  {
    key: "ages",
    q: () => "Love it. How old are the kids? (Tap all that fit — this shapes everything.)",
    showIf: (s) => Boolean(s._kidBand && (s.kidAges === undefined || s.kidAges.length === 0) && s._kidBand !== "none"),
    options: [
      { label: "Under 3", add: 2 },
      { label: "3–5", add: 4 },
      { label: "6–8", add: 7 },
      { label: "9–12", add: 10 },
      { label: "Teens", add: 15 },
    ],
    type: "e.g. 4, 7, and 10",
    learn: "kids' ages",
  },
  {
    key: "days",
    q: () => "Perfect. How many days will you be in the parks?",
    options: [
      { label: "3 days", set: { parkDays: 3 } },
      { label: "4 days", set: { parkDays: 4 } },
      { label: "5 days", set: { parkDays: 5 } },
      { label: "6+ days", set: { parkDays: 6 } },
    ],
    type: "e.g. 5 days",
    learn: "trip length",
  },
  {
    key: "when",
    q: () => "When are you hoping to go? (This sets your crowd strategy and booking windows.)",
    options: [
      { label: "Spring (Mar–May)", set: { month: "April" } },
      { label: "Summer (Jun–Aug)", set: { month: "June" } },
      { label: "Fall (Sep–Nov)", set: { month: "October" } },
      { label: "Winter/Holidays", set: { month: "December" } },
    ],
    type: "e.g. early October",
    learn: "travel dates",
  },
  {
    key: "loves",
    q: () => "Now the fun part — what is your crew most excited for? (Tap all that apply.)",
    options: [
      { label: "Meeting princesses & characters", set: { characters: true } },
      { label: "Star Wars / Galaxy's Edge", set: { starwars: true, _sw: true } },
      { label: "Big thrill rides", set: { _thrill: true } },
      { label: "The magic & the shows", set: { _magic: true } },
    ],
    type: "e.g. my daughter loves Elsa, my son wants Star Wars",
    learn: "what everyone loves",
  },
  {
    key: "priorities",
    q: () => "When it comes to rides, what does this trip need to deliver? (Tap all that matter — this is where I really tailor your days.)",
    options: [
      { label: "The newest & most popular", set: { _pNew: true } },
      { label: "The classics we love", set: { _pClassic: true } },
      { label: "Big thrills & coasters", set: { _pThrill: true } },
      { label: "Gentle & kid-friendly", set: { _pGentle: true } },
    ],
    type: "e.g. all the new stuff, plus the classics for grandma",
    learn: "ride priorities",
  },
  {
    key: "pace",
    q: () => "How does your family like to tour? Be honest — it's the difference between a great day and a meltdown.",
    options: [
      { label: "Relaxed — savor it, breaks matter", set: { pace: "relaxed" } },
      { label: "Balanced — a bit of everything", set: { pace: "balanced" } },
      { label: "Commando — maximize every minute", set: { pace: "commando" } },
    ],
    type: "describe your ideal day",
    learn: "your pace",
  },
  {
    key: "dining",
    q: () => "And meals — how do you like to eat in the parks?",
    options: [
      { label: "Sit-down & character meals", set: { dining: "table" } },
      { label: "Quick & easy, more ride time", set: { dining: "quick" } },
      { label: "A mix of both", set: { dining: "mix" } },
    ],
    type: "e.g. one character breakfast, rest quick",
    learn: "dining style",
  },
  {
    key: "budget",
    q: () => "Last one, and then I'll build your whole trip — what's your target budget? (I'll fit everything to it, to the dollar.)",
    options: [
      { label: "Around $5,000", set: { budget: 5000 } },
      { label: "Around $6,500", set: { budget: 6500 } },
      { label: "Around $9,000", set: { budget: 9000 } },
      { label: "$12,000+", set: { budget: 12000 } },
    ],
    type: "e.g. $7,500",
    learn: "your budget",
  },
];
