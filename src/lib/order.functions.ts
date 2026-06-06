import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { type StripeEnv, createStripeClient } from "@/lib/stripe.server";

const schema = z.object({
  sessionId: z.string().min(1).max(200).regex(/^[a-zA-Z0-9_]+$/),
  environment: z.enum(["sandbox", "live"]),
});

export type OrderItem = {
  description: string;
  quantity: number;
  amountTotal: number; // cents
  currency: string;
};

export type OrderSummary = {
  status: string;
  paymentStatus: string;
  email: string | null;
  name: string | null;
  amountSubtotal: number;
  amountShipping: number;
  amountTotal: number;
  currency: string;
  items: OrderItem[];
  shippingAddress: {
    name?: string | null;
    line1?: string | null;
    line2?: string | null;
    city?: string | null;
    state?: string | null;
    postal_code?: string | null;
    country?: string | null;
  } | null;
  orderNumber: string;
};

export const getOrderSummary = createServerFn({ method: "POST" })
  .inputValidator((data: z.infer<typeof schema>) => schema.parse(data))
  .handler(async ({ data }): Promise<{ order: OrderSummary } | { error: string }> => {
    try {
      const stripe = createStripeClient(data.environment as StripeEnv);
      const session = await stripe.checkout.sessions.retrieve(data.sessionId, {
        expand: ["line_items", "customer_details", "shipping_cost.shipping_rate"],
      });

      const lineItems = session.line_items?.data ?? [];
      const items: OrderItem[] = lineItems.map((li) => ({
        description: li.description ?? "Item",
        quantity: li.quantity ?? 1,
        amountTotal: li.amount_total ?? 0,
        currency: (li.currency ?? session.currency ?? "usd").toLowerCase(),
      }));

      const shipping = session.shipping_details ?? session.collected_information?.shipping_details ?? null;

      const order: OrderSummary = {
        status: session.status ?? "unknown",
        paymentStatus: session.payment_status ?? "unknown",
        email: session.customer_details?.email ?? null,
        name: session.customer_details?.name ?? shipping?.name ?? null,
        amountSubtotal: session.amount_subtotal ?? 0,
        amountShipping: session.shipping_cost?.amount_total ?? 0,
        amountTotal: session.amount_total ?? 0,
        currency: (session.currency ?? "usd").toLowerCase(),
        items,
        shippingAddress: shipping
          ? {
              name: shipping.name,
              line1: shipping.address?.line1,
              line2: shipping.address?.line2,
              city: shipping.address?.city,
              state: shipping.address?.state,
              postal_code: shipping.address?.postal_code,
              country: shipping.address?.country,
            }
          : null,
        orderNumber: data.sessionId.slice(-10).toUpperCase(),
      };

      return { order };
    } catch (error) {
      console.error("getOrderSummary error:", error);
      return { error: error instanceof Error ? error.message : "Failed to load order" };
    }
  });
