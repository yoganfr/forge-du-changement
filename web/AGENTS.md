<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Dev local — deux serveurs en parallèle

Le repo héberge **deux applications distinctes** qu'il faut lancer **dans deux terminaux séparés** :

| Terminal | CWD | Commande | Port | Rôle |
|---|---|---|---|---|
| 1 | `Le produit SaaS/` (racine) | `npm run dev` | **5173** | SPA Vite `/src` — dashboard authentifié (Supabase, RLS, modules métier) |
| 2 | `Le produit SaaS/web` | `npm run dev` | **3000** | Landing publique Next.js 16 (App Router, SSR, pages publiques workspace) |

Ne jamais faire `cd web && npm run dev` depuis le terminal racine Vite : PowerShell n'accepte pas `&&` et, surtout, couper Vite pour lancer Next.js casse la session de dev sur le dashboard. Utiliser un second onglet de terminal.

## Variables d'environnement dev

Chaque app a son propre fichier d'environnement local :

- **Racine (`.env.local`)** — Vite SPA : `VITE_SUPABASE_URL`, `VITE_SUPABASE_KEY`. Sans ce fichier, `src/lib/supabase.ts` retombe sur un fallback `https://example.supabase.co` / `dev-placeholder-key` qui provoque `ERR_NAME_NOT_RESOLVED` au clic "Se connecter".
- **`web/.env.local`** — Next.js : `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.

Les deux fichiers pointent sur le **même projet Supabase** (`kpgkxeilddeyfwiiqaha.supabase.co`). Pour répliquer `web/.env.local` vers `.env.local` racine, prendre les mêmes valeurs d'URL et d'anon key, mais renommer les variables en `VITE_*`. Les deux fichiers sont ignorés par `.gitignore` via le pattern `*.local`.

## Conventions spécifiques Next.js (ce dossier)

- **App Router** uniquement, pas de `pages/`. Server Components par défaut ; `"use client"` en tête de fichier pour les composants interactifs.
- **Polices produit** (Satoshi / Clash Display) chargées via `web/public/fonts/fonts.css` puis `<link rel="stylesheet">` dans `app/layout.tsx`. Ne pas réintroduire `@import` dans `globals.css` (incompatible Turbopack).
- **Thème** : source de vérité = `document.documentElement.dataset.theme`. Positionné par un script inline dans `<head>` **avant** hydration React, lu ensuite par `useSyncExternalStore` dans `components/ThemeToggle.tsx`. Interdit d'introduire `setState` dans un `useEffect` pour lire `localStorage` : règle ESLint `react-hooks/set-state-in-effect` (eslint-plugin-react-hooks v7).
- **SEO** : `metadataBase` = `NEXT_PUBLIC_SITE_URL`, title template `"%s | La Forge du Changement"`. Sitemap et `robots.txt` dynamiques dans `app/sitemap.ts` / `app/robots.ts`.
- **Supabase côté Next.js** : un seul client `@supabase/ssr` par scope (server/client), pour éviter le warning `Multiple GoTrueClient instances`. À consolider lors de l'EPIC 15 · REF-77.

## Workflow Git (rappel)

- Branche de travail par défaut = `main`. Signaler toute divergence avant de committer.
- Convention commit : `type(scope): action` + trailer obligatoire `Made-with: Cursor AI` (cf. `docs/git-commit-conventions.md`).
- Scopes Next.js : `web`, `ui`, `docs`, `rules`. Toujours préfixer les modifs de ce dossier par `web`.
- Push systématique après chaque commit agent, sauf demande explicite de l'utilisateur.
