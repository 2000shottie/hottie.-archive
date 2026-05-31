import ed1 from "@/assets/editorial-1.jpg";
import ed2 from "@/assets/editorial-2.jpg";
import bagPink from "@/assets/p-bag-pink.png";
import sun1 from "@/assets/p-sunglasses.png";
import heels from "@/assets/p-heels.png";

const collections = [
  { title: "Off Duty", count: 24, kind: "image", img: ed1, tone: "oklch(0.95 0.03 12)" },
  { title: "It Girl Bags", count: 38, kind: "product", img: bagPink, tone: "oklch(0.93 0.05 14)" },
  { title: "Hot Girl Sunglasses", count: 19, kind: "product", img: sun1, tone: "oklch(0.92 0.012 250)" },
  { title: "Soft Luxury", count: 41, kind: "image", img: ed2, tone: "oklch(0.93 0.05 18)" },
  { title: "Designer Essentials", count: 56, kind: "product", img: heels, tone: "oklch(0.96 0.005 250)" },
  { title: "Archive Girl", count: 12, kind: "text", img: "", tone: "oklch(0.88 0.07 14)" },
];

export function Collections() {
  return (
    <section id="archive" className="bg-gradient-blush py-20 md:py-28">
      <div className="mx-auto max-w-[1480px] px-5 md:px-10">
        <div className="mb-14 max-w-2xl">
          <p className="text-[11px] tracking-luxe uppercase text-foreground/60">Curated</p>
          <h2 className="mt-3 font-display text-4xl text-foreground md:text-6xl">
            Collections <span className="font-script text-primary">— a moodboard</span>
          </h2>
        </div>

        <div className="grid auto-rows-[220px] grid-cols-2 gap-3 md:auto-rows-[280px] md:grid-cols-4 md:gap-5">
          {collections.map((c, i) => (
            <a
              key={c.title}
              href="#"
              className={[
                "group relative overflow-hidden rounded-2xl transition-all hover:shadow-soft",
                i === 0 ? "md:col-span-2 md:row-span-2" : "",
                i === 3 ? "md:col-span-2" : "",
              ].join(" ")}
              style={{ background: c.tone }}
            >
              {c.kind === "image" && (
                <img
                  src={c.img}
                  alt={c.title}
                  loading="lazy"
                  className="absolute inset-0 size-full object-cover transition-transform duration-[1200ms] group-hover:scale-105"
                />
              )}
              {c.kind === "product" && (
                <img
                  src={c.img}
                  alt={c.title}
                  loading="lazy"
                  className="absolute inset-0 size-full object-contain p-10 transition-transform duration-700 group-hover:-translate-y-2 group-hover:scale-105"
                  style={{ filter: "drop-shadow(0 30px 30px rgb(0 0 0 / 0.15))" }}
                />
              )}
              {c.kind === "text" && (
                <div className="flex h-full items-center justify-center p-6">
                  <p className="font-script text-center text-4xl text-primary-foreground md:text-5xl">
                    archive girl
                  </p>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/30 via-transparent to-transparent opacity-60" />
              <div className="absolute inset-x-4 bottom-4 flex items-end justify-between text-white">
                <div>
                  <p className="text-[10px] tracking-luxe uppercase opacity-80">
                    {c.count} pieces
                  </p>
                  <h3 className="mt-1 font-display text-2xl md:text-3xl">{c.title}</h3>
                </div>
                <span className="rounded-full glass px-3 py-1.5 text-[10px] tracking-luxe uppercase text-foreground opacity-0 transition-opacity group-hover:opacity-100">
                  Open →
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
