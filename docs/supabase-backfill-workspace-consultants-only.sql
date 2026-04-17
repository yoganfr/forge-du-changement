-- À exécuter dans Supabase SQL Editor si workspace_consultants est vide après la migration
-- (consultants avec workspace_id NULL ne sont pas couverts par le backfill 4a seul).

-- Diagnostic (lecture seule, tu peux lancer séparément)
-- SELECT role, COUNT(*) FILTER (WHERE workspace_id IS NOT NULL) AS avec_ws,
--        COUNT(*) FILTER (WHERE workspace_id IS NULL) AS sans_ws
-- FROM public.users GROUP BY 1;
-- SELECT is_platform_superadmin, COUNT(*) FROM public.users GROUP BY 1;

INSERT INTO public.workspace_consultants (workspace_id, user_id, level, status)
SELECT w.id, sa.id, 'owner', 'active'
FROM public.workspaces w
CROSS JOIN LATERAL (
  SELECT u.id
  FROM public.users u
  WHERE u.is_platform_superadmin = true
  ORDER BY u.created_at ASC NULLS LAST, u.id
  LIMIT 1
) sa
WHERE NOT EXISTS (
  SELECT 1
  FROM public.workspace_consultants wc
  WHERE wc.workspace_id = w.id
    AND wc.level = 'owner'
    AND wc.status = 'active'
)
ON CONFLICT (workspace_id, user_id) DO UPDATE
  SET level = 'owner', status = 'active';

-- Si 0 ligne insérée : aucun users.is_platform_superadmin = true → soit lancer l’UPDATE du script
-- principal sur tes emails, soit insérer à la main (remplace les UUID) :
--
-- INSERT INTO public.workspace_consultants (workspace_id, user_id, level, status)
-- VALUES ('<workspace_uuid>', '<consultant_users_uuid>', 'owner', 'active')
-- ON CONFLICT (workspace_id, user_id) DO UPDATE SET level = 'owner', status = 'active';
