---
name: stock-sync
description: Vestiaire stock sync — strict backend checker, product_stock cache, frontend reads cache only
type: feature
---
# Stock sync architecture (v2 — backend-driven, strict)

Mission-critical. Don't regress.

## Source of truth
- `public.product_stock` (product_id PK, available, reason, source, checked_at) — written ONLY by backend checker.
- `public.sold_products` — real paid orders (source='local'). Always overrides `product_stock` in `getStockMap`.
- `public.stock_check_log` — append-only history, pruned to 30 days each batch.

## Backend checker
- `src/lib/stock-checker.server.ts` — `.server.ts` extension so it can never be imported from client code.
- Calls Firecrawl with `waitFor: 4000`, `location: { country: "US" }`, 20s timeout, 1 retry on transient errors only (timeout / 5xx / 429).
- STRICT classifier: IN STOCK only when 200 + product ID in markdown + visible "add to bag"/"add to cart"/"make an offer" + no sold/removed text. Any other outcome (sold, redirect, empty page, blocked, Firecrawl error) = OUT OF STOCK. Never fail open.
- `checkAll()` runs sequentially with 1s gap between products, per-product try/catch so one bad URL never aborts the batch.

## Server fns (src/lib/stock-cache.functions.ts)
- `getStockMap()` — merges product_stock + sold_products into a single map. The frontend's only stock data source.
- `refreshStockInBackground()` — fire-and-forget trigger from page load. Internally rate-limited to once per 5 min per worker isolate + in-flight guard.
- `getRecentStockChecks()` — admin page reads this.

## Cron
- pg_cron job `hottie-stock-sync` runs every 10 min, POSTs to `https://project--404cf217-b92b-41fa-a8e4-4207aaff23bc.lovable.app/api/public/hooks/sync-stock`. Route imports `checkAll` dynamically.

## Frontend rule
- `useStock(url, productId)` reads ONLY from the cached map (`getStockMap`). Never calls Firecrawl from the browser. Same call signature as before — every product card still needs the productId arg.
- `__root.tsx` fires `refreshStockInBackground()` once per session via sessionStorage flag.

## Adding a new product
- Add to `src/lib/products.ts` with a `vestiaireUrl`. The next cron tick (or page load) will populate its row in `product_stock`. No manual step.

## Do not
- Do not write to `product_stock` from the client.
- Do not import `stock-checker.server.ts` from any `.tsx` / route file.
- Do not bring back "fail open on Firecrawl error" — strict mode is intentional.
