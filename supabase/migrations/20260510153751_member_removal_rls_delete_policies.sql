-- Retrait membre depuis la fiche entreprise (DELETE users / invitations / workspace_consultants).
-- Aligné sur can_manage_workspace (consultant owner + admin client) et propriétaire consultant pour workspace_consultants.

DROP POLICY IF EXISTS lf_v2_users_delete ON public.users;
DROP POLICY IF EXISTS lf_v2_invitations_delete ON public.invitations;
DROP POLICY IF EXISTS lf_ws_cons_delete ON public.workspace_consultants;

CREATE POLICY lf_v2_users_delete ON public.users
FOR DELETE TO authenticated
USING (
  is_platform_superadmin()
  OR (
    workspace_id IS NOT NULL
    AND can_manage_workspace(workspace_id)
    AND id <> current_app_user_id()
  )
);

COMMENT ON POLICY lf_v2_users_delete ON public.users IS
  'Consultant owner ou admin entreprise retire un membre ; pas d''auto-suppression client.';

CREATE POLICY lf_v2_invitations_delete ON public.invitations
FOR DELETE TO authenticated
USING (
  is_platform_superadmin()
  OR (
    workspace_id IS NOT NULL
    AND can_manage_workspace(workspace_id)
  )
);

COMMENT ON POLICY lf_v2_invitations_delete ON public.invitations IS
  'Retrait des lignes invitation lors du retrait membre ou nettoyage.';

CREATE POLICY lf_ws_cons_delete ON public.workspace_consultants
FOR DELETE TO authenticated
USING (
  is_platform_superadmin()
  OR is_workspace_consultant_owner(workspace_id)
  OR is_workspace_org_admin(workspace_id)
);

COMMENT ON POLICY lf_ws_cons_delete ON public.workspace_consultants IS
  'Retrait rattachement consultant : owner dossier ou admin client.';
