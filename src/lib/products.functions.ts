/**
 * Public-facing product list helpers.
 * Returns DB-imported published products in a shape compatible with the
 * hardcoded `Product` type so they can be merged into the site grid.
 */

import { createServerFn } from "@tanstack/react-start";
import type { Product, Category } from "@/lib/products";

export const listPublishedProducts = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: products } = await supabaseAdmin
    .from("products")
    .select("*")
    .eq("status", "published")
    .order("listed_at", { ascending: false });
  if (!products?.length) return [] as Product[];

  const ids = products.map((p) => p.id);
  const { data: imgs } = await supabaseAdmin
    .from("product_images")
    .select("*")
    .in("product_id", ids)
    .order("position");
  const byProduct = new Map<string, typeof imgs>();
  (imgs ?? []).forEach((img) => {
    const arr = byProduct.get(img.product_id) ?? [];
    arr.push(img);
    byProduct.set(img.product_id, arr);
  });

  return products.map<Product>((p) => {
    const images = byProduct.get(p.id) ?? [];
    const hero = images[0]?.processed_url ?? "";
    const gallery = images.slice(1).map((i) => i.processed_url);
    return {
      id: p.slug,
      name: p.name,
      house: p.house,
      price: p.price,
      img: hero,
      swatch: "#f5f3ee",
      category: (p.category as Category) ?? "tops",
      tag: p.tag ?? undefined,
      description: p.description ?? undefined,
      details: [
        p.size ? { label: "Size", value: p.size } : null,
        p.condition ? { label: "Condition", value: p.condition } : null,
      ].filter(Boolean) as { label: string; value: string }[],
      gallery,
      vestiaireUrl: p.vestiaire_url ?? undefined,
      listedAt: p.listed_at,
      originCountry: p.seller_country ?? undefined,
    };
  });
});
