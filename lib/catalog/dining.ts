import type { ParkKey } from "./parks";

export interface DiningVenue {
  id: string;
  park: ParkKey;
  name: string;
  char: boolean;
  diff: number;
  kid: number;
}

export const DINING: DiningVenue[] = [
  { id: "crt", park: "MK", name: "Cinderella's Royal Table", char: true, diff: 3, kid: 5 },
  { id: "bog", park: "MK", name: "Be Our Guest Restaurant", char: false, diff: 3, kid: 4 },
  { id: "crystal", park: "MK", name: "The Crystal Palace (character buffet)", char: true, diff: 2, kid: 5 },
  { id: "ltt", park: "MK", name: "Liberty Tree Tavern", char: false, diff: 1, kid: 3 },
  { id: "space220", park: "EP", name: "Space 220 Restaurant", char: false, diff: 3, kid: 3 },
  { id: "garden", park: "EP", name: "Garden Grill (character)", char: true, diff: 2, kid: 5 },
  { id: "akershus", park: "EP", name: "Akershus Royal Banquet Hall (princesses)", char: true, diff: 2, kid: 5 },
  { id: "oga", park: "HS", name: "Oga's Cantina", char: false, diff: 3, kid: 3 },
  { id: "scifi", park: "HS", name: "Sci-Fi Dine-In Theater", char: false, diff: 2, kid: 4 },
  { id: "50s", park: "HS", name: "50's Prime Time Café", char: false, diff: 2, kid: 4 },
  { id: "tusker", park: "AK", name: "Tusker House (character buffet)", char: true, diff: 2, kid: 5 },
  { id: "yak", park: "AK", name: "Yak & Yeti Restaurant", char: false, diff: 1, kid: 3 },
];
