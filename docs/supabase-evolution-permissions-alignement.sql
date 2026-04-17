-- =============================================================================
-- La Forge — Évolution BDD / RLS alignée sur les guidelines permissions
-- (consultants par workspace, owner / collaborateur, super admin en base,
--  audit, RLS cohérente sur les tables métier courantes)
--
-- À exécuter dans Supabase SQL Editor (idéalement sur une branche / staging d’abord).
-- Vérifier les noms de policies existantes : ce script DROP les policies lf_* connues
-- sur workspaces / users / invitations puis les remplace.
-- Administrateur espace entreprise (rôle users.admin) : inclus ici ; complément ciblé
-- possible via docs/supabase-evolution-org-admin-rls.sql si la base a été migrée avant cette évolution.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 0) Prérequis : fonctions JWT (garder si déjà présentes = CREATE OR REPLACE)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.jwt_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT NULLIF(lower(trim(auth.jwt() ->> 'email')), '')
$$;

REVOKE ALL ON FUNCTION public.jwt_email() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.jwt_email() TO authenticated;

CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id
  FROM public.users u
  WHERE lower(u.email) = public.jwt_email()
  LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.current_app_user_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_app_user_id() TO authenticated;

-- Colonne super admin (doit exister avant la fonction is_platform_superadmin qui la référence)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS is_platform_superadmin boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.users.is_platform_superadmin IS
  'Accès transversal plateforme (break-glass). À utiliser avec MFA / audit côté produit.';

UPDATE public.users
SET is_platform_superadmin = true
WHERE lower(email) IN ('yoganhedef@yahoo.fr', 'yoganhedef@gmail.com');

-- Super admin plateforme : priorité au flag en base ; repli sur emails le temps de la migration
CREATE OR REPLACE FUNCTION public.is_platform_superadmin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE lower(u.email) = public.jwt_email()
      AND (
        u.is_platform_superadmin = true
        OR lower(u.email) IN ('yoganhedef@yahoo.fr', 'yoganhedef@gmail.com')
      )
  )
$$;

REVOKE ALL ON FUNCTION public.is_platform_superadmin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_platform_superadmin() TO authenticated;

-- Membre entreprise : workspace courant depuis la ligne users
CREATE OR REPLACE FUNCTION public.current_member_workspace_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.workspace_id
  FROM public.users u
  WHERE lower(u.email) = public.jwt_email()
  LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.current_member_workspace_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_member_workspace_id() TO authenticated;

-- Administrateur de l’espace entreprise (rôle users.role = 'admin', même workspace)
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

-- ---------------------------------------------------------------------------
-- 1) Table workspace_consultants (rattachement consultant ↔ workspace)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.workspace_consultants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  level text NOT NULL CHECK (level = ANY (ARRAY['owner'::text, 'collaborator'::text])),
  status text NOT NULL DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'suspended'::text])),
  invited_by uuid REFERENCES public.users(id),
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, user_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS workspace_consultants_one_active_owner
  ON public.workspace_consultants(workspace_id)
  WHERE level = 'owner' AND status = 'active';

CREATE INDEX IF NOT EXISTS workspace_consultants_user_id_idx
  ON public.workspace_consultants(user_id);

CREATE INDEX IF NOT EXISTS workspace_consultants_workspace_id_idx
  ON public.workspace_consultants(workspace_id);

COMMENT ON TABLE public.workspace_consultants IS
  'Consultants rattachés à un workspace : owner (référent) ou collaborator. Source pour lister les entreprises accessibles et pour RLS.';

ALTER TABLE public.workspace_consultants ENABLE ROW LEVEL SECURITY;

-- Fonctions consultant ↔ workspace (après création de la table référencée)
CREATE OR REPLACE FUNCTION public.has_workspace_consultant_access(p_workspace_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_consultants wc
    WHERE wc.workspace_id = p_workspace_id
      AND wc.user_id = public.current_app_user_id()
      AND wc.status = 'active'
  )
$$;

REVOKE ALL ON FUNCTION public.has_workspace_consultant_access(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_workspace_consultant_access(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.is_workspace_consultant_owner(p_workspace_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_consultants wc
    WHERE wc.workspace_id = p_workspace_id
      AND wc.user_id = public.current_app_user_id()
      AND wc.level = 'owner'
      AND wc.status = 'active'
  )
$$;

REVOKE ALL ON FUNCTION public.is_workspace_consultant_owner(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_workspace_consultant_owner(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 3) Table audit_events (append-only côté app ; ici insert autorisé aux acteurs)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL,
  actor_user_id uuid REFERENCES public.users(id),
  action text NOT NULL,
  payload jsonb,
  created_at timestamp without time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_events_workspace_id_idx ON public.audit_events(workspace_id);
CREATE INDEX IF NOT EXISTS audit_events_created_at_idx ON public.audit_events(created_at DESC);

ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 4) Backfill workspace_consultants
--    4a) Consultants dont users.workspace_id pointe déjà vers un client
--    4b) Workspaces encore sans owner actif → premier compte is_platform_superadmin
--        (cas typique : consultant « global » avec workspace_id NULL, navigation par settings)
-- ---------------------------------------------------------------------------
INSERT INTO public.workspace_consultants (workspace_id, user_id, level, status)
SELECT u.workspace_id, u.id, 'owner', 'active'
FROM public.users u
WHERE u.role = 'consultant'
  AND u.workspace_id IS NOT NULL
