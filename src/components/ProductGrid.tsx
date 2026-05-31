import bagBlack from "@/assets/p-bag-black.png";
import bagPink from "@/assets/p-bag-pink.png";
import bagWhite from "@/assets/p-bag-white.png";
import sun1 from "@/assets/p-sunglasses.png";
import sun2 from "@/assets/p-sunglasses-2.png";
import heels from "@/assets/p-heels.png";
import necklace from "@/assets/p-necklace.png";

type Product = {
  id: string;
  name: string;
  house: string;
  price: number;
  img: string;
  tag?: string;
  swatch: string;
};

const products: Product[] = [
  { id: "1", name: "Quilted Mini Shoulder", house: "Maison BLNCGA", price: 1480, img: bagBlack, tag: "Just In", swatch: "oklch(0.92 0.045 12)" },
  { id: "2", name: "Cat-Eye Acetate Frames", house: "Saint Lila", price: 320, img: sun1, swatch: "oklch(0.86 0.005 250)" },
  { id: "3", name: "Powder Top-Handle Mini", house: "Roma Atelier", price: 1240, img: bagPink, tag: "Archive", swatch: "oklch(0.92 0.045 12)" },
  { id: "4", name: "Chrome Stiletto 95", house: "Vega Studio", price: 690, img: heels, swatch: "oklch(0.95 0.012 20)" },
  { id: "5", name: "Heavy Curb Choker", house: "Atelier Onze", price: 280, img: necklace, swatch: "oklch(0.86 0.005 250)" },
  { id: "6", name: "Ivory Raffia Micro", house: "Côte Maison", price: 560, img: bagWhite, tag: "New", swatch: "oklch(0.95 0.012 20)" },
  { id: "7", name: "Tortoise Rectangle Frames", house: "Saint Lila", price: 360, img: sun2, swatch: "oklch(0.92 0.045 12)" },
  { id: "8", name: "Quilted Mini — Noir", house: "Maison BLNCGA", price: 1480, img: bagBlack, swatch: "oklch(0.86 0.005 250)" },
];

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
  return (
    <button type="button" className="group block w-full text-left">
      <div
        className="relative aspect-square overflow-hidden rounded-2xl"
        style={{ background: `linear-gradient(160deg, ${product.swatch}, white 75%)` }}
      >
        {product.tag && (
          <span className="absolute left-3 top-3 z-10 rounded-full glass px-2.5 py-1 text-[9px] tracking-luxe uppercase text-foreground">
            {product.tag}
          </span>
        )}
        <button
          aria-label="Wishlist"
          className="absolute right-3 top-3 z-10 grid size-8 place-items-center rounded-full glass text-foreground/70 opacity-0 transition-all hover:text-primary group-hover:opacity-100"
        >
          ♡
        </button>
        <img
          src={product.img}
          alt={product.name}
          loading="lazy"
          width={1024}
          height={1024}
          className="absolute inset-0 size-full object-contain p-6 transition-all duration-700 ease-out group-hover:scale-105 group-hover:-translate-y-1 md:p-10"
          style={{ filter: "drop-shadow(0 30px 25px rgb(0 0 0 / 0.12))" }}
        />
        <div className="absolute inset-x-3 bottom-3 translate-y-3 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          <button className="w-full rounded-full bg-foreground/90 py-2.5 text-[10px] tracking-luxe uppercase text-background backdrop-blur transition-colors hover:bg-primary">
            Quick Add
          </button>
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
    </a>
  );
}
