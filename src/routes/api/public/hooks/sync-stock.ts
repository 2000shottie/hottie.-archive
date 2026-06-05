import { createFileRoute } from "@tanstack/react-router";
import { runStockSync } from "@/lib/stock-sync.functions";

export const Route = createFileRoute("/api/public/hooks/sync-stock")({
  server: {
    handlers: {
      POST: async () => {
        const result = await runStockSync();
        return Response.json(result, { status: result.ok ? 200 : 500 });
      },
    },
  },
});
