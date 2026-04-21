-- 2026-04-21 : fix super-admin qui ne voyait pas l'ensemble des workspaces
-- dans la page Paramètres > Missions & entreprises clientes.
--
-- Cause : la seule policy SELECT sur public.workspaces filtrait par
-- appartenance membre (users.workspace_id = auth.uid()). Les policies
-- INSERT/UPDATE/DELETE appelaient déjà is_platform_superadmin(), mais pas
-- la SELECT.
--
-- Fix : ajout d'une policy SELECT permissive pour les super-admin plateforme.
-- Elle se combine en OR avec authenticated_read_own_workspace, sans
-- modifier la règle existante pour les utilisateurs « membres ».

CREATE POLICY workspaces_superadmin_select ON public.workspaces
  FOR SELECT
  TO authenticated
  USING (public.is_platform_superadmin());
