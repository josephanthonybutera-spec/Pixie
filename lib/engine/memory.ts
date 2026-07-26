import type { Companion } from "@/lib/catalog/companions";
import { usd } from "./format";
import type { FamilyMemory, MemoryFact, Profile, UserProfile } from "./types";

/* Family memory — the competitive moat, made tangible in-session */
export function buildMemory(profile: Profile, companionId: string | null, userProfile: UserProfile | null): FamilyMemory {
  const kids = (profile.kidAges || []).map((age, i) => ({ age, label: `Child ${i + 1}` }));
  const facts: MemoryFact[] = [];
  const young = (profile.kidAges || []).some((a) => a <= 6);
  const fam = (userProfile?.name || "").split(" ").slice(-1)[0];
  if (fam) facts.push({ k: "family", v: `the ${fam}s`, src: "your profile" });
  if (profile.characters && young) facts.push({ k: "loves", v: "princess & character experiences", src: "your brief" });
  if (profile.starwars) facts.push({ k: "loves", v: "Star Wars / Galaxy's Edge", src: "your brief" });
  const prioLabel: Record<string, string> = { newest: "newest & most popular", classics: "the classics", thrills: "big thrills", gentle: "gentle rides" };
  if ((profile.priorities || []).length) facts.push({ k: "this trip", v: (profile.priorities || []).map((x) => prioLabel[x]).join(", "), src: "you told me" });
  facts.push({ k: "pace", v: `${profile.pace} days`, src: "you chose" });
  facts.push({ k: "dining", v: profile.dining === "table" ? "sit-down meals" : profile.dining === "quick" ? "quick & easy meals" : "a mix of dining", src: "you chose" });
  if (young) facts.push({ k: "learned", v: "young kids — afternoon breaks protect the evenings", src: "inferred" });
  facts.push({ k: "budget", v: usd(profile.budget || 6500), src: "your brief" });
  if (userProfile?.matchDisney) facts.push({ k: "linked", v: "My Disney Experience account", src: "your profile" });
  return {
    companionId,
    family: { adults: profile.adults, kids, name: fam },
    facts,
    behaviors: [],
    tripsPlanned: 1,
  };
}

/* A short, first-session reflection that proves the companion "gets" the family */
export function companionReflection(profile: Profile, comp: Companion, firstName?: string): string {
  const kids = profile.kidAges || [];
  const bits: string[] = [];
  if (profile.characters && kids.some((a) => a <= 8)) bits.push("a little one who's going to lose it (the good way) when they meet a princess");
  if (profile.starwars) bits.push("someone who's counting down to Galaxy's Edge");
  if (profile.pace === "relaxed") bits.push("a family that would rather savor than sprint");
  if (profile.pace === "commando") bits.push("a crew that wants to squeeze every drop out of every day");
  if (!bits.length) bits.push("a family that wants this done right");
  const list = bits.length > 1 ? bits.slice(0, -1).join(", ") + ", and " + bits.slice(-1) : bits[0];
  const hi = firstName ? `Okay ${firstName} —` : "Okay —";
  return `${hi} I think I've got you. You're ${list}. I'll remember all of it, and I'll get smarter about your family every trip. Here's what I've engineered so far:`;
}
