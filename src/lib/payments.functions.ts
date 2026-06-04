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
        ui_mode: "embedded",
        return_url: data.returnUrl,
        automatic_tax: { enabled: true },
        billing_address_collection: "required",
        shipping_address_collection: {
          allowed_countries: [
            "US", "CA", "GB", "AU", "NZ", "IE", "FR", "DE", "IT", "ES",
            "NL", "BE", "SE", "NO", "DK", "FI", "CH", "AT", "PT", "JP",
          ],
        },
        shipping_options: [
          {
            shipping_rate_data: {
              type: "fixed_amount",
              fixed_amount: { amount: 2000, currency: "usd" },
              display_name: "Standard shipping (3–4 weeks)",
              tax_behavior: "exclusive",
              tax_code: "txcd_92010001",
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
