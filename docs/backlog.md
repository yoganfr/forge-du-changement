# Backlog — La Forge du Changement
Dernière mise à jour : 18 avril 2026

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

| # | Titre | Statut |
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

| # | Titre | Priorité | Statut |
|---|-------|----------|--------|
| 47 | Invitation unitaire avec email + rôle | — | ✅ |
| 48 | Invitation par lot CSV (parsing + import) | — | ✅ |
| 49 | Renvoi d'email de connexion pour invitation en attente | — | ✅ |
| 50 | MFA sur comptes super-admin | 🟠 | ⬜ |
| 51 | Journal "qui a lancé le lot" visible UI | 🟡 | ⬜ |

---

## EPIC 2 — Vue DG Consolidée 🔴 PRIORITÉ #1

| # | Titre | Priorité | Statut |
|---|-------|----------|--------|
| 1 | Dashboard consolidé toutes directions | 🔴 | ⬜ |
| 2 | Classement inter-directions top 5 BUILD | 🔴 | ⬜ |
| 3 | Gantt macro consolidé | 🟠 | ⬜ |

---

## EPIC 3 — Maturity Roadmap (Rôles & Rythmes) 🔴 PRIORITÉ #2

| # | Titre | Priorité | Statut |
|---|-------|----------|--------|
| 4 | Structure 4 axes par projet BUILD (Processus/Orga/Outils/KPI) | 🔴 | ⬜ |
| 5 | Création et gestion des jalons | 🔴 | ⬜ |
| 6 | Macro RACI par jalon | 🔴 | ⬜ |
| 7 | Système Réactions/Réponses sur jalons | 🟠 | ⬜ |
| 8 | Vue matrice complète | 🟠 | ⬜ |
| 9 | Dépendances inter-jalons | 🟡 | ⬜ |

---

## EPIC 12 — Design Premium (audit agence) 🟠 NOUVEAU

| # | Titre | Priorité | Statut |
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

| # | Titre | Priorité | Statut |
|---|-------|----------|--------|
| 10 | Structure PAE par manager | 🟠 | ⬜ |
| 11 | Actions concrètes / Ressources / Abandons | 🟠 | ⬜ |
| 12 | Validation N+1 | 🟠 | ⬜ |
| 13 | Lien PAE ↔ Jalon | 🟠 | ⬜ |

---

## EPIC 5 — Plan de Charge

| # | Titre | Priorité | Statut |
|---|-------|----------|--------|
| 14 | Grille mensuelle RUN/BUILD/TRANSFO | 🟠 | ⬜ |
| 15 | Alerte surcharge | 🟠 | ⬜ |
| 16 | Vue synthèse par direction | 🟡 | ⬜ |

---

## EPIC 6 — Module SENS

| # | Titre | Priorité | Statut |
|---|-------|----------|--------|
| 17 | Diagnostic des 5 syndromes | 🟡 | ⬜ |
| 18 | Matrice d'implication | 🟡 | ⬜ |
| 19 | Kit NUI Manager | 🟡 | ⬜ |
| 20 | Modèle de l'aventure | 🟡 | ⬜ |
| 21 | Plan de communication | 🟡 | ⬜ |

---

## EPIC 7 — La Fabrique (Séminaires & Ateliers)

| # | Titre | Priorité | Statut |
|---|-------|----------|--------|
| 22 | Banque de séquences d'animation | 🟡 | ⬜ |
| 23 | Architecte de formats sur mesure | 🟡 | ⬜ |

---

## EPIC 8 — Gestion Managériale & Animation Terrain

| # | Titre | Priorité | Statut |
|---|-------|----------|--------|
| 24 | Assistant situationnel (Spirale/Courbe du changement) | 🟡 | ⬜ |
| 25 | Frise chronologique faits marquants + PASED | 🟡 | ⬜ |
| 26 | Réseau Change Agents | 🟡 | ⬜ |
| 27 | Guide de suivi managérial | 🟡 | ⬜ |
| 28 | Traitement des objections + Livret besoins | 🟡 | ⬜ |
| 29 | Croix de l'implication | 🟡 | ⬜ |

---

## EPIC 9 — Pilotage Projet

| # | Titre | Priorité | Statut |
|---|-------|----------|--------|
| 30 | Cartographie maturité au changement (niveaux 1→5) | 🟡 | ⬜ |
| 31 | Analyse d'impact OMOC | 🟡 | ⬜ |
| 32 | Quadrillage du terrain (cercles concentriques) | 🟡 | ⬜ |

---

## EPIC 13 — Exports

