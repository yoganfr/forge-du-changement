# REF-7b — Cycle de revue ReviewerPage — Point d'entrée

**Point d'entrée unique pour une IA qui commence une session sur REF-7b.2 (backend) ou REF-7b.5 (frontend).**

Dernière mise à jour : **6 mai 2026**, 01 h 05 (Europe/Paris)

---

## Résumé en 30 secondes

**REF-7b** = Implémenter un cycle de revue collectif pour la Maturity Roadmap.

**Qui** : Reviewers (N-1 d'un membre CODIR) commentent/arbitrent la roadmap figée V1.

**Quoi** : 
- Partie 2 : Grille roadmap read-only + commentaires sur chantiers/jalons/RACI
- Partie 3 : Formulaire pour proposer nouveaux chantiers
- Backend : 4 tables Supabase + 5 API routes + RLS policies

**Où** : `/src/pages/ReviewerSnapshotPage.tsx` (existent, à refactoriser)

**État** : ✅ Clarifications complètes + plans rédigés → **Prêt pour implémentation**

---

## Structure de travail

### Backend (REF-7b.2)

**Ce qui existe** :
- ✅ Règles métier complètes : [`docs/# Règles métier — REF-7b.2 Cycle de revue feedback.md`](docs/#%20Règles%20métier%20—%20REF-7b.2%20Cycle%20de%20revue%20feedback.md)
- ✅ Plan implémentation : [`.cursor/plans/ref-7b.2_schema_revue_final_implementation.plan.md`](.cursor/plans/ref-7b.2_schema_revue_final_implementation.plan.md)

**À faire** (6 todos du plan) :
1. Migration Supabase (DDL tables + indexes)
2. Tester RLS policies (5 tables principales)
3. Spécifier 5 API routes backend
4. Créer types TypeScript + API client wrapper
5. Audit trail : implémentation minimaliste (5 événements)
6. Tests d'intégration

**Fichiers clés** :
- `docs/# Règles métier — REF-7b.2 Cycle de revue feedback.md` — À lire d'abord
- `.cursor/plans/ref-7b.2_schema_revue_final_implementation.plan.md` — 6 todos structurés

---

### Frontend (REF-7b.5)

**Ce qui existe** :
- ✅ Architecture UX clarifiée : [`docs/architecture-ux-reviewerpage-ref7b5.md`](docs/architecture-ux-reviewerpage-ref7b5.md)
- ✅ Plan implémentation : [`.cursor/plans/ref-7b.5_frontend_reviewerpage_implementation.plan.md`](.cursor/plans/ref-7b.5_frontend_reviewerpage_implementation.plan.md)
- ⚠️ Code existant (incomplet) : `src/pages/ReviewerSnapshotPage.tsx`

**À faire** (8 todos du plan) :
1. Analyser/refactoriser RoadmapTimelineGrid pour mode read-only
2. Créer ReviewerRoadmapGrid (wrapper read-only)
3. Créer panel commentaires latéral (drawer/sidebar)
4. Implémenter formulaire Partie 3 (propositions chantier)
5. Implémenter logic state ReviewerPage (sélection cible, gestion panel)
6. Tester flow complet (clic chantier → panel → soumission)
7. +2 composants utilitaires (PropositionsTable, ReviewerPageHeader)

**Fichiers clés** :
- `docs/architecture-ux-reviewerpage-ref7b5.md` — À lire d'abord
- `.cursor/plans/ref-7b.5_frontend_reviewerpage_implementation.plan.md` — 8 todos structurés
- `src/pages/ReviewerSnapshotPage.tsx` — Cible de refactorisation

---

## Architecture globale

### 2 parties sur la ReviewerPage

```
┌──────────────────────────────────────────────┐
│ Header + Bandeau deadline (🟢/🟠/🔴)        │
├──────────────────────────────────────────────┤
│                                              │
│ Partie 2 : Roadmap grille (read-only)       │
│ - Clic chantier/jalon/RACI → Panel          │
│ - Panel latéral (drawer) avec commentaires  │
│                                              │
├──────────────────────────────────────────────┤
│                                              │
│ Partie 3 : Proposer un chantier             │
│ - Form : projet, axe, titre, constat/prop  │
│ - Tableau récap propositions                │
│                                              │
└──────────────────────────────────────────────┘
```

### Schéma Supabase simplifié

| Table | Rôle | Clé |
|-------|------|-----|
| `roadmap_snapshot_reviewers` | Cycle reviewer (lifecycle) | snapshot_id + user_id |
| `roadmap_review_feedbacks` | Feedbacks unifiés (reaction/decision/proposition) | snapshot_id + reviewer_user_id |
| `roadmap_snapshots` | Colonne deadline ajoutée | id |
| `roadmap_snapshot_review_config` | Paramètres workspace (partage) | workspace_id |

---

## Décisions cristallisées

### Lifecycle reviewer
- `pending` → `draft` → `submitted` → `closed` (+ réouverture possible)
- **Règle critique** : Aucun feedback après submission

### 3 kinds feedbacks
1. **reaction** : texte libre, éditable même après ACK CODIR
2. **decision** : constat/proposition/bénéfice, immuable après submission
3. **proposition_chantier** : création chantier (Partie 3)

### Target types (éléments commentables)
- `chantier`, `jalon`, `raci_chantier` (plus de "projet")

### Arbitrage CODIR
- États : ok / nok / sous_condition
- Motivation obligatoire si ≠ ok

---

## Comment naviguer

### Je suis une IA qui arrive en session nouvelle

**Étape 1** : Lis ce fichier en entier (vous le faites) ✓  
**Étape 2** : Choisis backend ou frontend  
**Étape 3** : Ouvre la doc spécialisée (Règles métier ou Architecture UX)  
**Étape 4** : Ouvre le plan correspondant (dans `.cursor/plans/`)  
**Étape 5** : Suit les todos du plan  

### Je dois implémenter le backend (REF-7b.2)

**Chemin** :
1. Lire [`docs/# Règles métier — REF-7b.2 Cycle de revue feedback.md`](docs/#%20Règles%20métier%20—%20REF-7b.2%20Cycle%20de%20revue%20feedback.md) (20 min)
2. Consulter [`.cursor/plans/ref-7b.2_schema_revue_final_implementation.plan.md`](.cursor/plans/ref-7b.2_schema_revue_final_implementation.plan.md) (5 min)
3. Commencer Todo 1 : Migration Supabase

### Je dois implémenter le frontend (REF-7b.5)

**Chemin** :
1. Lire [`docs/architecture-ux-reviewerpage-ref7b5.md`](docs/architecture-ux-reviewerpage-ref7b5.md) (20 min)
2. Consulter [`.cursor/plans/ref-7b.5_frontend_reviewerpage_implementation.plan.md`](.cursor/plans/ref-7b.5_frontend_reviewerpage_implementation.plan.md) (5 min)
3. Commencer Todo 1 : Refactor RoadmapTimelineGrid

### Je dois faire les deux en parallèle

**Chemin recommandé** :
- Backend : Todos 1-2 (migrations + RLS)
- Frontend : Todos 1-3 (composants) en parallèle
- Puis intégration

---

## Fichiers clés du repo

### Docs
- `docs/README_ref7b-reviewerpage.md` ← **Vous êtes ici**
- `docs/# Règles métier — REF-7b.2 Cycle de revue feedback.md` (règles métier)
- `docs/architecture-ux-reviewerpage-ref7b5.md` (architecture UX)
- `docs/backlog.md` (REF-7b.2 ligne 135, REF-7b.5 ligne 138)

### Plans (locaux)
- `.cursor/plans/ref-7b.2_schema_revue_final_implementation.plan.md` (backend)
- `.cursor/plans/ref-7b.5_frontend_reviewerpage_implementation.plan.md` (frontend)

### Code (à implémenter)
- `src/pages/ReviewerSnapshotPage.tsx` (cible refactorisation)
- `src/components/ReviewerRoadmapGrid.tsx` (à créer)
- `src/components/CommentsPanel.tsx` (à créer)
- `src/components/PropositionChantierForm.tsx` (à créer)
- `src/lib/api/reviewer.ts` (à créer, API client)

### Migrations Supabase (à créer)
- `supabase/migrations/XXXXXXX_create_reviewer_tables.sql`

---

## Points de vigilance

✅ **RLS critique** : Aucune table sensible sans policy explicite  
✅ **Optimistic locking** : Version field sur feedbacks pour race conditions  
✅ **Blocage post-submitted** : RLS + API validation  
✅ **Accessibilité** : Clavier nav, focus visibles, aria-labels  
✅ **Performance** : Pas de re-render inutile au clic  
✅ **Notifications** : Dédup avec `*_notified_at` timestamps  

---

## Git workflow

- **Branche** : `main` (prod)
- **Format commit** : `type(scope): action` en français
- **Scopes** : `roadmap`, `reviewer`, `rls`, `supabase`, `ui`
- **Trailer** : `Made-with: Cursor AI`
- **Push** : Systématique après chaque commit

Voir [`docs/git-commit-conventions.md`](docs/git-commit-conventions.md) pour détails.

---

## Contrats implicites

| Élément | Responsable | Proof |
|---------|-------------|-------|
| Workflow de planification | ✅ Documentation | [`docs/AI-AGENT-FEATURE-PLANNING-WORKFLOW.md`](AI-AGENT-FEATURE-PLANNING-WORKFLOW.md) |
| Règles métier | ✅ Yogan + AI | [`Règles métier — REF-7b.2...`](docs/#%20Règles%20métier%20—%20REF-7b.2%20Cycle%20de%20revue%20feedback.md) |
| Architecture UX | ✅ Yogan + AI | [`architecture-ux-reviewerpage-ref7b5.md`](docs/architecture-ux-reviewerpage-ref7b5.md) |
| Plan backend | ✅ AI | [`.cursor/plans/ref-7b.2...`](.cursor/plans/ref-7b.2_schema_revue_final_implementation.plan.md) |
| Plan frontend | ✅ AI | [`.cursor/plans/ref-7b.5...`](.cursor/plans/ref-7b.5_frontend_reviewerpage_implementation.plan.md) |
| Implémentation | ⏳ À faire | src/ + supabase/ |

---

## Raccourcis rapides

| Besoin | Aller à |
|--------|---------|
| Comprendre le métier | [`Règles métier — REF-7b.2...`](docs/#%20Règles%20métier%20—%20REF-7b.2%20Cycle%20de%20revue%20feedback.md) |
| Comprendre l'UX | [`architecture-ux-reviewerpage-ref7b5.md`](docs/architecture-ux-reviewerpage-ref7b5.md) |
| Plan backend complet | [`.cursor/plans/ref-7b.2...`](.cursor/plans/ref-7b.2_schema_revue_final_implementation.plan.md) |
| Plan frontend complet | [`.cursor/plans/ref-7b.5...`](.cursor/plans/ref-7b.5_frontend_reviewerpage_implementation.plan.md) |
| Où ça rentre dans le backlog | [`docs/backlog.md`](docs/backlog.md) (EPIC 3) |
| Règles git | [`docs/git-commit-conventions.md`](docs/git-commit-conventions.md) |

---

**Fin du README — Prêt à implémenter ! 🚀**
