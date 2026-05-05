# Workflow de planification de feature pour agents IA

**Guide du processus : De la clarification métier à l'implémentation prête**

Dernière mise à jour : **6 mai 2026**, 01 h 10 (Europe/Paris)

---

## Intro : Pourquoi ce processus ?

Quand une feature est mal documentée, les IAs qui arrivent en session N+1 perdent du temps ou redécouvrent les mêmes problèmes. Ce workflow assure que chaque feature est **cristallisée, documentée et découvrable** avant le développement.

**Résultat attendu** : Une IA qui arrive avec la demande "Implémenter REF-XXX" doit trouver un chemin clair du métier au code en <5 min.

---

## Les 5 phases du workflow

### Phase 1 : CLARIFICATION MÉTIER (✅ Obligatoire avant code)

**Objectif** : Résoudre **tous** les ambiguïtés métier/produit.

**Outils** :
- Questions structurées via `AskQuestion` tool (options à choix, pas open-ended)
- Itération interactive avec le PO/utilisateur
- Focus sur : règles, états, transitions, permissions, cas limites

**Livrables** :
- ✅ Document : `docs/Règles métier — REF-XXX.md`
  - Lifecycle complet (états + transitions)
  - Cas limites et edge cases
  - Permissions/RLS requirements
  - Audit/traçabilité scope
  - ~200-400 lignes

**Checklist Phase 1** :
- [ ] Toutes ambiguïtés métier résolues via AskQuestion
- [ ] Lifecycle clairement défini
- [ ] Tous les "et si ?" traités
- [ ] PO a validé les décisions finales
- [ ] Règles métier doc créée et commise

