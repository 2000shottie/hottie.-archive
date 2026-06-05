import { Link } from "@tanstack/react-router";


type FooterLink = { label: string; to: string; hash?: string };

export function Footer() {
  const columns: Array<{ t: string; links: FooterLink[] }> = [
    { t: "Shop", links: [
      { label: "New", to: "/new" },
      { label: "Bags", to: "/archive", hash: "bags" },
      { label: "Tops", to: "/archive", hash: "tops" },
      { label: "Bottoms", to: "/archive", hash: "bottoms" },
      { label: "Shoes", to: "/archive", hash: "shoes" },
      { label: "Jewelry", to: "/archive", hash: "jewelry" },
      { label: "Sunglasses", to: "/archive", hash: "eyewear" },
    ]},
    { t: "Care", links: [
      { label: "Shipping", to: "/shipping" },
      { label: "Authenticity", to: "/authenticity" },
      { label: "Contact", to: "/contact" },
    ]},
  ];
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-[1480px] px-5 py-16 md:px-10">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">

          {columns.map((c) => (
            <div key={c.t}>
              <p className="text-[10px] tracking-luxe uppercase text-foreground">{c.t}</p>
              <ul className="mt-4 space-y-2.5 text-[13px] text-muted-foreground">
                {c.links.map((i) => (
                  <li key={i.label}>
                    <Link
                      to={i.to}
                      hash={i.hash}
                      className="transition-colors hover:text-primary"
                    >
                      {i.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center gap-2 border-t border-border pt-10 text-center">
          <p className="font-script text-3xl text-foreground md:text-4xl">Have a question?</p>
          <Link
            to="/contact"
            className="text-[12px] tracking-luxe uppercase text-muted-foreground transition-colors hover:text-primary"
          >
            Contact us →
          </Link>
        </div>
        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-border pt-6 text-[11px] tracking-luxe uppercase text-muted-foreground md:flex-row md:items-center">
          <p>© {new Date().getFullYear()} Hottie. Archive — all rights reserved.</p>
          <p>Soft luxury for internet icons.</p>
        </div>

      </div>
    </footer>
  );
}
