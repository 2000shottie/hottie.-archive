import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { checkVestiaireStock, type StockStatus } from "@/lib/stock.functions";

/**
 * Polls the Vestiaire listing every 5 minutes and refetches on window focus.
 * Returns `{ available: true }` while loading so UI stays optimistic.
 */
export function useStock(url: string | undefined) {
  const check = useServerFn(checkVestiaireStock);
  return useQuery<StockStatus>({
    queryKey: ["stock", url],
    enabled: !!url,
    queryFn: () => check({ data: { url: url! } }),
    refetchInterval: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
    staleTime: 1000 * 60 * 2,
    initialData: url
      ? {
          available: true,
          source: "unknown",
          reason: "Checking…",
          checkedAt: new Date().toISOString(),
        }
      : undefined,
  });
}
