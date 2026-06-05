// Country tiers mirrored from src/lib/payments.functions.ts so the client can
// show per-country shipping pricing before opening the Stripe iframe.

export type TierKey = "US" | "NA" | "EU" | "APAC" | "ROW";

export const TIERS: Record<
  TierKey,
  { countries: readonly string[]; flat?: number; pct?: number; label: string; note: string }
> = {
  US: { countries: ["US"], flat: 2000, label: "US Standard Shipping", note: "No US sales tax." },
  NA: {
    countries: ["CA", "MX"],
    pct: 0.12,
    label: "North America",
    note: "Duties & taxes included.",
  },
  EU: {
    countries: [
      "GB","IE","FR","DE","IT","ES","PT","NL","BE","LU",
      "SE","NO","DK","FI","IS","CH","AT","PL","CZ","SK",
      "HU","RO","BG","GR","HR","SI","EE","LV","LT","MT","CY",
    ],
    pct: 0.22,
    label: "Europe / UK",
    note: "VAT, duties & handling included.",
  },
  APAC: {
    countries: ["AU","NZ","JP","KR","SG","HK","TW","IL","AE","SA"],
    pct: 0.15,
    label: "Asia-Pacific / Middle East",
    note: "Duties & taxes included.",
  },
  ROW: {
    countries: ["TH","MY","PH","ID","VN","IN","TR","ZA","BR","AR","CL","CO","PE","UY"],
    pct: 0.25,
    label: "Rest of world",
    note: "Duties & taxes included.",
  },
};

export function tierForCountry(cc: string): TierKey | null {
  for (const k of Object.keys(TIERS) as TierKey[]) {
    if (TIERS[k].countries.includes(cc)) return k;
  }
  return null;
}

export function shippingCostCents(cc: string, subtotalCents: number): number | null {
  const key = tierForCountry(cc);
  if (!key) return null;
  const t = TIERS[key];
  if (t.flat != null) return t.flat;
  if (t.pct != null) return Math.max(5000, Math.round(subtotalCents * t.pct));
  return null;
}

// Display names for the country dropdown.
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

export function allCountryOptions(): Array<{ code: string; name: string; tier: TierKey }> {
  const out: Array<{ code: string; name: string; tier: TierKey }> = [];
  for (const tier of Object.keys(TIERS) as TierKey[]) {
    for (const cc of TIERS[tier].countries) {
      out.push({ code: cc, name: COUNTRY_NAMES[cc] ?? cc, tier });
    }
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}
