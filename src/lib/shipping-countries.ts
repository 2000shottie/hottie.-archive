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

// Flat $20 per order, anywhere in the world. Customs/duties/taxes are baked
// into each product's listed price, so we don't add them here.
const FLAT_SHIP_USD = 20;

export type CartShipping = {
  shipDollars: number;
  dutiesDollars: number;
  totalDollars: number;
  international: boolean;
  lines: Array<{ id: string; ship: number; duties: number }>;
};

export function cartShipping(
  lines: Array<{ product: Product; qty: number }>,
  _buyerCountry: string,
): CartShipping {
  const ship = lines.length > 0 ? FLAT_SHIP_USD : 0;
  return {
    shipDollars: ship,
    dutiesDollars: 0,
    totalDollars: ship,
    international: true,
    lines: lines.map(({ product }) => ({ id: product.id, ship, duties: 0 })),
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
