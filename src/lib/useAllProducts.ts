/**
 * Returns hardcoded products merged with published DB-imported products.
 * DB products appear first (newest), then the hardcoded archive.
 */
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { products as hardcoded, type Product } from "@/lib/products";
import { listPublishedProducts } from "@/lib/products.functions";

export function useAllProducts(): { data: Product[]; isLoading: boolean } {
  const fetchPublished = useServerFn(listPublishedProducts);
  const q = useQuery({
    queryKey: ["published-products"],
    queryFn: () => fetchPublished(),
    staleTime: 60_000,
    placeholderData: (prev) => prev ?? [],
  });
  const db = (q.data ?? []) as Product[];
  // De-dupe by id (hardcoded id vs db slug). DB items win if collision.
  const seen = new Set(db.map((p) => p.id));
  const merged = [...db, ...hardcoded.filter((p) => !seen.has(p.id))];
  return { data: merged, isLoading: q.isLoading };
}

export function useProductById(id: string | undefined): Product | undefined {
  const { data } = useAllProducts();
  if (!id) return undefined;
  return data.find((p) => p.id === id);
}
