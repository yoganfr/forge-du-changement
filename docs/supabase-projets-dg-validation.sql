-- Validation DG des projets BUILD retenus pour la Maturity Roadmap
-- Après exécution : seuls les projets avec dg_validated_transfo = true sont éligibles à la roadmap (côté app).

ALTER TABLE public.projets
  ADD COLUMN IF NOT EXISTS dg_validated_transfo boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.projets.dg_validated_transfo IS
  'Validé par le DG : le projet BUILD peut être architecturé en chantiers/jalons (Maturity Roadmap).';
