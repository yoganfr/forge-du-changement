-- Réaligner la contrainte `jalons_axe_check` avec l'application (4 axes en MAJUSCULES).
-- À exécuter dans Supabase → SQL Editor si l'insert jalon échoue avec :
--   new row for relation "jalons" violates check constraint "jalons_axe_check"
--
-- Cause fréquente : contrainte créée avec d'autres libellés (français, casse, ancienne maquette).

ALTER TABLE public.jalons DROP CONSTRAINT IF EXISTS jalons_axe_check;

-- Si vous aviez des valeurs hors liste, ajuster avant le ADD ci-dessous (exemples) :
-- UPDATE public.jalons SET axe = 'PROCESSUS' WHERE axe ILIKE 'processus%';
-- UPDATE public.jalons SET axe = 'KPI' WHERE axe ILIKE 'kpi%';

ALTER TABLE public.jalons
  ADD CONSTRAINT jalons_axe_check
  CHECK (axe IS NULL OR axe IN ('PROCESSUS', 'ORGANISATION', 'OUTILS', 'KPI'));

COMMENT ON CONSTRAINT jalons_axe_check ON public.jalons IS
  'Axes roadmap : PROCESSUS, ORGANISATION, OUTILS, KPI (aligné src/lib/types.ts Axe).';
