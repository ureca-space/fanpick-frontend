-- Supabase Dashboard > SQL Editor에서 아래 두 값을 먼저 Vault에 저장하세요.
-- 실제 값으로 바꾼 뒤 각 줄을 한 번씩 실행합니다.
--
-- select vault.create_secret(
--   'https://YOUR_PROJECT_REF.supabase.co',
--   'project_url'
-- );
--
-- select vault.create_secret(
--   'YOUR_RANDOM_CRON_SECRET',
--   'push_cron_secret'
-- );

select cron.schedule(
  'send-match-notifications-every-minute',
  '* * * * *',
  $$
  select net.http_post(
    url := (
      select decrypted_secret
      from vault.decrypted_secrets
      where name = 'project_url'
    ) || '/functions/v1/send-match-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'push_cron_secret'
      )
    ),
    body := '{}'::jsonb
  );
  $$
);
