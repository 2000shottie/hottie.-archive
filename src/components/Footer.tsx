import { Link } from "@tanstack/react-router";


type FooterLink = { label: string; to: string; hash?: string };
type FooterGroup = { label: string; links: FooterLink[] };
type FooterColumn = { t: string; items: Array<FooterLink | FooterGroup> };

export function Footer() {
  const columns: FooterColumn[] = [
    { t: "Shop", items: [
      { label: "New", to: "/new" },
      { label: "Bags", to: "/archive", hash: "bags" },
      { label: "Tops", to: "/archive", hash: "tops" },
      { label: "Bottoms", to: "/archive", hash: "bottoms" },
      { label: "Shoes", to: "/archive", hash: "shoes" },
      { label: "Jewelry", to: "/archive", hash: "jewelry" },
      { label: "Sunglasses", to: "/archive", hash: "eyewear" },
    ]},
    { t: "Care", items: [
      { label: "Shipping", to: "/shipping" },
      { label: "Authenticity", to: "/authenticity" },
      { label: "Support", links: [
        { label: "Contact", to: "/contact" },
      ]},
    ]},
  ];

  const renderItem = (item: FooterLink | FooterGroup, index: number) => {
    if ("links" in item) {
      return (
        <li key={item.label} className={index > 0 ? "mt-3" : ""}>
          <p className="text-[10px] font-semibold tracking-luxe uppercase text-foreground">{item.label}</p>
          <ul className="mt-2 space-y-2">
            {item.links.map((link) => (
              <li key={link.label}>
                <Link
                  to={link.to}
                  hash={link.hash}
                  className="transition-colors hover:text-primary"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </li>
      );
    }
    return (
      <li key={item.label}>
        <Link
          to={item.to}
          hash={item.hash}
          className="transition-colors hover:text-primary"
        >
          {item.label}
        </Link>
      </li>
    );
  };

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-[1480px] px-5 py-16 md:px-10">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">

          {columns.map((c) => (
            <div key={c.t}>
              <p className="text-[10px] font-semibold tracking-luxe uppercase text-foreground">{c.t}</p>
              <ul className="mt-5 space-y-3.5 text-[13px] text-muted-foreground">
                {c.items.map(renderItem)}
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
          <p>© {new Date().getFullYear()} Hottie. — all rights reserved.</p>
        </div>

      </div>
    </footer>
  );
}
