import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getStockMap, type StockMap, type StockMapEntry } from "@/lib/stock-cache.functions";

/**
 * One shared query that loads the whole stock map. Every product card
 * subscribes to this — React Query dedupes so the network request only fires
 * once per refresh window.
 */
export function useStockMap() {
  const fetchMap = useServerFn(getStockMap);
  return useQuery<StockMap>({
    queryKey: ["stock-map"],
    queryFn: () => fetchMap(),
    // The backend cron + on-load refresh keep this fresh; the frontend just
    // re-reads every 30s and on focus so updates show without a hard reload.
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    staleTime: 15_000,
    placeholderData: (prev) => prev ?? {},
  });
}

/**
 * Sort products so buyable items appear first and sold-out items below.
 * Within each group, sort newest-to-oldest by `listedAt`.
 */
export function sortProductsByAvailability<T extends { id: string; listedAt: string }>(
  items: T[],
  stockMap: StockMap,
): T[] {
  return [...items].sort((a, b) => {
    const aEntry = stockMap[a.id];
    const bEntry = stockMap[b.id];
    const aAvailable = aEntry ? aEntry.available : true;
    const bAvailable = bEntry ? bEntry.available : true;

    if (aAvailable && !bAvailable) return -1;
    if (!aAvailable && bAvailable) return 1;

    return new Date(b.listedAt).getTime() - new Date(a.listedAt).getTime();
  });
}

/**
 * Returns the cached stock status for a single product. Strict default:
 * while the map is still loading and we have no entry yet, we treat the
 * product as available so the page doesn't flash "Sold out" before the
 * data arrives. Once an entry is present, we trust it.
 */
export function useStock(url: string | undefined, productId?: string) {
  const query = useStockMap();
  const entry: StockMapEntry | undefined = productId ? query.data?.[productId] : undefined;

  const data: StockMapEntry = entry ?? {
    available: true,
    reason: "Checking stock…",
    checkedAt: new Date().toISOString(),
  };

  return { ...query, data };
}

/**
 * Kept for back-compat with anything that imported the old helper.
 * Returns the list of product IDs currently marked unavailable.
 */
export function useLocallySoldIds() {
  const query = useStockMap();
  const data = Object.entries(query.data ?? {})
    .filter(([, v]) => !v.available)
    .map(([k]) => k);
  return { ...query, data };
}
