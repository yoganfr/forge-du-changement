-- INSERT directions : les membres CODIR / pilote / contributeur doivent pouvoir créer
-- une ligne non transverse dans leur workspace (profil, wizard invité).
-- La policy FOR ALL `directions_all` impose WITH CHECK (can_manage_workspace(...)),
-- ce qui bloquait tout insert par un membre terrain.

CREATE OR REPLACE FUNCTION public.can_member_self_serve_direction_insert(
  p_workspace_id uuid,
  p_is_transverse boolean
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
    WHERE u.id = public.current_app_user_id()
      AND u.workspace_id = p_workspace_id
      AND u.role IN ('codir', 'contributeur', 'pilote')
      AND COALESCE(p_is_transverse, false) = false
  );
$function$;

COMMENT ON FUNCTION public.can_member_self_serve_direction_insert(uuid, boolean) IS
  'RLS directions : membre terrain peut INSERT une direction non transverse dans son workspace.';

CREATE POLICY directions_insert_member_self_serve ON public.directions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.can_member_self_serve_direction_insert(workspace_id, is_transverse)
  );
