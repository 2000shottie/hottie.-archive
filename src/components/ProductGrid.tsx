import { Link } from "@tanstack/react-router";
import { products, type Product } from "@/lib/products";
import { useStock } from "@/lib/useStock";
import { ProductQuickActions } from "@/components/ProductQuickActions";

export function ProductGrid() {
  return (
    <section id="shop" className="bg-background py-20 md:py-28">
      <div className="mx-auto max-w-[1480px] px-5 md:px-10">
        <div className="mb-12 flex items-end justify-between">
          <div>
            <p className="text-[11px] tracking-luxe uppercase text-muted-foreground">
              The Edit
            </p>
            <h2 className="mt-3 font-display text-4xl text-foreground md:text-6xl">
              Featured <span className="font-script text-primary">pieces</span>
            </h2>
          </div>
          <a
            href="#"
            className="hidden text-[11px] tracking-luxe uppercase text-foreground/70 transition-colors hover:text-primary md:inline-block"
          >
            View all →
          </a>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-4 md:gap-x-6 md:gap-y-16">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductCard({ product }: { product: Product }) {
  const { data: stock } = useStock(product.vestiaireUrl, product.id);
  const soldOut = stock ? !stock.available : false;
  return (
    <Link
      to="/product/$id"
      params={{ id: product.id }}
      className="group block w-full text-left"
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
        <span
          aria-label="Wishlist"
          className="absolute right-3 top-3 z-10 grid size-8 place-items-center rounded-full glass text-foreground/70 opacity-0 transition-all hover:text-primary group-hover:opacity-100"
        >
          ♡
        </span>
        <img
          src={product.img}
          alt={product.name}
          loading="lazy"
          width={1024}
          height={1024}
          className="absolute inset-0 size-full object-contain transition-all duration-700 ease-out group-hover:scale-105 group-hover:-translate-y-1"
        />
        <div className="absolute inset-x-3 bottom-3 translate-y-3 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          <span className="block w-full rounded-full bg-foreground/90 py-2.5 text-center text-[10px] tracking-luxe uppercase text-background backdrop-blur">
            View Piece
          </span>
        </div>
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
      <ProductQuickActions product={product} soldOut={soldOut} />
    </Link>
  );
}
