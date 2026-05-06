# Plan REF-7b.2 — Schéma revue (Supabase)

**Spec** : [`docs/# Règles métier — REF-7b.2 Cycle de revue feedback.md`](#%20Règles%20métier%20—%20REF-7b.2%20Cycle%20de%20revue%20feedback.md)  
**DDL** : [`docs/supabase-roadmap-review-cycle.sql`](supabase-roadmap-review-cycle.sql)  
**Client API** : [`src/lib/api/roadmapReviews.ts`](../src/lib/api/roadmapReviews.ts)

## Todos

1. [ ] Appliquer / valider le SQL sur Supabase (`review_deadline`, tables, indexes).
2. [ ] Rédiger et tester les policies RLS (reviewer isolé, CODIR owner, consultant).
3. [ ] Vérifier les contraintes `target_type` (incl. `raci_chantier` si utilisé).
4. [ ] Audit trail minimal (`audit_events`) sur ouverture revue, soumission, arbitrage.
5. [ ] Recette : insert feedback bloqué après `submitted` côté RLS ou trigger.

## Notes

- L’app Vite consomme déjà les tables via `roadmapReviews.ts` ; l’écart principal reste **RLS + migration versionnée** alignée prod.
