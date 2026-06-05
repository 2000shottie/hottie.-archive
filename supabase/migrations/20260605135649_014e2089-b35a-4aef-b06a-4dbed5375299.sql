CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
BEGIN
  PERFORM cron.unschedule('sync-vestiaire-stock-every-5-minutes');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

SELECT cron.schedule(
  'sync-vestiaire-stock-every-5-minutes',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://project--404cf217-b92b-41fa-a8e4-4207aaff23bc-dev.lovable.app/api/public/hooks/sync-stock',
    headers := '{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInJlZiI6Im1ndnJmemdtZnp6cnRuc3pzcnV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MTkyNTcsImV4cCI6MjA5NTk5NTI1N30.Qb-GmIsauneMH6CuaF1_i8XXie1_ck2vE2Rw_m0FRF8"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);