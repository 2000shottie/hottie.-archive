import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { ProductGrid } from "@/components/ProductGrid";
import { Collections } from "@/components/Collections";
import { Editorial } from "@/components/Editorial";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HOTTIE. — Soft Luxury for Internet Icons" },
      {
        name: "description",
        content:
          "A curated designer fashion archive. Bags, sunglasses, jewelry & shoes — softly styled, authenticated, shipped in silk.",
      },
      { property: "og:title", content: "HOTTIE. — Soft Luxury for Internet Icons" },
      {
        property: "og:description",
        content: "Curated like a moodboard. For girls with expensive taste.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <Hero />
        <ProductGrid />
        <Collections />
        <Editorial />
      </main>
      <Footer />
    </div>
  );
}
