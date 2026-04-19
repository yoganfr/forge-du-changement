-- Garde backend : validation decideur sur projets.dg_validated_transfo
-- Objectif :
-- - Autoriser uniquement consultant/admin/pilote/superadmin
-- - Bloquer codir/contributeur meme si le frontend est contourne
-- - Ne pas impacter les autres updates sur projets

BEGIN;

CREATE OR REPLACE FUNCTION public.current_member_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.role::text
  FROM public.users u
  WHERE lower(u.email) = public.jwt_email()
  LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.current_member_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_member_role() TO authenticated;

CREATE OR REPLACE FUNCTION public.trg_guard_decideur_validation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_role text;
BEGIN
  IF NEW.dg_validated_transfo IS DISTINCT FROM OLD.dg_validated_transfo THEN
    IF public.is_platform_superadmin() THEN
      RETURN NEW;
    END IF;

    actor_role := public.current_member_role();
    IF actor_role NOT IN ('consultant', 'admin', 'pilote') THEN
      RAISE EXCEPTION 'Acces refuse: validation decideur reservee aux roles consultant/admin/pilote/superadmin'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_decideur_validation_on_projets ON public.projets;
CREATE TRIGGER guard_decideur_validation_on_projets
  BEFORE UPDATE ON public.projets
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_guard_decideur_validation();

COMMIT;
