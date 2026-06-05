import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
  type StripeEnv,
  createStripeClient,
  getStripeErrorMessage,
} from "@/lib/stripe.server";

type CheckoutResult = { clientSecret: string } | { error: string };

const itemSchema = z.object({
  priceId: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/),
  quantity: z.number().int().min(1).max(10),
  // Origin country of the physical item (ISO-2). Drives import duties.
  originCountry: z.string().length(2).regex(/^[A-Z]{2}$/).optional(),
});

const inputSchema = z.object({
  items: z.array(itemSchema).min(1).max(20),
  returnUrl: z.string().url(),
  environment: z.enum(["sandbox", "live"]),
  country: z.string().length(2).regex(/^[A-Z]{2}$/),
});

// ---------- Origin-aware shipping + duties (server source of truth) ----------
// Mirrors src/lib/admin-rates.ts so we don't pull admin tooling into payments.
// Tune both in sync.

type Region = "US" | "EU" | "UK" | "NA" | "APAC" | "ROW";

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

function regionOf(cc: string): Region {
  return REGION_BY_COUNTRY[cc.toUpperCase()] ?? "ROW";
}

// Outbound shipping (USD) per item, origin region → destination region.
const SHIP_USD: Record<Region, Record<Region, number>> = {
  US:   { US: 15, NA: 25, EU: 40, UK: 40, APAC: 55, ROW: 65 },
  EU:   { US: 25, NA: 30, EU: 15, UK: 18, APAC: 45, ROW: 55 },
  UK:   { US: 25, NA: 30, EU: 18, UK: 12, APAC: 45, ROW: 55 },
  NA:   { US: 20, NA: 15, EU: 40, UK: 40, APAC: 55, ROW: 65 },
  APAC: { US: 45, NA: 50, EU: 45, UK: 45, APAC: 18, ROW: 60 },
  ROW:  { US: 55, NA: 55, EU: 50, UK: 50, APAC: 55, ROW: 40 },
};

// Combined import duties + destination VAT/sales tax as a fraction of item value.
const LANDED_PCT: Record<Region, number> = {
  US: 0.22,
  NA: 0.20,
  EU: 0.24,
  UK: 0.24,
  APAC: 0.18,
  ROW: 0.25,
};

function isDomestic(origin: Region, dest: Region): boolean {
  return (
    origin === dest ||
    (origin === "EU" && dest === "UK") ||
    (origin === "UK" && dest === "EU")
  );
}

// Per-item landed cost in cents.
function itemLandedCents(
  itemValueCents: number,
  originCC: string | undefined,
  buyerCC: string,
): { shipCents: number; dutiesCents: number; international: boolean } {
  const origin = regionOf(originCC ?? "EU");
  const dest = regionOf(buyerCC);
  const shipCents = SHIP_USD[origin][dest] * 100;
  const international = !isDomestic(origin, dest);
  const dutiesCents = international
    ? Math.round(itemValueCents * LANDED_PCT[dest])
    : 0;
  return { shipCents, dutiesCents, international };
}

export const createCartCheckoutSession = createServerFn({ method: "POST" })
  .inputValidator((data: z.infer<typeof inputSchema>) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<CheckoutResult> => {
    try {
      const stripe = createStripeClient(data.environment as StripeEnv);

      const lookupKeys = data.items.map((i) => i.priceId);
      const prices = await stripe.prices.list({
        lookup_keys: lookupKeys,
        limit: 100,
      });
      const byKey = new Map(prices.data.map((p) => [p.lookup_key, p]));

      const line_items = data.items.map((item) => {
        const price = byKey.get(item.priceId);
        if (!price) throw new Error(`Price not found: ${item.priceId}`);
        return { price: price.id, quantity: item.quantity };
      });

      // Flat $20 worldwide. Customs/duties/taxes are baked into product prices.
      const totalShipCents = 2000;
      const totalDutiesCents = 0;
      const shippingAmountCents = totalShipCents;
      const displayName = "Worldwide shipping (incl. customs, duties & taxes)";
      const anyInternational = true;

      const session = await stripe.checkout.sessions.create({
        line_items,
        mode: "payment",
        ui_mode: "embedded_page",
        return_url: data.returnUrl,
        billing_address_collection: "required",
        shipping_address_collection: {
          // Only ship to the country the buyer selected up-front, so the
          // rate shown matches what Stripe charges.
          allowed_countries: [data.country] as unknown as never,
        },
        shipping_options: [
          {
            shipping_rate_data: {
              type: "fixed_amount" as const,
              fixed_amount: { amount: shippingAmountCents, currency: "usd" },
              display_name: displayName,
              delivery_estimate: {
                minimum: { unit: "week" as const, value: 3 },
                maximum: { unit: "week" as const, value: anyInternational ? 5 : 4 },
              },
              metadata: {
                ship_cents: String(totalShipCents),
                duties_cents: String(totalDutiesCents),
                international: anyInternational ? "1" : "0",
                buyer_country: data.country,
              },
            },
          },
        ],
        payment_method_types: ["card", "link"],
        phone_number_collection: { enabled: true },
        metadata: {
          productIds: data.items.map((i) => i.priceId).join(","),
        },
      });

      return { clientSecret: session.client_secret ?? "" };
    } catch (error) {
      console.error("createCartCheckoutSession error:", error);
      return { error: getStripeErrorMessage(error) };
    }
  });
