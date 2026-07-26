import type { ParkKey } from "./parks";

/* ============================================================
   WALT DISNEY WORLD ATTRACTIONS — real data, editorially maintained.
   Updated: July 2026. To refresh: names, lands, and height requirements
   from disneyworld.disney.go.com (each attraction page lists the height
   requirement). `wait` is our editorial standby estimate in minutes at
   [rope drop, midday peak, evening]; `kid`/`thrill` (0–5) are editorial
   scores — tune freely, the engine only compares them.
   `ll` is Lightning Lane tier: "SP" = Single Pass (premier, paid per
   ride), "MP" = Multi Pass, null = no Lightning Lane.
   ============================================================ */

export type AttractionType = "ride" | "show" | "char";
export type LightningLane = "SP" | "MP" | null;
/** Editorial tag driving the "priorities" feature: what this attraction
 *  is *for* when a family asks for newest / classics / thrills / gentle. */
export type EditorialTag = "new" | "classic" | "thrill" | "gentle";

export interface Attraction {
  id: string;
  park: ParkKey;
  name: string;
  /** index into PARKS[park].lands */
  land: number;
  type: AttractionType;
  /** height requirement in inches; 0 = any height (real WDW values) */
  h: number;
  /** editorial standby estimate, minutes at [rope drop, midday, evening] */
  wait: [number, number, number];
  dur: number;
  ll: LightningLane;
  kid: number;
  thrill: number;
  indoor: boolean;
  tag: EditorialTag;
  /** fixed showtime "HH:MM" for scheduled shows */
  at?: string;
}

