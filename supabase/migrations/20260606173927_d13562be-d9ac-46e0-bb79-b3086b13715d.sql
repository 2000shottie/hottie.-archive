
CREATE TABLE public.product_stock (
  product_id text PRIMARY KEY,
  available boolean NOT NULL,
  reason text NOT NULL,
  source text NOT NULL DEFAULT 'vestiaire',
  consecutive_failures integer NOT NULL DEFAULT 0,
  checked_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.product_stock TO anon, authenticated;
GRANT ALL ON public.product_stock TO service_role;
ALTER TABLE public.product_stock ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Product stock is publicly readable"
  ON public.product_stock FOR SELECT
  USING (true);

CREATE TABLE public.stock_check_log (
  id bigserial PRIMARY KEY,
  product_id text NOT NULL,
  available boolean NOT NULL,
  reason text NOT NULL,
  status_code integer,
  duration_ms integer,
  checked_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX stock_check_log_product_checked_idx
  ON public.stock_check_log (product_id, checked_at DESC);

GRANT SELECT ON public.stock_check_log TO anon, authenticated;
GRANT ALL ON public.stock_check_log TO service_role;
ALTER TABLE public.stock_check_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stock check log is publicly readable"
  ON public.stock_check_log FOR SELECT
  USING (true);
