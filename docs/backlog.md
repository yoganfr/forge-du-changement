# Backlog — La Forge du Changement
Dernière mise à jour : 21 avril 2026

## Convention de notation

| Préfixe | Signification |
|--------|----------------|
| **`REF-n`** | Identifiant de **tâche dans ce document** : numéro de la colonne *REF* du tableau de l’EPIC concerné (ex. `REF-36` = export Vue Synthèse dans **EPIC 13**). Toujours lire une REF **avec son EPIC** ; seul cas ambigu documenté ici : **`REF-41`** existe à la fois en **EPIC 2** (validation décideur) et en **EPIC 10** (super-admin) — utiliser « EPIC 2 · REF-41 » ou « EPIC 10 · REF-41 ». |
| **`GH-n`** | Numéro d’[**issue GitHub**](https://github.com/yoganfr/forge-du-changement/issues) sur `yoganfr/forge-du-changement`. |
| **`EPIC k`** | Bloc thématique du backlog (priorisation et périmètre). |

Les valeurs **`REF-*`** et **`GH-*`** sont indépendantes (ex. `GH-11` = plan de charge côté GitHub, alors que **`REF-11`** en **EPIC 4** = actions PAE).

## Traçabilité GitHub ([yoganfr/forge-du-changement](https://github.com/yoganfr/forge-du-changement))

### Jeu historique (GH-1–GH-15)

Comparaison du **20 avril 2026** : les issues dont le périmètre est ✅ dans le backlog ont été **fermées** sur GitHub avec un commentaire de référence à ce fichier.

| GH | État (après sync) | Tâche backlog (REF) / commentaire |
|----|-------------------|-----------------------------------|
| [GH-1](https://github.com/yoganfr/forge-du-changement/issues/1) | Fermée | EPIC 2 · REF-1 — dashboard consolidé ✅ |
| [GH-2](https://github.com/yoganfr/forge-du-changement/issues/2) | Fermée | EPIC 2 · REF-2 — top 5 BUILD ✅ |
| [GH-3](https://github.com/yoganfr/forge-du-changement/issues/3) | Ouverte | EPIC 2 · REF-3 — Gantt macro consolidé ⬜ |
| [GH-4](https://github.com/yoganfr/forge-du-changement/issues/4) | Fermée | EPIC 3 · REF-4 — 4 axes ✅ |
| [GH-5](https://github.com/yoganfr/forge-du-changement/issues/5) | Fermée | EPIC 3 · REF-5 — jalons ✅ |
| [GH-6](https://github.com/yoganfr/forge-du-changement/issues/6) | Fermée | EPIC 3 · REF-6 — macro RACI ✅ |
| [GH-7](https://github.com/yoganfr/forge-du-changement/issues/7) | Ouverte | EPIC 3 · REF-7 — réactions / réponses ⬜ |
| [GH-8](https://github.com/yoganfr/forge-du-changement/issues/8) | Fermée | EPIC 3 · REF-8 — vue matrice ✅ |
| [GH-9](https://github.com/yoganfr/forge-du-changement/issues/9) | Fermée | EPIC 3 · REF-9 — dépendances (données conservées, UI masquée) ✅ |
| [GH-10](https://github.com/yoganfr/forge-du-changement/issues/10) | Ouverte | EPIC 4 · REF-10 — PAE structure ⬜ |
| [GH-11](https://github.com/yoganfr/forge-du-changement/issues/11) | Ouverte | EPIC 5 · REF-14 — plan de charge (grille) ⬜ |
| [GH-12](https://github.com/yoganfr/forge-du-changement/issues/12) | Fermée | EPIC 10 · REF-33 — auth réelle ✅ |
| [GH-13](https://github.com/yoganfr/forge-du-changement/issues/13) | Fermée | EPIC 10 · REF-35 — Vercel ✅ |
| [GH-14](https://github.com/yoganfr/forge-du-changement/issues/14) | Ouverte | EPIC 13 · REF-36 — export PDF / impression navigateur 🚧 |
| [GH-15](https://github.com/yoganfr/forge-du-changement/issues/15) | Ouverte | EPIC 6 · REF-17 — module SENS (diagnostic) ⬜ |

### Extensions (GH-16+ — avril 2026)

Issues créées pour ancrer les lots **hors jeu GH-1–GH-15**. **GH-16** et **GH-17** sont des *jalons de livraison* refermées tout de suite ; le reste est **ouvert** tant que le backlog indique ⬜ ou 🚧.

| GH | État | Tâche backlog (REF) / commentaire |
|----|------|-----------------------------------|
| [GH-16](https://github.com/yoganfr/forge-du-changement/issues/16) | Fermée | EPIC 10 · REF-38–46 — permissions / audit / scaling ✅ (jalon GitHub) |
| [GH-17](https://github.com/yoganfr/forge-du-changement/issues/17) | Fermée | EPIC 11 · REF-47–49 — invitations v1 ✅ (jalon GitHub) |
| [GH-18](https://github.com/yoganfr/forge-du-changement/issues/18) | Ouverte | EPIC 11 · REF-50 — MFA super-admin ⬜ |
| [GH-19](https://github.com/yoganfr/forge-du-changement/issues/19) | Ouverte | EPIC 11 · REF-51 — journal import lot CSV en UI ⬜ |
| [GH-20](https://github.com/yoganfr/forge-du-changement/issues/20) | Ouverte | EPIC 12 · REF-52–58 — design premium ⬜ |
| [GH-21](https://github.com/yoganfr/forge-du-changement/issues/21) | Ouverte | EPIC 4 · REF-11–13 — PAE suite (complète [GH-10](https://github.com/yoganfr/forge-du-changement/issues/10) · REF-10) ⬜ |
| [GH-22](https://github.com/yoganfr/forge-du-changement/issues/22) | Ouverte | EPIC 5 · REF-15–16 — plan de charge suite (complète [GH-11](https://github.com/yoganfr/forge-du-changement/issues/11) · REF-14) ⬜ |
| [GH-23](https://github.com/yoganfr/forge-du-changement/issues/23) | Ouverte | EPIC 6 · REF-18–21 — module SENS suite (complète [GH-15](https://github.com/yoganfr/forge-du-changement/issues/15) · REF-17) ⬜ |
| [GH-24](https://github.com/yoganfr/forge-du-changement/issues/24) | Ouverte | EPIC 7 · REF-22–23 ⬜ |
| [GH-25](https://github.com/yoganfr/forge-du-changement/issues/25) | Ouverte | EPIC 8 · REF-24–29 ⬜ |
| [GH-26](https://github.com/yoganfr/forge-du-changement/issues/26) | Ouverte | EPIC 9 · REF-30–32 ⬜ |
| [GH-27](https://github.com/yoganfr/forge-du-changement/issues/27) | Ouverte | EPIC 13 · REF-37 — export PDF PAE Manager ⬜ |

## Légende
- 🔴 Priorité haute
- 🟠 Priorité moyenne  
- 🟡 Priorité basse
- ✅ Terminé
- 🚧 En cours
- ⬜ À faire

---

## EPIC 1 — Stabilisation & Fondations ✅ DONE
Implémenté le 17/04/2026. Gantt 24 mois, scoring, onboarding, logos Storage, connexion Supabase.

---

## EPIC 10 — Infrastructure & Sécurité ✅ DONE

| REF | Titre | Statut |
|---|-------|--------|
| 33 | Auth Supabase — Connexion email/password + Google OAuth + Magic Link | ✅ |
| 34 | RLS Supabase sécurisé par workspace | ✅ |
| 35 | Déploiement Vercel avec variables d'env et routing SPA | ✅ |
| 38 | **NEW** Refonte architecture permissions (consultants/owner/collaborator) | ✅ |
| 39 | **NEW** Table `workspace_consultants` + fonctions helper | ✅ |
| 40 | **NEW** Table `audit_events` pour traçabilité | ✅ |
| 41 | **NEW** Super admin plateforme en base (`is_platform_superadmin`) | ✅ |
| 42 | **NEW** Rôle `admin` workspace (administrateur espace entreprise) | ✅ |
| 43 | **NEW** Rate limiting client OTP (anti double-clic) | ✅ |
| 44 | **NEW** Cache/deduplication côté API (scaling) | ✅ |
| 45 | **NEW** Documentation permissions en langage métier | ✅ |
| 46 | **NEW** Scripts SQL de vérification RLS | ✅ |

---

## EPIC 11 — Invitations ✅ DONE (partiel)

| REF | Titre | Priorité | Statut |
|---|-------|----------|--------|
| 47 | Invitation unitaire avec email + rôle | — | ✅ |
| 48 | Invitation par lot CSV (parsing + import) | — | ✅ |
| 49 | Renvoi d'email de connexion pour invitation en attente | — | ✅ |
| 50 | MFA sur comptes super-admin | 🟠 | ⬜ |
| 51 | Journal "qui a lancé le lot" visible UI | 🟡 | ⬜ |

---

## EPIC 2 — Vue décideur consolidée 🟠 PARTIEL (priorité restante : macro transverse)

| REF | Titre | Priorité | Statut |
|---|-------|----------|--------|
| 1 | Dashboard consolidé toutes directions | 🔴 | ✅ |
| 2 | Classement inter-directions top 5 BUILD | 🔴 | ✅ |
| 3 | Gantt macro consolidé (lecture transverse multi-directions) | 🟠 | ⬜ |
| 41 | Vue décideur + validation avec revue obligatoire + historique | 🔴 | ✅ |

---

## EPIC 3 — Maturity Roadmap (Rôles & Rythmes) 🚧 EN COURS

| REF | Titre | Priorité | Statut |
|---|-------|----------|--------|
| 4 | Structure 4 axes par projet BUILD (Processus/Orga/Outils/KPI) | 🔴 | ✅ |
| 5 | Création et gestion des jalons | 🔴 | ✅ |
| 6 | Macro RACI par jalon | 🔴 | ✅ |
| 7 | Système Réactions/Réponses sur jalons | 🟠 | ⬜ |
| 8 | Vue matrice complète (grille temps × 4 axes, chantiers typés par axe) | 🟠 | ✅ |
| 9 | Dépendances inter-jalons (séquence ligne + `jalon_dependance_id` conservée, **UI masquée**) | 🟡 | ✅ |

**Livraison par vagues (détail jalon / roadmap, avril 2026)**  
- **V1** : backdrop drawer/modales (mousedown+mouseup), RACI typographie + grilles 2 col (pilote radio, autres cases), échéance = maille timeline.  
- **V2** : pas de saisie dépendance en UI ; création **Direction** inline (modal chantier + drawer RACI) avec détection de doublon.  
- **V3** : jalon KPI **miroir** sync indicateur/cible/échéance parent, verrou nom+date sur miroir, suppression miroir → vide KPI parent. Script : `docs/supabase-jalons-kpi-source.sql`.

---

## EPIC 12 — Design Premium (audit agence) 🟠 NOUVEAU

| REF | Titre | Priorité | Statut |
|---|-------|----------|--------|
| 52 | Monochromatiser l'échelle des scores (caramel clair→intense) | 🟠 | ⬜ |
| 53 | Unifier l'identité clair/sombre (bordeaux constant) | 🟠 | ⬜ |
| 54 | Ajouter grain et ombres longues (effet artisanat) | 🟡 | ⬜ |
| 55 | Augmenter les white spaces et paddings | 🟡 | ⬜ |
| 56 | Micro-identité visuelle par module (bord gauche coloré) | 🟡 | ⬜ |
| 57 | Retravailler tableaux style "premium" (dividers fantômes) | 🟡 | ⬜ |
| 58 | Harmoniser header (pas de bleu/rouge vif hors palette) | 🟠 | ⬜ |

---

## EPIC 4 — Plan d'Action d'Équipe (PAE)

| REF | Titre | Priorité | Statut |
|---|-------|----------|--------|
| 10 | Structure PAE par manager | 🟠 | ⬜ |
| 11 | Actions concrètes / Ressources / Abandons | 🟠 | ⬜ |
| 12 | Validation N+1 | 🟠 | ⬜ |
| 13 | Lien PAE ↔ Jalon | 🟠 | ⬜ |

---

## EPIC 5 — Plan de Charge

| REF | Titre | Priorité | Statut |
|---|-------|----------|--------|
| 14 | Grille mensuelle RUN/BUILD/TRANSFO | 🟠 | ⬜ |
| 15 | Alerte surcharge | 🟠 | ⬜ |
| 16 | Vue synthèse par direction | 🟡 | ⬜ |

---

## EPIC 6 — Module SENS

| REF | Titre | Priorité | Statut |
|---|-------|----------|--------|
| 17 | Diagnostic des 5 syndromes | 🟡 | ⬜ |
| 18 | Matrice d'implication | 🟡 | ⬜ |
| 19 | Kit NUI Manager | 🟡 | ⬜ |
| 20 | Modèle de l'aventure | 🟡 | ⬜ |
| 21 | Plan de communication | 🟡 | ⬜ |

---

## EPIC 7 — La Fabrique (Séminaires & Ateliers)

| REF | Titre | Priorité | Statut |
|---|-------|----------|--------|
| 22 | Banque de séquences d'animation | 🟡 | ⬜ |
| 23 | Architecte de formats sur mesure | 🟡 | ⬜ |

---

## EPIC 8 — Gestion Managériale & Animation Terrain

| REF | Titre | Priorité | Statut |
|---|-------|----------|--------|
| 24 | Assistant situationnel (Spirale/Courbe du changement) | 🟡 | ⬜ |
| 25 | Frise chronologique faits marquants + PASED | 🟡 | ⬜ |
| 26 | Réseau Change Agents | 🟡 | ⬜ |
| 27 | Guide de suivi managérial | 🟡 | ⬜ |
| 28 | Traitement des objections + Livret besoins | 🟡 | ⬜ |
| 29 | Croix de l'implication | 🟡 | ⬜ |

---

## EPIC 9 — Pilotage Projet

| REF | Titre | Priorité | Statut |
|---|-------|----------|--------|
| 30 | Cartographie maturité au changement (niveaux 1→5) | 🟡 | ⬜ |
| 31 | Analyse d'impact OMOC | 🟡 | ⬜ |
| 32 | Quadrillage du terrain (cercles concentriques) | 🟡 | ⬜ |

---

## EPIC 13 — Exports

| REF | Titre | Priorité | Statut |
|---|-------|----------|--------|
| 36 | Export PDF — Vue Synthèse Direction | 🟠 | 🚧 |
| 37 | Export PDF — PAE Manager | 🟡 | ⬜ |

*Note (EPIC 13 · REF-36)* : v1 **impression navigateur** sur la Vue décideur (`window.print` + styles `dg-print`). Export PDF dédié (génération fichier, branding contrôlé, hors navigateur) encore à traiter si besoin CODIR. Suivi GitHub : **GH-14**.

---

## Stack technique

- **Frontend** : React + TypeScript (Vite)
- **Backend** : Supabase (PostgreSQL + Storage + RLS + Auth)
- **Déploiement** : Vercel (main branch auto-deploy)
- **Repo** : yoganfr/forge-du-changement
- **URL prod** : https://forge-du-changement.vercel.app

## Tables Supabase (métier)

- `workspaces` — espaces entreprise
- `users` — profils (avec `is_platform_superadmin`, `role: admin/consultant/codir/pilote/contributeur`)
- `invitations` — invitations en attente
- `workspace_consultants` — rattachement consultant ↔ workspace (owner/collaborator)
- `audit_events` — traçabilité actions sensibles
- `directions` — directions/périmètres
- `projets` — projets RUN/BUILD avec scoring (`dg_validated_transfo`, etc.)
- `chantiers` — lignes thématiques sous projet BUILD ; colonne `axe` (voir `docs/supabase-chantiers-axe.sql`)
- `jalons` — jalons roadmap (dates cible, statut, facette, `jalon_dependance_id`, `kpi_source_jalon_id` — voir `docs/supabase-jalons-kpi-source.sql`)
- `raci_jalons` — macro RACI par jalon (pilote / impliqué / informé par direction)
- `raci_projets` — relations RACI projet (héritage / autres usages)
- `plan_de_charge` — charges mensuelles

## Fonctions SQL helper

- `jwt_email()` — email du JWT courant
- `current_app_user_id()` — UUID user métier courant
- `is_platform_superadmin()` — check super admin plateforme
- `current_member_workspace_id()` — workspace du membre courant
- `is_workspace_org_admin(p_workspace_id)` — admin du workspace ?
- `has_workspace_consultant_access(p_workspace_id)` — consultant accès ?
- `is_workspace_consultant_owner(p_workspace_id)` — owner du dossier ?

## Composants principaux

- `App.tsx` — dashboard, navigation, garde d'auth, entrées La Fabrique / Vue décideur / roadmap
- `OnboardingFlow.tsx` — création espace entreprise + invitations
- `ProjectSelector.tsx` — outil saisie/scoring projets (Supabase)
- `CompanySheet.tsx` — fiche entreprise + invitations unitaires/CSV
- `ProfileSheet.tsx` — drawer profil utilisateur
- `MemberOnboarding.tsx` — espace membre
- `pages/DashboardDG.tsx` — synthèse décideur (KPI, validation BUILD, top 5, impression, historique)
- `pages/Login.tsx` — écran connexion premium
- `pages/AuthCallback.tsx` — retour OAuth/Magic Link
- `MaturityRoadmap.tsx` — roadmap maturité (chantiers, jalons, RACI, dépendances)
- `RoadmapTimelineGrid.tsx` — grille 4 axes × échéances
- `DgProjectAccordion.tsx` — détail projet dans la Vue décideur
- `ChantierLineModal.tsx` / `JalonQuickAddModal.tsx` — édition chantiers et jalons
- `src/lib/api.ts` — façade CRUD + réexport roadmap
- `src/lib/api/roadmap.ts` — chantiers, jalons, RACI jalons
- `src/lib/auth.ts` — Auth helpers + rate limit client
- `src/lib/supabase.ts` — client Supabase (vars d'env)
- `src/lib/types.ts` — types TypeScript

## Documentation projet

- `docs/# Règles métier — Maturity Roadmap.md` — référence métier module roadmap
- `docs/maturity-roadmap-synthese-evolutions-produit.md` — pistes versionnement, param workspace, etc.
- `docs/supabase-chantiers-axe.sql` — migration `chantiers.axe` (typage par axe de création)
- `docs/proposition-regles-matrice-permissions.md` — règles en langage métier
- `docs/security-quick-wins.md` — MFA, rate limits, RLS, audit
- `docs/supabase-evolution-permissions-alignement.sql` — script SQL principal
- `docs/supabase-verify-permissions-setup.sql` — vérifs post-migration
- `docs/supabase-verify-rls-all-public-tables.sql` — audit RLS global
- `docs/supabase-storage-assets-hardening.sql` — durcissement Storage

## Design system

- Couleur accent : `#8E3B46` (bordeaux / caramel-candy-600)
- Palettes : `caramel-candy` (chaud bordeaux), `orecchiette` (doré paille), `muted-yellow-green` (validation)
- Aliases compat : `--dark-red-500`, `--coral-400`, `--straw-400`, `--steel-blue-400`
- Typo titres : Playfair Display
- Typo corps : Inter
- Thème : dark/light (toggle en haut à droite)
- Variables CSS : `themes.css` + `design-system.css`

---

## Trajectoire suggérée

**Sprint prochain (CODIR-ready)** :
1. EPIC 2 · **REF-3** — Gantt macro consolidé multi-directions (reste le gap principal de l’EPIC) — **GH-3**
2. EPIC 3 · **REF-7** — Réactions / réponses sur jalons (valeur « dialogue structuré » des règles métier) — **GH-7**
3. EPIC 12 — Top 3 polish design (**REF-52, REF-53, REF-58** — lot **GH-20**)
4. EPIC 13 · **REF-36** — Finaliser si besoin livrable PDF autonome (au-delà de l’impression navigateur) — **GH-14**

**Sprint d’après** :
5. EPIC 3 — versionnement roadmap, param maille temporelle workspace (voir synthèse évolutions)
6. EPIC 4 — PAE **REF-10–13** (**GH-10** structure, **GH-21** suite actions / validation / lien jalons)

**Plus tard** :
7. EPIC 5 — Plan de charge (**GH-11** grille · **GH-22** suite)
8. EPIC 6 — Module SENS (**GH-15** · **GH-23** suite)

---

## Plan d'implémentation détaillé (tâches prêtes dev)

### Sprint 1 — CODIR-ready (2 semaines)

*État code (19/04/2026)* : **T1–T3 et T4** sont largement couverts par `DashboardDG` + agrégations locales (KPI, tableaux validation BUILD, top 5). **T5** (Gantt macro consolidé) et **T7** (PDF autonome) restent les gros morceaux ouverts ; **T6** (design) inchangé.

#### T1 — Cadrage KPI DG consolidé (GH-1 · EPIC 2 · REF-1)
- **Objectif** : figer les indicateurs de la Vue DG pour éviter les allers-retours de définition en cours de dev.
- **Scope** :
  - définir les KPI: volume RUN/BUILD, score moyen BUILD, nb directions actives, nb projets en alerte.
  - définir filtres: workspace, période.
  - définir règles de calcul (source tables, arrondis, valeurs nulles).
- **Critères d'acceptation** :
  - doc validée (1 page max) avec formule de chaque KPI.
  - liste des endpoints/queries nécessaires validée.
- **Dépendances** : aucune.
- **Estimation** : 0.5 jour.

#### T2 — Couche agrégations backend/API Vue DG (GH-1 · EPIC 2 · REF-1)
- **Objectif** : fournir des données consolidées fiables et rapides pour le dashboard DG.
- **Scope** :
  - créer fonctions d'agrégation dans `src/lib/api.ts` (ou RPC Supabase si plus pertinent).
  - ajouter types TS dédiés (`DashboardDgMetrics`, `DirectionRankingItem`, etc.).
  - gérer pagination/limite si dataset volumineux.
- **Critères d'acceptation** :
  - temps de réponse cible < 500ms sur dataset nominal.
  - fallback propre si aucune donnée.
  - requêtes compatibles RLS actuelle.
- **Dépendances** : T1.
- **Estimation** : 1.5 jours.

#### T3 — UI Dashboard consolidé DG (GH-1 · EPIC 2 · REF-1)
- **Objectif** : rendre visible la synthèse DG multi-directions dans l'app.
- **Scope** :
  - nouvelle vue/module dans `App.tsx` + composant dédié.
  - cartes KPI + tableau synthèse directions.
  - états loading/empty/error.
- **Critères d'acceptation** :
  - navigation fonctionnelle depuis le menu.
  - rendu correct desktop (et lisible tablette).
  - aucun blocage si données partielles.
- **Dépendances** : T2.
- **Estimation** : 2 jours.

#### T4 — Classement inter-directions top 5 BUILD (GH-2 · EPIC 2 · REF-2)
- **Objectif** : mettre en évidence les directions les plus avancées en BUILD.
- **Scope** :
  - calcul top 5 côté data.
  - composant UI classement + indicateur variation (optionnel v1).
  - tri stable en cas d'égalité.
- **Critères d'acceptation** :
  - top 5 exact et déterministe.
  - comportement défini si < 5 directions.
- **Dépendances** : T2, T3.
- **Estimation** : 1 jour.

#### T5 — Gantt macro consolidé (GH-3 · EPIC 2 · REF-3)
- **Objectif** : donner une lecture transverse des jalons/projets.
- **Scope** :
  - vue macro en lecture seule (v1).
  - regroupement par direction.
  - fenêtres temporelles (M-1, trimestre, semestre).
- **Critères d'acceptation** :
  - affichage stable sur datasets volumineux.
  - lisibilité des jalons critiques.
- **Dépendances** : T2, T3.
- **Estimation** : 2 jours.

#### T6 — Design premium quick wins (EPIC 12 · REF-52, REF-53, REF-58 — GH-20)
- **Objectif** : élever la perception premium sans refonte lourde.
- **Scope** :
  - score monochromatique caramel.
  - identité clair/sombre cohérente autour du bordeaux.
  - harmonisation header (suppression bleus/rouges non palette).
- **Critères d'acceptation** :
  - conformité visuelle validée sur 3 écrans clés (Login, Dashboard, CompanySheet).
  - aucun contraste critique régressif.
- **Dépendances** : T3.
- **Estimation** : 1 jour.

#### T7 — Export PDF Vue Synthèse Direction (GH-14 · EPIC 13 · REF-36)
- **Objectif** : générer un livrable partageable pour CODIR/clients.
- **Scope** :
  - aujourd’hui : **impression navigateur** sur la Vue DG (bouton + styles dédiés) — acceptable en v0.
  - cible : export PDF d'une vue synthèse (KPI + tableau + date + workspace), génération fichier si besoin.
  - gestion des cas sans données.
  - cohérence branding.
- **Critères d'acceptation** :
  - PDF ou PDF équivalent imprimable en temps raisonnable (< 5 s côté utilisateur pour une génération dédiée si implémentée).
  - rendu lisible A4 (portrait ou paysage défini).
  - contenu fidèle à la vue écran.
- **Dépendances** : T3, T4, T6.
- **Estimation** : 1.5 jours.

#### T8 — Recette, perf et mise en prod Sprint 1
- **Objectif** : sécuriser la mise en production.
- **Scope** :
  - tests manuels multi-rôles (consultant/admin/codir).
  - vérification Vercel (build/runtime logs).
  - smoke tests navigation + auth + workspace switch.
- **Critères d'acceptation** :
  - aucune erreur bloquante.
  - pas de régression majeure sur modules existants.
  - checklist de déploiement validée.
- **Dépendances** : T1 à T7.
- **Estimation** : 1 jour.

### Sprint 2 — Cœur métier roadmap (EPIC 3)

*État 19/04/2026* : **T9 à T11, T13 et T14** sont couverts par l’app (axes, CRUD jalons, RACI, grille, dépendance). **T12** (réactions / réponses) et **T15** (recette ciblée + perf) restent pertinents ; ajouter au besoin versionnement / param workspace depuis `docs/maturity-roadmap-synthese-evolutions-produit.md`.

#### T9 — Structure 4 axes BUILD (GH-4 · EPIC 3 · REF-4)
- **Estimation** : 1 jour.

#### T10 — CRUD jalons (GH-5 · EPIC 3 · REF-5)
- **Estimation** : 1.5 jours.

#### T11 — Macro RACI par jalon (GH-6 · EPIC 3 · REF-6)
- **Estimation** : 1 jour.

#### T12 — Réactions/Réponses sur jalons (GH-7 · EPIC 3 · REF-7)
- **Estimation** : 1 jour.

#### T13 — Vue matrice complète (GH-8 · EPIC 3 · REF-8)
- **Estimation** : 1.5 jours.

#### T14 — Dépendances inter-jalons (GH-9 · EPIC 3 · REF-9)
- **Estimation** : 1 jour.

#### T15 — Recette EPIC 3 + optimisation perf
- **Estimation** : 1 jour.

### Sprint 3 — Plan d'Action d'Équipe (EPIC 4)

#### T16 — Structure PAE manager (GH-10 · EPIC 4 · REF-10)
- **Estimation** : 1 jour.

#### T17 — Actions / Ressources / Abandons (EPIC 4 · REF-11 — lot **GH-21** ; ne pas confondre avec **GH-11**)
- **Estimation** : 1 jour.

#### T18 — Validation N+1 (EPIC 4 · REF-12 — lot **GH-21** ; ne pas confondre avec **GH-12** auth)
- **Estimation** : 1 jour.

#### T19 — Lien PAE ↔ jalon (EPIC 4 · REF-13 — lot **GH-21** ; ne pas confondre avec **GH-13** Vercel)
- **Estimation** : 1 jour.

#### T20 — Recette PAE + préparation export PAE (GH-27 · EPIC 13 · REF-37)
- **Estimation** : 1 jour.

### Récap dépendances critiques
- T2 dépend de T1
- T3 dépend de T2
- T4 dépend de T2/T3
- T5 dépend de T2/T3
- T6 dépend de T3
- T7 dépend de T3/T4/T6
- T8 dépend de T1→T7

### Capacity planning (indicatif)
- **Sprint 1** : ~10.5 jours
- **Sprint 2** : ~8 jours
- **Sprint 3** : ~5 jours
- **Total** : ~23.5 jours ouvrés (hors aléas)

---

## Pilotage hebdo (ordre d'exécution recommandé)

### Rôles projet (proposition)
- **Lead Produit / Métier** : arbitrage KPI, validation UX métier, priorisation
- **Lead Tech** : architecture, qualité code, intégration finale
- **Dev Front** : UI/UX, composants, états de chargement/erreur
- **Dev Data/Supabase** : agrégations, requêtes, RLS, perf SQL
- **QA** : scénarios de recette, non-régression, validation pré-prod

### Semaine 1 — Cadrage + fondations data (Sprint 1)

#### Jour 1 (lundi)
- T1 cadrage KPI DG consolidé (atelier 60-90 min)
- sortie: mini-spec validée + définition done de T2/T3
- **Jalon** : go/no-go scope Sprint 1 figé

#### Jour 2 (mardi)
- démarrage T2 (agrégations backend/API)
- création types TS et contrats de données
- **Contrôle** : revue technique rapide (15 min) sur modèle de données

#### Jour 3 (mercredi)
- fin T2 + tests unitaires/validation manuelle API
- début T3 (squelette UI Dashboard DG)
- **Jalon** : démo interne “data branchée à la vue”

#### Jour 4 (jeudi)
- continuation T3 (cards KPI, tableau synthèse, états loading/error)
- démarrage T4 (top 5 BUILD)
- **Contrôle** : revue UX métier des libellés et priorités visuelles

#### Jour 5 (vendredi)
- fin T4
- initialisation T5 (Gantt macro v1 read-only)
- **Jalon hebdo** : démo CODIR interne (v0 Dashboard + Top5 + Gantt embryon)

### Semaine 2 — Finalisation Sprint 1 + mise en prod

#### Jour 6 (lundi)
- finalisation T5 (Gantt macro consolidé)
- démarrage T6 (polish design REF-52 / REF-53 / REF-58)
- **Contrôle** : point accessibilité contraste + cohérence palette

#### Jour 7 (mardi)
- fin T6
- démarrage T7 (export PDF vue synthèse)
- **Jalon** : première génération PDF exploitable

#### Jour 8 (mercredi)
- finalisation T7 (robustesse “pas de données”, branding)
- début T8 (recette multi-rôles)
- **Contrôle** : test perf et logs Vercel

#### Jour 9 (jeudi)
- continuation T8: correction bugs et régressions
- gel fonctionnel sprint (feature freeze)
- **Jalon** : décision release candidate

#### Jour 10 (vendredi)
- T8 final: smoke tests, validation métier finale, déploiement prod
- rétrospective courte + préparation Sprint 2
- **Jalon** : Sprint 1 livré en production

### Semaine 3-4 — Sprint 2 (EPIC 3)
- S3: T9/T10/T11 (structure axes + CRUD jalons + macro RACI)
- S4: T12/T13/T14/T15 (interactions, matrice, dépendances, recette)
- **Jalon fin Sprint 2** : roadmap maturité exploitable de bout en bout

### Semaine 5 — Sprint 3 (EPIC 4 PAE)
- T16/T17/T18/T19/T20 en flux continu
- démo intermédiaire milieu de semaine + finalisation fin de semaine
- **Jalon fin Sprint 3** : PAE opérationnel + lien jalons

## Cadence de gouvernance

### Rituels
- **Daily** 15 min (blocages + plan du jour)
- **Revue hebdo** 45 min (démo + décisions)
- **Comité produit** 30 min (priorisation backlog)

### Indicateurs de pilotage
- avancement tâches sprint (% done)
- bugs bloquants ouverts
- temps moyen de chargement vue DG
- taux de réussite export PDF

### Définition de Done (DoD) commune
- code mergé + build vert
- lints sans erreur
- logs Vercel sans erreur bloquante
- scénario métier clé testé (consultant/admin/codir)
- documentation backlog mise à jour

---

## Journal d'avancement (historique opérationnel)

### Session avril 2026 — synthèse des travaux réalisés

#### Fait
- Convention **REF-** (tâche dans ce document) vs **GH-** (issue GitHub), colonnes de tableaux renommées en *REF*, traçabilité et plan d’implémentation alignés (correction des confusions PAE REF-11–13 vs GH-11–13).
- Création des issues GitHub **GH-16–GH-27** (jalons livrés + lots ouverts par epic) et tableau d’extension en tête de `docs/backlog.md`.
- Synchronisation issues **GH-1–GH-15** avec ce backlog (fermeture des issues livrées, tableau de traçabilité en tête de document).
- Maturity Roadmap: amélioration UX drawer/popins (fermeture backdrop robuste), uniformisation RACI (grilles 2 colonnes, pilote unique), échéance alignée sur la timeline.
- Maturity Roadmap: simplification dépendances (masquées en UI, `jalon_dependance_id` conservée en base).
- Maturity Roadmap: création de direction inline avec anti-doublon (normalisation + proximité de libellé).
- KPI roadmap: mise en place du jalon KPI miroir synchronisé (création/mise à jour/suppression), verrouillage nom + échéance côté miroir.
- Documentation métier/technique mise à jour (règles roadmap, synthèse évolutions, backlog, script SQL `supabase-jalons-kpi-source.sql`).
- Vue décideur / sélection projets: harmonisation itérative des frises et mini-frises (édition + décideur), puis composant partagé pour marqueurs début/fin.
- Vue décideur: renommage UX, garde d'accès rôle (`consultant/admin/pilote/superadmin`), validation/retrait avec revue obligatoire, historique des décisions via `audit_events`.
- Sécurité backend: script de garde SQL sur `projets.dg_validated_transfo` pour bloquer `codir`/`contributeur`.
- Cartes RUN: alignement visuel avec BUILD sur l'entête (placement mini-gantt et pastille criticité).
- Gouvernance Git: règle projet enrichie avec trailer `Made-with: Cursor AI`, convention commit formalisée dans `docs/git-commit-conventions.md`.

#### En cours
- Validation visuelle fine des frises sur tous les contextes d'affichage (édition, Vue décideur consolidée, Ma Direction, états RUN/BUILD variés).

#### À faire
- Navigation historique navigateur: brancher la navigation interne sur l'URL/historique (retour arrière cohérent sans sortie du site).
- Export PDF DG final (si attendu hors impression navigateur).
- Phase G roadmap (future): intégration managers contributeurs dans le champ Responsable (actuellement texte libre).