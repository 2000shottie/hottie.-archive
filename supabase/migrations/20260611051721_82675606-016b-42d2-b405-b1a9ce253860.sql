-- Make the locked-down posture of `orders` explicit. RLS is already enabled with
-- no policies, so the Data API (anon + authenticated) already returns zero rows.
-- All legitimate reads/writes go through server functions using the service role
-- (which bypasses RLS): `src/lib/orders.functions.ts` (admin-token gated) and the
-- verified Stripe webhook `src/routes/api/public/payments/webhook.ts`. This site
-- has no end-user customer accounts, so there is no auth.uid()-scoped owner to
-- grant SELECT to.

-- Explicit deny-all policies — defense in depth, and removes scanner ambiguity.
DROP POLICY IF EXISTS "Deny all client access to orders" ON public.orders;
CREATE POLICY "Deny all client access to orders"
  ON public.orders
  AS RESTRICTIVE
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- Revoke any inherited Data API privileges from anon/authenticated. Only the
-- service role (used by server functions / webhook) may touch this table.
REVOKE ALL ON public.orders FROM anon;
REVOKE ALL ON public.orders FROM authenticated;
GRANT ALL ON public.orders TO service_role;