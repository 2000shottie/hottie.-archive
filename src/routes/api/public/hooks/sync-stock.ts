import { createFileRoute } from "@tanstack/react-router";

/**
 * Public hook hit by pg_cron every 5 minutes to refresh every product's
 * Vestiaire stock status. Protected by a shared secret so anonymous callers
 * cannot burn Firecrawl credits.
 *
 * pg_cron sends `x-admin-token: <ADMIN_TOKEN>`.
 */
export const Route = createFileRoute("/api/public/hooks/sync-stock")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env.STOCK_SYNC_SECRET;
        if (!expected) {
          return Response.json({ ok: false, error: "server_misconfigured" }, { status: 500 });
        }
        const provided = request.headers.get("x-sync-secret") ?? "";
        if (provided.length !== expected.length) {
          return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
        }
        let mismatch = 0;
        for (let i = 0; i < expected.length; i++) {
          mismatch |= expected.charCodeAt(i) ^ provided.charCodeAt(i);
        }
        if (mismatch !== 0) {
          return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
        }

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
