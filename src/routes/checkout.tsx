import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { useCart } from "@/lib/cart";
import { useStock } from "@/lib/useStock";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { createCartCheckoutSession } from "@/lib/payments.functions";
import {
  allCountryOptions,
  cartShipping,
} from "@/lib/shipping-countries";
import type { Product } from "@/lib/products";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — HOTTIE." },
      { name: "description", content: "Secure checkout." },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { lines, subtotal, count } = useCart();
  const createSession = useServerFn(createCartCheckoutSession);
  const [availableIds, setAvailableIds] = useState<Record<string, boolean>>({});
  const reportAvailability = (id: string, available: boolean) =>
    setAvailableIds((prev) => (prev[id] === available ? prev : { ...prev, [id]: available }));

  const checkoutBlocked = lines.some(
    ({ product }) => !!product.vestiaireUrl && availableIds[product.id] !== true,
  );

  // Country picked BEFORE the Stripe iframe loads so we can show only the
  // shipping rate applicable to the customer (and price it correctly).
  const [country, setCountry] = useState<string>("");
  const countryOptions = allCountryOptions();
  const ship = country ? cartShipping(lines, country) : null;
  const shipDollars = ship?.totalDollars ?? null;

  // Snapshot the cart + country so the Stripe session is recreated when either
  // changes.
  const itemsKey = lines.map((l) => `${l.product.id}:${l.qty}`).join("|");
  const sessionKey = `${itemsKey}__${country || "none"}`;
  const lastKeyRef = useRef<string>("");

  const fetchClientSecret = async (): Promise<string> => {
    if (!country) throw new Error("Select a shipping country first");
    const result = await createSession({
      data: {
        items: lines.map((l) => ({
          priceId: l.product.id,
          quantity: l.qty,
          ...(l.product.originCountry ? { originCountry: l.product.originCountry } : {}),
        })),
        returnUrl: `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
        environment: getStripeEnvironment(),
        country,
      },
    });
    if ("error" in result) throw new Error(result.error);
    if (!result.clientSecret) throw new Error("No client secret returned");
    return result.clientSecret;
  };

  // Reset Stripe iframe whenever the cart or selected country changes
  const [providerKey, setProviderKey] = useState(sessionKey);
  useEffect(() => {
    if (lastKeyRef.current !== sessionKey) {
      lastKeyRef.current = sessionKey;
      setProviderKey(sessionKey);
    }
  }, [sessionKey]);

  if (count === 0) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <main className="mx-auto max-w-[800px] px-5 py-24 text-center">
          <h1 className="font-display text-4xl">Your bag is empty.</h1>
          <Link
            to="/"
            className="mt-6 inline-block rounded-full bg-foreground px-7 py-3.5 text-[11px] tracking-luxe uppercase text-background hover:bg-primary"
          >
            Find something
          </Link>
        </main>
        <Footer />
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-background text-foreground">
      <PaymentTestModeBanner />
      <Navbar />
      <main className="mx-auto max-w-[1200px] px-5 py-10 md:px-10 md:py-16">
        <Link to="/cart" className="text-[11px] tracking-luxe uppercase text-foreground/60 hover:text-primary">
          ← Back to bag
        </Link>
        <h1 className="mt-4 font-display text-4xl md:text-6xl">
          Check<span className="font-script text-primary">out</span>
        </h1>

        <div className="mt-10 grid grid-cols-1 gap-10 md:grid-cols-[1.4fr,1fr]">
          <div>
            {checkoutBlocked ? (
              <div className="rounded-2xl border border-border bg-card p-6 text-[13px] text-muted-foreground">
                One or more items in your bag are sold out. Remove them from your bag to continue.
              </div>
            ) : (
              <>
                {/* Country picker controls which shipping rate is shown
                    inside Stripe checkout — one option, priced for that country. */}
                <div className="mb-5 rounded-2xl border border-border bg-card p-5">
                  <label htmlFor="ship-country" className="text-[11px] tracking-luxe uppercase text-muted-foreground">
                    Ship to
                  </label>
                  <select
                    id="ship-country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[14px] focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Select your country…</option>
                    {countryOptions.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {ship && shipDollars != null ? (
                    <p className="mt-3 text-[12px] text-muted-foreground">
                      <span className="text-foreground">
                        {ship.international ? "Worldwide shipping" : "Domestic shipping"}
                      </span>{" "}
                      — ${shipDollars.toFixed(2)} · 3–{ship.international ? 5 : 4} weeks
                      {ship.international ? " · duties & taxes included" : ""}
                    </p>
                  ) : (
                    <p className="mt-3 text-[12px] text-muted-foreground">
                      Choose a country to see your exact shipping total. All international rates include duties &amp; taxes — no customs bills on delivery.
                    </p>
                  )}
                </div>

                {country ? (
                  <div className="rounded-2xl border border-border bg-card overflow-hidden">
                    <EmbeddedCheckoutProvider
                      key={providerKey}
                      stripe={getStripe()}
                      options={{ fetchClientSecret }}
                    >
                      <EmbeddedCheckout />
                    </EmbeddedCheckoutProvider>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center text-[13px] text-muted-foreground">
                    Select a country above to continue to payment.
                  </div>
                )}
              </>
            )}
            <p className="mt-6 text-[12px] leading-relaxed text-muted-foreground">
              Each item is individually sourced from our exclusive network of designer collections.
              Please allow approximately 3–4 weeks for delivery.
            </p>
            <p className="mt-2 text-[11px] tracking-luxe uppercase text-muted-foreground">
              All sales are final — no returns or refunds.
            </p>
          </div>

          <aside className="h-fit rounded-2xl border border-border/70 bg-blush/30 p-6 md:sticky md:top-24">
            <h2 className="text-[11px] tracking-luxe uppercase">Order</h2>
            <ul className="mt-5 space-y-4">
              {lines.map(({ product, qty }) => (
                <CheckoutLine
                  key={product.id}
                  product={product}
                  qty={qty}
                  onStock={(available) => reportAvailability(product.id, available)}
                />
              ))}
            </ul>
            <dl className="mt-6 space-y-2 border-t border-border pt-4 text-[13px]">
              <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>${subtotal.toLocaleString()}</dd></div>
              {ship && shipDollars != null ? (
                <>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">
                      Shipping{ship.international ? " (incl. duties & taxes)" : ""}
                    </dt>
                    <dd>${shipDollars.toLocaleString()}</dd>
                  </div>
                  <div className="flex justify-between font-display text-[16px] pt-2 border-t border-border">
                    <dt>Total</dt>
                    <dd>${(subtotal + shipDollars).toLocaleString()}</dd>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between"><dt className="text-muted-foreground">Shipping</dt><dd>Select country</dd></div>
                  <div className="flex justify-between font-display text-[16px] pt-2 border-t border-border">
                    <dt>Total</dt>
                    <dd>${subtotal.toLocaleString()}+</dd>
                  </div>
                </>
              )}
            </dl>
            <p className="mt-3 text-[11px] text-muted-foreground leading-relaxed">
              Shipping and applicable import duties/taxes are included in your total when required.{" "}
              <Link to="/shipping" className="underline hover:text-primary">Shipping details</Link>
            </p>
          </aside>
        </div>

      </main>
      <Footer />
    </div>
  );
}

function CheckoutLine({
  product,
  qty,
  onStock,
}: {
  product: Product;
  qty: number;
  onStock: (available: boolean) => void;
}) {
  const { data: stock } = useStock(product.vestiaireUrl, product.id);
  const available = stock ? stock.available : false;

  useEffect(() => onStock(available), [available, onStock]);

  return (
    <li className="flex items-center gap-3">
      <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-white">
        <img src={product.img} alt="" className="absolute inset-0 size-full object-contain" />
        {!available && product.vestiaireUrl && (
          <span className="absolute inset-0 grid place-items-center bg-background/55 text-[8px] tracking-luxe uppercase text-foreground">
            Sold
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px]">{product.name}</p>
        <p className="text-[11px] text-muted-foreground">
          Qty {qty}{!available && product.vestiaireUrl ? " · unavailable" : ""}
        </p>
      </div>
      <p className="text-[13px]">${(product.price * qty).toLocaleString()}</p>
    </li>
  );
}
