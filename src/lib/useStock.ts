import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { checkVestiaireStock, type StockStatus } from "@/lib/stock.functions";

/**
 * Polls the Vestiaire listing every 5 minutes and refetches on window focus.
 * Fails closed while loading so stale/unchecked stock can never be purchased.
 */
export function useStock(url: string | undefined) {
  const check = useServerFn(checkVestiaireStock);
  return useQuery<StockStatus>({
    queryKey: ["stock", url],
    enabled: !!url,
    queryFn: () => check({ data: { url: url! } }),
    refetchInterval: 1000 * 60,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    staleTime: 0,
    placeholderData: url
      ? {
          available: false,
          source: "unknown",
          reason: "Checking Vestiaire stock…",
          checkedAt: new Date().toISOString(),
        }
      : undefined,
  });
}
