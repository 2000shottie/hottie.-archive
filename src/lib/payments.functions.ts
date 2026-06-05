import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type Stripe from "stripe";
import {
  type StripeEnv,
  createStripeClient,
  getStripeErrorMessage,
} from "@/lib/stripe.server";

type CheckoutResult = { clientSecret: string } | { error: string };

const itemSchema = z.object({
  priceId: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/),
  quantity: z.number().int().min(1).max(10),
});

const inputSchema = z.object({
  items: z.array(itemSchema).min(1).max(20),
  returnUrl: z.string().url(),
  environment: z.enum(["sandbox", "live"]),
  country: z.string().length(2).regex(/^[A-Z]{2}$/).optional(),
});

// Country tiers for shipping + customs (DDP). All non-US tiers are
// percent-of-subtotal with a $50 floor, calculated server-side at session
// creation so each region only sees its own option in the Stripe address step.
const TIERS = {
  US: { countries: ["US"], flat: 2000, label: "US Standard Shipping" },
  NA: {
    countries: ["CA", "MX"],
    pct: 0.12,
    label: "North America (incl. duties)",
  },
  EU: {
    countries: [
      "GB", "IE", "FR", "DE", "IT", "ES", "PT", "NL", "BE", "LU",
      "SE", "NO", "DK", "FI", "IS", "CH", "AT", "PL", "CZ", "SK",
      "HU", "RO", "BG", "GR", "HR", "SI", "EE", "LV", "LT", "MT", "CY",
    ],
    pct: 0.22,
    label: "Europe / UK (incl. VAT & duties)",
  },
  APAC: {
    countries: ["AU", "NZ", "JP", "KR", "SG", "HK", "TW", "IL", "AE", "SA"],
    pct: 0.15,
    label: "Asia-Pacific / Middle East (incl. duties)",
  },
  ROW: {
    countries: [
      "TH", "MY", "PH", "ID", "VN", "IN", "TR", "ZA",
      "BR", "AR", "CL", "CO", "PE", "UY",
    ],
    pct: 0.25,
    label: "Rest of world (incl. duties)",
  },
} as const;

function dutyAmountCents(subtotalCents: number, pct: number): number {
  return Math.max(5000, Math.round(subtotalCents * pct));
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

      // Sum subtotal in cents from Stripe (authoritative) to drive % rates.
      const subtotalCents = data.items.reduce((acc, item) => {
        const price = byKey.get(item.priceId);
        return acc + (price?.unit_amount ?? 0) * item.quantity;
      }, 0);

      // Build per-tier shipping options. If a country is selected, only
      // include the matching tier so the customer never sees rates that
      // don't apply to them.
      const allTierKeys = ["US", "NA", "EU", "APAC", "ROW"] as const;
      type TierKey = typeof allTierKeys[number];
      const tierForCountry = (cc: string): TierKey | null => {
        for (const k of allTierKeys) {
          if ((TIERS[k].countries as readonly string[]).includes(cc)) return k;
        }
        return null;
      };

      const selectedTier = data.country ? tierForCountry(data.country) : null;
      const activeTiers: readonly TierKey[] = selectedTier ? [selectedTier] : allTierKeys;

      const allowedCountries = selectedTier
        ? (TIERS[selectedTier].countries as readonly string[]).slice()
        : Object.values(TIERS).flatMap((t) => t.countries);

      const shipping_options =
        activeTiers.map((key) => {
          if (key === "US") {
            return {
              shipping_rate_data: {
                type: "fixed_amount" as const,
                fixed_amount: { amount: TIERS.US.flat, currency: "usd" },
                display_name: TIERS.US.label,
                delivery_estimate: {
                  minimum: { unit: "week" as const, value: 3 },
                  maximum: { unit: "week" as const, value: 4 },
                },
                metadata: { region: "US", pct: "0", countries: TIERS.US.countries.join(",") },
              },
            };
          }
          const tier = TIERS[key];
          const amount = dutyAmountCents(subtotalCents, tier.pct);
          return {
            shipping_rate_data: {
              type: "fixed_amount" as const,
              fixed_amount: { amount, currency: "usd" },
              display_name: tier.label,
              delivery_estimate: {
                minimum: { unit: "week" as const, value: 3 },
                maximum: { unit: "week" as const, value: 5 },
              },
              metadata: {
                region: key,
                pct: String(tier.pct),
                countries: tier.countries.join(","),
              },
            },
          };
        });

      const session = await stripe.checkout.sessions.create({
        line_items,
        mode: "payment",
        ui_mode: "embedded_page",
        return_url: data.returnUrl,
        billing_address_collection: "required",
        shipping_address_collection: {
          allowed_countries: allowedCountries as unknown as never,
        },
        shipping_options,
        // Cards (Apple Pay on supported devices) + Link. Explicitly excludes Amazon Pay.
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
