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
  country: z.string().length(2).regex(/^[A-Z]{2}$/).optional(),
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

      // Worldwide shipping — Stripe collects the address in checkout.
      const allowedCountries = Object.keys({
        US:1,CA:1,MX:1,GB:1,IE:1,FR:1,DE:1,IT:1,ES:1,PT:1,NL:1,BE:1,LU:1,
        SE:1,NO:1,DK:1,FI:1,IS:1,CH:1,AT:1,PL:1,CZ:1,SK:1,HU:1,RO:1,BG:1,
        GR:1,HR:1,SI:1,EE:1,LV:1,LT:1,MT:1,CY:1,AU:1,NZ:1,JP:1,KR:1,SG:1,
        HK:1,TW:1,IL:1,AE:1,SA:1,TH:1,MY:1,PH:1,ID:1,VN:1,IN:1,TR:1,ZA:1,
        BR:1,AR:1,CL:1,CO:1,PE:1,UY:1,
      });

      // --- Reservation pre-check: refuse if any item is already sold or
      // actively reserved by another in-flight checkout. ---
      const uniqueProductIds = Array.from(new Set(data.items.map((i) => i.priceId)));
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

      const [{ data: soldRows }, { data: stockRows }, { data: resRows }] = await Promise.all([
        supabaseAdmin.from("sold_products").select("product_id").in("product_id", uniqueProductIds),
        supabaseAdmin
          .from("product_stock")
          .select("product_id, available")
          .in("product_id", uniqueProductIds),
        supabaseAdmin
          .from("product_reservations")
          .select("product_id, expires_at")
          .in("product_id", uniqueProductIds)
          .gt("expires_at", new Date().toISOString()),
      ]);

      const blocked = new Set<string>();
      for (const r of soldRows ?? []) blocked.add(r.product_id);
      for (const r of stockRows ?? []) if (r.available === false) blocked.add(r.product_id);
      for (const r of resRows ?? []) blocked.add(r.product_id);
      if (blocked.size > 0) {
        return { error: "This item is no longer available." };
      }

      // Stripe Checkout minimum `expires_at` is 30 minutes from now, so the
      // DB reservation window aligns with the Stripe session window.
      const RESERVATION_MINUTES = 30;
      const expiresAtDate = new Date(Date.now() + RESERVATION_MINUTES * 60 * 1000);
      const expiresAtUnix = Math.floor(expiresAtDate.getTime() / 1000);

      const session = await stripe.checkout.sessions.create({
        line_items,
        mode: "payment",
        ui_mode: "embedded_page",
        return_url: data.returnUrl,
        expires_at: expiresAtUnix,
        billing_address_collection: "required",
        shipping_address_collection: {
          allowed_countries: allowedCountries as unknown as never,
        },
        shipping_options: [
          {
            shipping_rate_data: {
              type: "fixed_amount" as const,
              fixed_amount: { amount: 2000, currency: "usd" },
              display_name: "Worldwide shipping (incl. customs, duties & taxes)",
              delivery_estimate: {
                minimum: { unit: "week" as const, value: 3 },
                maximum: { unit: "week" as const, value: 5 },
              },
              metadata: {
                ship_cents: "2000",
                duties_cents: "0",
                international: "1",
                buyer_country: data.country ?? "",
              },
            },
          },
        ],
        payment_method_types: ["card", "link"],
        phone_number_collection: { enabled: true },
        payment_intent_data: {
          description: `HOTTIE. order — ${data.items.length} item${data.items.length === 1 ? "" : "s"}`,
        },
        metadata: {
          productIds: data.items.map((i) => i.priceId).join(","),
        },
      });

      // --- Atomic reservation claim ---
      // Each RPC only succeeds if the row is new OR the existing one has
      // already expired. If any claim fails, expire the Stripe session,
      // release the rows we did claim, and bail out.
      const claimed: string[] = [];
      let lostRace = false;
      for (const productId of uniqueProductIds) {
        const { data: row, error: claimErr } = await supabaseAdmin.rpc("try_reserve_product", {
          _product_id: productId,
          _session_id: session.id,
          _expires_at: expiresAtDate.toISOString(),
        });
        if (claimErr) {
          console.error("try_reserve_product error", productId, claimErr);
          lostRace = true;
          break;
        }
        if (!row) {
          lostRace = true;
          break;
        }
        claimed.push(productId);
      }

      if (lostRace) {
        try {
          await stripe.checkout.sessions.expire(session.id);
        } catch (e) {
          console.error("Failed to expire Stripe session after lost race:", e);
        }
        if (claimed.length > 0) {
          await supabaseAdmin
            .from("product_reservations")
            .delete()
            .in("product_id", claimed)
            .eq("stripe_session_id", session.id);
        }
        return { error: "This item is no longer available." };
      }

      return { clientSecret: session.client_secret ?? "" };
    } catch (error) {
      console.error("createCartCheckoutSession error:", error);
      return { error: getStripeErrorMessage(error) };
    }
  });
