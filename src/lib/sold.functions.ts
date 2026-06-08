import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/** Returns the list of product IDs that have been sold via this site. */
export const getSoldProductIds = createServerFn({ method: "GET" }).handler(
  async (): Promise<string[]> => {
    const { data, error } = await supabaseAdmin
      .from("sold_products")
      .select("product_id");
    if (error) {
      console.error("getSoldProductIds error:", error);
      return [];
    }
    return (data ?? []).map((r) => r.product_id);
  },
);

// NOTE: `markProductsSold` was removed. It was previously called from the
// browser on the checkout return page, which allowed any anonymous caller
// to mark arbitrary products as sold and effectively delist the catalog.
// `sold_products` is now written exclusively by the Stripe webhook
// (`src/routes/api/public/payments/webhook.ts`) after the signature is
// verified — that's the only trusted "this order was actually paid" signal.
