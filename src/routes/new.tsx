import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { products, type Product } from "@/lib/products";
import { useStock } from "@/lib/useStock";

type SortMode = "newest" | "price-desc" | "price-asc";

export const Route = createFileRoute("/new")({
  head: () => ({
    meta: [
      { title: "New Arrivals — HOTTIE." },
      {
        name: "description",
        content: "The latest drops from the HOTTIE. archive — newest pieces first.",
      },
    ],
  }),
  component: NewPage,
});

function NewPage() {
  const [sort, setSort] = useState<SortMode>("newest");

  const sorted = [...products].sort((a, b) => {
    if (sort === "price-asc") return a.price - b.price;
    if (sort === "price-desc") return b.price - a.price;
    return new Date(b.listedAt).getTime() - new Date(a.listedAt).getTime();
  });

  const label =
    sort === "newest"
      ? "newest first"
      : sort === "price-desc"
        ? "highest price first"
        : "lowest price first";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="bg-gradient-soft">
        <section className="mx-auto max-w-[1480px] px-5 pb-10 pt-16 md:px-10 md:pb-14 md:pt-24">
          <p className="text-[11px] tracking-luxe uppercase text-muted-foreground">
            New In
          </p>
          <h1 className="mt-4 font-display text-5xl text-foreground md:text-7xl">
            Fresh <span className="font-script text-primary">drops</span>
          </h1>
          <p className="mt-4 text-[11px] tracking-luxe uppercase text-muted-foreground">
            {sorted.length} {sorted.length === 1 ? "piece" : "pieces"} · {label}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="text-[10px] tracking-luxe uppercase text-muted-foreground">
              Sort by
            </span>
            {([
              { key: "newest", label: "Newest" },
              { key: "price-desc", label: "Price: High → Low" },
              { key: "price-asc", label: "Price: Low → High" },
            ] as { key: SortMode; label: string }[]).map((opt) => (
              <button
                key={opt.key}
                onClick={() => setSort(opt.key)}
                className={`rounded-full border px-3 py-1.5 text-[10px] tracking-luxe uppercase transition-colors ${
                  sort === opt.key
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-foreground/15 text-foreground/70 hover:border-primary hover:text-primary"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        <div className="bg-background pb-24">
          <section className="mx-auto max-w-[1480px] px-5 py-12 md:px-10 md:py-16">
            <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-4 md:gap-x-6 md:gap-y-16">
              {sorted.map((p) => (
                <NewCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}


function NewCard({ product }: { product: Product }) {
  const { data: stock } = useStock(product.vestiaireUrl, product.id);
  const soldOut = stock ? !stock.available : false;
  return (
    <Link
      to="/product/$id"
      params={{ id: product.id }}
      className={`group block w-full text-left ${soldOut ? "pointer-events-none" : ""}`}
    >
      <div
        className="relative aspect-square overflow-hidden rounded-2xl"
        style={{ background: "white" }}
      >
        {product.tag && !soldOut && (
          <span className="absolute left-3 top-3 z-10 rounded-full glass px-2.5 py-1 text-[9px] tracking-luxe uppercase text-foreground">
            {product.tag}
          </span>
        )}
        {soldOut && (
          <span className="absolute right-3 top-3 z-20 rounded-full bg-foreground px-2.5 py-1 text-[9px] tracking-luxe uppercase text-background shadow-md">
            Sold out
          </span>
        )}
        <img
          src={product.img}
          alt={product.name}
          loading="lazy"
          className="absolute inset-0 size-full object-contain transition-all duration-700 ease-out group-hover:scale-105 group-hover:-translate-y-1"
        />
      </div>
      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] tracking-luxe uppercase text-muted-foreground">
            {product.house}
          </p>
          <h3 className="mt-1 truncate text-[13px] text-foreground">{product.name}</h3>
        </div>
        <p className="shrink-0 font-display text-[15px] text-foreground">
          ${product.price.toLocaleString()}
        </p>
      </div>
    </Link>
  );
}