ON CONFLICT (workspace_id, user_id) DO NOTHING;

INSERT INTO public.workspace_consultants (workspace_id, user_id, level, status)
SELECT w.id, sa.id, 'owner', 'active'
FROM public.workspaces w
CROSS JOIN LATERAL (
  SELECT u.id
  FROM public.users u
  WHERE u.is_platform_superadmin = true
  ORDER BY u.created_at ASC NULLS LAST, u.id
  LIMIT 1
) sa
WHERE NOT EXISTS (
  SELECT 1
  FROM public.workspace_consultants wc
  WHERE wc.workspace_id = w.id
    AND wc.level = 'owner'
    AND wc.status = 'active'
)
ON CONFLICT (workspace_id, user_id) DO UPDATE
  SET level = 'owner', status = 'active';

-- ---------------------------------------------------------------------------
-- 5) Trigger : après création d’un workspace, rattacher le consultant connecté comme owner
--    (si la ligne users existe, rôle consultant, et pas déjà d’owner actif)
-- ---------------------------------------------------------------------------
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

DROP TRIGGER IF EXISTS workspaces_assign_consultant_owner ON public.workspaces;
CREATE TRIGGER workspaces_assign_consultant_owner
  AFTER INSERT ON public.workspaces
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_workspaces_assign_consultant_owner();

-- ---------------------------------------------------------------------------
-- 6) RLS — workspace_consultants
-- ---------------------------------------------------------------------------
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

DROP POLICY IF EXISTS "lf_ws_cons_update" ON public.workspace_consultants;
CREATE POLICY "lf_ws_cons_update"
  ON public.workspace_consultants FOR UPDATE
  TO authenticated
  USING (
    public.is_platform_superadmin()
    OR public.is_workspace_consultant_owner(workspace_id)
  )
  WITH CHECK (
    public.is_platform_superadmin()
    OR public.is_workspace_consultant_owner(workspace_id)
  );

-- ---------------------------------------------------------------------------
-- 7) RLS — audit_events (lecture owner / superadmin ; insert pour acteurs du workspace)
-- ---------------------------------------------------------------------------
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

DROP POLICY IF EXISTS "lf_audit_insert" ON public.audit_events;
CREATE POLICY "lf_audit_insert"
  ON public.audit_events FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_platform_superadmin()
    OR (
      workspace_id IS NOT NULL
      AND (
        public.has_workspace_consultant_access(workspace_id)
        OR public.current_member_workspace_id() = workspace_id
      )
    )
  );

-- ---------------------------------------------------------------------------
-- 8) Remplacement policies workspaces / users / invitations (fin « tout consultant voit tout »)
-- ---------------------------------------------------------------------------
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lf_workspaces_select" ON public.workspaces;
DROP POLICY IF EXISTS "lf_workspaces_insert" ON public.workspaces;
DROP POLICY IF EXISTS "lf_workspaces_update" ON public.workspaces;
DROP POLICY IF EXISTS "lf_users_select" ON public.users;
DROP POLICY IF EXISTS "lf_users_insert" ON public.users;
DROP POLICY IF EXISTS "lf_users_update" ON public.users;
DROP POLICY IF EXISTS "lf_invitations_select" ON public.invitations;
DROP POLICY IF EXISTS "lf_invitations_insert" ON public.invitations;
DROP POLICY IF EXISTS "lf_invitations_update" ON public.invitations;
DROP POLICY IF EXISTS "lf_invitations_select_own_email" ON public.invitations;
DROP POLICY IF EXISTS "lf_invitations_update_invitee_own_email" ON public.invitations;
-- Ré-exécution du script : retirer les lf_v2_* déjà posées
DROP POLICY IF EXISTS "lf_v2_workspaces_select" ON public.workspaces;
DROP POLICY IF EXISTS "lf_v2_workspaces_insert" ON public.workspaces;
DROP POLICY IF EXISTS "lf_v2_workspaces_update" ON public.workspaces;
DROP POLICY IF EXISTS "lf_v2_workspaces_delete" ON public.workspaces;
DROP POLICY IF EXISTS "lf_v2_users_select" ON public.users;
DROP POLICY IF EXISTS "lf_v2_users_insert" ON public.users;
DROP POLICY IF EXISTS "lf_v2_users_update" ON public.users;
DROP POLICY IF EXISTS "lf_v2_invitations_select" ON public.invitations;
DROP POLICY IF EXISTS "lf_v2_invitations_insert" ON public.invitations;
DROP POLICY IF EXISTS "lf_v2_invitations_update" ON public.invitations;
DROP POLICY IF EXISTS "lf_v2_invitations_update_own_email" ON public.invitations;

