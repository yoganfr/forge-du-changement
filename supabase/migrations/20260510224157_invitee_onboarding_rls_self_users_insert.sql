-- Onboarding invite : autoriser un utilisateur authentifie a creer SA PROPRE ligne
-- public.users lorsqu'une invitation correspondante (memes email + workspace_id)
-- existe en statut 'en_attente' ou 'acceptee'.
--
-- Contexte : la policy `lf_v2_users_insert` precedente exigeait
-- `has_workspace_consultant_access(workspace_id) OR current_member_workspace_id() = workspace_id`.
-- Or `current_member_workspace_id()` lit public.users via jwt_email() ; tant que la
-- ligne n'existe pas (cas d'un nouvel invite codir/pilote/contributeur), elle renvoie
-- NULL. RLS rejetait alors l'INSERT du wizard d'onboarding (InviteeSetupWizard ->
-- createUser), bloquant tout le flow avec "Impossible d'enregistrer votre profil".
--
-- Securite : la nouvelle clause exige
--   - lower(email) = jwt_email()  (on ne peut creer QUE sa propre ligne)
--   - une invitation existante pour ce meme email + workspace_id (statut 'en_attente' OU 'acceptee')
-- Aucun acces au workspace n'est elargi : seul l'utilisateur invite peut creer sa
-- propre ligne, et uniquement pour le workspace ou il a deja ete invite.

DROP POLICY IF EXISTS lf_v2_users_insert ON public.users;

CREATE POLICY lf_v2_users_insert
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (
  is_platform_superadmin()
  OR (
    workspace_id IS NOT NULL
    AND (
      has_workspace_consultant_access(workspace_id)
      OR current_member_workspace_id() = workspace_id
      OR (
        lower(email) = jwt_email()
        AND EXISTS (
          SELECT 1
          FROM public.invitations inv
          WHERE lower(inv.email) = jwt_email()
            AND inv.workspace_id = users.workspace_id
            AND inv.status IN ('en_attente', 'acceptee')
        )
      )
    )
  )
);

COMMENT ON POLICY lf_v2_users_insert ON public.users IS
  'Insert autorise : superadmin, consultant rattache au workspace, membre du meme workspace, ou nouvel invite creant sa propre ligne (email = JWT) avec invitation correspondante (en_attente ou acceptee).';
