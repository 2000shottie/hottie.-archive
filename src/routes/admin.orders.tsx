import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { listOrders, sendTrackingEmail, type AdminOrder } from "@/lib/orders.functions";
import { getProduct } from "@/lib/products";

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrdersPage,
  head: () => ({
    meta: [
      { title: "Orders — send tracking" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
});

const CARRIERS = ["USPS", "UPS", "FedEx", "DHL", "Royal Mail", "La Poste", "Other"];

function fmtMoney(cents: number | null, currency: string) {
  if (cents == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

function AdminOrdersPage() {
  const fetchOrders = useServerFn(listOrders);
  const sendEmail = useServerFn(sendTrackingEmail);

  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      setOrders(await fetchOrders());
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-2xl tracking-luxe uppercase mb-2">Orders</h1>
      <p className="text-sm text-foreground/70 mb-8">
        Every paid order. Paste the carrier and tracking number, then click Send — the buyer
        gets an email with a tracking link. Confirmation emails are sent automatically at checkout.
      </p>

      {loading && <p className="text-sm">Loading…</p>}
      {err && <p className="text-sm text-red-600">{err}</p>}

      <div className="space-y-6">
        {orders.map((o) => (
          <OrderCard key={o.id} order={o} onSend={sendEmail} onChanged={load} />
        ))}
        {!loading && orders.length === 0 && (
          <p className="text-sm text-foreground/60">No orders yet.</p>
        )}
      </div>
    </div>
  );
}

function OrderCard({
  order,
  onSend,
  onChanged,
}: {
  order: AdminOrder;
  onSend: ReturnType<typeof useServerFn<typeof sendTrackingEmail>>;
  onChanged: () => void;
}) {
  const [carrier, setCarrier] = useState(order.carrier ?? "USPS");
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const items = order.productIds.map((id) => getProduct(id)).filter(Boolean);
  const addr = order.shippingAddress;

  const submit = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const r = await onSend({ data: { orderId: order.id, carrier, trackingNumber } });
      setMsg(`Sent. Tracking link: ${r.trackingUrl}`);
      onChanged();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed to send");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border border-foreground/10 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
        <div>
          <div className="text-sm font-medium">{order.buyerName ?? order.buyerEmail}</div>
          <div className="text-xs text-foreground/60">{order.buyerEmail}</div>
        </div>
        <div className="text-xs text-foreground/60 text-right">
          <div>{new Date(order.createdAt).toLocaleString()}</div>
          <div>{fmtMoney(order.amountTotalCents, order.currency)}</div>
        </div>
      </div>

      <ul className="text-sm mb-3 list-disc list-inside text-foreground/80">
        {items.map((p) => (
          <li key={p!.id}>
            <span className="uppercase tracking-wider text-xs text-foreground/60">{p!.house}</span>{" "}
            {p!.name}
          </li>
        ))}
      </ul>

      {addr && (
        <div className="text-xs text-foreground/70 mb-4">
          Ship to: {[addr.line1, addr.line2, addr.city, addr.state, addr.postal_code, addr.country]
            .filter(Boolean)
            .join(", ")}
        </div>
      )}

      {order.shippedEmailSentAt ? (
        <div className="text-xs text-emerald-700 mb-3">
          Shipped email sent {new Date(order.shippedEmailSentAt).toLocaleString()} ·{" "}
          {order.carrier} {order.trackingNumber}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2 items-end">
        <label className="flex flex-col text-xs">
          <span className="mb-1 uppercase tracking-wider text-foreground/60">Carrier</span>
          <select
            value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
            className="border border-foreground/20 bg-background px-3 py-2 text-sm"
          >
            {CARRIERS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col text-xs flex-1 min-w-[200px]">
          <span className="mb-1 uppercase tracking-wider text-foreground/60">Tracking #</span>
          <input
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="e.g. 9400111899223197428490"
            className="border border-foreground/20 bg-background px-3 py-2 text-sm"
          />
        </label>
        <button
          type="button"
          onClick={submit}
          disabled={busy || trackingNumber.trim().length < 3}
          className="rounded-full border border-foreground/15 bg-foreground px-5 py-2 text-xs uppercase tracking-luxe text-background disabled:opacity-50"
        >
          {busy ? "Sending…" : order.shippedEmailSentAt ? "Resend" : "Send"}
        </button>
      </div>

      {msg && <p className="mt-3 text-xs">{msg}</p>}
    </div>
  );
}
