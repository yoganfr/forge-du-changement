-- =============================================================================
-- La Forge — Vérifications lecture seule après migrations permissions
-- À exécuter dans Supabase SQL Editor (aucune modification de données).
--
-- Voir aussi : docs/supabase-verify-rls-all-public-tables.sql (toutes les tables public),
-- docs/security-quick-wins.md (MFA, rate limits, secrets).
--
-- Comment lancer :
--   • Bouton **Run** (ou raccourci) sur tout le fichier : plusieurs SELECT
--     s’enchaînent et tu obtiens plusieurs onglets / blocs de résultats.
--   • Si tu vois : « EXPLAIN only works on a single SQL statement »,
--     c’est que tu as utilisé **Explain** sur plusieurs requêtes à la fois.
--     Fais **Run** à la place, OU sélectionne **une seule** requête (du SELECT
--     au point-virgule) puis Explain si tu en as besoin.
-- =============================================================================

-- 1) Colonne super-admin plateforme
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
  AND column_name = 'is_platform_superadmin';

-- 2) Tables attendues
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('workspace_consultants', 'audit_events')
ORDER BY table_name;

-- 3) Fonctions helper (extrait pg_proc)
SELECT p.proname AS function_name
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'jwt_email',
    'current_app_user_id',
    'is_platform_superadmin',
    'current_member_workspace_id',
    'is_workspace_org_admin',
    'has_workspace_consultant_access',
    'is_workspace_consultant_owner',
    'trg_workspaces_assign_consultant_owner'
  )
ORDER BY 1;

-- 4) Contrainte CHECK sur users.role (doit autoriser 'admin')
SELECT c.conname, pg_get_constraintdef(c.oid) AS definition
FROM pg_constraint c
JOIN pg_class rel ON rel.oid = c.conrelid
JOIN pg_namespace n ON n.oid = rel.relnamespace
WHERE n.nspname = 'public'
  AND rel.relname = 'users'
  AND c.contype = 'c'
ORDER BY c.conname;

-- 5) Trigger sur workspaces
SELECT tgname, tgenabled
FROM pg_trigger
WHERE tgrelid = 'public.workspaces'::regclass
  AND NOT tgisinternal;

-- 6) Policies lf_v2_* (workspaces / users / invitations)
SELECT tab.relname AS table_name, pol.polname AS policy_name
FROM pg_policy pol
JOIN pg_class tab ON tab.oid = pol.polrelid
JOIN pg_namespace n ON n.oid = tab.relnamespace
WHERE n.nspname = 'public'
  AND tab.relname IN ('workspaces', 'users', 'invitations')
  AND pol.polname LIKE 'lf_v2_%'
ORDER BY 1, 2;

-- 7) Données : au moins un owner consultant par workspace (ou vide si pas encore backfill)
SELECT w.id, w.company_name,
       (SELECT COUNT(*) FROM public.workspace_consultants wc
        WHERE wc.workspace_id = w.id AND wc.level = 'owner' AND wc.status = 'active') AS active_owners
FROM public.workspaces w
ORDER BY w.company_name;

-- 8) RLS activée sur les tables sensibles
SELECT c.relname, c.relrowsecurity AS rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relname IN ('workspaces', 'users', 'invitations', 'workspace_consultants', 'audit_events')
ORDER BY 1;
