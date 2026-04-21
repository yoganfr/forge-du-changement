# Session historique — EPIC 14 homepage publique et composants visuels

Date : 21 avril 2026  
Statut : terminée (livraison code documentée ; REF-74 / REF-75 à poursuivre)

## 1) Contexte et objectif

Objectif de session : livrer la **homepage commerciale** sur le site Next.js (`web/`), intégrer le **bloc trajectoire / roadmap** (route verticale + jalons + étapes) et poser les **fondations visuelles** (typographies, navigation, thème) alignées sur la direction éditoriale.

Contexte :

- Les fondations SEO **workspace** (`/workspace/[id]`, sitemap, robots, etc.) étaient déjà en place (session du 20 avril 2026).
- Le fichier `docs/history/2026-04-20-epic14-nextjs-landing.md` indiquait notamment homepage à construire et `LandingTimeline` non implémentée.
- Le backlog référence les tâches **EPIC 14 · REF-73 à REF-75** (trajectoire, images hero responsive, CTA conversion).

## 2) Décisions prises

- Nommer le composant de trajectoire **`LandingRoadmapTrajectoire`** (et non `LandingTimeline`) : grille route SVG + pins + cartes par étape, statuts `done` / `current` / `upcoming`, réutilisable pour d’autres pages publiques.
- Utiliser les familles **Satoshi** (corps) et **Clash Display** (titres landing) servies depuis `web/public/fonts/` plutôt que de réutiliser Playfair/Inter du dashboard Vite sur cette homepage.
- **CTA principal** : contact par **mailto** (`#rdv` + section CTA) ; entrée **« Déjà membre ? »** vers **`/acces-membres`** (page de transition), sans deep-link conditionnel vers le dashboard dans cette itération (**REF-75** reste ouvert).
- Conserver **clair / sombre** sur la landing via **`ThemeToggle`**, cohérent avec l’expérience produit.

## 3) Changements réalisés

**Fonctionnel / UX**

- `web/app/page.tsx` : homepage en sections (hero, constat, miroir, tension, bascule, piliers Clarifier / Aligner / Piloter, bloc « Une transformation visible » + `LandingRoadmapTrajectoire`, moment de décision, CTA rendez-vous, filtre « Pour qui », footer).
- `web/components/LandingNav.tsx` : marque, lien « Prendre rendez-vous » vers `/#rdv`, « Se connecter » → `/acces-membres`, menu mobile (overlay + Escape), `ThemeToggle`.
- `web/components/LandingRoadmapTrajectoire.tsx` : assemblage visuel route + jalons + textes d’étapes ; URLs d’assets sous `/images/SVG roadmap assets/`.
- `web/app/acces-membres/page.tsx` et `web/app/bientot-disponible/page.tsx` : pages placeholder expliquant la migration du parcours membre vers Next.js.

**Visuel / assets**

- `web/public/fonts/` : fichiers `.woff2` + `fonts.css` (Satoshi, Clash Display).
- `web/public/images/` : PNG (ex. route, repères) et SVG roadmap pour le bloc trajectoire.

**Technique**

- `web/app/layout.tsx`, `web/app/globals.css` : intégration des polices et styles landing.
- `web/next.config.ts` : ajustements de configuration au besoin pour le build / assets.

**Documentation produit**

- `docs/backlog.md` : mise à jour statut **EPIC 14** (PARTIEL), **REF-73** ✅, **REF-74** 🚧, **REF-75** ⬜, journal d’avancement, priorisation « Maintenant », liste des composants `web/`.

**Git**

- Commit applicatif : `51c390e` — `feat(web): finaliser la homepage publique et ses composants visuels`.

## 4) Tests et validations

- Build / lint : à valider dans l’environnement local (`web/`) après tirage de la branche.
- Vérifications manuelles recommandées : `/` (homepage), `/#rdv`, `/acces-membres`, `/bientot-disponible`, bascule thème, rendu du bloc trajectoire (desktop + mobile).

**Validations métier**

- Reprise des messages et de la structure éditoriale alignées sur le copywriting landing (hors périmètre de ce fichier si détaillé ailleurs).

## 5) Risques / limites restantes

- **REF-74** : pas encore de jeux d’images hero distincts desktop / tablette / mobile si le backlog exige des variantes explicites par breakpoint.
- **REF-75** : pas de détection de session ni de redirection vers le dashboard Vite ; pas de modal « créer un compte » sur la landing.
- Pages **acces-membres** / **bientot-disponible** : texte de transition ; connexion réelle à Supabase / workspace à brancher ultérieurement.

## 6) URLs et environnements impactés

- Local : `http://localhost:3000` (app Next.js `web/`)
- Preview / prod : selon projet Vercel lié au dossier `web/` (voir `web/README.md` et tableau backlog pour les URL historiques)

## 7) Prochaines étapes

**Maintenant**

1. Finaliser **REF-74** (hero responsive si besoin métier) et **REF-75** (CTA intelligent).
2. Brancher **acces-membres** sur le flux d’auth réel lorsque le parcours unique Next.js sera prêt.

**Après**

3. Recette visuelle cross-navigateurs et accessibilité (focus, contrastes) sur la homepage.

## 8) Références

- Backlog : `docs/backlog.md`
- Session EPIC 14 fondations : `docs/history/2026-04-20-epic14-nextjs-landing.md`
- Commit : `51c390e`
