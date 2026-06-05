import { Search, ShoppingBag, User, Home } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useCart } from "@/lib/cart";
import hottieLogo from "@/assets/hottie-signature-transparent.png.asset.json";


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
  const { count } = useCart();
  return (
    <header className="sticky top-0 z-50 glass border-b border-border/60">
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
          {links.map((l) =>
            l.to.startsWith("/#") ? (
              <a key={l.label} href={l.to} className="transition-colors hover:text-primary">
                {l.label}
              </a>
            ) : (
              <Link key={l.label} to={l.to} className="transition-colors hover:text-primary">
                {l.label}
              </Link>
            ),
          )}
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
          <Link to="/cart" aria-label="Bag" className="flex items-center gap-1.5 transition-colors hover:text-primary">
            <ShoppingBag className="size-[26px]" strokeWidth={1.4} />
            <span className="text-[12px] tracking-luxe uppercase">({count})</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
