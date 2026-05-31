import { Search, Heart, ShoppingBag, User } from "lucide-react";

export function Navbar() {
  const links = ["New", "Bags", "Sunglasses", "Jewelry", "Shoes", "Archive"];
  return (
    <header className="sticky top-0 z-50 glass border-b border-border/60">
      <div className="mx-auto flex max-w-[1480px] items-center justify-between px-5 py-4 md:px-10">
        <nav className="hidden flex-1 items-center gap-7 text-[11px] tracking-luxe uppercase text-foreground/70 md:flex">
          {links.map((l) => (
            <a key={l} href="#" className="transition-colors hover:text-primary">
              {l}
            </a>
          ))}
        </nav>
        <a href="/" className="font-script text-[34px] leading-none text-foreground md:text-[40px]">
          Hottie<span className="text-primary">.</span>
        </a>
        <div className="flex flex-1 items-center justify-end gap-4 text-foreground/70">
          <button aria-label="Search" className="hidden transition-colors hover:text-primary md:block">
            <Search className="size-[18px]" strokeWidth={1.4} />
          </button>
          <button aria-label="Account" className="hidden transition-colors hover:text-primary md:block">
            <User className="size-[18px]" strokeWidth={1.4} />
          </button>
          <button aria-label="Wishlist" className="transition-colors hover:text-primary">
            <Heart className="size-[18px]" strokeWidth={1.4} />
          </button>
          <button aria-label="Bag" className="flex items-center gap-1.5 transition-colors hover:text-primary">
            <ShoppingBag className="size-[18px]" strokeWidth={1.4} />
            <span className="text-[11px] tracking-luxe uppercase">(0)</span>
          </button>
        </div>
      </div>
    </header>
  );
}
