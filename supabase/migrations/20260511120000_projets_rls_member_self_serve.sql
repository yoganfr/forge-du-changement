-- Membres CODIR / contributeur / pilote : créer et gérer des projets sur leur direction
-- ou sur une direction transverse du workspace (sans être consultant owner ni admin).
-- Ancienne policy unique : WITH CHECK (can_manage_workspace) bloquait tout INSERT membre.

CREATE OR REPLACE FUNCTION public.can_member_self_serve_projet(
  p_workspace_id uuid,
  p_direction_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    INNER JOIN public.directions d
      ON d.id = p_direction_id
     AND d.workspace_id = p_workspace_id
    WHERE u.id = public.current_app_user_id()
      AND u.workspace_id = p_workspace_id
      AND u.role IN ('codir', 'contributeur', 'pilote')
      AND (
        d.is_transverse = true
        OR (u.direction_id IS NOT NULL AND u.direction_id = d.id)
      )
  );
$function$;

COMMENT ON FUNCTION public.can_member_self_serve_projet(uuid, uuid) IS
  'Self-service projets : membre terrain sur sa direction_id ou sur une direction is_transverse du workspace.';

DROP POLICY IF EXISTS projets_all ON public.projets;

CREATE POLICY projets_select ON public.projets
  FOR SELECT
  USING (public.can_access_workspace(workspace_id));

CREATE POLICY projets_insert ON public.projets
  FOR INSERT
  WITH CHECK (
    public.can_manage_workspace(workspace_id)
    OR public.can_member_self_serve_projet(workspace_id, direction_id)
  );

CREATE POLICY projets_update ON public.projets
  FOR UPDATE
  USING (
    public.can_access_workspace(workspace_id)
    AND (
      public.can_manage_workspace(workspace_id)
      OR public.can_member_self_serve_projet(workspace_id, direction_id)
    )
  )
  WITH CHECK (
    public.can_manage_workspace(workspace_id)
    OR public.can_member_self_serve_projet(workspace_id, direction_id)
  );

CREATE POLICY projets_delete ON public.projets
  FOR DELETE
  USING (
    public.can_access_workspace(workspace_id)
    AND (
      public.can_manage_workspace(workspace_id)
      OR public.can_member_self_serve_projet(workspace_id, direction_id)
    )
  );
