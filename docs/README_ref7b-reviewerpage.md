# REF-7b — Cycle de revue ReviewerPage — Point d'entrée

**Point d'entrée unique pour une IA qui commence une session sur REF-7b.2 (backend) ou REF-7b.5 (frontend).**

Dernière mise à jour : **19 octobre 2026**, 13 h 53 (Europe/Paris)

---

## Résumé en 30 secondes

**REF-7b** = Implémenter un cycle de revue collectif pour la Maturity Roadmap.

**Qui** : Reviewers (N-1 d'un membre CODIR) commentent/arbitrent la roadmap figée V1.

**Quoi** : 
- Partie 2 : Grille roadmap read-only + commentaires sur chantiers/jalons/RACI
- Partie 3 : Formulaire pour proposer nouveaux chantiers
- Backend : 4 tables Supabase + 5 API routes + RLS policies

**Où** : `/src/pages/ReviewerSnapshotPage.tsx` (V1 grille + panneau + Partie 3 branchés)

**État au 19 octobre 2026** : le schéma **REF-7b.2** est ✅ (ne pas rouvrir les policies RLS). **REF-7b.5bis** est ✅ recetté le 15 juin. **REF-7b.3** est ✅ : fenêtre de choix, e-mail de connexion vers la revue, trace d’ouverture. La source de vérité des statuts est [`docs/backlog.md`](backlog.md), section EPIC 3 et priorisation **Maintenant**.

| REF | Statut | Constat |
|-----|--------|---------|
| 7b.2 | ✅ | Tables, RLS, triggers d’audit (`reviewer_submitted`, `snapshot_review_reopened`, `feedback_arbitrated`) |
| 7b.3 | ✅ | Fenêtre, e-mail de connexion vers la revue, trace `snapshot_review_opened`. Recetté le 19/10/2026. L’e-mail ne contient pas le nom de la version |
| 7b.4 | 🚧 | Route `/review/:snapshotId` livrée. Nav principale non masquée |
| 7b.5 | 🚧 | Cœur V1 livré. Restent PCI figé, drawer &lt; 768 px, autosave |
| 7b.5bis | ✅ | Polish recetté le 15/06/2026 |
| 7b.5ter | ⬜ | Indicateurs de feedbacks sur la grille (retour de recette). Ne pas le nommer 7b.6 |
| 7b.6 | ⬜ | Panneau flottant `react-rnd` — sens d’origine conservé |

Le prochain lot produit n’est pas choisi. Candidats : **7b.5ter**, finition **7b.4**.

---

## Structure de travail

### Backend (REF-7b.2)

**Ce qui existe** :
- ✅ Règles métier complètes : [`docs/# Règles métier — REF-7b.2 Cycle de revue feedback.md`](docs/#%20Règles%20métier%20—%20REF-7b.2%20Cycle%20de%20revue%20feedback.md)
- ✅ Plan implémentation : [`docs/plan-ref-7b.2-schema-revue.md`](docs/plan-ref-7b.2-schema-revue.md)

**Livré** : migration, policies, client `src/lib/api/roadmapReviews.ts`, triggers d’audit listés dans le backlog. Le plan [`docs/plan-ref-7b.2-schema-revue.md`](plan-ref-7b.2-schema-revue.md) garde des cases ouvertes historiques : ne pas les traiter comme le travail courant.

**Fichiers clés** :
- `docs/# Règles métier — REF-7b.2 Cycle de revue feedback.md` — À lire d'abord
- `docs/plan-ref-7b.2-schema-revue.md` — historique ; le statut courant est dans le backlog

---

### Frontend (REF-7b.5)

**Ce qui existe** :
- ✅ Architecture UX clarifiée : [`docs/architecture-ux-reviewerpage-ref7b5.md`](docs/architecture-ux-reviewerpage-ref7b5.md)
- ✅ Plan implémentation : [`docs/plan-ref-7b.5-reviewerpage-frontend.md`](docs/plan-ref-7b.5-reviewerpage-frontend.md)
- ✅ Code V1 : `src/pages/ReviewerSnapshotPage.tsx`

**Livré** : grille lecture seule, panneau latéral, propositions chantier, modal de soumission, polish 7b.5bis.

**Reste** (plan frontend) : PCI figé `raci_chantier`, drawer plein écran sous 768 px, autosave, badges grille = **REF-7b.5ter**, panneau flottant = **REF-7b.6**.

**Fichiers clés** :
- `docs/architecture-ux-reviewerpage-ref7b5.md` — À lire d'abord
- `docs/plan-ref-7b.5-reviewerpage-frontend.md` — reste à faire listé en tête du plan
- `src/pages/ReviewerSnapshotPage.tsx` — page livrée, à étendre lot par lot

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
1. **reaction** : texte libre, éditable tant que non lu par le CODIR (`reaction_acknowledged_at IS NULL`)
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
**Étape 4** : Ouvre le plan correspondant (dans `docs/plan-ref-7b.*`)  
**Étape 5** : Suit les todos du plan  

### Je dois implémenter le backend (REF-7b.2)

**Chemin** :
1. Lire [`docs/# Règles métier — REF-7b.2 Cycle de revue feedback.md`](docs/#%20Règles%20métier%20—%20REF-7b.2%20Cycle%20de%20revue%20feedback.md) (20 min)
2. Consulter [`docs/plan-ref-7b.2-schema-revue.md`](docs/plan-ref-7b.2-schema-revue.md) (5 min)
3. Commencer Todo 1 : Migration Supabase

### Je dois implémenter le frontend (REF-7b.5)

**Chemin** :
1. Lire [`docs/architecture-ux-reviewerpage-ref7b5.md`](docs/architecture-ux-reviewerpage-ref7b5.md) (20 min)
2. Consulter [`docs/plan-ref-7b.5-reviewerpage-frontend.md`](docs/plan-ref-7b.5-reviewerpage-frontend.md) (5 min)
3. Enchaîner sur les todos « restants » du plan (PCI figé, responsive drawer, badges)

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

### Plans (versionnés dans `docs/`)
- `docs/plan-ref-7b.2-schema-revue.md` (backend)
- `docs/plan-ref-7b.5-reviewerpage-frontend.md` (frontend)

### Code
- `src/pages/ReviewerSnapshotPage.tsx` (V1 : grille + panneau + Partie 3)
- `src/lib/reviewerSnapshotRoadmap.ts` (hydratation chantiers/jalons depuis items snapshot)
- `src/lib/api/roadmapReviews.ts` (client Supabase reviewers + feedbacks)
- `src/RoadmapTimelineGrid.tsx` (clic chantier possible en lecture seule pour la revue)

### SQL Supabase (référence déploiement)
- `docs/supabase-roadmap-review-cycle.sql`

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
| Plan backend | ✅ AI | [`docs/plan-ref-7b.2-schema-revue.md`](plan-ref-7b.2-schema-revue.md) |
| Plan frontend | ✅ AI | [`docs/plan-ref-7b.5-reviewerpage-frontend.md`](plan-ref-7b.5-reviewerpage-frontend.md) |
| Implémentation | 🚧 Cycle partiel | `ReviewerSnapshotPage`, `roadmapReviews.ts` — statuts dans `docs/backlog.md` |

---

## Raccourcis rapides

| Besoin | Aller à |
|--------|---------|
| Comprendre le métier | [`Règles métier — REF-7b.2...`](docs/#%20Règles%20métier%20—%20REF-7b.2%20Cycle%20de%20revue%20feedback.md) |
| Comprendre l'UX | [`architecture-ux-reviewerpage-ref7b5.md`](docs/architecture-ux-reviewerpage-ref7b5.md) |
| Plan backend complet | [`docs/plan-ref-7b.2-schema-revue.md`](plan-ref-7b.2-schema-revue.md) |
| Plan frontend complet | [`docs/plan-ref-7b.5-reviewerpage-frontend.md`](plan-ref-7b.5-reviewerpage-frontend.md) |
| Où ça rentre dans le backlog | [`docs/backlog.md`](docs/backlog.md) (EPIC 3) |
| Règles git | [`docs/git-commit-conventions.md`](docs/git-commit-conventions.md) |

---

**Fin du README — Prêt à implémenter ! 🚀**
