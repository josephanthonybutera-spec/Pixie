export type ParkKey = "MK" | "EP" | "HS" | "AK";

export interface Park {
  name: string;
  open: string;
  night: string | null;
  lands: string[];
}

/* Real Walt Disney World parks, lands, and nighttime spectaculars.
   Updated July 2026 — `open` is a typical rope-drop hour (real hours vary
   daily; check disneyworld.disney.go.com/calendars when updating). */
export const PARKS: Record<ParkKey, Park> = {
  MK: { name: "Magic Kingdom", open: "9:00", night: "Happily Ever After (fireworks)", lands: ["Main Street", "Adventureland", "Frontierland", "Liberty Square", "Fantasyland", "Tomorrowland"] },
  EP: { name: "EPCOT", open: "9:00", night: "Luminous — The Symphony of Us", lands: ["World Celebration", "World Discovery", "World Nature", "World Showcase"] },
  HS: { name: "Hollywood Studios", open: "8:30", night: "Fantasmic!", lands: ["Hollywood Blvd", "Sunset Blvd", "Toy Story Land", "Galaxy's Edge", "Echo Lake"] },
  AK: { name: "Animal Kingdom", open: "8:00", night: null, lands: ["Discovery Island", "Pandora", "Africa", "Asia"] },
};
