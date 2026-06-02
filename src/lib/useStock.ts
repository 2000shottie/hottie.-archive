import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { checkVestiaireStock, type StockStatus } from "@/lib/stock.functions";

/**
 * Polls the Vestiaire listing and refetches on window focus.
 * Defaults to available while loading — we only mark a piece sold out
 * once Vestiaire has confirmed it.
 */
export function useStock(url: string | undefined) {
  const check = useServerFn(checkVestiaireStock);
  return useQuery<StockStatus>({
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
}
