import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { products, CATEGORY_LABELS, type Category, type Product } from "@/lib/products";
import { useStock } from "@/lib/useStock";

const ORDER: Category[] = ["bags", "tops", "bottoms", "shoes", "jewelry", "eyewear"];

export const Route = createFileRoute("/archive")({
  head: () => ({
    meta: [
      { title: "Archive — HOTTIE." },
      {
        name: "description",
        content:
          "The full HOTTIE. archive, sorted by category — bags, tops, bottoms, shoes, jewelry and eyewear.",
      },
    ],
  }),
  component: ArchivePage,
});

function ArchivePage() {
  const grouped = ORDER.map((cat) => ({
    cat,
    items: products.filter((p) => p.category === cat),
  }));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="bg-gradient-soft">
        <section className="mx-auto max-w-[1480px] px-5 pb-10 pt-16 md:px-10 md:pb-14 md:pt-24">
          <p className="text-[11px] tracking-luxe uppercase text-muted-foreground">
            The Archive
          </p>
          <h1 className="mt-4 font-display text-5xl text-foreground md:text-7xl">
            Sorted by <span className="font-script text-primary">category</span>
          </h1>
          <nav className="mt-8 flex flex-wrap gap-2">
            {ORDER.map((c) => {
              const count = grouped.find((g) => g.cat === c)?.items.length ?? 0;
              return (
                <a
                  key={c}
                  href={`#${c}`}
                  className="rounded-full border border-foreground/15 px-4 py-2 text-[11px] tracking-luxe uppercase text-foreground/80 transition-colors hover:border-primary hover:text-primary"
                >
                  {CATEGORY_LABELS[c]} <span className="opacity-50">· {count}</span>
                </a>
              );
            })}
          </nav>
        </section>

        <div className="bg-background pb-24">
          {grouped.map(({ cat, items }) => (
            <section
              key={cat}
              id={cat}
              className="mx-auto max-w-[1480px] scroll-mt-24 px-5 py-12 md:px-10 md:py-16"
            >
              <div className="mb-8 flex items-end justify-between border-b border-border/70 pb-4">
                <h2 className="font-display text-3xl text-foreground md:text-5xl">
                  {CATEGORY_LABELS[cat]}
                </h2>
                <p className="text-[11px] tracking-luxe uppercase text-muted-foreground">
                  {items.length} {items.length === 1 ? "piece" : "pieces"}
                </p>
              </div>

              {items.length === 0 ? (
                <p className="py-12 text-center font-script text-2xl text-foreground/50">
                  coming soon —
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-4 md:gap-x-6 md:gap-y-16">
                  {items.map((p) => (
                    <ArchiveCard key={p.id} product={p} />
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function ArchiveCard({ product }: { product: Product }) {
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
