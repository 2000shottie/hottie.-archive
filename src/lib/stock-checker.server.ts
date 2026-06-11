/**
 * Backend Vestiaire stock checker.
 *
 * Strict policy: a product is IN STOCK only when Firecrawl returns a clean,
 * fully-rendered product page with the right product ID and a visible buy
 * action. Anything else — sold marker, removal page, redirect, blocked,
 * timeout, Firecrawl 4xx/5xx, missing add-to-bag — is OUT OF STOCK.
 *
 * Server-only by file extension: must never be imported from client code.
 */

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { products, type Product } from "@/lib/products";

const FIRECRAWL_ENDPOINT = "https://api.firecrawl.dev/v2/scrape";
const FIRECRAWL_TIMEOUT_MS = 20_000;
const RETRY_DELAY_MS = 1_500;
const BETWEEN_REQUESTS_MS = 1_000;

export type CheckResult = {
  productId: string;
  available: boolean;
  reason: string;
  statusCode?: number;
  durationMs: number;
};

export type BatchResult = {
  ok: boolean;
  startedAt: string;
  finishedAt: string;
  totalChecked: number;
  inStock: number;
  outOfStock: number;
  results: CheckResult[];
  error?: string;
};

function vestiaireProductId(url: string): string | undefined {
  return url.match(/-(\d+)\.shtml(?:$|[?#])/)?.[1];
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function firecrawlOnce(
  url: string,
  apiKey: string,
): Promise<{ statusCode?: number; content: string; ok: boolean; error?: string }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FIRECRAWL_TIMEOUT_MS);
  try {
    const res = await fetch(FIRECRAWL_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown", "html"],
        onlyMainContent: false,
        waitFor: 4000,
        maxAge: 0,
        storeInCache: false,
        location: { country: "US", languages: ["en"] },
      }),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      return { ok: false, error: `firecrawl_${res.status}`, statusCode: res.status, content: "" };
    }
    const json = (await res.json()) as {
      data?: { html?: string; markdown?: string; metadata?: { statusCode?: number } };
    };
    const markdown = json.data?.markdown ?? "";
    const html = json.data?.html ?? "";
    return {
      ok: true,
      statusCode: json.data?.metadata?.statusCode,
      content: `${markdown}\n${html}`.toLowerCase(),
    };
  } catch (err) {
    const message =
      err instanceof Error
        ? err.name === "AbortError"
          ? "firecrawl_timeout"
          : err.message
        : "firecrawl_unknown_error";
    return { ok: false, error: message, content: "" };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Classify a Vestiaire page. Strict: any uncertainty → OUT OF STOCK.
 */
function classify(
  content: string,
  statusCode: number | undefined,
  productId: string | undefined,
): { available: boolean; reason: string } {
  if (statusCode === 404) return { available: false, reason: "Listing returned 404." };

  if (content.trim().length < 400) {
    return { available: false, reason: "Page response was empty or blocked." };
  }

  const soldRegex =
    /\bsold at\b|this item has been sold|item is sold|no longer available|item sold out|out of stock|seller on vacation|on vacation|seller is away|seller away|seller is currently away|away until|on holiday|seller holiday|temporarily unavailable|currently unavailable|purchase unavailable|cannot be purchased/i;
  if (soldRegex.test(content)) {
    return { available: false, reason: "Vestiaire marks this item as sold or unavailable." };
  }

  const removedRegex =
    /page not found|page you are looking for|couldn't find this page|couldn't find the page|product not found|listing (?:is )?no longer available/i;
  if (removedRegex.test(content)) {
    return { available: false, reason: "Listing has been removed." };
  }

  if (productId && !content.includes(productId)) {
    return { available: false, reason: "Page redirected away from this listing." };
  }

  // Firecrawl's markdown can merge adjacent button labels, e.g.
  // "add to bagmake an offer", so use direct phrase detection instead of
  // strict word-boundary regexes. Sold/removed markers above still win first.
  const hasBuyAction =
    content.includes("add to bag") ||
    content.includes("add to cart") ||
    content.includes("make an offer");
  if (!hasBuyAction) {
    return { available: false, reason: "No purchase button rendered on the listing." };
  }

  return { available: true, reason: "Listing is live and buyable." };
}

async function checkOne(product: Product): Promise<CheckResult> {
  const start = Date.now();
  const url = product.vestiaireUrl!;
  const productId = vestiaireProductId(url);
  const apiKey = process.env.FIRECRAWL_API_KEY;

  if (!apiKey) {
    return {
      productId: product.id,
      available: false,
      reason: "Stock checker not configured (missing FIRECRAWL_API_KEY).",
      durationMs: Date.now() - start,
    };
  }

  let attempt = await firecrawlOnce(url, apiKey);
  // Retry once on transient failures only (network / 5xx / 429 / timeout).
  const transient =
    !attempt.ok &&
    (attempt.error === "firecrawl_timeout" ||
      (attempt.statusCode !== undefined &&
        (attempt.statusCode >= 500 || attempt.statusCode === 429)) ||
      attempt.statusCode === undefined);
  if (transient) {
    await sleep(RETRY_DELAY_MS);
    attempt = await firecrawlOnce(url, apiKey);
  }

  if (!attempt.ok) {
    return {
      productId: product.id,
      available: false,
      reason: `Could not verify stock (${attempt.error ?? "unknown"}) — marked unavailable.`,
      statusCode: attempt.statusCode,
      durationMs: Date.now() - start,
    };
  }

  const verdict = classify(attempt.content, attempt.statusCode, productId);
  return {
    productId: product.id,
    available: verdict.available,
    reason: verdict.reason,
    statusCode: attempt.statusCode,
    durationMs: Date.now() - start,
  };
}

/**
 * Re-check every product with a Vestiaire URL, writing to product_stock
 * and stock_check_log. Sequential with a small gap between requests to
 * stay polite with Firecrawl.
 */
export async function checkAll(): Promise<BatchResult> {
  const startedAt = new Date().toISOString();
  const list = products.filter((p) => p.vestiaireUrl);
  const unmonitored = products.filter((p) => !p.vestiaireUrl);
  if (unmonitored.length > 0) {
    console.warn(
      `[stock-check] WARNING: ${unmonitored.length} product(s) have no vestiaireUrl and will NOT be monitored:`,
      unmonitored.map((p) => p.id).join(", "),
    );
  }
  const results: CheckResult[] = [];

  for (let i = 0; i < list.length; i++) {
    const product = list[i];
    let result: CheckResult;
    try {
      result = await checkOne(product);
    } catch (err) {
      result = {
        productId: product.id,
        available: false,
        reason: `Checker error: ${err instanceof Error ? err.message : "unknown"} — marked unavailable.`,
        durationMs: 0,
      };
    }
    results.push(result);

    const { error: upsertErr } = await supabaseAdmin.from("product_stock").upsert(
      {
        product_id: result.productId,
        available: result.available,
        reason: result.reason,
        source: "vestiaire",
        checked_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "product_id" },
    );
    if (upsertErr) console.error("product_stock upsert error", result.productId, upsertErr);

    const { error: logErr } = await supabaseAdmin.from("stock_check_log").insert({
      product_id: result.productId,
      available: result.available,
      reason: result.reason,
      status_code: result.statusCode ?? null,
      duration_ms: result.durationMs,
    });
    if (logErr) console.error("stock_check_log insert error", result.productId, logErr);

    console.log(
      `[stock-check] ${result.productId} ${result.available ? "IN" : "OUT"} (${result.statusCode ?? "?"}) ${result.durationMs}ms — ${result.reason}`,
    );

    if (i < list.length - 1) await sleep(BETWEEN_REQUESTS_MS);
  }

  // Prune log entries older than 30 days so the table stays small.
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  await supabaseAdmin.from("stock_check_log").delete().lt("checked_at", cutoff);

  const inStock = results.filter((r) => r.available).length;
  return {
    ok: true,
    startedAt,
    finishedAt: new Date().toISOString(),
    totalChecked: results.length,
    inStock,
    outOfStock: results.length - inStock,
    results,
  };
}
