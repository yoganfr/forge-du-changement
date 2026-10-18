-- APPLIQUÉE le 18 octobre 2026, 22 h 23 (Europe/Paris)
-- sur le projet Supabase forge-du-changement (kpgkxeilddeyfwiiqaha),
-- via la migration MCP users_insert_role_matches_invitation.
-- Écrite le 18 octobre 2026, 22 h 21 (Europe/Paris).
--
-- But : un invité qui crée sa propre ligne public.users ne peut écrire
-- que le rôle de son invitation la plus récente (même email, même espace,
-- statut en_attente ou acceptee). Ordre : created_at décroissant, puis id texte.
-- Si ce rôle est NULL, la comparaison échoue et l'insert est refusé.
--
-- Inchangé : superadmin, consultant rattaché à l'espace, membre déjà
-- rattaché à l'espace. Le premier owner ne crée pas sa ligne users ici.
--
-- Lecture du 18 octobre 2026 : 0 invitation sur 9 a un rôle NULL.
-- Le formulaire d'invitation envoie toujours codir, pilote ou contributeur.
--
-- Hors périmètre : un insert forgé peut encore poser is_platform_superadmin.
-- Un consultant qui passe par has_workspace_consultant_access peut encore
-- choisir le rôle.

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
        AND role = (
          SELECT inv.role
          FROM public.invitations inv
          WHERE lower(inv.email) = jwt_email()
            AND inv.workspace_id = users.workspace_id
            AND inv.status IN ('en_attente', 'acceptee')
          ORDER BY inv.created_at DESC NULLS LAST, inv.id::text DESC
          LIMIT 1
        )
      )
    )
  )
);

COMMENT ON POLICY lf_v2_users_insert ON public.users IS
  'Insert autorise : superadmin, consultant rattache, membre du meme espace, ou invite creant sa ligne avec le role de son invitation la plus recente (en_attente ou acceptee).';
