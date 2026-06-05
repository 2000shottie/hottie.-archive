import { Search, ShoppingBag, User, Home, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import hottieLogo from "@/assets/hottie-signature-uploaded.png.asset.json";



export function Navbar() {
  const links = [
    { label: "New", to: "/new" },
    { label: "Bags", to: "/archive", hash: "bags" },
    { label: "Tops", to: "/archive", hash: "tops" },
    { label: "Bottoms", to: "/archive", hash: "bottoms" },
    { label: "Shoes", to: "/archive", hash: "shoes" },
    { label: "Jewelry", to: "/archive", hash: "jewelry" },
    { label: "Sunglasses", to: "/archive", hash: "eyewear" },
    { label: "Contact", to: "/contact" },
  ];
  const { count, lines, subtotal, remove } = useCart();
  const [bagOpen, setBagOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header
      className={`sticky top-0 z-50 backdrop-blur-md transition-all duration-300 ${
        scrolled
          ? "bg-transparent border-b border-transparent"
          : "bg-blush-light/90 border-b border-blush/30"
      }`}
    >
      <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-4 px-5 md:px-10">
        <Link
          to="/"
          aria-label="Hottie — home"
          className="flex shrink-0 items-center"
        >
          <img
            src={hottieLogo.url}
            alt="Hottie"
            className="h-24 w-auto md:h-32"
          />
        </Link>
        <nav className="hidden items-center gap-7 text-[11px] tracking-luxe uppercase text-foreground/70 md:flex">
          {links.map((l) => (
            <Link
              key={l.label}
              to={l.to}
              hash={l.hash}
              className="transition-colors hover:text-primary"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center justify-end gap-4 text-foreground/70">
          <button aria-label="Search" className="hidden transition-colors hover:text-primary md:block">
            <Search className="size-[18px]" strokeWidth={1.4} />
          </button>
          <Link to="/contact" aria-label="Account" className="hidden transition-colors hover:text-primary md:block">
            <User className="size-[18px]" strokeWidth={1.4} />
          </Link>
          <Link to="/" aria-label="Home" className="transition-colors hover:text-primary">
            <Home className="size-[26px]" strokeWidth={1.4} />
          </Link>
          <Popover open={bagOpen} onOpenChange={setBagOpen}>
            <PopoverTrigger asChild>
              <button aria-label="Bag" className="flex items-center gap-1.5 transition-colors hover:text-primary">
                <ShoppingBag className="size-[26px]" strokeWidth={1.4} />
                <span className="text-[12px] tracking-luxe uppercase">({count})</span>
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              sideOffset={12}
              className="w-[340px] max-w-[calc(100vw-24px)] p-0 border-border bg-card shadow-soft"
            >
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <h3 className="text-[11px] tracking-luxe uppercase">Your bag ({count})</h3>
              </div>
              {lines.length === 0 ? (
                <div className="px-5 pb-6 text-center">
                  <p className="text-[13px] text-muted-foreground">Your bag is empty.</p>
                  <Link
                    to="/"
                    onClick={() => setBagOpen(false)}
                    className="mt-3 inline-block text-[11px] tracking-luxe uppercase text-foreground hover:text-primary"
                  >
                    Continue browsing →
                  </Link>
                </div>
              ) : (
                <>
                  <ul className="max-h-[60vh] overflow-y-auto border-t border-border divide-y divide-border">
                    {lines.map(({ product, qty }) => (
                      <li key={product.id} className="flex items-center gap-3 px-5 py-3">
                        <Link
                          to="/product/$id"
                          params={{ id: product.id }}
                          onClick={() => setBagOpen(false)}
                          className="relative size-16 shrink-0 overflow-hidden rounded-md bg-white border border-border"
                        >
                          <img
                            src={product.img}
                            alt={product.name}
                            className="absolute inset-0 size-full object-contain"
                          />
                        </Link>
                        <div className="min-w-0 flex-1">
                          <Link
                            to="/product/$id"
                            params={{ id: product.id }}
                            onClick={() => setBagOpen(false)}
                            className="block truncate text-[13px] hover:text-primary"
                          >
                            {product.name}
                          </Link>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            Qty {qty} · ${(product.price * qty).toLocaleString()}
                          </p>
                        </div>
                        <button
                          aria-label={`Remove ${product.name}`}
                          onClick={() => remove(product.id)}
                          className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        >
                          <X className="size-4" strokeWidth={1.6} />
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="border-t border-border px-5 py-4">
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>${subtotal.toLocaleString()}</span>
                    </div>
                    <Link
                      to="/cart"
                      onClick={() => setBagOpen(false)}
                      className="mt-3 block w-full rounded-full bg-foreground py-3 text-center text-[11px] tracking-luxe uppercase text-background hover:bg-primary transition-colors"
                    >
                      View bag &amp; checkout
                    </Link>
                  </div>
                </>
              )}
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </header>
  );
}
