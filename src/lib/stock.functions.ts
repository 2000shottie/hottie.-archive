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
        // Pin to a consistent locale so we hit the same product page every time
        // (Vestiaire geo-redirects between regional mirrors otherwise).
        location: { country: "US", languages: ["en"] },
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
      data?: { markdown?: string; metadata?: { statusCode?: number; title?: string } };
      markdown?: string;
    };
    const markdown = (json.data?.markdown ?? json.markdown ?? "").toLowerCase();
    const statusCode = json.data?.metadata?.statusCode;
    const vestiaireProductId = getVestiaireProductId(url);

    // Definitive sold-out markers (JS-rendered — see waitFor above).
    // The product header replaces the price + "Add to bag" with "Sold at $X".
    const soldRegex =
      /\bsold at\b|this item has been sold|item is sold|no longer available|item sold out|out of stock/i;

    // Removed / unfindable listing markers.
    const removedRegex =
      /page not found|page you are looking for|couldn't find this page|couldn't find the page|product not found|this product is no longer|item no longer available|listing (?:is )?no longer available/i;

    // Vestiaire sometimes redirects delisted items to a category / search page
    // instead of returning a 404. Detect this by checking for category-page
    // signals (lots of results, sort/filter chrome) AND the absence of the
    // specific product id we asked for.
    const looksLikeCategoryPage =
      /\bresults\b[\s\S]{0,40}sort by|save this search|all filters/i.test(markdown);
    const productIdMissing =
      !!vestiaireProductId && !markdown.includes(vestiaireProductId);
    const redirectedAway = productIdMissing && looksLikeCategoryPage;

    if (
      statusCode === 404 ||
      soldRegex.test(markdown) ||
      removedRegex.test(markdown) ||
      redirectedAway
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
