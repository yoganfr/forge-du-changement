-- Durcissement isolation multi-tenant.
-- Appliqué sur le projet Supabase forge-du-changement (kpgkxeilddeyfwiiqaha).

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE TRUNCATE, TRIGGER, REFERENCES ON ALL TABLES IN SCHEMA public FROM authenticated;

CREATE OR REPLACE FUNCTION public.user_privilege_columns_unchanged(
  p_id uuid,
  p_workspace_id uuid,
  p_role text,
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
      AND u.workspace_id IS NOT DISTINCT FROM p_workspace_id
      AND u.role IS NOT DISTINCT FROM p_role
      AND u.is_platform_superadmin IS NOT DISTINCT FROM p_is_platform_superadmin
  );
$$;

CREATE OR REPLACE FUNCTION public.caller_member_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT u.role
  FROM public.users u
  WHERE u.id = public.current_app_user_id()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.invitation_workspace_unchanged(p_id uuid, p_workspace_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.invitations i
    WHERE i.id = p_id
      AND i.workspace_id IS NOT DISTINCT FROM p_workspace_id
  );
$$;

REVOKE ALL ON FUNCTION public.user_privilege_columns_unchanged(uuid, uuid, text, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.caller_member_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.invitation_workspace_unchanged(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_privilege_columns_unchanged(uuid, uuid, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.caller_member_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.invitation_workspace_unchanged(uuid, uuid) TO authenticated;

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
    OR public.has_workspace_consultant_access(workspace_id)
    OR public.can_manage_workspace(workspace_id)
    OR public.user_privilege_columns_unchanged(id, workspace_id, role, is_platform_superadmin)
  );

DROP POLICY IF EXISTS lf_v2_invitations_update ON public.invitations;
CREATE POLICY lf_v2_invitations_update
  ON public.invitations
  FOR UPDATE
  TO authenticated
  USING (
    public.is_platform_superadmin()
    OR (
      workspace_id IS NOT NULL
      AND public.can_view_workspace_invitations(workspace_id)
    )
    OR (
      lower(email) = public.jwt_email()
      AND status = 'en_attente'
    )
  )
  WITH CHECK (
    public.is_platform_superadmin()
    OR (
      workspace_id IS NOT NULL
      AND public.can_view_workspace_invitations(workspace_id)
      AND public.invitation_workspace_unchanged(id, workspace_id)
    )
    OR (
      lower(email) = public.jwt_email()
      AND public.invitation_workspace_unchanged(id, workspace_id)
    )
  );

DROP POLICY IF EXISTS lf_ws_cons_insert ON public.workspace_consultants;
CREATE POLICY lf_ws_cons_insert
  ON public.workspace_consultants
  FOR INSERT
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
        SELECT 1
        FROM public.users u
        WHERE u.id = public.current_app_user_id()
          AND u.role = ANY (ARRAY['consultant'::text, 'admin'::text])
      )
      AND NOT EXISTS (
        SELECT 1
        FROM public.workspace_consultants wc
        WHERE wc.workspace_id = workspace_consultants.workspace_id
          AND wc.level = 'owner'
          AND wc.status = 'active'
      )
    )
  );

CREATE OR REPLACE FUNCTION public.audit_feedback_arbitrated()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  ws_id uuid;
BEGIN
  IF NEW.codir_status IS NOT NULL AND (OLD.codir_status IS NULL OR OLD.codir_status <> NEW.codir_status) THEN
    SELECT rs.workspace_id INTO ws_id
    FROM public.roadmap_snapshots rs
    WHERE rs.id = NEW.snapshot_id;

    INSERT INTO public.audit_events (workspace_id, actor_user_id, action, payload)
    VALUES (
      ws_id,
      NEW.codir_user_id,
      'feedback_arbitrated',
      jsonb_build_object(
        'feedback_id', NEW.id,
        'snapshot_id', NEW.snapshot_id,
        'reviewer_user_id', NEW.reviewer_user_id,
        'kind', NEW.kind,
        'codir_status', NEW.codir_status,
        'codir_motivation', NEW.codir_motivation,
        'arbitrated_by', NEW.codir_user_id,
        'arbitrated_at', NEW.codir_at
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.audit_reviewer_reopened()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  ws_id uuid;
BEGIN
  IF NEW.status = 'draft' AND OLD.status = 'submitted' THEN
    SELECT rs.workspace_id INTO ws_id
    FROM public.roadmap_snapshots rs
    WHERE rs.id = NEW.snapshot_id;

    INSERT INTO public.audit_events (workspace_id, actor_user_id, action, payload)
    VALUES (
      ws_id,
      public.current_app_user_id(),
      'snapshot_review_reopened',
      jsonb_build_object(
        'snapshot_id', NEW.snapshot_id,
        'reviewer_user_id', NEW.user_id,
        'reopened_by', public.current_app_user_id()
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.audit_reviewer_submitted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  ws_id uuid;
BEGIN
  IF NEW.status = 'submitted' AND (OLD.status IS NULL OR OLD.status <> 'submitted') THEN
    SELECT rs.workspace_id INTO ws_id
    FROM public.roadmap_snapshots rs
    WHERE rs.id = NEW.snapshot_id;

    INSERT INTO public.audit_events (workspace_id, actor_user_id, action, payload)
    VALUES (
      ws_id,
      NEW.user_id,
      'reviewer_submitted',
      jsonb_build_object(
        'snapshot_id', NEW.snapshot_id,
        'reviewer_user_id', NEW.user_id,
        'submitted_at', NEW.submitted_at
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE INDEX IF NOT EXISTS jalons_workspace_id_idx ON public.jalons (workspace_id);
CREATE INDEX IF NOT EXISTS invitations_workspace_id_idx ON public.invitations (workspace_id);
CREATE INDEX IF NOT EXISTS plan_de_charge_workspace_id_idx ON public.plan_de_charge (workspace_id);
CREATE INDEX IF NOT EXISTS users_email_lower_idx ON public.users (lower(email));
