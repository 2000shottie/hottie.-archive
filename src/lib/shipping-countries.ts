// Origin → destination shipping + duties calculator used both client-side
// (sidebar preview in checkout) and as the source-of-truth shape for what
// payments.functions.ts charges. Keep tables in sync with
// src/lib/payments.functions.ts and src/lib/admin-rates.ts.

import type { Product } from "@/lib/products";

export type Region = "US" | "EU" | "UK" | "NA" | "APAC" | "ROW";

const REGION_BY_COUNTRY: Record<string, Region> = {
  US: "US",
  CA: "NA", MX: "NA",
  GB: "UK",
  IE: "EU", FR: "EU", DE: "EU", IT: "EU", ES: "EU", PT: "EU", NL: "EU",
  BE: "EU", LU: "EU", SE: "EU", NO: "EU", DK: "EU", FI: "EU", IS: "EU",
  CH: "EU", AT: "EU", PL: "EU", CZ: "EU", SK: "EU", HU: "EU", RO: "EU",
  BG: "EU", GR: "EU", HR: "EU", SI: "EU", EE: "EU", LV: "EU", LT: "EU",
  MT: "EU", CY: "EU",
  AU: "APAC", NZ: "APAC", JP: "APAC", KR: "APAC", SG: "APAC", HK: "APAC",
  TW: "APAC", IL: "APAC", AE: "APAC", SA: "APAC",
};

export function regionOf(cc: string): Region {
  return REGION_BY_COUNTRY[cc.toUpperCase()] ?? "ROW";
}

const SHIP_USD: Record<Region, Record<Region, number>> = {
  US:   { US: 15, NA: 25, EU: 40, UK: 40, APAC: 55, ROW: 65 },
  EU:   { US: 25, NA: 30, EU: 15, UK: 18, APAC: 45, ROW: 55 },
  UK:   { US: 25, NA: 30, EU: 18, UK: 12, APAC: 45, ROW: 55 },
  NA:   { US: 20, NA: 15, EU: 40, UK: 40, APAC: 55, ROW: 65 },
  APAC: { US: 45, NA: 50, EU: 45, UK: 45, APAC: 18, ROW: 60 },
  ROW:  { US: 55, NA: 55, EU: 50, UK: 50, APAC: 55, ROW: 40 },
};

const LANDED_PCT: Record<Region, number> = {
  US: 0.22, NA: 0.20, EU: 0.24, UK: 0.24, APAC: 0.18, ROW: 0.25,
};

function isDomestic(origin: Region, dest: Region): boolean {
  return (
    origin === dest ||
    (origin === "EU" && dest === "UK") ||
    (origin === "UK" && dest === "EU")
  );
}

export type CartShipping = {
  shipDollars: number;
  dutiesDollars: number;
  totalDollars: number;
  international: boolean;
  // Per-line breakdown for debugging / transparency.
  lines: Array<{ id: string; ship: number; duties: number }>;
};

export function cartShipping(
  lines: Array<{ product: Product; qty: number }>,
  buyerCountry: string,
): CartShipping {
  const dest = regionOf(buyerCountry);
  let ship = 0;
  let duties = 0;
  let international = false;
  const breakdown: CartShipping["lines"] = [];
  for (const { product, qty } of lines) {
    const origin = regionOf(product.originCountry ?? "EU");
    const lineShip = SHIP_USD[origin][dest] * qty;
    const intl = !isDomestic(origin, dest);
    const lineDuties = intl ? Math.round(product.price * qty * LANDED_PCT[dest]) : 0;
    ship += lineShip;
    duties += lineDuties;
    if (intl) international = true;
    breakdown.push({ id: product.id, ship: lineShip, duties: lineDuties });
  }
  return {
    shipDollars: ship,
    dutiesDollars: duties,
    totalDollars: ship + duties,
    international,
    lines: breakdown,
  };
}

// Country picker options — every destination region we support, sorted by name.
export const COUNTRY_NAMES: Record<string, string> = {
  US: "United States",
  CA: "Canada", MX: "Mexico",
  GB: "United Kingdom", IE: "Ireland", FR: "France", DE: "Germany",
  IT: "Italy", ES: "Spain", PT: "Portugal", NL: "Netherlands",
  BE: "Belgium", LU: "Luxembourg", SE: "Sweden", NO: "Norway",
  DK: "Denmark", FI: "Finland", IS: "Iceland", CH: "Switzerland",
  AT: "Austria", PL: "Poland", CZ: "Czechia", SK: "Slovakia",
  HU: "Hungary", RO: "Romania", BG: "Bulgaria", GR: "Greece",
  HR: "Croatia", SI: "Slovenia", EE: "Estonia", LV: "Latvia",
  LT: "Lithuania", MT: "Malta", CY: "Cyprus",
  AU: "Australia", NZ: "New Zealand", JP: "Japan", KR: "South Korea",
  SG: "Singapore", HK: "Hong Kong", TW: "Taiwan", IL: "Israel",
  AE: "United Arab Emirates", SA: "Saudi Arabia",
  TH: "Thailand", MY: "Malaysia", PH: "Philippines", ID: "Indonesia",
  VN: "Vietnam", IN: "India", TR: "Türkiye", ZA: "South Africa",
  BR: "Brazil", AR: "Argentina", CL: "Chile", CO: "Colombia",
  PE: "Peru", UY: "Uruguay",
};

export function allCountryOptions(): Array<{ code: string; name: string }> {
  return Object.keys(COUNTRY_NAMES)
    .map((code) => ({ code, name: COUNTRY_NAMES[code] }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
