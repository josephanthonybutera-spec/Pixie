export interface DiningRate {
  a: number;
  k: number;
}

export interface PriceTable {
  ticketAdultPerDay: number;
  ticketKidPerDay: number;
  dining: {
    table: DiningRate;
    mix: DiningRate;
    quick: DiningRate;
  };
}

export const PRICE: PriceTable = {
  ticketAdultPerDay: 142,
  ticketKidPerDay: 131,
  dining: { table: { a: 78, k: 36 }, mix: { a: 56, k: 28 }, quick: { a: 38, k: 22 } },
};
