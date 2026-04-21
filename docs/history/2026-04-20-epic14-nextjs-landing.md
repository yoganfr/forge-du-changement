# Session historique - EPIC 14 Next.js Landing

Date: 20 avril 2026  
Statut: Session terminee - livraison validee

## 1) Contexte et objectif

Objectif de session: mettre en place une app Next.js App Router separee du dashboard Vite pour servir des pages publiques SEO de workspace, avec securite opt-in (`is_public`) et cout d'exploitation minimal.

Contexte architecture:

- Dashboard existant: Vite SPA (`src/`)
- Nouveau canal SEO: Next.js (`web/`)
- Deploiements Vercel separes

## 2) Decisions prises

- Conserver une architecture hybride Vite + Next.js (pas de migration complete).
- Utiliser ISR on-demand (`revalidate=3600`) plutot que prerender massif.
- Utiliser un client Supabase admin server-only pour la landing, avec filtre explicite `is_public=true` et `archived=false`.
- Garder `is_public=false` par defaut (publication explicite, privacy by design).
- Standardiser les variables d'environnement, notamment `NEXT_PUBLIC_SITE_URL` et `SUPABASE_SERVICE_ROLE_KEY`.

## 3) Changements realises

Infrastructure:

- Creation de `web/` (Next.js App Router + TypeScript + Tailwind).
- Ajout de `@supabase/supabase-js`.
- Configuration `turbopack.root` pour eviter les warnings de lockfiles multiples.

Fonctionnel/SEO:

- Route dynamique `web/app/workspace/[id]/page.tsx`.
- Metadata dynamique (title, description, Open Graph, Twitter, canonical, robots).
- JSON-LD Organization sur page workspace.
- `web/app/sitemap.ts` dynamique (workspaces publics uniquement).
- `web/app/robots.ts` avec sitemap dynamique.
- Cache React (`cache(...)`) pour mutualiser les fetchs.

Securite:

- Filtres explicites sur la landing: `is_public=true` + `archived=false`.
- 404 homogene pour workspace inexistant ou prive.
- Service role conserve server-side uniquement.

Configuration:

- Variable `NEXT_PUBLIC_SITE_URL` avec fallback `http://localhost:3000`.
- Renommage `SUPABASE_SERVICE_KEY` -> `SUPABASE_SERVICE_ROLE_KEY`.
- Mise a jour de la doc `web/README.md`.

## 4) Tests et validations

- `npm run lint` (web): OK
- `npm run build` (web): OK
- Smoke tests local:
  - `/robots.txt`: OK
  - `/sitemap.xml`: OK
  - `/workspace/{id-test}`: 404 attendue si non public

Validations metier:

- Donnees de test uniquement (workspace de demonstration).
- Base confirmee en mode prive par defaut.
- Aucun leak d'information sur les workspaces non publics.

## 5) Risques / limites restantes

- `sitemap.xml` peut refleter un etat precedent le temps de la revalidation (24h).
- `LandingTimeline` non implementee (placeholder present).
- Homepage commerciale `web/app/page.tsx` a construire.
- CTA intelligent (deep-link auth / modal sinon) a finaliser.

## 6) URLs et environnements impactes

- Dashboard Vite: `https://forge-du-changement.vercel.app`
- Landing Next.js (session): `https://forge-du-changement-kgyg-xi.vercel.app`
- Local landing: `http://localhost:3000`

## 7) Prochaines etapes

Maintenant:

1. EPIC 14 - REF-73/74/75 (timeline, hero responsive, CTA intelligent)
2. EPIC 3 - REF-7 (reactions/reponses)
3. EPIC 2 - REF-3 (Gantt macro consolide)

Apres:

4. EPIC 11 - REF-50/51 (MFA + journal import CSV)
5. EPIC 13 - REF-36 (export PDF autonome si besoin confirme)

## 8) References

- Backlog principal: `docs/backlog.md`
- Compte-rendu detaille: `docs/backlog_update_nextjs_landing_20avril2026.md`
- Regles metier roadmap: `docs/# Règles métier — Maturity Roadmap.md`
- Synthese evolutions roadmap: `docs/maturity-roadmap-synthese-evolutions-produit.md`
- Regles permissions: `docs/proposition-regles-matrice-permissions.md`
