import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type StockStatus = {
  available: boolean;
  source: "firecrawl" | "unknown";
  reason: string;
  checkedAt: string;
};

export function isConfirmedLiveStock(status: StockStatus): boolean {
  return status.available && status.source === "firecrawl" && status.reason === "Listing is live.";
}

function getVestiaireProductId(url: string): string | undefined {
  return url.match(/-(\d+)\.shtml(?:$|[?#])/)?.[1];
}

export async function fetchVestiaireStockStatus(url: string): Promise<StockStatus> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  const checkedAt = new Date().toISOString();

  if (!apiKey) {
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
        url,
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
    const sourceText = markdown;
    const statusCode = json.data?.metadata?.statusCode;
    const title = json.data?.metadata?.title?.toLowerCase() ?? "";
    const vestiaireProductId = getVestiaireProductId(url);

    // Definitive sold-out markers (JS-rendered — see waitFor above).
    // The product header replaces the price + "Add to bag" with "Sold at $X".
    const soldRegex =
      /\bsold at\b|this item has been sold|item is sold|no longer available|item sold out|out of stock/i;

    // Removed / unfindable listing markers — Vestiaire often redirects
    // delisted items to a "page not found" or generic search page rather
    // than returning a 404. Treat these as sold so they disappear from buy flow.
    const removedRegex =
      /page not found|page you are looking for|couldn't find this page|couldn't find the page|product not found|this product is no longer|item no longer available|listing (?:is )?no longer available|oops[^a-z]{0,5}(?:this )?page/i;

    // A real Vestiaire product page is always thousands of chars of markdown.
    // If the page resolves but is suspiciously tiny, it's almost certainly
    // a redirect to an empty/not-found shell.
    const looksEmpty = markdown.trim().length < 400;
    const missingRequestedProduct =
      !!vestiaireProductId &&
      !sourceText.includes(vestiaireProductId) &&
      !/\badd to bag\b|\badd to cart\b|\bmake an offer\b/i.test(sourceText);
    const genericRedirect =
      missingRequestedProduct &&
      /buy \/ sell|vestiaire collective|handbag|shoes|clothing|accessories/.test(title);

    if (
      statusCode === 404 ||
      soldRegex.test(markdown) ||
      removedRegex.test(markdown) ||
      (looksEmpty && statusCode && statusCode >= 200 && statusCode < 400) ||
      genericRedirect
    ) {
      return {
        available: false,
        source: "firecrawl",
        reason: "This listing is no longer available.",
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
}

/**
 * Auto out-of-stock checker.
 * Fetches the source listing page via Firecrawl (Cloudflare blocks
 * direct server fetches) and looks for sold-out signals. Returns `available:false`
 * when the listing is sold, hidden, or no longer reachable.
 *
 * Requires a Firecrawl connection (FIRECRAWL_API_KEY env var).
 */
export const checkVestiaireStock = createServerFn({ method: "POST" })
  .inputValidator(z.object({ url: z.string().url(), productId: z.string().min(1).max(100).optional() }))
  .handler(async ({ data }): Promise<StockStatus> => {
    const status = await fetchVestiaireStockStatus(data.url);

    if (data.productId && status.source === "firecrawl") {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      if (!status.available) {
        const { error } = await supabaseAdmin
          .from("sold_products")
          .upsert({ product_id: data.productId, source: "vestiaire" }, { onConflict: "product_id" });
        if (error) console.error("checkVestiaireStock upsert sold_products error:", error);
      } else if (isConfirmedLiveStock(status)) {
        const { error } = await supabaseAdmin
          .from("sold_products")
          .delete()
          .eq("product_id", data.productId)
          .eq("source", "vestiaire");
        if (error) console.error("checkVestiaireStock unmark sold_products error:", error);
      }
    }

    return status;
  });
