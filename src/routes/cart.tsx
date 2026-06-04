import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useCart } from "@/lib/cart";
import { useStock } from "@/lib/useStock";
import type { Product } from "@/lib/products";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Bag — HOTTIE." },
      { name: "description", content: "Your curated picks from the HOTTIE archive." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { lines, setQty, remove, subtotal, count } = useCart();
  const shipping = subtotal > 0 ? 20 : 0;
  const total = subtotal + shipping;
  const [soldIds, setSoldIds] = useState<Record<string, boolean>>({});
  const hasSoldOut = useMemo(
    () => lines.some(({ product }) => !!product.vestiaireUrl && soldIds[product.id] !== false),
    [lines, soldIds],
  );
  const reportSold = (id: string, sold: boolean) =>
    setSoldIds((prev) => (prev[id] === sold ? prev : { ...prev, [id]: sold }));


  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="mx-auto max-w-[1100px] px-5 py-12 md:px-10 md:py-20">
        <p className="text-[11px] tracking-luxe uppercase text-muted-foreground">Your Bag</p>
        <h1 className="mt-3 font-display text-4xl md:text-6xl">
          The <span className="font-script text-primary">edit</span>, in your bag.
        </h1>

        {count === 0 ? (
          <div className="mt-16 rounded-2xl border border-border/70 bg-blush/30 p-12 text-center">
            <p className="font-script text-3xl text-foreground">find something hot.</p>
            <p className="mt-3 text-[14px] text-muted-foreground">
              Pick a piece you like from the edit.
            </p>
            <Link
              to="/"
              className="mt-8 inline-block rounded-full bg-foreground px-7 py-3.5 text-[11px] tracking-luxe uppercase text-background transition-colors hover:bg-primary"
            >
              Browse The Edit
            </Link>
          </div>
        ) : (
          <div className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-[1.6fr,1fr]">
            <ul className="divide-y divide-border/70">
              {lines.map(({ product, qty }) => (
                <CartLine
                  key={product.id}
                  product={product}
                  qty={qty}
                  onQty={(q) => setQty(product.id, q)}
                  onRemove={() => remove(product.id)}
                  onStock={(sold) => reportSold(product.id, sold)}
                />
              ))}
            </ul>

            <aside className="h-fit rounded-2xl border border-border/70 bg-blush/30 p-6 md:sticky md:top-24">
              <h2 className="text-[11px] tracking-luxe uppercase text-foreground">Summary</h2>
              <dl className="mt-5 space-y-3 text-[13px]">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd className="text-foreground">${subtotal.toLocaleString()}</dd>
                </div>

                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Shipping</dt>
                  <dd className="text-foreground">${shipping}</dd>
                </div>
                <div className="flex justify-between border-t border-border pt-3 font-display text-[16px]">
                  <dt>Total</dt>
                  <dd>${total.toLocaleString()}</dd>
                </div>
              </dl>
              <p className="mt-5 text-[11px] leading-relaxed text-muted-foreground">
                Each piece is individually sourced — please allow approximately 3–4 weeks for delivery.
                All sales are final. No returns or refunds.
              </p>
              {hasSoldOut && (
                <p className="mt-4 rounded-xl bg-foreground/5 px-3 py-2 text-[11px] text-foreground/80">
                  Checking availability — any sold pieces must be removed before checkout.
                </p>
              )}
              {hasSoldOut ? (
                <button
                  type="button"
                  disabled
                  className="mt-4 block w-full rounded-full bg-foreground/40 py-3.5 text-center text-[11px] tracking-luxe uppercase text-background"
                >
                  Sold out
                </button>
              ) : (
                <Link
                  to="/checkout"
                  className="mt-4 block w-full rounded-full bg-foreground py-3.5 text-center text-[11px] tracking-luxe uppercase text-background transition-colors hover:bg-primary"
                >
                  Checkout →
                </Link>
              )}
              <Link
                to="/"
                className="mt-3 block text-center text-[11px] tracking-luxe uppercase text-foreground/60 hover:text-primary"
              >
                Keep shopping
              </Link>
            </aside>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

function CartLine({
  product,
  qty,
  onQty,
  onRemove,
  onStock,
}: {
  product: Product;
  qty: number;
  onQty: (q: number) => void;
  onRemove: () => void;
  onStock: (sold: boolean) => void;
}) {
  const { data: stock } = useStock(product.vestiaireUrl, product.id);
  const soldOut = stock ? !stock.available : false;
  // Notify parent so the checkout button can react.
  useEffect(() => onStock(soldOut), [onStock, soldOut]);
  return (
    <li className="flex gap-4 py-6">
      <Link
        to="/product/$id"
        params={{ id: product.id }}
        className="relative block size-24 shrink-0 overflow-hidden rounded-xl md:size-32"
        style={{ background: `linear-gradient(160deg, ${product.swatch}, white 78%)` }}
      >
        <img src={product.img} alt={product.name} className="size-full object-contain p-3" />
        {soldOut && (
          <span className="absolute right-1 top-1 rounded-full bg-foreground px-2 py-0.5 text-[8px] tracking-luxe uppercase text-background">
            Sold
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col justify-between">
        <div>
          <p className="text-[10px] tracking-luxe uppercase text-muted-foreground">{product.house}</p>
          <Link
            to="/product/$id"
            params={{ id: product.id }}
            className="mt-1 line-clamp-2 text-[14px] text-foreground hover:text-primary"
          >
            {product.name}
          </Link>
          {soldOut && (
            <p className="mt-1 text-[10px] tracking-luxe uppercase text-foreground/70">
              Just sold — remove to continue
            </p>
          )}
        </div>
        <div className="flex items-end justify-between">
          <p className="text-[11px] tracking-luxe uppercase text-muted-foreground">
            One of one
          </p>
          <div className="text-right">
            <p className="font-display text-[16px] text-foreground">
              ${(product.price * qty).toLocaleString()}
            </p>
            <button
              type="button"
              onClick={onRemove}
              className="mt-1 text-[10px] tracking-luxe uppercase text-muted-foreground hover:text-primary"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}
