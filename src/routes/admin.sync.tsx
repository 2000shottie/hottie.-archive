import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { triggerStockSync, type StockSyncResult } from "@/lib/stock-sync.functions";

export const Route = createFileRoute("/admin/sync")({
  component: AdminSyncPage,
  head: () => ({ meta: [{ title: "Re-run stock detection" }, { name: "robots", content: "noindex" }] }),
});

function AdminSyncPage() {
  const run = useServerFn(triggerStockSync);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StockSyncResult | null>(null);

  const onClick = async () => {
    setLoading(true);
    setResult(null);
    try {
      const r = await run();
      setResult(r);
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
        Re-checks every Vestiaire listing right now. Items that come back available
        are unmarked; items confirmed sold on Vestiaire are marked sold. Local
        purchases are never touched.
      </p>
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="rounded-full border border-foreground/15 bg-foreground px-6 py-2 text-xs uppercase tracking-luxe text-background disabled:opacity-50"
      >
        {loading ? "Running…" : "Re-run detection"}
      </button>

      {result && (
        <div className="mt-8 space-y-4 text-sm">
          {result.error && (
            <p className="text-red-600">Error: {result.error}</p>
          )}
          <div>
            <h2 className="uppercase tracking-luxe text-xs mb-2">Marked sold ({result.markedSold.length})</h2>
            {result.markedSold.length === 0 ? <p className="text-foreground/60">None</p> : (
              <ul className="list-disc list-inside">{result.markedSold.map((id) => <li key={id}>{id}</li>)}</ul>
            )}
          </div>
          <div>
            <h2 className="uppercase tracking-luxe text-xs mb-2">Unmarked / back available ({result.unmarked.length})</h2>
            {result.unmarked.length === 0 ? <p className="text-foreground/60">None</p> : (
              <ul className="list-disc list-inside">{result.unmarked.map((id) => <li key={id}>{id}</li>)}</ul>
            )}
          </div>
          <details>
            <summary className="cursor-pointer uppercase tracking-luxe text-xs">All checks ({result.checked.length})</summary>
            <ul className="mt-2 space-y-1">
              {result.checked.map((c) => (
                <li key={c.id} className={c.available ? "text-foreground/70" : "text-red-600"}>
                  <span className="font-medium">{c.id}</span> — {c.available ? "live" : "sold"} — {c.reason}
                </li>
              ))}
            </ul>
          </details>
        </div>
      )}
    </div>
  );
}
