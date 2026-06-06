
-- products table (DB-backed listings, separate from hardcoded src/lib/products.ts)
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  house text NOT NULL,
  price integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'usd',
  description text,
  category text,
  tag text,
  size text,
  condition text,
  seller_country text,
  vestiaire_url text,
  vestiaire_id text,
  status text NOT NULL DEFAULT 'draft', -- draft | published | archived
  needs_image_review boolean NOT NULL DEFAULT false,
  listed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Products readable by everyone" ON public.products FOR SELECT USING (true);

-- product_images
CREATE TABLE public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  processed_url text NOT NULL,        -- white-bg version (shown on site)
  original_url text,                   -- raw Vestiaire url (private backup)
  original_storage_path text,          -- path in storage to original backup
  needs_review boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.product_images TO anon, authenticated;
GRANT ALL ON public.product_images TO service_role;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Product images readable by everyone" ON public.product_images FOR SELECT USING (true);
CREATE INDEX idx_product_images_product ON public.product_images(product_id, position);

-- import_jobs (status tracker the UI polls)
CREATE TABLE public.import_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_url text NOT NULL,
  status text NOT NULL DEFAULT 'queued', -- queued | scraping | cleaning_images | creating_listing | ready | failed
  step_label text,                        -- human label shown in UI
  progress_current integer NOT NULL DEFAULT 0,
  progress_total integer NOT NULL DEFAULT 0,
  error text,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.import_jobs TO anon, authenticated;
GRANT ALL ON public.import_jobs TO service_role;
ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Import jobs readable by everyone" ON public.import_jobs FOR SELECT USING (true);

-- updated_at trigger fn
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_products_touch BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_import_jobs_touch BEFORE UPDATE ON public.import_jobs
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