export const ATTR: Attraction[] = [
  // ---- Magic Kingdom ----
  { id: "7dmt", park: "MK", name: "Seven Dwarfs Mine Train", land: 4, type: "ride", h: 38, wait: [45, 85, 70], dur: 6, ll: "SP", kid: 5, thrill: 2, indoor: false, tag: "new" },
  { id: "tron", park: "MK", name: "TRON Lightcycle / Run", land: 5, type: "ride", h: 48, wait: [50, 80, 65], dur: 5, ll: "SP", kid: 2, thrill: 5, indoor: true, tag: "new" },
  { id: "space", park: "MK", name: "Space Mountain", land: 5, type: "ride", h: 44, wait: [35, 60, 45], dur: 6, ll: "MP", kid: 2, thrill: 4, indoor: true, tag: "thrill" },
  { id: "btm", park: "MK", name: "Big Thunder Mountain Railroad", land: 2, type: "ride", h: 40, wait: [25, 50, 35], dur: 6, ll: "MP", kid: 3, thrill: 3, indoor: false, tag: "thrill" },
  { id: "tiana", park: "MK", name: "Tiana's Bayou Adventure", land: 2, type: "ride", h: 40, wait: [40, 75, 55], dur: 11, ll: "MP", kid: 4, thrill: 3, indoor: false, tag: "new" },
  { id: "pan", park: "MK", name: "Peter Pan's Flight", land: 4, type: "ride", h: 0, wait: [35, 60, 50], dur: 4, ll: "MP", kid: 5, thrill: 0, indoor: true, tag: "classic" },
  { id: "hm", park: "MK", name: "Haunted Mansion", land: 3, type: "ride", h: 0, wait: [20, 45, 35], dur: 8, ll: "MP", kid: 3, thrill: 1, indoor: true, tag: "classic" },
  { id: "potc", park: "MK", name: "Pirates of the Caribbean", land: 1, type: "ride", h: 0, wait: [15, 35, 25], dur: 9, ll: "MP", kid: 4, thrill: 1, indoor: true, tag: "classic" },
  { id: "jc", park: "MK", name: "Jungle Cruise", land: 1, type: "ride", h: 0, wait: [30, 60, 45], dur: 10, ll: "MP", kid: 4, thrill: 0, indoor: false, tag: "classic" },
  { id: "buzz", park: "MK", name: "Buzz Lightyear's Space Ranger Spin", land: 5, type: "ride", h: 0, wait: [15, 35, 25], dur: 5, ll: "MP", kid: 5, thrill: 0, indoor: true, tag: "gentle" },
  { id: "iasw", park: "MK", name: "“it's a small world”", land: 4, type: "ride", h: 0, wait: [10, 25, 20], dur: 11, ll: "MP", kid: 5, thrill: 0, indoor: true, tag: "classic" },
  { id: "pooh", park: "MK", name: "The Many Adventures of Winnie the Pooh", land: 4, type: "ride", h: 0, wait: [15, 35, 25], dur: 4, ll: "MP", kid: 5, thrill: 0, indoor: true, tag: "gentle" },
  // character meet locations rotate — verify on the official app before a trip
  { id: "mickeymeet", park: "MK", name: "Meet Mickey at Town Square Theater", land: 0, type: "char", h: 0, wait: [20, 40, 30], dur: 10, ll: null, kid: 5, thrill: 0, indoor: true, tag: "gentle" },
  { id: "princess", park: "MK", name: "Princess Fairytale Hall", land: 4, type: "char", h: 0, wait: [25, 45, 35], dur: 10, ll: null, kid: 5, thrill: 0, indoor: true, tag: "gentle" },
  { id: "parade", park: "MK", name: "Festival of Fantasy Parade", land: 0, type: "show", h: 0, wait: [0, 0, 0], dur: 15, ll: null, kid: 5, thrill: 0, at: "15:00", indoor: false, tag: "classic" },

  // ---- EPCOT ----
  { id: "gotg", park: "EP", name: "Guardians of the Galaxy: Cosmic Rewind", land: 1, type: "ride", h: 42, wait: [55, 90, 75], dur: 4, ll: "SP", kid: 2, thrill: 5, indoor: true, tag: "new" },
  // reopened 2025 as the reimagined Test Track
  { id: "tt", park: "EP", name: "Test Track", land: 1, type: "ride", h: 40, wait: [40, 70, 55], dur: 5, ll: "MP", kid: 3, thrill: 4, indoor: false, tag: "thrill" },
  { id: "frozen", park: "EP", name: "Frozen Ever After", land: 3, type: "ride", h: 0, wait: [40, 70, 55], dur: 5, ll: "MP", kid: 5, thrill: 0, indoor: true, tag: "gentle" },
  { id: "remy", park: "EP", name: "Remy's Ratatouille Adventure", land: 3, type: "ride", h: 0, wait: [35, 65, 50], dur: 5, ll: "MP", kid: 5, thrill: 0, indoor: true, tag: "gentle" },
  { id: "soarin", park: "EP", name: "Soarin' Around the World", land: 2, type: "ride", h: 40, wait: [25, 50, 40], dur: 6, ll: "MP", kid: 4, thrill: 1, indoor: true, tag: "classic" },
  { id: "sse", park: "EP", name: "Spaceship Earth", land: 0, type: "ride", h: 0, wait: [10, 25, 20], dur: 15, ll: "MP", kid: 3, thrill: 0, indoor: true, tag: "classic" },
  { id: "nemo", park: "EP", name: "The Seas with Nemo & Friends", land: 2, type: "ride", h: 0, wait: [5, 15, 10], dur: 5, ll: null, kid: 5, thrill: 0, indoor: true, tag: "gentle" },
  { id: "turtle", park: "EP", name: "Turtle Talk with Crush", land: 2, type: "show", h: 0, wait: [10, 15, 10], dur: 15, ll: null, kid: 5, thrill: 0, indoor: true, tag: "gentle" },

  // ---- Hollywood Studios ----
  { id: "rise", park: "HS", name: "Star Wars: Rise of the Resistance", land: 3, type: "ride", h: 40, wait: [60, 95, 80], dur: 18, ll: "SP", kid: 3, thrill: 4, indoor: true, tag: "new" },
  { id: "falcon", park: "HS", name: "Millennium Falcon: Smugglers Run", land: 3, type: "ride", h: 38, wait: [30, 55, 45], dur: 5, ll: "MP", kid: 4, thrill: 3, indoor: true, tag: "new" },
  { id: "slinky", park: "HS", name: "Slinky Dog Dash", land: 2, type: "ride", h: 38, wait: [50, 85, 70], dur: 2, ll: "MP", kid: 5, thrill: 3, indoor: false, tag: "new" },
  { id: "tsm", park: "HS", name: "Toy Story Mania!", land: 2, type: "ride", h: 0, wait: [30, 55, 45], dur: 8, ll: "MP", kid: 5, thrill: 0, indoor: true, tag: "gentle" },
  { id: "tot", park: "HS", name: "The Twilight Zone Tower of Terror", land: 1, type: "ride", h: 40, wait: [35, 65, 50], dur: 8, ll: "MP", kid: 2, thrill: 5, indoor: true, tag: "thrill" },
  // Muppets retheme announced — check operating status before a trip
  { id: "rnrc", park: "HS", name: "Rock 'n' Roller Coaster", land: 1, type: "ride", h: 48, wait: [40, 70, 55], dur: 2, ll: "MP", kid: 2, thrill: 5, indoor: true, tag: "thrill" },
  { id: "mmrr", park: "HS", name: "Mickey & Minnie's Runaway Railway", land: 0, type: "ride", h: 0, wait: [35, 65, 50], dur: 5, ll: "MP", kid: 5, thrill: 1, indoor: true, tag: "gentle" },
  { id: "frozensing", park: "HS", name: "Frozen Sing-Along Celebration", land: 4, type: "show", h: 0, wait: [0, 0, 0], dur: 30, ll: null, kid: 5, thrill: 0, at: "14:30", indoor: true, tag: "gentle" },

  // ---- Animal Kingdom ----
  { id: "fop", park: "AK", name: "Avatar Flight of Passage", land: 1, type: "ride", h: 44, wait: [65, 95, 80], dur: 6, ll: "SP", kid: 3, thrill: 4, indoor: true, tag: "new" },
  { id: "navi", park: "AK", name: "Na'vi River Journey", land: 1, type: "ride", h: 0, wait: [40, 70, 55], dur: 5, ll: "MP", kid: 5, thrill: 0, indoor: true, tag: "gentle" },
  { id: "safari", park: "AK", name: "Kilimanjaro Safaris", land: 2, type: "ride", h: 0, wait: [30, 60, 40], dur: 22, ll: "MP", kid: 5, thrill: 0, indoor: false, tag: "classic" },
  { id: "everest", park: "AK", name: "Expedition Everest", land: 3, type: "ride", h: 44, wait: [25, 50, 40], dur: 4, ll: "MP", kid: 2, thrill: 4, indoor: false, tag: "thrill" },
  { id: "kali", park: "AK", name: "Kali River Rapids", land: 3, type: "ride", h: 38, wait: [20, 45, 35], dur: 5, ll: "MP", kid: 4, thrill: 2, indoor: false, tag: "classic" },
  { id: "lionking", park: "AK", name: "Festival of the Lion King", land: 2, type: "show", h: 0, wait: [0, 0, 0], dur: 30, ll: null, kid: 5, thrill: 0, at: "13:00", indoor: true, tag: "classic" },
];
