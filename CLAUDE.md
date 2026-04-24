# CLAUDE.md — La Forge du Changement

Point d'entrée pour Claude Code. À lire en entier avant toute action.

## 1. Identité produit et stack

**Produit** : SaaS d'accompagnement de transformations d'entreprise. Module cœur = **Maturity Roadmap**. Cibles : DG, CODIR, consultants, managers terrain.

**Stack en cohabitation** :

| Dossier | App | Port | Projet Vercel |
|---------|-----|------|---------------|
| `/src` | SPA React + Vite + TypeScript — dashboard authentifié | 5173 | `forge-du-changement.vercel.app` |
| `/web` | Next.js 16 App Router + Tailwind v4 — landing publique + SEO | 3000 | `forge-du-changement-kgyg-xi.vercel.app` |

Backend : **Supabase** (Postgres + RLS + Auth + Storage). Repo : `yoganfr/forge-du-changement`, branche prod = `main`.

## 2. Lancer le projet en local

Par défaut, ne lancer que le dashboard Vite. Le serveur Next.js local de `/web` a déjà provoqué une cascade de processus `node.exe` et une saturation mémoire.

```bash
# Racine — dashboard authentifié stable
npm run dev          # SPA Vite → http://localhost:5173
```

`/web` reste déployé par Vercel et validé via `npm run build`. Son lancement local est volontairement bloqué :

```bash
cd web
npm run dev          # bloqué volontairement
npm run dev:manual   # uniquement si lancement local explicitement assumé
```

Variables d'environnement :
- `.env.local` (racine) : `VITE_SUPABASE_URL`, `VITE_SUPABASE_KEY`
- `web/.env.local` : `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`

Les deux pointent sur le même projet Supabase (`kpgkxeilddeyfwiiqaha.supabase.co`).

## 3. Docs à lire selon la demande

Avant toute action, lire les docs pertinents :

| Type de demande | Doc à lire |
|-----------------|------------|
| Toujours | [docs/git-commit-conventions.md](docs/git-commit-conventions.md) |
| Règles métier roadmap | [docs/# Règles métier — Maturity Roadmap.md](docs/#%20Règles%20métier%20—%20Maturity%20Roadmap.md) |
| Évolution produit / EPICs / backlog | [docs/backlog.md](docs/backlog.md) |
| Refactor / restructuration | [docs/refactor_rules.md](docs/refactor_rules.md) |
| Permissions / rôles / RACI | [docs/proposition-regles-matrice-permissions.md](docs/proposition-regles-matrice-permissions.md) |
| UI / CSS / design system | [docs/visual-coherence-theme-rules.md](docs/visual-coherence-theme-rules.md) |
| Copywriting landing | [docs/copywriting V3.md](docs/copywriting%20V3.md) |
| Synthèse produit / roadmap phases | [docs/maturity-roadmap-synthese-evolutions-produit.md](docs/maturity-roadmap-synthese-evolutions-produit.md) |

## 4. Points d'entrée code

**Dashboard (`/src`)** :
- [src/App.tsx](src/App.tsx), [src/MaturityRoadmap.tsx](src/MaturityRoadmap.tsx), [src/RoadmapTimelineGrid.tsx](src/RoadmapTimelineGrid.tsx)
- [src/ProjectSelector.tsx](src/ProjectSelector.tsx), [src/pages/DashboardDG.tsx](src/pages/DashboardDG.tsx), [src/pages/Login.tsx](src/pages/Login.tsx)
- API : [src/lib/api.ts](src/lib/api.ts) + [src/lib/api/roadmap.ts](src/lib/api/roadmap.ts), [src/lib/api/workspaces.ts](src/lib/api/workspaces.ts)
- Types et tokens CSS : [src/lib/types.ts](src/lib/types.ts), [src/themes.css](src/themes.css), [src/design-system.css](src/design-system.css)

**Landing (`/web`)** :
- [web/app/page.tsx](web/app/page.tsx), [web/components/LandingNav.tsx](web/components/LandingNav.tsx)
- [web/app/workspace/[id]/page.tsx](web/app/workspace/%5Bid%5D/page.tsx), [web/lib/supabase.ts](web/lib/supabase.ts)

## 5. Règles d'or

**Refactor** : aucune modification sans problème concret. Si le gain ne tient pas en une phrase simple, ne pas faire. Règle : Supprimer > Simplifier > Ajouter.

**Thème** : jamais hardcoder couleurs / typo / espacement / radius / ombres. Toujours via variables CSS tokens. Valider en `[data-theme='light']` ET `[data-theme='dark']`.

**Permissions** : consulter la matrice avant toute décision sur la Vue décideur, les invitations, la fiche entreprise. Rôles : `superadmin / consultant / admin / pilote` voient la Vue décideur ; `codir / contributeur` non.

**RLS Supabase** : toute nouvelle table ou colonne sensible doit avoir une policy RLS explicite. Ne jamais utiliser `SUPABASE_SERVICE_ROLE_KEY` côté client. Dans `/web`, le client admin (bypass RLS) sert uniquement les pages publiques (`is_public=true`).

**Next.js 16** : breaking changes vs versions précédentes (ex. `params: Promise<...>` dans les pages dynamiques). Lire [web/AGENTS.md](web/AGENTS.md) avant d'écrire du code Next.js.

**Ambiguïté** : en cas de doute métier ou de conflit entre deux docs, signaler et demander confirmation avant d'implémenter.

## 6. Architecture pendant la migration /src → /web (EPIC 15)

- Modification dashboard → reste dans `/src`. Pas de duplicata dans `/web` sans vague EPIC 15.
- Modification landing / SEO / page publique → reste dans `/web`.
- Nouvel écran → consulter EPIC 15 du backlog avant de choisir la cible.
- `/web` garde une copie locale de `src/themes.css` dans `web/app/themes.css` pour éviter les imports cross-app en dev. Toute évolution des tokens doit synchroniser explicitement les deux fichiers ou traiter la dette REF-76.

## 7. Git workflow

Format : `type(scope): action courte orientée métier` en français, ≤ 72 caractères, sans point final.

Types : `feat / fix / refactor / style / perf / test / docs / chore`

Scopes : `dg / roadmap / selector / gantt / auth / supabase / rls / ui / docs / rules / web`

Trailer obligatoire pour les commits agent :
```
Made-with: Claude Code
```

Push systématique après chaque commit agent, sauf demande explicite contraire.

Branche de travail = `main`. Si divergence avec `origin/main`, signaler avant de committer.

## 8. Horodatage France

Pour toute ligne "Dernière mise à jour" dans les docs, obtenir l'heure réelle :

```bash
node -e "const d=new Date(),z='Europe/Paris';const p=new Intl.DateTimeFormat('fr-FR',{timeZone:z,day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(d);const day=p.find(x=>x.type==='day').value,month=p.find(x=>x.type==='month').value,year=p.find(x=>x.type==='year').value,h=String(p.find(x=>x.type==='hour').value).padStart(2,'0'),m=String(p.find(x=>x.type==='minute').value).padStart(2,'0');console.log('Dernière mise à jour : **'+day+' '+month+' '+year+'**, '+h+' h '+m+' (Europe/Paris)');"
```

Ne jamais inventer une date ou une heure.
