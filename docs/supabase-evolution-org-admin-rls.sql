-- =============================================================================
-- La Forge — Administrateur d’espace entreprise (rôle users.role = 'admin')
-- Alignement RLS / trigger avec docs/proposition-regles-matrice-permissions.md
--
-- Quand l’exécuter :
-- - Après la migration principale `supabase-evolution-permissions-alignement.sql`
--   si celle-ci avait été appliquée **avant** l’ajout des règles org admin ; ou
-- - En complément sur une base déjà à jour (idempotent : CREATE OR REPLACE + DROP/CREATE policies).
--
-- Exécuter dans Supabase SQL Editor. En cas d’erreur sur la CHECK `users_role_check`,
-- vérifier qu’aucune ligne `users.role` n’a une valeur hors liste.
-- =============================================================================

BEGIN;

-- Autoriser le rôle métier « admin » (administrateur de l’espace entreprise client)
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users
  ADD CONSTRAINT users_role_check CHECK (
    role = ANY (
      ARRAY[
        'consultant'::text,
        'admin'::text,
        'codir'::text,
        'pilote'::text,
        'contributeur'::text
      ]
    )
  );

CREATE OR REPLACE FUNCTION public.is_workspace_org_admin(p_workspace_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = public.current_app_user_id()
      AND u.workspace_id = p_workspace_id
      AND u.role = 'admin'
  )
$$;

REVOKE ALL ON FUNCTION public.is_workspace_org_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_workspace_org_admin(uuid) TO authenticated;

-- Trigger création workspace : premier owner aussi si créateur = admin entreprise
CREATE OR REPLACE FUNCTION public.trg_workspaces_assign_consultant_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
BEGIN
  uid := public.current_app_user_id();
  IF uid IS NULL THEN
    RETURN NEW;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = uid AND u.role IN ('consultant', 'admin')
  ) THEN
    RETURN NEW;
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.workspace_consultants wc
    WHERE wc.workspace_id = NEW.id AND wc.level = 'owner' AND wc.status = 'active'
  ) THEN
    RETURN NEW;
  END IF;
  INSERT INTO public.workspace_consultants (workspace_id, user_id, level, status)
  VALUES (NEW.id, uid, 'owner', 'active')
  ON CONFLICT (workspace_id, user_id) DO UPDATE
    SET level = 'owner', status = 'active';
  RETURN NEW;
END;
$$;

-- workspace_consultants : l’admin client peut voir les rattachements consultants de son espace
DROP POLICY IF EXISTS "lf_ws_cons_select" ON public.workspace_consultants;
CREATE POLICY "lf_ws_cons_select"
  ON public.workspace_consultants FOR SELECT
  TO authenticated
  USING (
    public.is_platform_superadmin()
    OR user_id = public.current_app_user_id()
    OR public.is_workspace_consultant_owner(workspace_id)
    OR public.is_workspace_org_admin(workspace_id)
  );

DROP POLICY IF EXISTS "lf_ws_cons_insert" ON public.workspace_consultants;
CREATE POLICY "lf_ws_cons_insert"
  ON public.workspace_consultants FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_platform_superadmin()
    OR (
      public.is_workspace_consultant_owner(workspace_id)
      AND user_id <> public.current_app_user_id()
    )
    OR (
      level = 'owner'
      AND user_id = public.current_app_user_id()
      AND EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = public.current_app_user_id() AND u.role IN ('consultant', 'admin')
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.workspace_consultants wc
        WHERE wc.workspace_id = workspace_id AND wc.level = 'owner' AND wc.status = 'active'
      )
    )
  );

-- audit_events (si table présente)
DROP POLICY IF EXISTS "lf_audit_select" ON public.audit_events;
CREATE POLICY "lf_audit_select"
  ON public.audit_events FOR SELECT
  TO authenticated
  USING (
    public.is_platform_superadmin()
    OR (
      workspace_id IS NOT NULL
      AND (
        public.is_workspace_consultant_owner(workspace_id)
        OR public.is_workspace_org_admin(workspace_id)
      )
    )
  );

-- workspaces
DROP POLICY IF EXISTS "lf_v2_workspaces_insert" ON public.workspaces;
CREATE POLICY "lf_v2_workspaces_insert"
  ON public.workspaces FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_platform_superadmin()
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = public.current_app_user_id() AND u.role IN ('consultant', 'admin')
    )
  );

DROP POLICY IF EXISTS "lf_v2_workspaces_update" ON public.workspaces;
CREATE POLICY "lf_v2_workspaces_update"
  ON public.workspaces FOR UPDATE
  TO authenticated
  USING (
    public.is_platform_superadmin()
    OR public.is_workspace_consultant_owner(id)
    OR public.is_workspace_org_admin(id)
  )
  WITH CHECK (
    public.is_platform_superadmin()
    OR public.is_workspace_consultant_owner(id)
    OR public.is_workspace_org_admin(id)
  );

-- invitations : CODIR ou admin espace peuvent inviter depuis leur workspace
DROP POLICY IF EXISTS "lf_v2_invitations_insert" ON public.invitations;
CREATE POLICY "lf_v2_invitations_insert"
  ON public.invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_platform_superadmin()
    OR (
      workspace_id IS NOT NULL
      AND (
        public.has_workspace_consultant_access(workspace_id)
        OR (
          workspace_id = public.current_member_workspace_id()
          AND EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = public.current_app_user_id() AND u.role IN ('codir', 'admin')
          )
        )
      )
    )
  );

COMMIT;
