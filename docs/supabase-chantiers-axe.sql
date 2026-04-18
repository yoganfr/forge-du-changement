-- Chantiers : type (axe) défini par la zone de création dans la roadmap.
-- À exécuter dans Supabase SQL Editor après revue.
-- Les chantiers existants restent avec axe NULL (comportement historique : visibles sur les 4 axes).

ALTER TABLE public.chantiers
  ADD COLUMN IF NOT EXISTS axe text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chantiers_axe_check'
  ) THEN
    ALTER TABLE public.chantiers
      ADD CONSTRAINT chantiers_axe_check
      CHECK (axe IS NULL OR axe IN ('PROCESSUS', 'ORGANISATION', 'OUTILS', 'KPI'));
  END IF;
END $$;

COMMENT ON COLUMN public.chantiers.axe IS
  'Axe de roadmap (Processus / Organisation / Outils / KPI) : zone où le chantier a été créé. NULL = données antérieures à cette colonne.';
