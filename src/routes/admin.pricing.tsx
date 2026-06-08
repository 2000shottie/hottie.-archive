import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { products } from "@/lib/products";
import {
  computeInternalPricing,
  computeForBuyer,
  priceWarning,
  MINIMUM_PROFIT_USD,
} from "@/lib/admin-pricing";
import { ALL_DESTINATIONS } from "@/lib/admin-rates";
import { AdminGate, adminSignOut } from "@/components/AdminGate";

// Unlisted admin route. Not in nav, not in sitemap. Gated by AdminGate,
// which verifies an admin token server-side before any of the internal
// cost / margin data renders.
export const Route = createFileRoute("/admin/pricing")({
  head: () => ({
    meta: [
      { title: "Admin · Pricing" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: () => (
    <AdminGate>
      <AdminPricing />
    </AdminGate>
  ),
});

function AdminPricing() {
  const [buyer, setBuyer] = useState<string>("US");

  const rows = useMemo(
    () =>
      products.map((p) => ({
        p,
        r: computeInternalPricing(p),
        b: computeForBuyer(p, buyer),
        warn: priceWarning(p),
      })),
    [buyer],
  );


  const blocked = rows.filter((x) => x.warn).length;

  return (
    <main className="mx-auto max-w-[1400px] p-6 md:p-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">Pricing · Admin only</h1>
          <p className="mt-1 text-[12px] text-muted-foreground">
            Internal cost data — never visible to customers. Minimum profit floor: $
            {MINIMUM_PROFIT_USD}. Required price is worst-case across all destinations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-[11px] uppercase tracking-luxe text-muted-foreground">
            Simulate buyer
          </label>
          <select
            value={buyer}
            onChange={(e) => setBuyer(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            {ALL_DESTINATIONS.map((cc) => (
              <option key={cc} value={cc}>
                {cc}
              </option>
            ))}
          </select>
          <button
            onClick={adminSignOut}
            className="text-[11px] uppercase tracking-luxe text-muted-foreground hover:text-primary"
          >
            Lock
          </button>
        </div>
      </div>

      {blocked > 0 && (
        <div className="mt-6 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-[13px]">
          {blocked} {blocked === 1 ? "product is" : "products are"} blocked from publishing — see warnings below.
        </div>
      )}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-[12px]">
          <thead className="bg-muted/40 text-left text-[11px] uppercase tracking-luxe text-muted-foreground">
            <tr>
              <th className="p-3">Product</th>
              <th className="p-3">Origin</th>
              <th className="p-3 text-right">Listed</th>
              <th className="p-3 text-right">My cost</th>
              <th className="p-3 text-right">Worst ship</th>
              <th className="p-3 text-right">Worst duties</th>
              <th className="p-3 text-right">Worst @</th>
              <th className="p-3 text-right">Required</th>
              <th className="p-3 text-right">Margin</th>
              <th className="p-3 text-right">→ {buyer} profit</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ p, r, b, warn }) => (
              <tr key={p.id} className="border-t border-border align-top">
                <td className="p-3">
                  <div className="font-medium">{p.name}</div>
                  <div className="text-[11px] text-muted-foreground">{p.house}</div>
                </td>
                <td className="p-3">{p.originCountry ?? "—"}</td>
                <td className="p-3 text-right">${r.listedPrice.toLocaleString()}</td>
                <td className="p-3 text-right">
                  {r.hasData ? `$${r.myCost.toLocaleString()}` : "—"}
                </td>
                <td className="p-3 text-right">
                  ${r.worstLanded.outboundShipping.toLocaleString()}
                </td>
                <td className="p-3 text-right">
                  ${r.worstLanded.dutiesAndTax.toLocaleString()}
                </td>
                <td className="p-3 text-right">{r.worstDestination}</td>
                <td className="p-3 text-right">
                  ${r.internalRequiredPrice.toLocaleString()}
                </td>
                <td
                  className={
                    "p-3 text-right " +
                    (r.hasData && r.margin >= 0 ? "text-emerald-600" : "text-destructive")
                  }
                >
                  {r.hasData
                    ? `${r.margin >= 0 ? "+" : ""}$${r.margin.toLocaleString()}`
                    : "—"}
                </td>
                <td
                  className={
                    "p-3 text-right " +
                    (b.ok ? "text-emerald-600" : "text-destructive")
                  }
                  title={`Ship $${b.landed.outboundShipping} + duties $${b.landed.dutiesAndTax}`}
                >
                  {r.hasData ? `${b.profit >= 0 ? "+" : ""}$${b.profit.toLocaleString()}` : "—"}
                </td>
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
        Reminder: never expose myCost, originCountry, outbound shipping, duties/tax, minimum profit, or required price in customer-facing UI.
      </p>
    </main>
  );
}
