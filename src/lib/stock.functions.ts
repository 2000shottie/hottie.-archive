import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type StockStatus = {
  available: boolean;
  source: "firecrawl" | "unknown";
  reason: string;
  checkedAt: string;
};

/**
 * Auto out-of-stock checker.
 * Fetches the source listing page via Firecrawl (Cloudflare blocks
 * direct server fetches) and looks for sold-out signals. Returns `available:false`
 * when the listing is sold, hidden, or no longer reachable.
 *
 * Requires a Firecrawl connection (FIRECRAWL_API_KEY env var).
 */
export const checkVestiaireStock = createServerFn({ method: "POST" })
  .inputValidator(z.object({ url: z.string().url() }))
  .handler(async ({ data }): Promise<StockStatus> => {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    const checkedAt = new Date().toISOString();

    if (!apiKey) {
      // No Firecrawl connected yet — assume available and surface the reason
      // in the UI so the seller knows to connect it.
      return {
        available: true,
        source: "unknown",
        reason: "Firecrawl not connected — stock check skipped.",
        checkedAt,
      };
    }

    try {
      const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: data.url,
          formats: ["markdown"],
          onlyMainContent: false,
          // The source site renders price / sold badge with JS — wait for it.
          waitFor: 4000,
        }),
      });

      if (!res.ok) {
        // Transient errors should NOT flip the product to sold out —
        // fail open so live items stay buyable when the scraper hiccups.
        return {
          available: true,
          source: "firecrawl",
          reason: `Could not verify stock (${res.status}) — assuming live.`,
          checkedAt,
        };
      }

      const json = (await res.json()) as {
        data?: { markdown?: string; metadata?: { statusCode?: number } };
        markdown?: string;
      };
      const markdown = (json.data?.markdown ?? json.markdown ?? "").toLowerCase();
      const statusCode = json.data?.metadata?.statusCode;

      // Definitive sold-out markers (JS-rendered — see waitFor above).
      // The product header replaces the price + "Add to bag" with "Sold at $X".
      const soldRegex =
        /\bsold at\b|this item has been sold|item is sold|no longer available|product not found|item sold out|out of stock/i;

      if (statusCode === 404 || soldRegex.test(markdown)) {
        return {
          available: false,
          source: "firecrawl",
          reason: "This listing has been marked as sold.",
          checkedAt,
        };
      }

      return {
        available: true,
        source: "firecrawl",
        reason: "Listing is live.",
        checkedAt,
      };
    } catch (err) {
      // Fail open on network errors so live pieces stay buyable.
      return {
        available: true,
        source: "firecrawl",
        reason: `Could not verify stock: ${err instanceof Error ? err.message : "unknown"} — assuming live.`,
        checkedAt,
      };
    }
  });
