import ed1 from "@/assets/editorial-1.jpg";
import ed2 from "@/assets/editorial-2.jpg";

export function Editorial() {
  return (
    <section className="bg-background py-20 md:py-28">
      <div className="mx-auto grid max-w-[1480px] grid-cols-1 gap-8 px-5 md:grid-cols-12 md:gap-10 md:px-10">
        <div className="md:col-span-5">
          <img
            src={ed1}
            alt="Soft slip dress editorial"
            loading="lazy"
            className="aspect-[4/5] w-full rounded-2xl object-cover shadow-soft"
          />
        </div>
        <div className="flex flex-col justify-center md:col-span-4">
          <p className="text-[11px] tracking-luxe uppercase text-muted-foreground">
            The Journal — 04
          </p>
          <h2 className="mt-5 font-display text-4xl leading-[1.05] text-foreground md:text-6xl">
            The art of being <span className="font-script text-primary">hot.</span>
          </h2>
          <p className="mt-6 text-[15px] leading-relaxed text-muted-foreground">
            We write about the pieces that linger — a slip dress in honest light, the
            quiet weight of a vintage chain, an archive find that finally feels like
            yours. Soft, considered, expensive in a whisper.
          </p>
          <a
            href="#"
            className="mt-8 inline-flex w-fit items-center gap-2 border-b border-foreground/30 pb-1 text-[11px] tracking-luxe uppercase text-foreground transition-all hover:border-primary hover:text-primary"
          >
            Read the journal →
          </a>
        </div>
        <div className="md:col-span-3">
          <img
            src={ed2}
            alt="Chrome hoop earring editorial"
            loading="lazy"
            className="aspect-[3/4] w-full rounded-2xl object-cover shadow-soft md:mt-16"
          />
        </div>
      </div>
    </section>
  );
}
