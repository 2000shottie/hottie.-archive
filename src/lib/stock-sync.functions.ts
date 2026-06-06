import { createServerFn } from "@tanstack/react-start";
import { products } from "@/lib/products";
import { fetchVestiaireStockStatus, isConfirmedLiveStock } from "@/lib/stock.functions";

export type StockSyncResult = {
  ok: boolean;
  checked: { id: string; available: boolean; reason: string }[];
  markedSold: string[];
  unmarked: string[];
  error?: string;
};

/**
 * Re-runs Vestiaire stock detection for every product with a vestiaireUrl.
 * - Products detected as no longer available are upserted as `source='vestiaire'`.
 * - Products that come back available cause any existing `source='vestiaire'`
 *   row to be removed, so items detected before the latest deployment get
 *   reprocessed automatically.
 * - `source='local'` rows (real paid orders) are never touched.
 */
export async function runStockSync(): Promise<StockSyncResult> {
  const vestiaireProducts = products.filter((p) => p.vestiaireUrl);
  const checked: StockSyncResult["checked"] = [];
  const markedSold: string[] = [];
  const availableIds: string[] = [];

  for (const product of vestiaireProducts) {
    const stock = await fetchVestiaireStockStatus(product.vestiaireUrl!);
    checked.push({ id: product.id, available: stock.available, reason: stock.reason });
    if (isConfirmedLiveStock(stock)) availableIds.push(product.id);
    else markedSold.push(product.id);
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  if (markedSold.length > 0) {
    const rows = markedSold.map((id) => ({ product_id: id, source: "vestiaire" }));
    const { error } = await supabaseAdmin
      .from("sold_products")
      .upsert(rows, { onConflict: "product_id" });
    if (error) {
      console.error("runStockSync upsert error:", error);
      return { ok: false, checked, markedSold, unmarked: [], error: error.message };
    }
  }

  let unmarked: string[] = [];
  if (availableIds.length > 0) {
    const { data, error } = await supabaseAdmin
      .from("sold_products")
      .delete()
      .in("product_id", availableIds)
      .eq("source", "vestiaire")
      .select("product_id");
    if (error) {
      console.error("runStockSync unmark error:", error);
      return { ok: false, checked, markedSold, unmarked: [], error: error.message };
    }
    unmarked = (data ?? []).map((r) => r.product_id);
  }

  return { ok: true, checked, markedSold, unmarked };
}

/** Manual trigger for "Re-run detection" admin action. */
export const triggerStockSync = createServerFn({ method: "POST" }).handler(
  async (): Promise<StockSyncResult> => runStockSync(),
);
