import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
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

/** Marks one or more products as sold via this site (called on successful checkout). */
export const markProductsSold = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({ productIds: z.array(z.string().min(1).max(100)).min(1).max(50) }),
  )
  .handler(async ({ data }) => {
    const rows = data.productIds.map((id) => ({ product_id: id }));
    const { error } = await supabaseAdmin
      .from("sold_products")
      .upsert(rows, { onConflict: "product_id" });
    if (error) {
      console.error("markProductsSold error:", error);
      throw new Error("Could not mark products as sold");
    }
    return { ok: true };
  });
