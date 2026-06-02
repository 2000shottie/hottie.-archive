import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getProduct, products } from "@/lib/products";
import { useCart } from "@/lib/cart";
import { useStock } from "@/lib/useStock";

export const Route = createFileRoute("/product/$id")({
  loader: ({ params }) => {
    const product = getProduct(params.id);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.product.name} — HOTTIE.` : "HOTTIE." },
      {
        name: "description",
        content: loaderData?.product.description ?? "A curated piece from the HOTTIE archive.",
      },
    ],
  }),
  notFoundComponent: () => (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="mx-auto max-w-[800px] px-5 py-32 text-center">
        <p className="text-[11px] tracking-luxe uppercase text-muted-foreground">404</p>
        <h1 className="mt-4 font-display text-5xl">Piece not found.</h1>
        <Link to="/" className="mt-8 inline-block text-[11px] tracking-luxe uppercase text-primary">
          ← Back to the edit
        </Link>
      </main>
      <Footer />
    </div>
  ),
  errorComponent: () => (
    <div className="p-10 text-center">Something went wrong.</div>
  ),
  component: ProductPage,
});

function ProductPage() {
  const { product } = Route.useLoaderData();
  const more = products.filter((p) => p.id !== product.id).slice(0, 4);
  const { add } = useCart();
  const navigate = useNavigate();
  const { data: stock } = useStock(product.vestiaireUrl, product.id);
  const soldOut = stock ? !stock.available : false;

  const images = [product.img, ...(product.gallery ?? [])];
  const [activeIdx, setActiveIdx] = useState(0);
  const activeImg = images[activeIdx] ?? product.img;
  const isMainShot = activeIdx === 0;

  const onAdd = (then?: "checkout") => {
    if (soldOut) {
      toast.error("Sorry — this piece just sold.");
      return;
    }
    add(product, 1);
    if (then === "checkout") {
      navigate({ to: "/checkout" });
    } else {
      toast.success(`${product.name} added to your bag ♡`, {
        action: { label: "View bag", onClick: () => navigate({ to: "/cart" }) },
      });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <div className="mx-auto max-w-[1480px] px-5 pt-6 md:px-10">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-[11px] tracking-luxe uppercase text-foreground/60 transition-colors hover:text-primary"
          >
            ← The Edit
          </Link>
        </div>

        <section className="mx-auto grid max-w-[1480px] grid-cols-1 gap-10 px-5 pb-16 pt-8 md:grid-cols-2 md:gap-16 md:px-10 md:pb-24 md:pt-12">
          <div className="flex flex-col gap-3">
            <div
              className="relative aspect-square w-full overflow-hidden rounded-2xl md:rounded-[28px]"
              style={{ background: `linear-gradient(160deg, ${product.swatch}, white 78%)` }}
            >
              {product.tag && (
                <span className="absolute left-4 top-4 z-10 rounded-full glass px-3 py-1.5 text-[10px] tracking-luxe uppercase text-foreground">
                  {product.tag}
                </span>
              )}
              {soldOut && (
                <span className="absolute right-4 top-4 z-20 rounded-full bg-foreground px-3 py-1.5 text-[10px] tracking-luxe uppercase text-background shadow-soft">
                  Sold out
                </span>
              )}
              <img
                src={activeImg}
                alt={product.name}
                className="absolute inset-0 size-full object-contain p-4 md:p-6"
                style={isMainShot ? { filter: "drop-shadow(0 40px 30px rgb(0 0 0 / 0.14))" } : undefined}
              />

            </div>

            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2 md:gap-3">
                {images.map((src, i) => {
                  const isActive = i === activeIdx;
                  const thumbMain = i === 0;
                  return (
                    <button
                      key={src + i}
                      type="button"
                      onClick={() => setActiveIdx(i)}
                      aria-label={`View photo ${i + 1}`}
                      className={`relative aspect-square overflow-hidden rounded-xl border transition-all ${
                        isActive
                          ? "border-foreground/70 shadow-soft"
                          : "border-border/60 opacity-80 hover:opacity-100"
                      }`}
                      style={{ background: `linear-gradient(160deg, ${product.swatch}, white 78%)` }}
                    >
                      <img
                        src={src}
                        alt=""
                        className="absolute inset-0 size-full object-contain p-2"
                      />

                    </button>
                  );
                })}
              </div>
            )}
          </div>


          <div className="flex flex-col justify-center">
            <p className="text-[11px] tracking-luxe uppercase text-muted-foreground">
              {product.house}
            </p>
            <h1 className="mt-3 font-display text-4xl leading-tight md:text-6xl">
              {product.name}
            </h1>
            <p className="mt-5 font-display text-2xl text-foreground">
              ${product.price.toLocaleString()}
            </p>

            <p className="mt-8 max-w-md text-[15px] leading-relaxed text-muted-foreground">
              {product.description ??
                "A softly styled, hand-picked piece from the HOTTIE archive. One of one — once it's gone, it's gone."}
            </p>

            {product.vestiaireUrl && (
              <p className="mt-4 text-[11px] tracking-luxe uppercase text-muted-foreground">
                {soldOut ? "● Sold out" : "● In stock"}
              </p>
            )}

            <div className="mt-10 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => onAdd()}
                disabled={soldOut}
                className="rounded-full bg-foreground px-7 py-4 text-[11px] tracking-luxe uppercase text-background transition-all hover:bg-primary hover:shadow-soft disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-foreground"
              >
                {soldOut ? "Sold Out" : "Add to Bag"}
              </button>
              <button
                type="button"
                onClick={() => onAdd("checkout")}
                disabled={soldOut}
                className="rounded-full border border-foreground/20 px-7 py-4 text-[11px] tracking-luxe uppercase text-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
              >
                Buy it now →
              </button>
            </div>

            <dl className="mt-10 grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 border-t border-border/70 pt-6 text-[12px]">
              {product.details?.map((d: { label: string; value: string }) => (
                <div key={d.label} className="contents">
                  <dt className="text-muted-foreground">{d.label}</dt>
                  <dd className="text-foreground">{d.value}</dd>
                </div>
              ))}
              <dt className="text-muted-foreground">Shipping</dt>
              <dd className="text-foreground">Worldwide, tracked · 3–4 weeks</dd>
              <dt className="text-muted-foreground">Returns</dt>
              <dd className="text-foreground">No returns or refunds</dd>
              <dt className="text-muted-foreground">Authenticity</dt>
              <dd className="text-foreground">Hand-checked</dd>
            </dl>
          </div>
        </section>

        <section className="bg-blush/30 py-16 md:py-24">
          <div className="mx-auto max-w-[1480px] px-5 md:px-10">
            <h2 className="mb-10 font-display text-3xl md:text-4xl">
              You might also <span className="font-script text-primary">love</span>
            </h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6">
              {more.map((p) => (
                <Link
                  key={p.id}
                  to="/product/$id"
                  params={{ id: p.id }}
                  className="group block"
                >
                  <div
                    className="relative aspect-square overflow-hidden rounded-2xl"
                    style={{ background: `linear-gradient(160deg, ${p.swatch}, white 75%)` }}
                  >
                    <img
                      src={p.img}
                      alt={p.name}
                      className="absolute inset-0 size-full object-contain p-6 transition-transform duration-700 group-hover:scale-105 md:p-10"
                      style={{ filter: "drop-shadow(0 30px 25px rgb(0 0 0 / 0.12))" }}
                    />
                  </div>
                  <p className="mt-3 truncate text-[12px] text-foreground">{p.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    ${p.price.toLocaleString()}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
