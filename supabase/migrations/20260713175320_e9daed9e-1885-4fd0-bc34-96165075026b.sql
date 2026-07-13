
-- 1) products: restrict public reads to published rows
DROP POLICY IF EXISTS "Products readable by everyone" ON public.products;
CREATE POLICY "Published products readable by everyone"
  ON public.products FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

-- 2) product_images: only images for published products
DROP POLICY IF EXISTS "Product images readable by everyone" ON public.product_images;
CREATE POLICY "Images for published products readable by everyone"
  ON public.product_images FOR SELECT
  TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = product_images.product_id AND p.status = 'published'
  ));

-- 3) stock_check_log: remove public read
DROP POLICY IF EXISTS "Stock check log is publicly readable" ON public.stock_check_log;

-- 4) Store stock-sync secret in Vault and update pg_cron job
SELECT vault.create_secret(
  '9ec61ad3b5e98da13e1bcf90982750237a03e71548786db857590df1fad039b7',
  'stock_sync_secret',
  'Shared secret for the /api/public/hooks/sync-stock cron webhook'
) WHERE NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'stock_sync_secret');

SELECT cron.unschedule('hottie-stock-sync');

SELECT cron.schedule(
  'hottie-stock-sync',
  '*/5 * * * *',
  $$
    SELECT net.http_post(
      url := 'https://project--404cf217-b92b-41fa-a8e4-4207aaff23bc.lovable.app/api/public/hooks/sync-stock',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-sync-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'stock_sync_secret' LIMIT 1)
      ),
      body := '{}'::jsonb
    );
  $$
);
