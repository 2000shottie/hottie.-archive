CREATE TABLE public.sold_products (
  product_id TEXT PRIMARY KEY,
  sold_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.sold_products TO anon, authenticated;
GRANT ALL ON public.sold_products TO service_role;

ALTER TABLE public.sold_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sold products are publicly readable"
ON public.sold_products
FOR SELECT
USING (true);