-- workspaces
CREATE POLICY "lf_v2_workspaces_select"
  ON public.workspaces FOR SELECT
  TO authenticated
  USING (
    public.is_platform_superadmin()
    OR public.has_workspace_consultant_access(id)
    OR id = public.current_member_workspace_id()
  );

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

CREATE POLICY "lf_v2_workspaces_delete"
  ON public.workspaces FOR DELETE
  TO authenticated
  USING (
    public.is_platform_superadmin()
    OR public.is_workspace_consultant_owner(id)
  );

-- users
CREATE POLICY "lf_v2_users_select"
  ON public.users FOR SELECT
  TO authenticated
  USING (
    public.is_platform_superadmin()
    OR lower(email) = public.jwt_email()
    OR (
      workspace_id IS NOT NULL
      AND (
        public.has_workspace_consultant_access(workspace_id)
        OR workspace_id = public.current_member_workspace_id()
      )
    )
  );

CREATE POLICY "lf_v2_users_insert"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_platform_superadmin()
    OR (
      workspace_id IS NOT NULL
      AND (
        public.has_workspace_consultant_access(workspace_id)
        OR public.current_member_workspace_id() = workspace_id
      )
    )
  );

CREATE POLICY "lf_v2_users_update"
  ON public.users FOR UPDATE
  TO authenticated
  USING (
    public.is_platform_superadmin()
    OR lower(email) = public.jwt_email()
    OR (
      workspace_id IS NOT NULL
      AND (
        public.has_workspace_consultant_access(workspace_id)
        OR public.current_member_workspace_id() = workspace_id
      )
    )
  )
  WITH CHECK (
    public.is_platform_superadmin()
    OR lower(email) = public.jwt_email()
    OR (
      workspace_id IS NOT NULL
      AND (
        public.has_workspace_consultant_access(workspace_id)
        OR public.current_member_workspace_id() = workspace_id
      )
    )
  );

-- invitations
CREATE POLICY "lf_v2_invitations_select"
  ON public.invitations FOR SELECT
  TO authenticated
  USING (
    public.is_platform_superadmin()
    OR lower(email) = public.jwt_email()
    OR (
      workspace_id IS NOT NULL
      AND (
        public.has_workspace_consultant_access(workspace_id)
        OR workspace_id = public.current_member_workspace_id()
      )
    )
  );

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

-- Une seule policy UPDATE : consultants / membres + invité (email JWT, ligne en attente)
CREATE POLICY "lf_v2_invitations_update"
  ON public.invitations FOR UPDATE
  TO authenticated
  USING (
    public.is_platform_superadmin()
    OR (
      workspace_id IS NOT NULL
      AND (
        public.has_workspace_consultant_access(workspace_id)
        OR workspace_id = public.current_member_workspace_id()
      )
    )
    OR (lower(email) = public.jwt_email() AND status = 'en_attente')
  )
  WITH CHECK (
    public.is_platform_superadmin()
    OR (
      workspace_id IS NOT NULL
      AND (
        public.has_workspace_consultant_access(workspace_id)
        OR workspace_id = public.current_member_workspace_id()
      )
    )
    OR (lower(email) = public.jwt_email())
  );

