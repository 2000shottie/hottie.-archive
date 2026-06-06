/**
 * Legacy single-product stock check, kept as a thin wrapper around the
 * backend checker for any caller that still needs an ad-hoc one-off check.
 *
 * The frontend should NOT call this — it reads from the cached map via
 * `getStockMap` instead. This is here for admin tools / future scripts.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { products } from "@/lib/products";

export type StockStatus = {
  available: boolean;
  source: "firecrawl" | "unknown";
  reason: string;
  checkedAt: string;
};

export function isConfirmedLiveStock(status: StockStatus): boolean {
  return status.available && status.source === "firecrawl";
}

export const checkVestiaireStock = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      url: z.string().url(),
      productId: z.string().min(1).max(100).optional(),
    }),
  )
  .handler(async ({ data }): Promise<StockStatus> => {
    const checkedAt = new Date().toISOString();
    const product =
      (data.productId && products.find((p) => p.id === data.productId)) ||
      products.find((p) => p.vestiaireUrl === data.url);
    if (!product || !product.vestiaireUrl) {
      return {
        available: false,
        source: "unknown",
        reason: "Unknown product — marked unavailable.",
        checkedAt,
      };
    }
    const { checkAll } = await import("@/lib/stock-checker.server");
    // Cheap path: run the full batch (small list) and read the entry we care about.
    const batch = await checkAll();
    const result = batch.results.find((r) => r.productId === product.id);
    if (!result) {
      return {
        available: false,
        source: "unknown",
        reason: "Stock check did not return a result.",
        checkedAt,
      };
    }
    return {
      available: result.available,
      source: "firecrawl",
      reason: result.reason,
      checkedAt: new Date().toISOString(),
    };
  });
