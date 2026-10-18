-- APPLIQUÉE le 18 octobre 2026, 23 h 50 (Europe/Paris)
-- sur le projet Supabase forge-du-changement (kpgkxeilddeyfwiiqaha).
--
-- But : à la création d'une personne, hors superadmin plateforme déjà en place,
-- le rôle ne peut plus être choisi librement, et le drapeau superadmin
-- ne peut pas être posé. À la modification, ce drapeau ne bouge plus
-- sauf pour un superadmin plateforme déjà en place.
--
-- Création autorisée hors superadmin : soi-même, dans un espace,
-- avec le rôle de l'invitation la plus récente (même email, même espace,
-- en_attente ou acceptee). Un rôle vide refuse la création.
-- Le passage « consultant rattaché » et le passage « membre déjà dans
-- l'espace » ne suffisent plus pour choisir un rôle.
--
-- Le premier responsable a déjà sa ligne avant de créer son espace :
-- ce verrou ne le concerne pas.

CREATE OR REPLACE FUNCTION public.platform_superadmin_flag_unchanged(
  p_id uuid,
  p_is_platform_superadmin boolean
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = p_id
      AND u.is_platform_superadmin IS NOT DISTINCT FROM p_is_platform_superadmin
  );
$$;

REVOKE ALL ON FUNCTION public.platform_superadmin_flag_unchanged(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.platform_superadmin_flag_unchanged(uuid, boolean) TO authenticated;

DROP POLICY IF EXISTS lf_v2_users_insert ON public.users;

CREATE POLICY lf_v2_users_insert
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_platform_superadmin()
  OR (
    is_platform_superadmin = false
    AND workspace_id IS NOT NULL
    AND lower(email) = public.jwt_email()
    AND role IS NOT NULL
    AND role = (
      SELECT inv.role
      FROM public.invitations inv
      WHERE lower(inv.email) = public.jwt_email()
        AND inv.workspace_id = users.workspace_id
        AND inv.status IN ('en_attente', 'acceptee')
      ORDER BY inv.created_at DESC NULLS LAST, inv.id::text DESC
      LIMIT 1
    )
  )
);

COMMENT ON POLICY lf_v2_users_insert ON public.users IS
  'Insert : superadmin plateforme, ou la personne elle-meme avec le role de son invitation la plus recente. Le drapeau superadmin reste faux.';

DROP POLICY IF EXISTS lf_v2_users_update ON public.users;

CREATE POLICY lf_v2_users_update
ON public.users
FOR UPDATE
TO authenticated
USING (
  public.is_platform_superadmin()
  OR public.has_workspace_consultant_access(workspace_id)
  OR public.can_manage_workspace(workspace_id)
  OR lower(email) = public.jwt_email()
  OR (
    workspace_id IS NOT NULL
    AND workspace_id = public.current_member_workspace_id()
    AND public.caller_member_role() = ANY (ARRAY['admin'::text, 'codir'::text, 'pilote'::text])
  )
)
WITH CHECK (
  public.is_platform_superadmin()
  OR (
    public.platform_superadmin_flag_unchanged(id, is_platform_superadmin)
    AND (
      public.has_workspace_consultant_access(workspace_id)
      OR public.can_manage_workspace(workspace_id)
      OR public.user_privilege_columns_unchanged(id, workspace_id, role, is_platform_superadmin)
    )
  )
);

COMMENT ON POLICY lf_v2_users_update ON public.users IS
  'Update : le drapeau superadmin ne change que si l appelant est deja superadmin plateforme.';
