import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { triggerStockSync, type StockSyncResult } from "@/lib/stock-sync.functions";
import { getRecentStockChecks, getActiveReservations } from "@/lib/stock-cache.functions";
import { AdminGate } from "@/components/AdminGate";

export const Route = createFileRoute("/admin/sync")({
  component: () => (
    <AdminGate>
      <AdminSyncPage />
    </AdminGate>
  ),
  head: () => ({ meta: [{ title: "Stock detection" }, { name: "robots", content: "noindex" }] }),
});

function AdminSyncPage() {
  const run = useServerFn(triggerStockSync);
  const fetchRecent = useServerFn(getRecentStockChecks);
  const fetchReservations = useServerFn(getActiveReservations);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StockSyncResult | null>(null);

  const cache = useQuery({
    queryKey: ["admin-stock-cache"],
    queryFn: () => fetchRecent(),
    refetchInterval: 15_000,
  });

  const reservations = useQuery({
    queryKey: ["admin-reservations"],
    queryFn: () => fetchReservations(),
    refetchInterval: 10_000,
  });

  const onClick = async () => {
    setLoading(true);
    setResult(null);
    try {
      const r = await run();
      setResult(r);
      await cache.refetch();
    } catch (err) {
      setResult({
        ok: false,
        checked: [],
        markedSold: [],
        unmarked: [],
        error: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl tracking-luxe uppercase mb-2">Stock detection</h1>
      <p className="text-sm text-foreground/70 mb-6">
        Vestiaire stock is refreshed automatically by a background job. Use the
        button below to force a re-check right now. Strict rules: anything that
        isn't a clean live listing with a buy button is marked OUT OF STOCK.
      </p>
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="rounded-full border border-foreground/15 bg-foreground px-6 py-2 text-xs uppercase tracking-luxe text-background disabled:opacity-50"
      >
        {loading ? "Running…" : "Re-run detection"}
      </button>

      <div className="mt-10">
        <h2 className="uppercase tracking-luxe text-xs mb-3">Current cached status</h2>
        {cache.isLoading && <p className="text-sm text-foreground/60">Loading…</p>}
        {cache.data && cache.data.length === 0 && (
          <p className="text-sm text-foreground/60">No stock data yet — run a check.</p>
        )}
        <ul className="space-y-2 text-sm">
          {(cache.data ?? []).map((row) => (
            <li
              key={row.product_id}
              className={`flex items-start justify-between gap-3 border-b border-foreground/10 pb-2 ${
                row.available ? "" : "text-red-600"
              }`}
            >
              <div className="min-w-0">
                <p className="font-medium truncate">{row.product_id}</p>
                <p className="text-xs text-foreground/60">{row.reason}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="uppercase tracking-luxe text-[10px]">
                  {row.available ? "In stock" : "Out of stock"}
                </p>
                <p className="text-[10px] text-foreground/50">
                  {new Date(row.checked_at).toLocaleString()}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {result && (
        <div className="mt-8 space-y-4 text-sm">
          {result.error && <p className="text-red-600">Error: {result.error}</p>}
          <details>
            <summary className="cursor-pointer uppercase tracking-luxe text-xs">
              Last run details ({result.checked.length})
            </summary>
            <ul className="mt-2 space-y-1">
              {result.checked.map((c) => (
                <li key={c.id} className={c.available ? "text-foreground/70" : "text-red-600"}>
                  <span className="font-medium">{c.id}</span> —{" "}
                  {c.available ? "live" : "out"} — {c.reason}
                </li>
              ))}
            </ul>
          </details>
        </div>
      )}
    </div>
  );
}
