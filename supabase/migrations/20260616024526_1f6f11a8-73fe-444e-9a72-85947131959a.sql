
CREATE TABLE public.product_reservations (
  product_id text PRIMARY KEY,
  stripe_session_id text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_reservations_session ON public.product_reservations(stripe_session_id);
CREATE INDEX idx_product_reservations_expires ON public.product_reservations(expires_at);

GRANT ALL ON public.product_reservations TO service_role;

ALTER TABLE public.product_reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny all client access to reservations"
  ON public.product_reservations
  AS RESTRICTIVE
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- Atomic claim: inserts a row, OR overwrites it only if the existing
-- reservation is already expired. Returns the row on success, nothing on
-- conflict. Service-role only.
CREATE OR REPLACE FUNCTION public.try_reserve_product(
  _product_id text,
  _session_id text,
  _expires_at timestamptz
)
RETURNS public.product_reservations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result public.product_reservations;
BEGIN
  INSERT INTO public.product_reservations (product_id, stripe_session_id, expires_at)
  VALUES (_product_id, _session_id, _expires_at)
  ON CONFLICT (product_id) DO UPDATE
    SET stripe_session_id = EXCLUDED.stripe_session_id,
        expires_at = EXCLUDED.expires_at,
        created_at = now()
    WHERE public.product_reservations.expires_at <= now()
  RETURNING * INTO result;
  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.try_reserve_product(text, text, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.try_reserve_product(text, text, timestamptz) TO service_role;
