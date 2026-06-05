import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { products } from "@/lib/products";
import { computeInternalPricing, priceWarning, MINIMUM_PROFIT_USD } from "@/lib/admin-pricing";

// Unlisted admin route. Not in nav, not in sitemap. Gated by a passphrase
// stored in localStorage so customers can never stumble onto cost data.
const KEY = "hottie.admin.v1";
const PASS = "hottie-admin"; // change anytime; rotate via localStorage

export const Route = createFileRoute("/admin/pricing")({
  head: () => ({
    meta: [
      { title: "Admin · Pricing" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminPricing,
});

function AdminPricing() {
  const [ok, setOk] = useState(false);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && window.localStorage.getItem(KEY) === PASS) {
      setOk(true);
    }
  }, []);

  if (!ok) {
    return (
      <main className="mx-auto max-w-md p-10">
        <h1 className="font-display text-3xl">Admin</h1>
        <p className="mt-2 text-sm text-muted-foreground">Enter passphrase.</p>
        <form
          className="mt-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (input === PASS) {
              window.localStorage.setItem(KEY, PASS);
              setOk(true);
            }
          }}
        >
          <input
            type="password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <button className="rounded-lg bg-foreground px-4 py-2 text-sm text-background">
            Enter
          </button>
        </form>
      </main>
    );
  }

  const rows = products.map((p) => ({ p, r: computeInternalPricing(p), warn: priceWarning(p) }));
  const blocked = rows.filter((x) => x.warn).length;

  return (
    <main className="mx-auto max-w-[1200px] p-6 md:p-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">Pricing · Admin only</h1>
          <p className="mt-1 text-[12px] text-muted-foreground">
            Internal data. Never visible to customers. Minimum profit floor: ${MINIMUM_PROFIT_USD}.
          </p>
        </div>
        <button
          onClick={() => {
            window.localStorage.removeItem(KEY);
            setOk(false);
          }}
          className="text-[11px] uppercase tracking-luxe text-muted-foreground hover:text-primary"
        >
          Lock
        </button>
      </div>

      {blocked > 0 && (
        <div className="mt-6 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-[13px]">
          {blocked} {blocked === 1 ? "product" : "products"} blocked from publishing — see warnings below.
        </div>
      )}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-[12px]">
          <thead className="bg-muted/40 text-left text-[11px] uppercase tracking-luxe text-muted-foreground">
            <tr>
              <th className="p-3">Product</th>
              <th className="p-3 text-right">Listed</th>
              <th className="p-3 text-right">My cost</th>
              <th className="p-3 text-right">Est. ship</th>
              <th className="p-3 text-right">Est. duties</th>
              <th className="p-3 text-right">Min profit</th>
              <th className="p-3 text-right">Required</th>
              <th className="p-3 text-right">Margin</th>
              <th className="p-3">Origin</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ p, r, warn }) => (
              <tr key={p.id} className="border-t border-border align-top">
                <td className="p-3">
                  <div className="font-medium">{p.name}</div>
                  <div className="text-[11px] text-muted-foreground">{p.house}</div>
                </td>
                <td className="p-3 text-right">${r.listedPrice.toLocaleString()}</td>
                <td className="p-3 text-right">{r.hasData ? `$${r.myCost.toLocaleString()}` : "—"}</td>
                <td className="p-3 text-right">${r.estimatedShippingCost.toLocaleString()}</td>
                <td className="p-3 text-right">${r.estimatedDutiesAndTaxes.toLocaleString()}</td>
                <td className="p-3 text-right">${r.minimumProfit}</td>
                <td className="p-3 text-right">${r.internalRequiredPrice.toLocaleString()}</td>
                <td
                  className={
                    "p-3 text-right " +
                    (r.hasData && r.margin >= 0 ? "text-emerald-600" : "text-destructive")
                  }
                >
                  {r.hasData ? `${r.margin >= 0 ? "+" : ""}$${r.margin.toLocaleString()}` : "—"}
                </td>
                <td className="p-3">{p.originCountry ?? "—"}</td>
                <td className="p-3">
                  {warn ? (
                    <span className="text-destructive">{warn}</span>
                  ) : (
                    <span className="text-emerald-600">OK to publish</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-6 text-[11px] text-muted-foreground">
        Reminder: never expose myCost, originCountry, estimatedShippingCost, estimatedDutiesAndTaxes,
        minimumProfit, or internalRequiredPrice in customer-facing UI.
      </p>
    </main>
  );
}
