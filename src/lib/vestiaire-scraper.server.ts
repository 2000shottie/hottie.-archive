/**
 * Scrapes a Vestiaire Collective product listing via Firecrawl.
 * Returns the structured fields + the list of original image URLs.
 * Server-only.
 */

export type ScrapedProduct = {
  title: string;
  brand: string;
  price: number;            // USD (rounded)
  currency: string;
  description: string;
  size?: string;
  condition?: string;
  sellerCountry?: string;
  available: boolean;
  vestiaireId?: string;
  images: string[];         // ordered, deduped, full-size when possible
};

const FIRECRAWL = "https://api.firecrawl.dev/v2/scrape";

function extractVestiaireId(url: string): string | undefined {
  return url.match(/-(\d+)\.shtml(?:$|[?#])/)?.[1];
}

function upgradeImage(u: string): string {
  // Vestiaire image CDN paths often include a size segment like
  // /produit/.../<id>_1.jpg or .../produit_1_xxx.jpg. Try to keep originals
  // as-is — the CDN supports very large versions natively.
  return u.split("?")[0];
}

export async function scrapeVestiaireProduct(url: string): Promise<ScrapedProduct> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) throw new Error("FIRECRAWL_API_KEY missing");

  const schema = {
    type: "object",
    properties: {
      title: { type: "string" },
      brand: { type: "string" },
      price_usd: { type: "number", description: "Total price in US dollars as a number, no currency symbol." },
      currency: { type: "string" },
      description: { type: "string" },
      size: { type: "string" },
      condition: { type: "string" },
      seller_country: { type: "string" },
      available: { type: "boolean", description: "True if the listing is still buyable (visible Add to bag / Make an offer button)." },
      images: {
        type: "array",
        description: "All product photo URLs in the order they appear in the listing gallery, largest resolution.",
        items: { type: "string" },
      },
    },
    required: ["title", "brand", "price_usd", "images"],
  };

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 45_000);
  let json: any;
  try {
    const res = await fetch(FIRECRAWL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        url,
        formats: [{ type: "json", schema, prompt: "Extract the Vestiaire Collective product details. images = every product photo URL from the gallery, largest version available." }, "markdown"],
        onlyMainContent: false,
        waitFor: 5000,
        location: { country: "US", languages: ["en"] },
      }),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`firecrawl_${res.status}`);
    json = await res.json();
  } finally {
    clearTimeout(timer);
  }

  const data = json?.data ?? json;
  const extracted = data?.json ?? {};
  const markdown: string = (data?.markdown ?? "").toString();

  // Fallback: pull image URLs from markdown if structured extraction missed them
  let images: string[] = Array.isArray(extracted.images) ? extracted.images.filter(Boolean) : [];
  if (images.length === 0) {
    const re = /https?:\/\/[^\s)\]]*vestiairecollective\.com\/produit[^\s)\]]+\.(?:jpg|jpeg|png|webp)/gi;
    images = Array.from(new Set(markdown.match(re) ?? []));
  }
  images = Array.from(new Set(images.map(upgradeImage)));

  if (images.length === 0) {
    throw new Error("Could not find any product images on this listing.");
  }

  const title = (extracted.title ?? "").toString().trim();
  const brand = (extracted.brand ?? "").toString().trim();
  if (!title || !brand) throw new Error("Could not extract product title or brand.");

  const price = Math.max(0, Math.round(Number(extracted.price_usd ?? 0)));

  return {
    title,
    brand,
    price,
    currency: (extracted.currency ?? "USD").toString().toUpperCase(),
    description: (extracted.description ?? "").toString().trim(),
    size: extracted.size ? String(extracted.size).trim() : undefined,
    condition: extracted.condition ? String(extracted.condition).trim() : undefined,
    sellerCountry: extracted.seller_country ? String(extracted.seller_country).trim() : undefined,
    available: extracted.available !== false,
    vestiaireId: extractVestiaireId(url),
    images,
  };
}