| # | Titre | Priorité | Statut |
|---|-------|----------|--------|
| 36 | Export PDF — Vue Synthèse Direction | 🟠 | ⬜ |
| 37 | Export PDF — PAE Manager | 🟡 | ⬜ |

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
- `projets` — projets RUN/BUILD avec scoring
- `raci_projets` — relations RACI
- `plan_de_charge` — charges mensuelles
- `jalons` — jalons de roadmap

## Fonctions SQL helper

- `jwt_email()` — email du JWT courant
- `current_app_user_id()` — UUID user métier courant
- `is_platform_superadmin()` — check super admin plateforme
- `current_member_workspace_id()` — workspace du membre courant
- `is_workspace_org_admin(p_workspace_id)` — admin du workspace ?
- `has_workspace_consultant_access(p_workspace_id)` — consultant accès ?
- `is_workspace_consultant_owner(p_workspace_id)` — owner du dossier ?

## Composants principaux

- `App.tsx` — dashboard, navigation, garde d'auth
- `OnboardingFlow.tsx` — création espace entreprise + invitations
- `ProjectSelector.tsx` — outil saisie/scoring projets (Supabase)
- `CompanySheet.tsx` — fiche entreprise + invitations unitaires/CSV
- `ProfileSheet.tsx` — drawer profil utilisateur
- `MemberOnboarding.tsx` — espace membre
- `pages/Login.tsx` — écran connexion premium
- `pages/AuthCallback.tsx` — retour OAuth/Magic Link
- `src/lib/api.ts` — CRUD Supabase + cache/dedup + audit
- `src/lib/auth.ts` — Auth helpers + rate limit client
- `src/lib/supabase.ts` — client Supabase (vars d'env)
- `src/lib/types.ts` — types TypeScript

## Documentation projet

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
1. EPIC 2 — Vue DG Consolidée (issues #1, #2, #3)
2. EPIC 12 — Top 3 polish design (issues #52, #53, #58)
3. EPIC 13 — Export PDF Vue Synthèse (issue #36)

**Sprint d'après (cœur métier)** :
4. EPIC 3 — Maturity Roadmap complète (issues #4 à #9)
5. EPIC 4 — PAE (issues #10 à #13)

**Plus tard** :
6. EPIC 5 — Plan de charge
7. EPIC 6 — Module SENS

---

## Plan d'implémentation détaillé (tâches prêtes dev)

### Sprint 1 — CODIR-ready (2 semaines)

#### T1 — Cadrage KPI DG consolidé (issue #1)
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

#### T2 — Couche agrégations backend/API Vue DG (issue #1)
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

#### T3 — UI Dashboard consolidé DG (issue #1)
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

#### T4 — Classement inter-directions top 5 BUILD (issue #2)
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

#### T5 — Gantt macro consolidé (issue #3)
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

#### T6 — Design premium quick wins (issues #52, #53, #58)
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

#### T7 — Export PDF Vue Synthèse Direction (issue #36)
- **Objectif** : générer un livrable partageable pour CODIR/clients.
- **Scope** :
  - export PDF d'une vue synthèse (KPI + tableau + date + workspace).
  - gestion des cas sans données.
  - cohérence branding.
- **Critères d'acceptation** :
  - PDF généré en < 5 secondes.
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

#### T9 — Structure 4 axes BUILD (issue #4)
- **Estimation** : 1 jour.

#### T10 — CRUD jalons (issue #5)
- **Estimation** : 1.5 jours.

#### T11 — Macro RACI par jalon (issue #6)
- **Estimation** : 1 jour.

#### T12 — Réactions/Réponses sur jalons (issue #7)
- **Estimation** : 1 jour.

#### T13 — Vue matrice complète (issue #8)
- **Estimation** : 1.5 jours.

#### T14 — Dépendances inter-jalons (issue #9)
- **Estimation** : 1 jour.

#### T15 — Recette EPIC 3 + optimisation perf
- **Estimation** : 1 jour.

### Sprint 3 — Plan d'Action d'Équipe (EPIC 4)

#### T16 — Structure PAE manager (issue #10)
- **Estimation** : 1 jour.

#### T17 — Actions / Ressources / Abandons (issue #11)
- **Estimation** : 1 jour.

#### T18 — Validation N+1 (issue #12)
- **Estimation** : 1 jour.

#### T19 — Lien PAE ↔ jalon (issue #13)
- **Estimation** : 1 jour.

#### T20 — Recette PAE + préparation export PAE (issue #37)
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
- démarrage T6 (polish design #52/#53/#58)
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