-- Réaligner la contrainte sur `jalons.axe` avec l'application (4 axes en MAJUSCULES).
-- À exécuter dans Supabase → SQL Editor si l'insert jalon échoue avec :
--   new row for relation "jalons" violates check constraint "jalons_axe_check"
--
-- Causes fréquentes :
--   - contrainte avec d'autres libellés (français, casse, ancienne maquette) ;
--   - plusieurs CHECK sur `axe` (contrainte de colonne + contrainte de table, noms jalons_axe_check1, etc.).

-- Supprimer toute contrainte CHECK sur public.jalons dont la définition mentionne la colonne axe
-- (évite de laisser une ancienne contrainte de colonne après migration).
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'jalons'
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%axe%'
  LOOP
    EXECUTE format('ALTER TABLE public.jalons DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;

-- Données existantes : aligner les libellés connus avant de recréer la contrainte stricte
UPDATE public.jalons SET axe = 'PROCESSUS' WHERE axe IS NOT NULL AND upper(trim(axe)) IN ('PROCESSUS', 'P', '1');
UPDATE public.jalons SET axe = 'ORGANISATION' WHERE axe IS NOT NULL AND upper(trim(axe)) IN ('ORGANISATION', 'O', '2');
UPDATE public.jalons SET axe = 'OUTILS' WHERE axe IS NOT NULL AND upper(trim(axe)) IN ('OUTILS', 'OUTIL', 'I', '3');
UPDATE public.jalons SET axe = 'KPI' WHERE axe IS NOT NULL AND upper(trim(axe)) IN ('KPI', 'KPIS', 'K', '4');

ALTER TABLE public.jalons
  ADD CONSTRAINT jalons_axe_check
  CHECK (axe IS NULL OR axe IN ('PROCESSUS', 'ORGANISATION', 'OUTILS', 'KPI'));

COMMENT ON CONSTRAINT jalons_axe_check ON public.jalons IS
  'Axes roadmap : PROCESSUS, ORGANISATION, OUTILS, KPI (aligné src/lib/types.ts Axe).';
