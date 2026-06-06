import { createServerFn } from "@tanstack/react-start";

export type StockSyncResult = {
  ok: boolean;
  checked: { id: string; available: boolean; reason: string }[];
  markedSold: string[];
  unmarked: string[];
  error?: string;
};

/**
 * Manual trigger for the admin "Re-run detection" button.
 * Delegates to the strict backend checker.
 */
export const triggerStockSync = createServerFn({ method: "POST" }).handler(
  async (): Promise<StockSyncResult> => {
    try {
      const { checkAll } = await import("@/lib/stock-checker.server");
      const batch = await checkAll();
      const checked = batch.results.map((r) => ({
        id: r.productId,
        available: r.available,
        reason: r.reason,
      }));
      return {
        ok: true,
        checked,
        markedSold: checked.filter((c) => !c.available).map((c) => c.id),
        unmarked: checked.filter((c) => c.available).map((c) => c.id),
      };
    } catch (err) {
      return {
        ok: false,
        checked: [],
        markedSold: [],
        unmarked: [],
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  },
);
