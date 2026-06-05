import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/authenticity")({
  head: () => ({
    meta: [
      { title: "Authenticity — HOTTIE." },
      {
        name: "description",
        content:
          "Every piece in the HOTTIE. archive is 100% authentic — sourced through our trusted network and independently verified before it ships.",
      },
      { property: "og:title", content: "Authenticity — HOTTIE." },
      {
        property: "og:description",
        content:
          "Triple-checked authenticity. Sourced, expert-verified, and delivered with paperwork.",
      },
    ],
  }),
  component: AuthenticityPage,
});

const steps: Array<{ n: string; t: string; d: string }> = [
  {
    n: "01",
    t: "Sourced from trusted resellers",
    d: "Every piece is hand-picked from trusted resellers with strong reputations and verified histories.",
  },
  {
    n: "02",
    t: "Expert-authenticated",
    d: "Before shipping, items pass through our authentication team — luxury specialists who inspect stitching, hardware, serials, and provenance.",
  },
  {
    n: "03",
    t: "Final HOTTIE. review",
    d: "We do a second visual check on arrival. If anything feels off, it never reaches you — full stop.",
  },
  {
    n: "04",
    t: "Delivered with paperwork",
    d: "Your order ships with the authentication certificate and original tags or dust bag when available.",
  },
];

function AuthenticityPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="mx-auto max-w-[900px] px-5 py-16 md:py-24">
        <p className="text-[11px] tracking-luxe uppercase text-muted-foreground">Care</p>
        <h1 className="mt-3 font-display text-5xl md:text-7xl">
          100% <span className="font-script text-primary">authentic</span>
        </h1>
        <p className="mt-6 max-w-[60ch] text-[15px] leading-relaxed text-muted-foreground">
          The archive is small on purpose. Every bag, top, pair of shoes and piece of
          jewelry has been authenticated by our expert team before
          it lands in your hands — and checked again by us. No fakes. No "inspired by."
          No grey-market guessing.
        </p>

        <div className="mt-14 space-y-8">
          {steps.map((s) => (
            <div
              key={s.n}
              className="flex flex-col gap-2 border-t border-border pt-6 md:flex-row md:gap-10"
            >
              <p className="font-display text-3xl text-primary md:w-24">{s.n}</p>
              <div>
                <h2 className="font-display text-xl text-foreground md:text-2xl">{s.t}</h2>
                <p className="mt-2 max-w-[55ch] text-[14px] leading-relaxed text-muted-foreground">
                  {s.d}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-2xl border border-border bg-card p-6 md:p-10">
          <p className="font-script text-3xl text-foreground md:text-4xl">
            Still unsure?
          </p>
          <p className="mt-3 max-w-[55ch] text-[14px] leading-relaxed text-muted-foreground">
            Reach out before you buy and we'll send extra photos, serial details, or
            condition notes — whatever you need to feel confident.
          </p>
          <Link
            to="/contact"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-[11px] tracking-luxe uppercase text-background transition-opacity hover:opacity-90"
          >
            Contact us →
          </Link>
        </div>

        <div className="mt-12">
          <Link
            to="/archive"
            className="text-[11px] tracking-luxe uppercase text-muted-foreground transition-colors hover:text-primary"
          >
            ← Back to archive
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
