export function Footer() {
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
            <form className="mt-5 flex max-w-sm items-center gap-2 rounded-full border border-border bg-card p-1.5 pl-5">
              <input
                type="email"
                placeholder="your@email"
                className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
              />
              <button className="rounded-full bg-foreground px-5 py-2 text-[10px] tracking-luxe uppercase text-background transition-colors hover:bg-primary">
                Subscribe
              </button>
            </form>
          </div>
          {[
            { t: "Shop", l: ["New", "Bags", "Sunglasses", "Jewelry", "Shoes"] },
            { t: "Studio", l: ["Journal", "Lookbook", "Stylist Notes"] },
            { t: "Care", l: ["Shipping", "Authenticity", "Returns", "Contact"] },
          ].map((c) => (
            <div key={c.t}>
              <p className="text-[10px] tracking-luxe uppercase text-foreground">{c.t}</p>
              <ul className="mt-4 space-y-2.5 text-[13px] text-muted-foreground">
                {c.l.map((i) => (
                  <li key={i}>
                    <a href="#" className="transition-colors hover:text-primary">{i}</a>
                  </li>
                ))}
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
