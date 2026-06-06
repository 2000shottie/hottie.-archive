
# Backend-driven Vestiaire stock system

Today the site checks Vestiaire from the user's browser every time a product card renders. That is slow, rate-limit-prone, and the recent attempt to relax it made false-live results possible. This replaces it with a cached, backend-owned system.

## End state

- A `product_stock` table is the **single source of truth** for whether each Vestiaire piece is buyable.
- The frontend reads from this table — instant, no Firecrawl calls in the browser path.
- A backend checker re-verifies every Vestiaire URL on a schedule and on page load (non-blocking).
- The rule flips to **strict**: anything that isn't a clean "live + buyable" answer = OUT OF STOCK.
- Every check writes a log row so you can see *when* and *why* an item was marked.

## Data model

New tables (via migration):

**`public.product_stock`** — latest known status per product
- `product_id` (PK) — matches `src/lib/products.ts`
- `available` boolean
- `reason` text — short human-readable explanation
- `checked_at` timestamptz
- `source` text — `'vestiaire'` | `'local-sale'`
- `consecutive_failures` int — used for backoff

**`public.stock_check_log`** — append-only history (last ~30 days)
- `id`, `product_id`, `available`, `reason`, `status_code`, `duration_ms`, `checked_at`

Both are publicly readable (no PII). Only the server role writes.

## Backend checker

`src/lib/stock-checker.server.ts` (server-only):

- `checkOne(product)` — calls Firecrawl with `waitFor: 4000`, US locale, 20s timeout, 1 retry on transient failure (network error, 5xx, 429). Strict classifier:
  - **IN STOCK** only if: 200 response AND product ID present in markdown AND an explicit "Add to bag" / "Make an offer" / price block is rendered AND no sold/removed text.
  - **OUT OF STOCK** for everything else: sold text, 404, redirect off product, missing buy button, empty page, repeated timeouts, Firecrawl error, blocked, etc.
- `checkAll()` — runs sequentially with a 1s gap between products to stay polite with Firecrawl, writes results into `product_stock` and appends to `stock_check_log`. Wrapped in per-product try/catch so one bad URL never aborts the batch.

## Endpoints and server functions

- `getStockMap()` — server fn, returns `{ [productId]: { available, reason, checkedAt } }`. Merges `product_stock` with `sold_products` (any row in `sold_products` forces out-of-stock).
- `refreshStockInBackground()` — server fn, fires `checkAll()` without awaiting and returns immediately. Called once per session from the root layout.
- `POST /api/public/hooks/sync-stock` — existing route, now calls the new `checkAll()`. Used by cron.

## Scheduling

`pg_cron` job (every 10 min) hits `/api/public/hooks/sync-stock`. This is the primary refresh path; the on-load background trigger is a backup so a fresh visitor still gets near-live data even if cron lagged.

## Frontend changes

- `useStock` is rewritten to **read from the cached map**, no per-card Firecrawl call. One `getStockMap()` query feeds every product card.
- `__root.tsx` fires `refreshStockInBackground()` once per session (non-blocking) so a page reload triggers a refresh without delaying render.
- All product grids (home, /new, /archive, /product/:id, related) continue calling `useStock(product.vestiaireUrl, product.id)` — same signature, new internals.
- The admin sync page keeps its manual "Re-run detection" button and now also shows `checked_at` + `reason` per product from the new tables.

## Logging & visibility

- Every check writes a row in `stock_check_log`.
- Admin sync page surfaces the latest log entries per product.
- Server logs include product id, duration, status code, and classification reason for every check.

## Migration / backfill

- After the migration runs, the first cron tick (or the first page load) populates `product_stock` for every product with a Vestiaire URL.
- Existing `sold_products` entries (real paid orders) stay authoritative and continue to override.

## Files touched

Created:
- migration: `product_stock`, `stock_check_log` (+ grants, RLS)
- `src/lib/stock-checker.server.ts` — strict classifier + batch runner
- `src/lib/stock-cache.functions.ts` — `getStockMap`, `refreshStockInBackground`
- pg_cron schedule via supabase insert tool

Edited:
- `src/lib/stock.functions.ts` — thin wrapper that delegates to the new checker
- `src/lib/stock-sync.functions.ts` — uses new `checkAll()`
- `src/lib/useStock.ts` — reads from cached map only
- `src/routes/api/public/hooks/sync-stock.ts` — calls new batch runner
- `src/routes/__root.tsx` — one-shot background refresh trigger
- `src/routes/admin.sync.tsx` — show last-checked / reason per product
- `mem://features/stock-sync` + `mem://index.md` — update rules to "strict = uncertain is OOS, frontend reads cache only"

## Notes / tradeoffs

- Strict mode means a Firecrawl outage will flip everything to OOS until the next successful check. This is what you asked for ("any uncertainty = OUT OF STOCK") and is the safe direction for an e-commerce site — better to lose a sale than to take payment for a piece you can't ship.
- Firecrawl usage stays bounded: ~9 products × 6 checks/hour = ~54 calls/hour, well inside normal plan limits.