**Exemple** : [`docs/# Règles métier — REF-7b.2 Cycle de revue feedback.md`](docs/#%20Règles%20métier%20—%20REF-7b.2%20Cycle%20de%20revue%20feedback.md)

---

### Phase 2 : ARCHITECTURE & UX (✅ Obligatoire si frontend)

**Objectif** : Décider comment l'utilisateur interagit avec la feature.

**Outils** :
- Analyse options UX (A vs B vs C)
- Diagrammes ASCII (layout, flow)
- Composant tree si React
- Décisions architecturales documentées

**Livrables** :
- ✅ Document : `docs/Architecture UX — REF-XXX.md`
  - Layout global (ASCII art)
  - Composants/sections
  - Interactions clés
  - Responsive considerations
  - Analyse trade-offs (1 choix = plusieurs options comparées)
  - ~150-300 lignes

**Checklist Phase 2** :
- [ ] Options UX analysées (pros/cons)
- [ ] Choix justifié
- [ ] Layout clair (ASCII)
- [ ] Composants listés
- [ ] Interactions documentées
- [ ] Doc créée et commise

**Exemple** : [`docs/architecture-ux-reviewerpage-ref7b5.md`](docs/architecture-ux-reviewerpage-ref7b5.md)

---

### Phase 3 : PLANS D'IMPLÉMENTATION (✅ Obligatoire)

**Objectif** : Diviser le travail en todos structurés.

**Outils** :
- Créer fichiers `.plan.md` dans `.cursor/plans/`
- Frontmatter YAML avec todos structurés
- Spécifier : schéma, API, composants, validations
- Une IA qui lit le plan doit connaître **exactement** quoi faire

**Livrables** :

#### Plan Backend (si Supabase)
- **File** : `.cursor/plans/ref-XXX_schema_backend_implementation.plan.md`
- Contenu :
  - Schéma SQL (tables, columns, indexes, constraints)
  - RLS policies (par table)
  - API routes (endpoint, body, returns)
  - Audit trail scope
  - Validations applicatives
  - 5-10 todos linéaires
  - ~400-600 lignes

#### Plan Frontend (si React)
- **File** : `.cursor/plans/ref-XXX_frontend_component_implementation.plan.md`
- Contenu :
  - Composants à créer (liste + responsabilité)
  - State management structure
  - API client wrapper
  - TypeScript types
  - Flow utilisateur (étapes)
  - 6-12 todos linéaires
  - ~300-500 lignes

**Checklist Phase 3** :
- [ ] Plans créés dans `.cursor/plans/`
- [ ] Todos numérotés et linéaires (1→2→3)
- [ ] Chaque todo : 1 concept clair = 1-2h de travail
- [ ] Schéma SQL complet (si backend)
- [ ] Composants listés (si frontend)
- [ ] Types TypeScript définis
- [ ] API routes spécifiées (si backend)

**Exemple** :
- [`ref-7b.2_schema_revue_final_implementation.plan.md`](.cursor/plans/ref-7b.2_schema_revue_final_implementation.plan.md)
- [`ref-7b.5_frontend_reviewerpage_implementation.plan.md`](.cursor/plans/ref-7b.5_frontend_reviewerpage_implementation.plan.md)

---

### Phase 4 : MISE À JOUR BACKLOG & RÉFÉRENCES (✅ Obligatoire)

**Objectif** : Faire que la feature soit découvrable dans le backlog.

**Actions** :
1. Ouvrir `docs/backlog.md`
2. Trouver la ligne de la REF concernée
3. **Ajouter références** aux docs/plans créés
4. Passer statut de ⬜ (à faire) → 🚧 (en cours)
5. Commit backlog

**Checklist Phase 4** :
- [ ] REF trouvée dans `docs/backlog.md`
- [ ] Lien vers doc Règles métier : `[`docs/Règles métier — REF-XXX.md`](...)`
- [ ] Lien vers doc Architecture UX (si pertinent)
- [ ] Liens vers plans : `[`ref-XXX_schema...plan.md`](.cursor/plans/...)`
- [ ] Statut passé à 🚧
- [ ] Horodatage France mis à jour (commande en CLAUDE.md)
- [ ] Commit backlog: `docs(backlog): updater REF-XXX avec références...`

**Exemple** : [`docs/backlog.md`](docs/backlog.md) lignes 135-138

---

### Phase 5 : DÉCOUVRABILITÉ POUR LES IA (✅ Très important)

**Objectif** : Assurer qu'une IA qui arrive en session N+1 trouve tout en <5 min.

**Actions** :

#### 5a : Ajouter section "Voir aussi" dans les docs spécialisées

Chaque doc (Règles métier + Architecture UX) doit avoir :
```markdown
### Voir aussi
- **[Autre doc spécialisée]** : Lien + description
- **[Plan backend/frontend]** : Lien + description
- **[Backlog]** : Lien ligne + EPIC
```

#### 5b : Créer README centralisateur (si feature complexe)

Pour les grosses features (REF-7b, etc.), créer :
- **File** : `docs/README_ref-XXX.md`
- Contenu :
  - Résumé 30 secondes
  - Structure travail (backend/frontend)
  - Cheminements de navigation (3 scenarios)
  - Fichiers clés
  - Raccourcis rapides
  - ~200 lignes

#### 5c : Updater `CLAUDE.md` tableau

Dans `CLAUDE.md` section 3 (Docs à lire selon la demande) :
- Ajouter ligne : `|| Feature XXX | [`docs/README_ref-XXX.md`](...) |`

#### 5d : Ajouter à `.cursor/rules/` si applicable

Si la feature a des patterns ou conventions nouvelles :
- Créer `d:\...\forge-du-changement\.cursor\rules\ref-XXX-conventions.mdc`
- Documenter les patterns/conventions/gotchas

**Checklist Phase 5** :
- [ ] Section "Voir aussi" dans Règles métier
- [ ] Section "Voir aussi" dans Architecture UX
- [ ] README centralisateur créé (si feature complexe)
- [ ] CLAUDE.md tableau mis à jour
- [ ] Croix-liens fonctionnels (test les liens)
- [ ] `.cursor/rules/` mis à jour si patterns nouveau
- [ ] Commit découvrabilité

---

## Git workflow pour les phases

**Commits recommandés** :

| Phase | Commit | Message type |
|-------|--------|--------------|
| 1 | Règles métier doc | `docs(ref-XXX): ajouter règles métier — lifecycle, feedbacks, arbitrage` |
| 2 | Architecture UX doc | `docs(ref-XXX): architecture UX — layout, composants, interactions` |
| 3 | Plans créés | Locaux, non committés (`.cursor/plans/` dans `.gitignore`) |
| 4 | Backlog update | `docs(backlog): updater REF-XXX avec références docs/plans` |
| 5 | Découvrabilité | `docs(ref-XXX): améliorer découvrabilité — README + CLAUDE.md + Voir aussi` |

**Total** : 4 commits publics (1, 2, 4, 5)

---

## Templates pour chaque phase

### Template : Règles métier doc

```markdown
# Règles métier — REF-XXX [Nom feature]

*Document de référence pour le module REF-XXX. Spécifie...*

Dernière mise à jour : **X mois 2026**, HH h MM (Europe/Paris)

---

### Voir aussi
- **Plan d'implémentation** : [...](.cursor/plans/...)
- **Architecture UX** : [...](...) (si applicable)
- **Backlog** : [...](docs/backlog.md) (ligne XXX)

---

## 1. Concepts fondamentaux

### 1.1 Lifecycle [Nom]
| État | → | Condition | Action |
|------|---|-----------|--------|

### 1.2 Types / Kinds [Nom]
- **Type 1** : description
- **Type 2** : description

## 2. Permissions / RLS

### RLS Policy 1 : ...
```sql
...
```

## 3. Audit Trail
- Event 1 : ...
- Event 2 : ...

## 4. Validations applicatives
...
```

### Template : Architecture UX doc

```markdown
# Architecture UX — REF-XXX [Nom feature]

**Date** : X mois 2026

---

### Voir aussi
- **Règles métier** : [...](...) 
- **Plan frontend** : [...](.cursor/plans/...)
- **Backlog** : [...](docs/backlog.md)

---

## 1. Layout global

```
┌─────────────────────────────┐
│ Header / Section 1          │
├─────────────────────────────┤
│ Main content / Section 2    │
└─────────────────────────────┘
```

## 2. Composants à créer

| Composant | Responsabilité |
|-----------|---|

## 3. Interactions clés

1. Clic [Element] → [Action]
2. ...

## 4. State management

```typescript
interface State {
  ...
}
```

## 5. Responsive mobile
...
```

### Template : Plan d'implémentation

```markdown
---
name: REF-XXX [Titre]
overview: Implémenter [description courte]
todos:
  - id: todo_1
    content: [Action spécifique et claire]
    status: pending
  - id: todo_2
    content: ...
    status: pending
isProject: false
---

# REF-XXX [Titre]

**Fondé sur** : `docs/Règles métier — REF-XXX.md` + `docs/Architecture UX — REF-XXX.md`
**Dernière maj** : X mois 2026

---

## 1. Décisions cristallisées

[Résumé des décisions clés du planning]

---

## 2. [Section principale 1 : Schéma / Composants]

[Détails techniques]

---

## [Todos linéaires]

### Todo 1 : [Action]
- [ ] Sous-point 1
- [ ] Sous-point 2

### Todo 2 : ...
```

---

## Checklist complet (avant implémentation)

### Règles métier
- [ ] Lifecycle défini (tous les états)
- [ ] Cas limites documentés
- [ ] Permissions clairement spécifiées
- [ ] RLS policies écrites en SQL
- [ ] Audit trail scope
- [ ] PO validation ✓
- [ ] Doc créée et commise

### Architecture UX
- [ ] Layout clairement dessiné (ASCII)
- [ ] Composants listés
- [ ] Interactions documentées
- [ ] Options UX comparées (trade-offs)
- [ ] Responsive thought through
- [ ] State management défini
- [ ] Doc créée et commise

### Plans d'implémentation
- [ ] Plan backend créé (si applicable)
  - [ ] Schéma SQL complet
  - [ ] RLS policies
  - [ ] API routes spécifiées
  - [ ] 5-10 todos
- [ ] Plan frontend créé (si applicable)
  - [ ] Composants listés
  - [ ] State structure
  - [ ] 6-12 todos
- [ ] Types TypeScript définis
- [ ] API client wrapper spécifié

### Backlog & découvrabilité
- [ ] REF trouvée dans backlog.md
- [ ] Liens vers docs ajoutés
- [ ] Liens vers plans ajoutés
- [ ] Statut → 🚧
- [ ] Horodatage France
- [ ] CLAUDE.md tableau mis à jour
- [ ] README centralisateur créé
- [ ] "Voir aussi" sections dans docs
- [ ] Tous les liens testés ✓
- [ ] Commit découvrabilité

### Git
- [ ] 4 commits (Règles + Architecture + Backlog + Découvrabilité)
- [ ] Messages de commit clairs
- [ ] `Made-with: Cursor AI` trailers
- [ ] Tous pushés vers `main`

---

## Cas d'usage : Quand utiliser ce workflow

### Workflow COMPLET (5 phases)
- ✅ Nouvelle feature complexe (frontend + backend)
- ✅ Changement architecture
- ✅ Module nouveau
- **Exemple** : REF-7b.2 + REF-7b.5 ReviewerPage

### Workflow PARTIEL (Phase 1+2 omise, 3+4+5)
- ✅ Bug à fixer (métier clair)
- ✅ Feature small/simple
- ✅ Refactor défini
- **Exemple** : Petite correction UI

### Workflow MINIMAL (Phase 5 only)
- ✅ Hot fix urgent
- ✅ Tech debt évident
- **Exemple** : Typo, perf quick win

---

## Exemple concret : REF-7b ReviewerPage

**Phases complètement appliquées** :

| Phase | Livrable | Fichier |
|-------|----------|---------|
| 1 | Règles métier | [`docs/# Règles métier — REF-7b.2 Cycle de revue feedback.md`](docs/#%20Règles%20métier%20—%20REF-7b.2%20Cycle%20de%20revue%20feedback.md) |
| 2 | Architecture UX | [`docs/architecture-ux-reviewerpage-ref7b5.md`](docs/architecture-ux-reviewerpage-ref7b5.md) |
| 3 | Plans | [`ref-7b.2_schema_revue_final_implementation.plan.md`](.cursor/plans/ref-7b.2_schema_revue_final_implementation.plan.md) + [`ref-7b.5_frontend_reviewerpage_implementation.plan.md`](.cursor/plans/ref-7b.5_frontend_reviewerpage_implementation.plan.md) |
| 4 | Backlog ref | [`docs/backlog.md`](docs/backlog.md) (lignes 135-138) |
| 5 | Découvrabilité | [`docs/README_ref7b-reviewerpage.md`](docs/README_ref7b-reviewerpage.md) + CLAUDE.md + "Voir aussi" |

**Résultat** : Une IA qui arrive en session N+1 peut lancer l'implémentation en <5 min ✅

---

## Trucs & astuces

### Trick 1 : Questions structurées
Ne **jamais** poser des questions ouvertes. Toujours proposer 2-4 options via `AskQuestion`.
```
Mauvais : "Comment devraient-ils lire les réactions ?"
Bon : "Devraient-ils lire en (A) temps réel, (B) batch quotidien, (C) sur demande ?"
```

### Trick 2 : Diagrammes ASCII
Les vrais diagrammes (Mermaid, Figma) sont nice but not required. Les ASCII art sont souvent plus rapides et restent 100% lisibles.

### Trick 3 : Todos linéaires
Évite les todos parallèles. Chaque todo doit être : "J'ai fait 1-3, je dois faire 4 maintenant".

### Trick 4 : Horodatage France
Toujours utiliser la commande Node documentée dans CLAUDE.md (section 8). Ne jamais deviner.

### Trick 5 : Croix-liens
Après chaque doc créée, mettre "Voir aussi" et tester les liens. Une IA qui clic trouvera le chemin complet.

### Trick 6 : Commits granulaires
1 commit = 1 phase (ou 1 doc). Pas de "docs: big update" qui mélange tout.

---

## Anti-patterns à éviter

### ❌ Anti-pattern 1 : Phase 1 incomplète
Commencer code avant que le PO ait validé le lifecycle. Résultat : découvrir des edge cases en code.

### ❌ Anti-pattern 2 : Plans sans todos
Créer un plan sans numéroter les todos. Une IA ne sait pas par où commencer.

### ❌ Anti-pattern 3 : Aucune découvrabilité
Créer des docs mais pas les linker. L'IA N+1 ne les trouvera jamais.

### ❌ Anti-pattern 4 : Docs orphelines
Règles métier exists mais pas mentionnées dans le backlog. Invisible.

### ❌ Anti-pattern 5 : Horodatage inventé
Mettre "6 mai 2026" sans vérifier. Les docs disent n'importe quoi à propos du timing.

---

## Quand ce workflow s'arrête

Le workflow se termine quand :
- ✅ Phase 5 complétée
- ✅ Todos structurés dans les plans
- ✅ Toutes les IA qui arrivent peuvent naviguer
- ✅ Commits pushés vers `main`
- ✅ Status REF → 🚧

**À partir d'ici**, une **autre IA peut lancer l'implémentation** sans revenir à la Phase 1.

---

## Comment améliorer ce workflow

Ce document est vivant. Suggestions :
- Vous avez découvert un cas qui ne rentre pas ? Signalez-le.
- Vous avez trouvé un template meilleur ? Mettez à jour la section.
- Un anti-pattern oublié ? Ajoutez-le.

**Editez ce fichier** et committez : `docs(workflow): améliorer...`

---

## Références

- **Point d'entrée planning** : Ce document
- **Point d'entrée implémentation** : `docs/README_ref7b-reviewerpage.md` (exemple)
- **Point d'entrée général** : `CLAUDE.md` section 3
- **Git conventions** : `docs/git-commit-conventions.md`

---

**Fin du workflow guide — Pour une IA qui travaille sur ce projet 🚀**
