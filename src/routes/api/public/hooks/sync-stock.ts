import { createFileRoute } from "@tanstack/react-router";

/**
 * Public hook hit by pg_cron every 10 minutes to refresh every product's
 * Vestiaire stock status. Anyone can call it (it only writes to the
 * `product_stock` cache and the `stock_check_log` history).
 */
export const Route = createFileRoute("/api/public/hooks/sync-stock")({
  server: {
    handlers: {
      POST: async () => {
        try {
          const { checkAll } = await import("@/lib/stock-checker.server");
          const result = await checkAll();
          return Response.json(result, { status: 200 });
        } catch (err) {
          console.error("sync-stock hook error", err);
          return Response.json(
            { ok: false, error: err instanceof Error ? err.message : "unknown" },
            { status: 500 },
          );
        }
      },
    },
  },
});
