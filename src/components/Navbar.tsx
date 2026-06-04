import { Search, Heart, ShoppingBag, User } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useCart } from "@/lib/cart";
import hottieLogo from "@/assets/hottie-signature.png.asset.json";


export function Navbar() {
  const links = [
    { label: "New", to: "/new" },
    { label: "Bags", to: "/#shop" },
    { label: "Sunglasses", to: "/#shop" },
    { label: "Jewelry", to: "/#shop" },
    { label: "Shoes", to: "/#shop" },
    { label: "Contact", to: "/contact" },
  ];
  const { count } = useCart();
  return (
    <header className="sticky top-0 z-50 glass border-b border-border/60">
      <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-6 px-5 py-4 md:px-10">
        <Link to="/" aria-label="Hottie — home" className="flex shrink-0 items-center">
          <img
            src={hottieLogo.url}
            alt="Hottie"
            className="h-10 w-auto md:h-12"
          />
        </Link>
        <nav className="hidden flex-1 items-center justify-center gap-7 text-[11px] tracking-luxe uppercase text-foreground/70 md:flex">
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



        <div className="flex flex-1 items-center justify-end gap-4 text-foreground/70">
          <button aria-label="Search" className="hidden transition-colors hover:text-primary md:block">
            <Search className="size-[18px]" strokeWidth={1.4} />
          </button>
          <Link to="/contact" aria-label="Account" className="hidden transition-colors hover:text-primary md:block">
            <User className="size-[18px]" strokeWidth={1.4} />
          </Link>
          <Link to="/cart" aria-label="Wishlist" className="transition-colors hover:text-primary">
            <Heart className="size-[18px]" strokeWidth={1.4} />
          </Link>
          <Link to="/cart" aria-label="Bag" className="flex items-center gap-1.5 transition-colors hover:text-primary">
            <ShoppingBag className="size-[18px]" strokeWidth={1.4} />
            <span className="text-[11px] tracking-luxe uppercase">({count})</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
