/* ============================================================
   WALT DISNEY WORLD PRICING — real, date-based ranges from public
   sources, plus the single representative rates the engine uses.
   Updated: July 2026, from Disney's published 2026 date-based prices
   (as reported by touringplans.com, mousesavers.com, wdw-magazine.com,
   disneytouristblog.com). Prices exclude 6.5% ticket tax.

   The engine multiplies the representative per-day rates; the ranges
   are the honest public spread to show users and to sanity-check the
   representatives when updating.
   ============================================================ */

export interface DiningRate {
  a: number;
  k: number;
}

export interface PriceRange {
  low: number;
  high: number;
}

export interface PriceTable {
  /** representative per-day rate for a mid-season 4-day base ticket */
  ticketAdultPerDay: number;
  ticketKidPerDay: number;
  /** published 2026 date-based ranges, per person per day */
  ticketRanges: {
    oneDayAdult: PriceRange; // 1-park 1-day, ages 10+
    oneDayKid: PriceRange; // ages 3–9
    fourDayPerDayAdult: PriceRange; // 4-day base ticket ÷ 4
  };
  /** representative per-person daily dining spend by style (editorial,
   *  from public menus: table-service dinners ~$60–100+/adult, character
   *  buffets ~$45–65, quick-service meals ~$15–25/person) */
  dining: {
    table: DiningRate;
    mix: DiningRate;
    quick: DiningRate;
  };
}

export const PRICE: PriceTable = {
  ticketAdultPerDay: 140,
  ticketKidPerDay: 132,
  ticketRanges: {
    oneDayAdult: { low: 119, high: 209 },
    oneDayKid: { low: 114, high: 194 },
    fourDayPerDayAdult: { low: 122, high: 175 },
  },
  dining: { table: { a: 85, k: 40 }, mix: { a: 62, k: 30 }, quick: { a: 40, k: 22 } },
};
