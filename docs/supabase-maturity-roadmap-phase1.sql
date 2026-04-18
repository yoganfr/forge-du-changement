-- Phase 1 — Maturity Roadmap (chantiers, jalons enrichis, raci_jalons)
-- Exécuter dans Supabase SQL Editor après revue.
-- Prérequis : fonctions public.current_app_user_id(), current_member_workspace_id(), has_workspace_consultant_access(), is_platform_superadmin()

-- ---------------------------------------------------------------------------
-- chantiers
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chantiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  projet_id uuid NOT NULL REFERENCES public.projets(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  nom text NOT NULL,
  description text,
  ordre integer NOT NULL DEFAULT 1,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chantiers_projet_id_idx ON public.chantiers(projet_id);
CREATE INDEX IF NOT EXISTS chantiers_workspace_id_idx ON public.chantiers(workspace_id);

-- ---------------------------------------------------------------------------
-- jalons — colonnes roadmap (si la table existe déjà)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'jalons' AND c.relkind = 'r'
  ) THEN
    ALTER TABLE public.jalons
      ADD COLUMN IF NOT EXISTS chantier_id uuid REFERENCES public.chantiers(id) ON DELETE CASCADE,
      ADD COLUMN IF NOT EXISTS projet_id uuid REFERENCES public.projets(id) ON DELETE CASCADE,
      ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
      ADD COLUMN IF NOT EXISTS direction_id uuid REFERENCES public.directions(id),
      ADD COLUMN IF NOT EXISTS axe text CHECK (axe IN ('PROCESSUS','ORGANISATION','OUTILS','KPI')),
      ADD COLUMN IF NOT EXISTS numero text,
      ADD COLUMN IF NOT EXISTS nom text NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS description text,
      ADD COLUMN IF NOT EXISTS mois_cible integer CHECK (mois_cible BETWEEN 1 AND 12),
      ADD COLUMN IF NOT EXISTS annee_cible integer,
      ADD COLUMN IF NOT EXISTS ordre_sequentiel integer DEFAULT 1,
      ADD COLUMN IF NOT EXISTS statut text
        CHECK (statut IN ('a_venir','en_cours','realise','bloque')) DEFAULT 'a_venir',
      ADD COLUMN IF NOT EXISTS responsable text,
      ADD COLUMN IF NOT EXISTS decideur text,
      ADD COLUMN IF NOT EXISTS kpi_description text,
      ADD COLUMN IF NOT EXISTS kpi_valeur_cible text,
      ADD COLUMN IF NOT EXISTS facette text
        CHECK (facette IN ('CONCEPTUALISATION','FORMATION','ACQUISITION','PRODUCTION','COMMUNICATION','AUTRE')),
      ADD COLUMN IF NOT EXISTS jalon_dependance_id uuid REFERENCES public.jalons(id),
      ADD COLUMN IF NOT EXISTS note_contexte text,
      ADD COLUMN IF NOT EXISTS created_at timestamp without time zone DEFAULT now(),
      ADD COLUMN IF NOT EXISTS updated_at timestamp without time zone DEFAULT now();
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- raci_jalons
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.raci_jalons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jalon_id uuid NOT NULL REFERENCES public.jalons(id) ON DELETE CASCADE,
  direction_id uuid NOT NULL REFERENCES public.directions(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('PILOTE','IMPLIQUE','INFORME')),
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  UNIQUE (jalon_id, direction_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS raci_jalons_unique_pilote
  ON public.raci_jalons(jalon_id) WHERE role = 'PILOTE';

DROP TABLE IF EXISTS public.etapes_jalons CASCADE;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.chantiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raci_jalons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lf_chantiers_all" ON public.chantiers;
CREATE POLICY "lf_chantiers_all" ON public.chantiers FOR ALL TO authenticated
  USING (
    public.is_platform_superadmin()
    OR public.has_workspace_consultant_access(workspace_id)
    OR workspace_id = public.current_member_workspace_id()
  )
  WITH CHECK (
    public.is_platform_superadmin()
    OR public.has_workspace_consultant_access(workspace_id)
    OR workspace_id = public.current_member_workspace_id()
  );

-- Remplacer la policy jalons si elle existait (alignement roadmap)
DROP POLICY IF EXISTS "lf_v2_jalons_all" ON public.jalons;
DROP POLICY IF EXISTS "lf_jalons_all" ON public.jalons;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'jalons' AND c.relkind = 'r'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "lf_jalons_all"
        ON public.jalons FOR ALL TO authenticated
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
END $$;

DROP POLICY IF EXISTS "lf_raci_all" ON public.raci_jalons;
CREATE POLICY "lf_raci_all" ON public.raci_jalons FOR ALL TO authenticated
  USING (
    public.is_platform_superadmin()
    OR EXISTS (
      SELECT 1 FROM public.jalons j
      WHERE j.id = raci_jalons.jalon_id
        AND (
          public.has_workspace_consultant_access(j.workspace_id)
          OR j.workspace_id = public.current_member_workspace_id()
        )
    )
  )
  WITH CHECK (
    public.is_platform_superadmin()
    OR EXISTS (
      SELECT 1 FROM public.jalons j
      WHERE j.id = raci_jalons.jalon_id
        AND (
          public.has_workspace_consultant_access(j.workspace_id)
          OR j.workspace_id = public.current_member_workspace_id()
        )
    )
  );
