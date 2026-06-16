import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useCart } from "@/lib/cart";
import { getOrderSummary, type OrderSummary } from "@/lib/order.functions";
import { getStripeEnvironment } from "@/lib/stripe";

export const Route = createFileRoute("/checkout/return")({
  head: () => ({
    meta: [
      { title: "Order confirmed — HOTTIE." },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { session_id?: string } => ({
    session_id: typeof search.session_id === "string" ? search.session_id : undefined,
  }),
  component: CheckoutReturn,
});

function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

function CheckoutReturn() {
  const { session_id } = Route.useSearch();
  const { clear } = useCart();
  const fetchOrder = useServerFn(getOrderSummary);
  const queryClient = useQueryClient();
  const done = useRef(false);

  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (done.current || !session_id) return;
    done.current = true;
    // The Stripe webhook (verified signature) is the only writer for
    // `sold_products`. Just clear the local cart and refresh the cached
    // stock map so the storefront reflects the sale on next load.
    clear();
    queryClient.invalidateQueries({ queryKey: ["sold-products"] });
    (async () => {
      try {
        const res = await fetchOrder({
          data: { sessionId: session_id, environment: getStripeEnvironment() },
        });
        if ("error" in res) setError(res.error);
        else setOrder(res.order);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load order");
      } finally {
        setLoading(false);
      }
    })();
  }, [session_id, clear, queryClient, fetchOrder]);

  if (!session_id) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <main className="mx-auto max-w-[700px] px-5 py-24 text-center">
          <h1 className="font-display text-4xl">No order found.</h1>
          <Link
            to="/"
            className="mt-6 inline-block rounded-full bg-foreground px-7 py-3.5 text-[11px] tracking-luxe uppercase text-background hover:bg-primary"
          >
            Go home
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="mx-auto max-w-[800px] px-5 py-16 md:py-24">
        <header className="text-center">
          <p className="text-[11px] tracking-luxe uppercase text-muted-foreground">Confirmed</p>
          <h1 className="mt-4 font-display text-5xl md:text-6xl">
            Thank you for shopping <span className="font-script text-primary">Hottie</span>!
          </h1>
          {order?.email && (
            <p className="mt-6 text-[14px] text-muted-foreground">
              Your order confirmation has been sent to{" "}
              <span className="text-foreground">{order.email}</span>.
              Thank you for your order ~ we can't wait for this special piece to join your collection :)
              <br /><br />
              Can't find it? Please check your junk or spam folder, and mark it as "Not Spam" so future updates land in your inbox.
              Tracking info will be sent the same way once your piece ships.
            </p>
          )}
          {!order?.email && (
            <p className="mt-6 text-[14px] text-muted-foreground">
              Your order is in. Your order confirmation will be sent to your email.
              Thank you for your order ~ we can't wait for this special piece to join your collection :)
              <br /><br />
              Can't find it? Please check your junk or spam folder, and mark it as "Not Spam" so future updates land in your inbox.
              Tracking info will be sent the same way once your piece ships.
            </p>
          )}
        </header>

        {loading && (
          <p className="mt-10 text-center text-[12px] text-muted-foreground">Loading your order…</p>
        )}

        {error && !loading && (
          <p className="mt-10 text-center text-[12px] text-destructive">{error}</p>
        )}

        {order && (
          <section className="mt-12 rounded-2xl border border-border bg-card p-6 md:p-8">
            <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-border pb-4">
              <div>
                <p className="text-[11px] tracking-luxe uppercase text-muted-foreground">Order</p>
                <p className="font-display text-2xl">#{order.orderNumber}</p>
              </div>
              <p className="text-[11px] tracking-luxe uppercase text-muted-foreground">
                {order.paymentStatus === "paid" ? "Paid" : order.paymentStatus}
              </p>
            </div>

            <ul className="mt-5 space-y-4">
              {order.items.map((it, i) => (
                <li key={i} className="flex items-start justify-between gap-4 text-[13px]">
                  <div className="min-w-0 flex-1">
                    <p>{it.description}</p>
                    <p className="text-[11px] text-muted-foreground">Qty {it.quantity}</p>
                  </div>
                  <p>{formatMoney(it.amountTotal, it.currency)}</p>
                </li>
              ))}
            </ul>

            <dl className="mt-6 space-y-2 border-t border-border pt-4 text-[13px]">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd>{formatMoney(order.amountSubtotal, order.currency)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Shipping (incl. duties &amp; taxes)</dt>
                <dd>{formatMoney(order.amountShipping, order.currency)}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-2 font-display text-[16px]">
                <dt>Total</dt>
                <dd>{formatMoney(order.amountTotal, order.currency)}</dd>
              </div>
            </dl>

            {order.shippingAddress && (
              <div className="mt-6 border-t border-border pt-4 text-[13px]">
                <p className="text-[11px] tracking-luxe uppercase text-muted-foreground">Shipping to</p>
                <div className="mt-2 leading-relaxed">
                  {order.shippingAddress.name && <p>{order.shippingAddress.name}</p>}
                  {order.shippingAddress.line1 && <p>{order.shippingAddress.line1}</p>}
                  {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
                  <p>
                    {[order.shippingAddress.city, order.shippingAddress.state, order.shippingAddress.postal_code]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                  {order.shippingAddress.country && <p>{order.shippingAddress.country}</p>}
                </div>
              </div>
            )}
          </section>
        )}

        <div className="mt-10 text-center">
          <Link
            to="/"
            className="inline-block rounded-full bg-foreground px-7 py-3.5 text-[11px] tracking-luxe uppercase text-background hover:bg-primary"
          >
            Keep browsing
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
