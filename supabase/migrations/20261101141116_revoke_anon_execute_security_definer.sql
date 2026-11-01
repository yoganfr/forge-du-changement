-- Tranche A du plan suite OWASP. Appliquée le 1 novembre 2026, 14 h 11 (Europe/Paris)
-- sur le projet Supabase forge-du-changement (kpgkxeilddeyfwiiqaha).
--
-- Une personne non connectée ne peut plus appeler les fonctions sensibles.
-- Une personne connectée le peut encore : ces fonctions font tenir les écrans
-- et les déclencheurs. Le chemin de recherche est fixé sur les quatre fonctions
-- que l'avertisseur signalait.
--
-- Retour arrière :
-- GRANT EXECUTE ON FUNCTION public.audit_feedback_arbitrated() TO anon, PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.audit_reviewer_reopened() TO anon, PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.audit_reviewer_submitted() TO anon, PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.caller_member_role() TO anon, PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.can_edit_transformation_discourse(uuid) TO anon, PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.can_member_self_serve_direction_insert(uuid, boolean) TO anon, PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.can_member_self_serve_projet(uuid, uuid) TO anon, PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.can_view_workspace_invitations(uuid) TO anon, PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.current_app_user_id() TO anon, PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.current_member_workspace_id() TO anon, PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.current_user_workspace_id() TO anon, PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.handle_auth_user_meta_sync_avatar_url() TO anon, PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.has_workspace_consultant_access(uuid) TO anon, PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.invitation_workspace_unchanged(uuid, uuid) TO anon, PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.is_platform_superadmin() TO anon, PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.is_workspace_consultant_owner(uuid) TO anon, PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.is_workspace_org_admin(uuid) TO anon, PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.platform_superadmin_flag_unchanged(uuid, boolean) TO anon, PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.rls_auto_enable() TO anon, PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.touch_transformation_discourses_updated_at() TO anon, PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.trg_workspaces_assign_consultant_owner() TO anon, PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.user_privilege_columns_unchanged(uuid, uuid, text, boolean) TO anon, PUBLIC;
-- ALTER FUNCTION public.can_access_workspace(uuid) RESET search_path;
-- ALTER FUNCTION public.can_manage_workspace(uuid) RESET search_path;
-- ALTER FUNCTION public.extract_avatar_url_from_auth_meta(jsonb) RESET search_path;
-- ALTER FUNCTION public.update_workspaces_updated_at() RESET search_path;

REVOKE ALL ON FUNCTION public.audit_feedback_arbitrated() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.audit_reviewer_reopened() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.audit_reviewer_submitted() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.caller_member_role() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_edit_transformation_discourse(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_member_self_serve_direction_insert(uuid, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_member_self_serve_projet(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_view_workspace_invitations(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.current_app_user_id() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.current_member_workspace_id() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.current_user_workspace_id() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.handle_auth_user_meta_sync_avatar_url() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_workspace_consultant_access(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.invitation_workspace_unchanged(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_platform_superadmin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_workspace_consultant_owner(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_workspace_org_admin(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.platform_superadmin_flag_unchanged(uuid, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.touch_transformation_discourses_updated_at() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.trg_workspaces_assign_consultant_owner() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.user_privilege_columns_unchanged(uuid, uuid, text, boolean) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.audit_feedback_arbitrated() TO authenticated;
GRANT EXECUTE ON FUNCTION public.audit_reviewer_reopened() TO authenticated;
GRANT EXECUTE ON FUNCTION public.audit_reviewer_submitted() TO authenticated;
GRANT EXECUTE ON FUNCTION public.caller_member_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_edit_transformation_discourse(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_member_self_serve_direction_insert(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_member_self_serve_projet(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_workspace_invitations(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_app_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_member_workspace_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_workspace_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_auth_user_meta_sync_avatar_url() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_workspace_consultant_access(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.invitation_workspace_unchanged(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_platform_superadmin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_workspace_consultant_owner(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_workspace_org_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.platform_superadmin_flag_unchanged(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rls_auto_enable() TO authenticated;
GRANT EXECUTE ON FUNCTION public.touch_transformation_discourses_updated_at() TO authenticated;
GRANT EXECUTE ON FUNCTION public.trg_workspaces_assign_consultant_owner() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_privilege_columns_unchanged(uuid, uuid, text, boolean) TO authenticated;

ALTER FUNCTION public.can_access_workspace(uuid) SET search_path TO public;
ALTER FUNCTION public.can_manage_workspace(uuid) SET search_path TO public;
ALTER FUNCTION public.extract_avatar_url_from_auth_meta(jsonb) SET search_path TO public;
ALTER FUNCTION public.update_workspaces_updated_at() SET search_path TO public;
