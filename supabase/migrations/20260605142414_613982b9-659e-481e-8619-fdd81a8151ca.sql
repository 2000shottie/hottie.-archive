ALTER TABLE public.sold_products ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'local';
CREATE INDEX IF NOT EXISTS sold_products_source_idx ON public.sold_products (source);