import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { checkVestiaireStock, type StockStatus } from "@/lib/stock.functions";
import { getSoldProductIds } from "@/lib/sold.functions";

/**
 * Returns the set of product IDs sold through this site.
 * Refetches on focus so the grid updates after a checkout in another tab.
 */
export function useLocallySoldIds() {
  const fetchIds = useServerFn(getSoldProductIds);
  return useQuery<string[]>({
    queryKey: ["sold-products"],
    queryFn: () => fetchIds(),
    refetchInterval: 1000 * 60,
    refetchOnWindowFocus: true,
    staleTime: 1000 * 30,
    placeholderData: [],
  });
}

/**
 * Polls the Vestiaire listing AND merges in the locally-sold list.
 * A piece is "available" only when Vestiaire says so AND it hasn't been
 * sold through this site. Defaults to available while loading.
 */
export function useStock(url: string | undefined, productId?: string) {
  const check = useServerFn(checkVestiaireStock);
  const stockQuery = useQuery<StockStatus>({
    queryKey: ["stock", url],
    enabled: !!url,
    queryFn: () => check({ data: { url: url! } }),
    refetchInterval: 1000 * 60 * 5,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 1000 * 60,
    placeholderData: {
      available: true,
      source: "unknown",
      reason: "Checking Vestiaire stock…",
      checkedAt: new Date().toISOString(),
    },
  });

  const soldQuery = useLocallySoldIds();
  const soldLocally = !!productId && (soldQuery.data ?? []).includes(productId);

  const base = stockQuery.data ?? {
    available: true,
    source: "unknown" as const,
    reason: "Checking stock…",
    checkedAt: new Date().toISOString(),
  };

  const merged: StockStatus = soldLocally
    ? {
        available: false,
        source: base.source,
        reason: "Sold through HOTTIE.",
        checkedAt: base.checkedAt,
      }
    : base;

  return { ...stockQuery, data: merged };
}
