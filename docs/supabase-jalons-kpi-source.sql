-- Lien jalon KPI auto ↔ jalon parent (suivi KPI piloté depuis le parent).
-- À exécuter dans Supabase SQL Editor après revue.
-- ON DELETE CASCADE : suppression du parent supprime le reflet KPI.

ALTER TABLE public.jalons
  ADD COLUMN IF NOT EXISTS kpi_source_jalon_id uuid REFERENCES public.jalons(id) ON DELETE CASCADE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'jalons_kpi_mirror_one_per_parent'
  ) THEN
    CREATE UNIQUE INDEX jalons_kpi_mirror_one_per_parent
      ON public.jalons (kpi_source_jalon_id)
      WHERE kpi_source_jalon_id IS NOT NULL;
  END IF;
END $$;

COMMENT ON COLUMN public.jalons.kpi_source_jalon_id IS
  'Si renseigné, ce jalon (axe KPI) est le reflet auto du bloc KPI du jalon parent ; intitulé + échéance pilotés depuis le parent.';
