import { Link } from "@tanstack/react-router";
import hero from "@/assets/hero.jpg";
import bagPink from "@/assets/p-bag-pink.png";
import sunnies from "@/assets/p-sunglasses.png";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-soft">
      <div className="mx-auto grid max-w-[1480px] grid-cols-1 gap-8 px-5 pb-16 pt-10 md:grid-cols-12 md:gap-10 md:px-10 md:pb-24 md:pt-14">
        {/* Left: editorial copy */}
        <div className="order-2 flex flex-col justify-between md:order-1 md:col-span-5">
          <div className="animate-fade-up">
            <p className="text-[11px] tracking-luxe uppercase text-muted-foreground">
              Vol. 01 — Spring Archive
            </p>
            <h1 className="mt-6 font-display text-[56px] leading-[0.95] text-foreground md:text-[88px]">
              Hot garments for
              <span className="block font-script text-primary"> hot girls.</span>
            </h1>
            <p className="mt-6 max-w-md text-[15px] leading-relaxed text-muted-foreground">
              A curated collection of vintage designer pieces. Timeless, rare,
              uniquely sourced, and handpicked like a moodboard you can wear.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <a
                href="#shop"
                className="group inline-flex items-center gap-3 rounded-full bg-foreground px-7 py-3.5 text-[11px] tracking-luxe uppercase text-background transition-all hover:bg-primary hover:shadow-soft"
              >
                Shop New
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </a>
              <Link
                to="/archive"
                className="inline-flex items-center gap-3 rounded-full border border-foreground/20 px-7 py-3.5 text-[11px] tracking-luxe uppercase text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                Explore Archive
              </Link>
            </div>
          </div>

          <div className="mt-12 hidden grid-cols-3 gap-6 border-t border-border/70 pt-6 md:grid">
            {[
              ["Hand-picked", "Every piece, curated."],
              ["Worldwide", "Soft, tracked shipping."],
              ["The 1% edit", "Only what we'd wear."],
            ].map(([t, s]) => (
              <div key={t}>
                <p className="text-[10px] tracking-luxe uppercase text-foreground">{t}</p>
                <p className="mt-1 text-[12px] text-muted-foreground">{s}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: image with floating products */}
        <div className="relative order-1 md:order-2 md:col-span-7">
          <div className="relative aspect-[3/2] w-full overflow-hidden rounded-2xl bg-blush shadow-soft md:rounded-[28px]">
            <img
              src={hero}
              alt="Curated vintage designer flat lay"
              className="size-full object-cover object-center"
              width={1600}
              height={1067}
            />
            <div className="absolute left-5 top-5 rounded-full glass px-4 py-1.5 text-[10px] tracking-luxe uppercase text-foreground">
              Summer Drop
            </div>

          </div>

          {/* floating product chips */}
          <img
            src={bagPink}
            alt=""
            aria-hidden
            className="pointer-events-none absolute -left-6 bottom-10 hidden w-40 animate-float drop-shadow-2xl md:block"
          />
          <img
            src={sunnies}
            alt=""
            aria-hidden
            className="pointer-events-none absolute -right-4 top-10 hidden w-44 animate-float drop-shadow-2xl md:block"
            style={{ animationDelay: "1.5s" }}
          />
        </div>
      </div>

      {/* marquee */}
      <div className="overflow-hidden border-y border-border/70 bg-blush/40 py-4">
        <div className="flex w-max animate-marquee gap-14 whitespace-nowrap font-script text-3xl text-foreground/80">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center gap-14">
              {[
                "soft luxury",
                "★",
                "internet it-girl",
                "★",
                "archive only",
                "★",
                "hand-picked",
                "★",
                "model off-duty",
                "★",
                "expensive taste",
                "★",
              ].map((t, j) => (
                <span key={j}>{t}</span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
