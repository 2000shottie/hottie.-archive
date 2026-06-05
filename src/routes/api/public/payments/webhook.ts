import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  type StripeEnv,
  createStripeClient,
  getWebhookSecret,
} from "@/lib/stripe.server";
import { sendOrderConfirmationEmail } from "@/lib/email.server";

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const env = (url.searchParams.get("env") === "live" ? "live" : "sandbox") as StripeEnv;
        const signature = request.headers.get("stripe-signature");
        if (!signature) return new Response("Missing signature", { status: 400 });

        const body = await request.text();
        const stripe = createStripeClient(env);

        let event;
        try {
          event = await stripe.webhooks.constructEventAsync(
            body,
            signature,
            getWebhookSecret(env),
          );
        } catch (err) {
          console.error("Webhook signature verification failed:", err);
          return new Response("Invalid signature", { status: 400 });
        }

        try {
          if (event.type === "checkout.session.completed") {
            const session = event.data.object as {
              id: string;
              amount_total?: number | null;
              currency?: string | null;
              customer_details?: { email?: string | null; name?: string | null } | null;
              shipping_details?: { address?: Record<string, string | null> | null } | null;
              metadata?: Record<string, string> | null;
            };
            const csv = session.metadata?.productIds ?? "";
            const productIds = csv
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean);
            if (productIds.length > 0) {
              const rows = productIds.map((id) => ({ product_id: id, source: "local" }));
              const { error } = await supabaseAdmin
                .from("sold_products")
                .upsert(rows, { onConflict: "product_id" });
              if (error) console.error("webhook upsert sold_products error:", error);
            }

            const buyerEmail = session.customer_details?.email;

            // Persist order so admin can later send shipping email.
            if (buyerEmail) {
              const { error: orderErr } = await supabaseAdmin
                .from("orders")
                .upsert(
                  {
                    stripe_session_id: session.id,
                    buyer_email: buyerEmail,
                    buyer_name: session.customer_details?.name ?? null,
                    product_ids: productIds,
                    amount_total_cents: session.amount_total ?? null,
                    currency: session.currency ?? "usd",
                    shipping_address: session.shipping_details?.address ?? null,
                  },
                  { onConflict: "stripe_session_id" },
                );
              if (orderErr) console.error("webhook insert orders error:", orderErr);

              try {
                await sendOrderConfirmationEmail({
                  to: buyerEmail,
                  customerName: session.customer_details?.name ?? null,
                  productIds,
                  amountTotalCents: session.amount_total ?? null,
                  currency: session.currency ?? "usd",
                  shippingAddress: session.shipping_details?.address ?? null,
                  sessionId: session.id,
                });
              } catch (mailErr) {
                console.error("Order email failed:", mailErr);
              }
            }
          }
        } catch (err) {
          console.error("Webhook handler error:", err);
          return new Response("Handler error", { status: 500 });
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});
