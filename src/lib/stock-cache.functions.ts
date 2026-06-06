/**
 * Stock cache server functions — the frontend's only interface for stock.
 *
 * - `getStockMap` returns the saved status for every product so cards render
 *   instantly without touching Firecrawl.
 * - `refreshStockInBackground` kicks off a backend re-check without blocking
 *   the request (waitUntil-style "fire and forget"). Safe to call on every
 *   page load — internally it's debounced by `last_refresh_at` so we don't
 *   hammer Firecrawl.
 */

import { createServerFn } from "@tanstack/react-start";

export type StockMapEntry = {
  available: boolean;
  reason: string;
  checkedAt: string;
};

export type StockMap = Record<string, StockMapEntry>;

// Module-level guards so concurrent visitors don't kick off overlapping
// batch checks. The Worker runtime keeps these per-isolate, which is enough
// to prevent the obvious thundering-herd; the cron job is the real refresh
// path, this is just a backup.
let inFlight: Promise<void> | null = null;
let lastRunAt = 0;
const MIN_REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export const getStockMap = createServerFn({ method: "GET" }).handler(
  async (): Promise<StockMap> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: stockRows, error: stockErr }, { data: soldRows, error: soldErr }] =
      await Promise.all([
        supabaseAdmin.from("product_stock").select("product_id, available, reason, checked_at"),
        supabaseAdmin.from("sold_products").select("product_id, sold_at"),
      ]);

    if (stockErr) console.error("getStockMap product_stock error", stockErr);
    if (soldErr) console.error("getStockMap sold_products error", soldErr);

    const map: StockMap = {};
    for (const row of stockRows ?? []) {
      map[row.product_id] = {
        available: row.available,
        reason: row.reason,
        checkedAt: row.checked_at,
      };
    }
    // sold_products always wins — a real paid order is the strongest signal.
    for (const row of soldRows ?? []) {
      map[row.product_id] = {
        available: false,
        reason: "Sold through HOTTIE.",
        checkedAt: row.sold_at,
      };
    }
    return map;
  },
);

export const refreshStockInBackground = createServerFn({ method: "POST" }).handler(
  async (): Promise<{ scheduled: boolean; reason: string }> => {
    const now = Date.now();
    if (inFlight) return { scheduled: false, reason: "already_running" };
    if (now - lastRunAt < MIN_REFRESH_INTERVAL_MS) {
      return { scheduled: false, reason: "rate_limited" };
    }
    lastRunAt = now;

    inFlight = (async () => {
      try {
        const { checkAll } = await import("@/lib/stock-checker.server");
        await checkAll();
      } catch (err) {
        console.error("background stock refresh failed", err);
      } finally {
        inFlight = null;
      }
    })();

    // Intentionally NOT awaited — return immediately so the page render isn't blocked.
    return { scheduled: true, reason: "started" };
  },
);

/**
 * Returns the most recent check log entries per product (admin use).
 */
export const getRecentStockChecks = createServerFn({ method: "GET" }).handler(
  async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("product_stock")
      .select("product_id, available, reason, checked_at")
      .order("checked_at", { ascending: false });
    if (error) {
      console.error("getRecentStockChecks error", error);
      return [];
    }
    return data ?? [];
  },
);