-- ---------------------------------------------------------------------------
-- 9) RLS — tables métier (si pas encore protégées : activer + policies homogènes)
--     Ajuster si certaines tables n’existent pas dans ton projet.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  -- directions
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE n.nspname = 'public' AND c.relname = 'directions' AND c.relkind = 'r') THEN
    EXECUTE 'ALTER TABLE public.directions ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "lf_v2_directions_all" ON public.directions';
    EXECUTE $p$
      CREATE POLICY "lf_v2_directions_all"
        ON public.directions FOR ALL
        TO authenticated
        USING (
          public.is_platform_superadmin()
          OR (workspace_id IS NOT NULL AND public.has_workspace_consultant_access(workspace_id))
          OR workspace_id = public.current_member_workspace_id()
        )
        WITH CHECK (
          public.is_platform_superadmin()
          OR (workspace_id IS NOT NULL AND public.has_workspace_consultant_access(workspace_id))
          OR workspace_id = public.current_member_workspace_id()
        )
    $p$;
  END IF;

  -- projets
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE n.nspname = 'public' AND c.relname = 'projets' AND c.relkind = 'r') THEN
    EXECUTE 'ALTER TABLE public.projets ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "lf_v2_projets_all" ON public.projets';
    EXECUTE $p$
      CREATE POLICY "lf_v2_projets_all"
        ON public.projets FOR ALL
        TO authenticated
        USING (
          public.is_platform_superadmin()
          OR (workspace_id IS NOT NULL AND public.has_workspace_consultant_access(workspace_id))
          OR workspace_id = public.current_member_workspace_id()
        )
        WITH CHECK (
          public.is_platform_superadmin()
          OR (workspace_id IS NOT NULL AND public.has_workspace_consultant_access(workspace_id))
          OR workspace_id = public.current_member_workspace_id()
        )
    $p$;
  END IF;

  -- jalons
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE n.nspname = 'public' AND c.relname = 'jalons' AND c.relkind = 'r') THEN
    EXECUTE 'ALTER TABLE public.jalons ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "lf_v2_jalons_all" ON public.jalons';
    EXECUTE $p$
      CREATE POLICY "lf_v2_jalons_all"
        ON public.jalons FOR ALL
        TO authenticated
        USING (
          public.is_platform_superadmin()
          OR (workspace_id IS NOT NULL AND public.has_workspace_consultant_access(workspace_id))
          OR workspace_id = public.current_member_workspace_id()
        )
        WITH CHECK (
          public.is_platform_superadmin()
          OR (workspace_id IS NOT NULL AND public.has_workspace_consultant_access(workspace_id))
          OR workspace_id = public.current_member_workspace_id()
        )
    $p$;
  END IF;

  -- plan_de_charge
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE n.nspname = 'public' AND c.relname = 'plan_de_charge' AND c.relkind = 'r') THEN
    EXECUTE 'ALTER TABLE public.plan_de_charge ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "lf_v2_plan_de_charge_all" ON public.plan_de_charge';
    EXECUTE $p$
      CREATE POLICY "lf_v2_plan_de_charge_all"
        ON public.plan_de_charge FOR ALL
        TO authenticated
        USING (
          public.is_platform_superadmin()
          OR (workspace_id IS NOT NULL AND public.has_workspace_consultant_access(workspace_id))
          OR workspace_id = public.current_member_workspace_id()
        )
        WITH CHECK (
          public.is_platform_superadmin()
          OR (workspace_id IS NOT NULL AND public.has_workspace_consultant_access(workspace_id))
          OR workspace_id = public.current_member_workspace_id()
        )
    $p$;
  END IF;

  -- raci_projets (accès via projet → workspace)
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE n.nspname = 'public' AND c.relname = 'raci_projets' AND c.relkind = 'r') THEN
    EXECUTE 'ALTER TABLE public.raci_projets ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "lf_v2_raci_projets_all" ON public.raci_projets';
    EXECUTE $p$
      CREATE POLICY "lf_v2_raci_projets_all"
        ON public.raci_projets FOR ALL
        TO authenticated
        USING (
          public.is_platform_superadmin()
          OR EXISTS (
            SELECT 1 FROM public.projets p
            WHERE p.id = raci_projets.projet_id
              AND (
                public.has_workspace_consultant_access(p.workspace_id)
                OR p.workspace_id = public.current_member_workspace_id()
              )
          )
        )
        WITH CHECK (
          public.is_platform_superadmin()
          OR EXISTS (
            SELECT 1 FROM public.projets p
            WHERE p.id = raci_projets.projet_id
              AND (
                public.has_workspace_consultant_access(p.workspace_id)
                OR p.workspace_id = public.current_member_workspace_id()
              )
          )
        )
    $p$;
  END IF;
END;
$$;

-- Retirer l’ancienne fonction « tout consultant » si elle existe encore
DROP FUNCTION IF EXISTS public.is_platform_consultant();

COMMIT;

-- =============================================================================
-- Après exécution — checklist app / données
-- =============================================================================
-- 1) Vérifier qu’il y a bien une ligne owner par workspace existant (sinon INSERT manuel).
--    Si COUNT(workspace_consultants)=0 : souvent consultants avec workspace_id NULL ; le script
--    inclut un backfill super-admin ; sinon exécuter docs/supabase-backfill-workspace-consultants-only.sql
-- 2) Pour rattacher un 2e consultant sur un client : INSERT dans workspace_consultants
--    (workspace_id, user_id, 'collaborator', 'active') en étant connecté comme owner.
-- 3) Mettre à jour l’app : listWorkspaces() = SELECT workspaces visibles via RLS (plus besoin
--    de lister « tous » les workspaces pour tout consultant).
-- 4) Retirer les emails en dur dans is_platform_superadmin() une fois is_platform_superadmin rempli.
-- 5) Si trigger AFTER INSERT sur workspaces pose souci (imports service_role), désactiver le trigger
--    sur les chemins d’administration ou utiliser service_role pour les migrations bulk.
