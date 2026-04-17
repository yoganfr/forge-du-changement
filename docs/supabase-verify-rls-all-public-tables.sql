-- =============================================================================
-- La Forge — Vérification couverture RLS sur le schéma public
-- Lecture seule. Exécuter dans Supabase SQL Editor (Run, pas Explain sur tout).
-- =============================================================================

-- A) Tables relationnelles sans RLS activée
SELECT c.relname AS table_without_rls
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND NOT c.relrowsecurity
ORDER BY 1;

-- B) Tables avec RLS mais sans aucune policy (accès « tout refusé » pour rôles couverts par RLS)
SELECT c.relname AS rls_enabled_but_no_policies
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relrowsecurity
  AND NOT EXISTS (
    SELECT 1 FROM pg_policy p WHERE p.polrelid = c.oid
  )
ORDER BY 1;
