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

  const SHIP_DOLLARS = 20;

  // Re-create the Stripe session whenever the cart changes.
  const itemsKey = lines.map((l) => `${l.product.id}:${l.qty}`).join("|");
  const lastKeyRef = useRef<string>("");

  const fetchClientSecret = async (): Promise<string> => {
    const result = await createSession({
      data: {
        items: lines.map((l) => ({
          priceId: l.product.id,
          quantity: l.qty,
          ...(l.product.originCountry ? { originCountry: l.product.originCountry } : {}),
        })),
        returnUrl: `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
        environment: getStripeEnvironment(),
      },
    });
    if ("error" in result) throw new Error(result.error);
    if (!result.clientSecret) throw new Error("No client secret returned");
    return result.clientSecret;
  };

  const [providerKey, setProviderKey] = useState(itemsKey);
  useEffect(() => {
    if (lastKeyRef.current !== itemsKey) {
      lastKeyRef.current = itemsKey;
      setProviderKey(itemsKey);
    }
  }, [itemsKey]);

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

        <div className="mt-8 px-1 space-y-3 max-w-[800px]">
          <p className="text-[13px] text-foreground/80 leading-relaxed">
            Each item is individually sourced from our exclusive network of designer collections. Please allow approximately 3–4 weeks for delivery.
          </p>
          <p className="text-[13px] text-foreground font-semibold leading-relaxed">
            Flat $20 shipping anywhere in the world, with all customs duties &amp; taxes already covered.
          </p>
          <p className="text-[13px] text-foreground leading-relaxed">
            ALL SALES ARE FINAL — NO RETURNS OR REFUNDS.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-10 md:grid-cols-[1.4fr,1fr]">
          <div className="order-2 md:order-1">
            {checkoutBlocked ? (
              <div className="rounded-2xl border border-border bg-card p-6 text-[13px] text-muted-foreground">
                One or more items in your bag are sold out. Remove them from your bag to continue.
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-card overflow-hidden min-h-[600px]">
                <EmbeddedCheckoutProvider
                  key={providerKey}
                  stripe={getStripe()}
                  options={{ fetchClientSecret }}
                >
                  <EmbeddedCheckout />
                </EmbeddedCheckoutProvider>
              </div>
            )}
          </div>


          <aside className="order-1 md:order-2 h-fit rounded-2xl border border-border/70 bg-blush/30 p-6 md:sticky md:top-24">
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
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Shipping (incl. duties &amp; taxes)</dt>
                <dd>${SHIP_DOLLARS.toLocaleString()}</dd>
              </div>
              <div className="flex justify-between font-display text-[16px] pt-2 border-t border-border">
                <dt>Total</dt>
                <dd>${(subtotal + SHIP_DOLLARS).toLocaleString()}</dd>
              </div>
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
    <li className="flex items-center gap-4">
      <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-white border border-border">
        <img src={product.img} alt={product.name} className="absolute inset-0 size-full object-contain" />
        {!available && product.vestiaireUrl && (
          <span className="absolute top-1 right-1 rounded-full bg-background/90 px-1.5 py-0.5 text-[8px] tracking-luxe uppercase text-foreground">
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
