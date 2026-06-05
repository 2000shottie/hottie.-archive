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
});

const inputSchema = z.object({
  items: z.array(itemSchema).min(1).max(20),
  returnUrl: z.string().url(),
  environment: z.enum(["sandbox", "live"]),
});

export const createCartCheckoutSession = createServerFn({ method: "POST" })
  .inputValidator((data: z.infer<typeof inputSchema>) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<CheckoutResult> => {
    try {
      const stripe = createStripeClient(data.environment as StripeEnv);

      // Resolve human-readable priceIds via lookup_keys
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

      const session = await stripe.checkout.sessions.create({
        line_items,
        mode: "payment",
        ui_mode: "embedded_page",
        return_url: data.returnUrl,
        billing_address_collection: "required",
        shipping_address_collection: {
          // Broad international coverage. Stripe will only show the
          // shipping options whose `allowed_countries` matches the buyer's
          // shipping address, so US customers see the $20 rate and
          // everyone else sees the $170 (incl. $150 customs duties) rate.
          allowed_countries: [
            "US", "CA", "MX", "GB", "IE", "FR", "DE", "IT", "ES", "PT",
            "NL", "BE", "LU", "SE", "NO", "DK", "FI", "IS", "CH", "AT",
            "PL", "CZ", "SK", "HU", "RO", "BG", "GR", "HR", "SI", "EE",
            "LV", "LT", "MT", "CY", "AU", "NZ", "JP", "KR", "SG", "HK",
            "TW", "TH", "MY", "PH", "ID", "VN", "IN", "AE", "SA", "IL",
            "TR", "ZA", "BR", "AR", "CL", "CO", "PE", "UY",
          ],
        },
        shipping_options: [
          {
            shipping_rate_data: {
              type: "fixed_amount",
              fixed_amount: {
                amount: 2000,
                currency: "usd",
              },
              display_name: "US Standard Shipping (3–4 weeks)",
              metadata: { region: "domestic" },
            },
          },
          {
            shipping_rate_data: {
              type: "fixed_amount",
              fixed_amount: {
                amount: 17000, // $20 shipping + $150 customs duties
                currency: "usd",
              },
              display_name: "International Shipping (incl. $150 customs duties)",
              delivery_estimate: {
                minimum: { unit: "week", value: 3 },
                maximum: { unit: "week", value: 5 },
              },
              metadata: { region: "international" },
            },
          },
        ],
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
