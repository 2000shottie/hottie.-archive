import { Link } from "@tanstack/react-router";

const SUPPORT_EMAIL = "a2000shottie@hotmail.com";

export function Footer() {
  const columns = [
    { t: "Shop", links: [
      { label: "New", to: "/#shop" as const },
      { label: "Bags", to: "/#shop" as const },
      { label: "Sunglasses", to: "/#shop" as const },
      { label: "Jewelry", to: "/#shop" as const },
      { label: "Shoes", to: "/#shop" as const },
    ]},
    { t: "Studio", links: [
      { label: "Journal", to: "/#editorial" as const },
      { label: "Lookbook", to: "/#editorial" as const },
      { label: "Stylist Notes", to: "/#editorial" as const },
    ]},
    { t: "Care", links: [
      { label: "Shipping", to: "/contact" as const },
      { label: "Authenticity", to: "/contact" as const },
      { label: "Returns", to: "/contact" as const },
      { label: "Contact", to: "/contact" as const },
    ]},
  ];
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-[1480px] px-5 py-16 md:px-10">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
          <div className="col-span-2">
            <p className="font-script text-5xl text-foreground">
              Hottie<span className="text-primary">.</span>
            </p>
            <p className="mt-4 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
              Letters from the archive, soft drops, and quiet sales. Once a week, never more.
            </p>
            <form
              className="mt-5 flex max-w-sm items-center gap-2 rounded-full border border-border bg-card p-1.5 pl-5"
              onSubmit={(e) => {
                e.preventDefault();
                const input = e.currentTarget.querySelector("input") as HTMLInputElement | null;
                if (input?.value) {
                  input.value = "";
                  import("sonner").then(({ toast }) => toast.success("Subscribed ♡"));
                }
              }}
            >
              <input
                type="email"
                required
                placeholder="your@email"
                className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
              />
              <button type="submit" className="rounded-full bg-foreground px-5 py-2 text-[10px] tracking-luxe uppercase text-background transition-colors hover:bg-primary">
                Subscribe
              </button>
            </form>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="mt-5 inline-block text-[12px] text-muted-foreground hover:text-primary"
            >
              {SUPPORT_EMAIL}
            </a>
          </div>
          {columns.map((c) => (
            <div key={c.t}>
              <p className="text-[10px] tracking-luxe uppercase text-foreground">{c.t}</p>
              <ul className="mt-4 space-y-2.5 text-[13px] text-muted-foreground">
                {c.links.map((i) =>
                  i.to.startsWith("/#") ? (
                    <li key={i.label}>
                      <a href={i.to} className="transition-colors hover:text-primary">{i.label}</a>
                    </li>
                  ) : (
                    <li key={i.label}>
                      <Link to={i.to} className="transition-colors hover:text-primary">{i.label}</Link>
                    </li>
                  ),
                )}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-14 flex flex-col items-start justify-between gap-3 border-t border-border pt-6 text-[11px] tracking-luxe uppercase text-muted-foreground md:flex-row md:items-center">
          <p>© {new Date().getFullYear()} Hottie. Archive — all rights reserved.</p>
          <p>Soft luxury for internet icons.</p>
        </div>
      </div>
    </footer>
  );
}
