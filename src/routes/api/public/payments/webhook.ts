import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  type StripeEnv,
  createStripeClient,
  getWebhookSecret,
} from "@/lib/stripe.server";

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
            const session = event.data.object as { metadata?: Record<string, string> | null };
            const csv = session.metadata?.productIds ?? "";
            const productIds = csv
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean);
            if (productIds.length > 0) {
              const rows = productIds.map((id) => ({ product_id: id }));
              const { error } = await supabaseAdmin
                .from("sold_products")
                .upsert(rows, { onConflict: "product_id" });
              if (error) console.error("webhook upsert sold_products error:", error);
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
