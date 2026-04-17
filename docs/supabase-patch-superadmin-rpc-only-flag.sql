-- À exécuter une fois sur Supabase après que tous les comptes break-glass
-- aient bien users.is_platform_superadmin = true (déjà fait par la migration initiale).
-- Retire le repli par liste d’emails dans la fonction (source de vérité = flag en base uniquement).

BEGIN;

CREATE OR REPLACE FUNCTION public.is_platform_superadmin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE lower(u.email) = public.jwt_email()
      AND u.is_platform_superadmin = true
  )
$$;

COMMIT;
