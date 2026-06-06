import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/shipping")({
  head: () => ({
    meta: [
      { title: "Shipping — HOTTIE." },
      {
        name: "description",
        content:
          "Worldwide shipping with duties paid upfront. US flat $20, international 12–25% of subtotal with no surprise customs fees.",
      },
      { property: "og:title", content: "Shipping — HOTTIE." },
      {
        property: "og:description",
        content:
          "Worldwide shipping, duties included. No surprise customs bills at the door.",
      },
    ],
  }),
  component: ShippingPage,
});

const tiers: Array<{ region: string; rate: string; note: string }> = [
  { region: "United States", rate: "$20 flat", note: "Tracked, 3–4 weeks. Duties included." },
  { region: "Canada & Mexico", rate: "$20 flat", note: "Duties & taxes included." },
  { region: "Europe & UK", rate: "$20 flat", note: "VAT, duties & handling included." },
  { region: "Asia-Pacific & Middle East", rate: "$20 flat", note: "Duties & taxes included." },
  { region: "Rest of world", rate: "$20 flat", note: "Duties & taxes included." },
];

function ShippingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="mx-auto max-w-[900px] px-5 py-16 md:py-24">
        <p className="text-[11px] tracking-luxe uppercase text-muted-foreground">Care</p>
        <h1 className="mt-3 font-display text-5xl md:text-7xl">
          Ships <span className="font-script text-primary">worldwide</span>
        </h1>
        <p className="mt-6 max-w-[640px] text-[15px] leading-relaxed text-muted-foreground">
          Every HOTTIE piece is prepared with care and shipped with full tracking from our archive.
          For both U.S. &amp; international orders, all duties and taxes are prepaid. The price you see at checkout is the final price you pay, no customs invoices, import fees, or unexpected charges upon delivery.
        </p>

        <section className="mt-12">
          <h2 className="text-[11px] tracking-luxe uppercase">Rates &amp; transit</h2>
          <div className="mt-5 overflow-hidden rounded-2xl border border-border">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-blush/40 text-[11px] tracking-luxe uppercase text-foreground">
                <tr>
                  <th className="px-5 py-3 font-normal">Region</th>
                  <th className="px-5 py-3 font-normal">Rate</th>
                  <th className="hidden px-5 py-3 font-normal md:table-cell">Includes</th>
                </tr>
              </thead>
              <tbody>
                {tiers.map((t, i) => (
                  <tr key={t.region} className={i % 2 ? "bg-card" : "bg-background"}>
                    <td className="px-5 py-4 font-medium">{t.region}</td>
                    <td className="px-5 py-4">{t.rate}</td>
                    <td className="hidden px-5 py-4 text-muted-foreground md:table-cell">{t.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">
            Your exact total — including the duty calculation for your country — is shown
            in checkout before you pay.
          </p>
        </section>

        <section className="mt-14 grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="text-[11px] tracking-luxe uppercase">Transit time</h2>
            <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
              Each piece is individually sourced from our exclusive designer network.
              Please allow 3–4 weeks for U.S. &amp; international delivery.
              You&rsquo;ll receive tracking as soon as your order ships.
            </p>
          </div>
          <div>
            <h2 className="text-[11px] tracking-luxe uppercase">Final sale</h2>
            <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
              Every piece in the archive is one-of-one. All sales are final — no returns
              or exchanges. Reach out before you order if you have a question.
            </p>
            <Link
              to="/contact"
              className="mt-4 inline-block text-[11px] tracking-luxe uppercase text-foreground underline hover:text-primary"
            >
              Contact us →
            </Link>
          </div>
        </section>

        <div className="mt-16 border-t border-border pt-10 text-center">
          <Link
            to="/"
            className="inline-block rounded-full bg-foreground px-7 py-3.5 text-[11px] tracking-luxe uppercase text-background hover:bg-primary"
          >
            Back to the archive
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
