# Project Memory

## Core
A product is sold-out if `product_stock.available` is false OR a row exists in `public.sold_products`. Frontend reads ONLY from `getStockMap()` — never call Firecrawl from the browser. Always call `useStock(product.vestiaireUrl, product.id)`.
Vestiaire stock is mission-critical & STRICT: backend checker (`src/lib/stock-checker.server.ts`) is the only writer. IN STOCK only when Firecrawl returns 200 + product ID in markdown + visible buy button. Any other outcome (sold, redirect, empty, blocked, timeout, error, missing buy button) = OUT OF STOCK. Never fail open. pg_cron `hottie-stock-sync` refreshes every 5 min; `__root.tsx` also fires a non-blocking refresh on page load.
Sold-out UI: keep image fully viewable, show small "Sold out" pill in top-right corner, disable purchase buttons. Never blur/overlay the whole image.
Product images: ONLY real Vestiaire/user-uploaded photos. ALWAYS composite every image onto SOLID WHITE SQUARE canvas — the image file itself must be square with white padding, not just CSS. In the UI, the square image MUST fill the product frame edge-to-edge — NO padding (no p-6/p-10), NO inset, NO drop-shadow filter that makes it look like a floating inner square. Use ONLY `absolute inset-0 size-full object-contain` on the img with white bg on the frame. NEVER crop, NEVER object-cover. Apply this to every product grid (home, archive, new, related). NEVER AI-generate fashion items or invent details.
When user uploads product photos: first image = hero, rest = gallery in exact order. Save all as PNG composited on white. Gallery MUST match hero pixel dimensions (VW bag 1586x1586, Dior tee 1379x1379, D&G cami 1379x1379) AND match hero's subject scale: detect non-white bbox, scale larger dim to ≈71% of canvas, center on white. Tops/tees use raw uploaded photos (no AI edits) — only square+white fill + scale-match.
BRAND-IMAGE INTEGRITY: Never mix photos from one brand into another brand's listing. Each listing's hero and gallery must come from the same physical item the user uploaded. When in doubt, ask before merging or replacing photos across listings.

## Memories
- [Stock sync architecture](mem://features/stock-sync) — v2 backend-driven strict checker, product_stock cache, cron, frontend reads cache only
- [Image sizing rule](mem://design/image-sizing) — Gallery images match hero dimensions per product
