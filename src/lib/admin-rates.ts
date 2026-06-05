// ADMIN-ONLY. Internal cost rate tables used to compute landed cost
// (outbound shipping + import duties + sales tax) for any origin→destination
// combination. Calibrated to real Vestiaire data points; tune as needed.
//
// Source data point (user-provided):
//   Dior top, NL → US, ~$450 declared value
//   Shipping €21.46, Customs/duties €79.26, Sales tax €19.36
//   ≈ $23 shipping + 22% landed taxes/duties
//
// Never import this from customer-facing components.

import type { Product } from "@/lib/products";

// Country buckets keep the table small. "EU" = any EU/EEA + UK.
export type Region = "US" | "EU" | "UK" | "NA" | "APAC" | "ROW";

const REGION_BY_COUNTRY: Record<string, Region> = {
  US: "US",
  CA: "NA", MX: "NA",
  GB: "UK",
  // EU/EEA
  IE: "EU", FR: "EU", DE: "EU", IT: "EU", ES: "EU", PT: "EU", NL: "EU",
  BE: "EU", LU: "EU", SE: "EU", NO: "EU", DK: "EU", FI: "EU", IS: "EU",
  CH: "EU", AT: "EU", PL: "EU", CZ: "EU", SK: "EU", HU: "EU", RO: "EU",
  BG: "EU", GR: "EU", HR: "EU", SI: "EU", EE: "EU", LV: "EU", LT: "EU",
  MT: "EU", CY: "EU",
  // APAC + ME
  AU: "APAC", NZ: "APAC", JP: "APAC", KR: "APAC", SG: "APAC", HK: "APAC",
  TW: "APAC", IL: "APAC", AE: "APAC", SA: "APAC",
};

export function regionOf(cc: string): Region {
  return REGION_BY_COUNTRY[cc.toUpperCase()] ?? "ROW";
}

// Outbound shipping cost (USD) to ship one item from origin region to
// destination region. Includes pickup/fulfillment + tracked courier.
const SHIP_USD: Record<Region, Record<Region, number>> = {
  US:   { US: 15, NA: 25, EU: 40, UK: 40, APAC: 55, ROW: 65 },
  EU:   { US: 25, NA: 30, EU: 15, UK: 18, APAC: 45, ROW: 55 },
  UK:   { US: 25, NA: 30, EU: 18, UK: 12, APAC: 45, ROW: 55 },
  NA:   { US: 20, NA: 15, EU: 40, UK: 40, APAC: 55, ROW: 65 },
  APAC: { US: 45, NA: 50, EU: 45, UK: 45, APAC: 18, ROW: 60 },
  ROW:  { US: 55, NA: 55, EU: 50, UK: 50, APAC: 55, ROW: 40 },
};

// Combined import duties + destination sales/VAT, as a fraction of declared
// item value. Applied on the price of the item at the destination.
// "Domestic" pairs are 0 duty (only sales tax which we treat as buyer-paid).
const LANDED_PCT: Record<Region, number> = {
  US: 0.22,   // ~18% duties + ~4% blended state sales tax on import
  NA: 0.20,
  EU: 0.24,   // VAT 20-21% + small duty on used goods
  UK: 0.24,   // VAT 20% + duty
  APAC: 0.18,
  ROW: 0.25,
};

// Domestic shipments skip import duty entirely.
function isDomestic(origin: Region, dest: Region): boolean {
  return origin === dest || (origin === "EU" && dest === "UK") || (origin === "UK" && dest === "EU");
}

export type LandedCost = {
  outboundShipping: number;
  dutiesAndTax: number;
  total: number;
};

export function landedCost(
  product: Product,
  buyerCountry: string,
): LandedCost {
  const origin = regionOf(product.originCountry ?? "EU");
  const dest = regionOf(buyerCountry);
  const outboundShipping = SHIP_USD[origin][dest];
  const dutiesAndTax = isDomestic(origin, dest)
    ? 0
    : Math.round(product.price * LANDED_PCT[dest]);
  return { outboundShipping, dutiesAndTax, total: outboundShipping + dutiesAndTax };
}

// All destinations we ship to — used to compute the worst-case landed cost
// (so the listed price covers $150 profit no matter where the customer is).
export const ALL_DESTINATIONS: readonly string[] = [
  "US", "CA", "MX",
  "GB", "FR", "DE", "IT", "ES", "NL", "SE", "NO", "CH", "PL", "GR",
  "AU", "JP", "KR", "SG", "HK", "AE",
  "BR", "ZA", "IN", "TR",
];

export function worstCaseLandedCost(product: Product): {
  destination: string;
  cost: LandedCost;
} {
  let worst: { destination: string; cost: LandedCost } | null = null;
  for (const cc of ALL_DESTINATIONS) {
    const cost = landedCost(product, cc);
    if (!worst || cost.total > worst.cost.total) {
      worst = { destination: cc, cost };
    }
  }
  return worst!;
}
