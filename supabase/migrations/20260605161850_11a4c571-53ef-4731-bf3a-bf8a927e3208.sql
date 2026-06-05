
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_session_id text NOT NULL UNIQUE,
  buyer_email text NOT NULL,
  buyer_name text,
  product_ids text[] NOT NULL DEFAULT '{}',
  amount_total_cents integer,
  currency text NOT NULL DEFAULT 'usd',
  shipping_address jsonb,
  carrier text,
  tracking_number text,
  tracking_url text,
  shipped_at timestamptz,
  shipped_email_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_created_at ON public.orders (created_at DESC);
CREATE INDEX idx_orders_shipped ON public.orders (shipped_at);

GRANT ALL ON public.orders TO service_role;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
-- No policies for anon/authenticated: only the server (service_role) reads/writes orders.
