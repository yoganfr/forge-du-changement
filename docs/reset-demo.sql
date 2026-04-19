-- Reset leger de la sandbox interne (environnement unique)
-- Usage: SQL Editor Supabase, avant une session de recette manuelle.

BEGIN;

-- Remet a zero la validation decideur sur les projets BUILD.
UPDATE public.projets
SET dg_validated_transfo = false,
    updated_at = now()
WHERE type = 'BUILD';

-- Nettoie l'historique decideur pour repartir d'un scenario vierge.
DELETE FROM public.audit_events
WHERE action IN ('decideur_validation_set', 'decideur_validation_revoked');

COMMIT;
