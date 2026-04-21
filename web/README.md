# La Forge du Changement — Landing publique (Next.js 16)

Application Next.js App Router servant :
- la landing publique (https://forge-du-changement-kgyg.vercel.app, alias prod),
- les pages workspace publiques `/workspace/[id]` (ISR),
- les pages de transition `/acces-membres` et `/bientot-disponible`.

Le dashboard authentifié vit dans `/src` (Vite SPA), **pas** ici — voir la racine du repo.

## Getting Started (dev local)

Le repo héberge deux applications. Il faut **deux terminaux en parallèle** :

```bash
# Terminal 1 — racine du repo (« Le produit SaaS/ »)
#  → SPA Vite, dashboard authentifié, port 5173
npm run dev

# Terminal 2 — dossier web/
#  → Landing Next.js, port 3000
cd web
npm run dev
```

- SPA Vite : http://localhost:5173 (authentification Supabase, dashboard).
- Landing Next.js : http://localhost:3000 (hero éditorial, roadmap publique, CTA mailto RDV).

Sous PowerShell, **ne pas** utiliser `&&` pour chaîner `cd web && npm run dev` (non supporté). Ouvrir un second onglet de terminal ou utiliser `;` / deux lignes.

## Variables d'environnement

Chaque application a son propre fichier d'environnement local.

### Racine (`.env.local`) — Vite SPA

```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_KEY=<anon key>
```

Sans ces variables, `src/lib/supabase.ts` retombe sur un fallback `https://example.supabase.co` qui provoque `ERR_NAME_NOT_RESOLVED` au clic "Se connecter".

### `web/.env.local` — Next.js

```
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service_role key, server-only>
```

Les deux fichiers pointent sur le **même projet Supabase**. Ne jamais exposer la service_role dans le bundle client. Les deux `.env.local` sont ignorés par `.gitignore` via le pattern `*.local`.

Pour la production, ces variables sont gérées dans le projet Vercel `forge-du-changement-kgyg` (Settings → Environment Variables). `NEXT_PUBLIC_SITE_URL` doit pointer sur le domaine final (canonique, sitemap, JSON-LD).

## Stack

- **Next.js 16.2.4** App Router, Server Components par défaut, bundler **Turbopack**.
- **React 19.2.4** avec `useSyncExternalStore` pour les états externes (cf. `components/ThemeToggle.tsx`).
- **Supabase** via `@supabase/ssr` (anon client côté client, admin côté server).
- **TypeScript 5**, **ESLint 9** (config Next via `eslint-config-next/core-web-vitals` + `/typescript`).
- **Tailwind** (utilitaires seulement) + design system maison (`app/globals.css`, tokens CSS custom properties, polices Satoshi / Clash Display dans `public/fonts/`).

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Lance `next dev` sur :3000 (Turbopack). |
| `npm run build` | Compile pour la prod (`next build`). |
| `npm run start` | Lance le serveur Node.js prod (`next start`), à utiliser après `build`. |
| `npm run lint` | ESLint sur l'ensemble du dossier (core-web-vitals + typescript). |

## Architecture

```
web/
├── app/
│   ├── layout.tsx          # Shell HTML + script anti-FOUC thème
│   ├── page.tsx            # Landing publique (RDV-only)
│   ├── globals.css         # Design system + variables CSS
│   ├── sitemap.ts          # Sitemap dynamique (workspaces publics)
│   ├── robots.ts           # Robots.txt + URL sitemap
│   ├── workspace/[id]/     # Pages workspace publiques (ISR, 404 homogène)
│   ├── acces-membres/      # Page transition "connexion"
│   └── bientot-disponible/ # Page transition "en travaux"
├── components/
│   ├── LandingNav.tsx
│   ├── LandingRoadmapTrajectoire.tsx  # Bloc roadmap (SVG + jalons + étapes)
│   └── ThemeToggle.tsx                 # useSyncExternalStore + CHANGE_EVENT
├── lib/
│   └── supabase/           # Clients SSR + server-only admin
├── public/
│   ├── fonts/              # Satoshi, Clash Display
│   └── images/             # Assets roadmap SVG
└── AGENTS.md               # Rules agent IA pour ce dossier
```

## Déploiement

- **Production (Next.js)** : projet Vercel `forge-du-changement-kgyg`, déploiement automatique sur push `main`.
- **Production (SPA Vite)** : projet Vercel `forge-du-changement`, déploiement depuis la même branche.
- `NEXT_PUBLIC_SITE_URL` détermine les URL canoniques, le sitemap et les données structurées JSON-LD : à valider sur chaque environnement.

## Documentation complémentaire

- `AGENTS.md` — règles agent IA spécifiques à ce dossier (conventions Next.js 16, thème, SEO, Supabase).
- `docs/backlog.md` (racine) — backlog produit, EPIC 14 (landing) + EPIC 15 (migration `/src` → `/web`).
- `docs/git-commit-conventions.md` (racine) — format des messages de commit et trailer `Made-with`.
