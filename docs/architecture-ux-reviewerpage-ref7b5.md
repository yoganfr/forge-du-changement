# Analyse architecture UX — ReviewerPage (REF-7b.5)

**Date** : 6 mai 2026

---

### Voir aussi
- **Règles métier cycle de revue** : [`docs/# Règles métier — REF-7b.2 Cycle de revue feedback.md`](docs/#%20Règles%20métier%20—%20REF-7b.2%20Cycle%20de%20revue%20feedback.md) — Fondations (lifecycle, feedbacks, arbitrage)
- **Plan d'implémentation frontend** : [`.cursor/plans/ref-7b.5_frontend_reviewerpage_implementation.plan.md`](.cursor/plans/ref-7b.5_frontend_reviewerpage_implementation.plan.md) — 8 composants, refactor grille, 6 todos
- **Backlog** : [`docs/backlog.md`](docs/backlog.md) (ligne 138) — REF-7b.5 dans EPIC 3

---

## 1. Réutilisation RoadmapTimelineGrid : analyse

### Option A : Réutiliser avec readOnly=true

**Avantages** :
- Zéro duplication code (DRY)
- Cohérence visuelle avec la roadmap CODIR
- Timeline columns partagées (même rendu temps)
- PCI / RACI affichage identique
- Maintenance simplifiée (1 grille = 1 évolution)

**Inconvénients** :
- `RoadmapTimelineGrid` est **très couplée** au mode édition (callbacks DnD, etc.)
- Beaucoup de props inutiles en mode viewer (ex: `onJalonDrop`, `onChantierDrop`)
- **Code bloat** : props défendues par `if (!readOnly)` partout
- Si des bugs d'édition surviennent, risque de cross-contamination viewer
- Logique métier mélangée : filtrages par `readOnly` → difficile à relire
- **Scrollable horizontal** : peut être insuffisant pour colloquer grille + panneau commentaires side-by-side (encombrement)

### Option B : Créer ReviewerGrid (variante légère)

**Avantages** :
- Code dédié = lisible, zéro if/readOnly
- Prêt pour future évolution (commentaires inline optionnels, highlight feedbacks, etc.)
- Pas de "murmuring" callbacks inutiles
- Meilleure séparation concerns (vue ≠ édition)
- Lighter payload props (juste ce qui est visualisé)

**Inconvénients** :
- Duplication : same table structure, groupement par axe, colonnes temps
- **Maintenance** : si timeline columns change, faut updater 2 endroits
- Risque d'incohérence visuelle (légères diffs rendering)
- Plus de code à écrire + tests

### Option C : Hybride - Wrapper

```tsx
<RoadmapTimelineGrid 
  readOnly={true}
  {...props}
/>
<CommentPanelLayout>
  {/* Panneau côté */}
</CommentPanelLayout>
```

**Avantages** :
- Réutilisation grille (DRY)
- Layout flexible (panneau peut être dimensionné indépendamment)
- Responsive : drawer adaptatif mobile vs desktop

**Inconvénients** :
- Même couplage que Option A
- Wrapper n'apporte pas beaucoup (juste CSS layout)

---

### Recommandation : **Option B (ReviewerGrid légère)**

**Raison** : Cycle reviewer est **critique et isolé** (pas d'édition, UX strictement lecture + commentaires). Coupling avec éditeur introduit risques inutiles. Duplication code est acceptable (grille est ~150 lignes, timeline columns utilité est juste timings, ~50 lignes).

**Pattern à suivre** :
- Créer `ReviewerRoadmapGrid.tsx` (80% identique à `RoadmapTimelineGrid`, but 20% spécialisé)
- Réutiliser `buildTimelineColumns()` et helpers temps (pas de duplication là)
- Props minimalistes : `chantiers`, `jalonsByChantier`, `readOnlyData` + callback `onJalonSelected(jalon, chantierId)`
- Aucun callback mutation (pas de DnD, pas d'edits)

---

## 2. Panneau commentaires : UX patterns standards

### Pattern 1 : Panneau flottant déplaçable (react-rnd)

**Exemples réels** :
- Linear.app : task detail slide-out, déplaçable
- Figma : design panels
- Slack : thread viewer

**Pour ReviewerPage** :
```
[Timeline Grid]                [Panel comments | Reac/Decision form]
scrollable left                Flottant ou ancré droit
clic jalon → highlight + update panel
```

**Avantages** :
- Pas de reflow grille (utile si dense)
- Multi-sélection possible (ouvrir 2 jalons côte-à-côte? Non pour reviewer, 1 seul)
- Pattern déjà utilisé (`JalonDrawer` existe)
- Desktop: bon
- Mobile: panneau peut être en fullscreen ou onglet

**Inconvénients** :
- Déplaçable = risque confusion utilisateur (où est mon panneau?)
- Mobile: fullscreen mieux que flottant
- État persistance : où sauvegarder position du panneau?

### Pattern 2 : Sidebar droit fixe (layout grid CSS)

**Exemples réels** :
- Notion : page + properties sidebar
- GitHub : PR details sidebar
- Linear : filter panels

```
[Timeline Grid | Fixed Sidebar]
peut scroll indépendamment
```

**Avantages** :
- Prédictible (sidebar toujours visible)
- UX stable mobile et desktop
- Facile à responsive (sidebar basculer en haut/bas si mobile <768px)
- À un seul clic : jalon sélectionné → update sidebar
- Bien pour dense UI

**Inconvénients** :
- Réduit espace horizontal pour grille (peut devenir cramped si bcp colonnes temps)
- Scrollbar grille + scrollbar sidebar = "scrollbar confusion"

### Pattern 3 : Panneau modal / slide-out plein écran

**Exemples réels** :
- Mobile Gmail : clic email → fullscreen detail
- Twitter : tweet detail modal

```
[Timeline Grid] + clic jalon → Modal/Slide fullscreen
```

**Avantages** :
- Mobile: excellent (fullscreen naturel)
- Desktop: focalisé
- Pas d'encombrement horizontal

**Inconvénients** :
- Perte contexte grille (ne vois pas les autres jalons)
- Back/forward compliqué (modal state hard to track)
- Pas pour "review rapide" (trop disruptif)

---

### Recommandation : **Pattern 2 (Sidebar fixe droit) + responsive**

**Raison** : Reviewer doit **garder le contexte grille** tout en commentant. Sidebar fixe est moderne standard. Responsive : mobile <768px → sidebar bascule en tab/drawer.

**Architecture** :
```tsx
<ReviewerPageLayout>
  <GridSection>
    <ReviewerRoadmapGrid 
      onJalonSelected={(jalon) => setSelectedJalon(jalon)}
      highlightedJalonId={selectedJalon?.id}
    />
  </GridSection>
  
  <CommentSidebarSection>
    {selectedJalon && (
      <CommentPanel 
        jalon={selectedJalon}
        chantierId={selectedChantierId}
        onSubmitReaction={...}
        onToggleDecision={...}
      />
    )}
  </CommentSidebarSection>
</ReviewerPageLayout>

// CSS
.layout { display: grid; grid-template-columns: 1fr 350px; }
@media (max-width: 768px) { 
  .layout { grid-template-columns: 1fr; } // sidebar into tabs/drawer
}
```

---

## 3. Partie 3 — Propositions (popin clic chantier)

### Contexte produit

**Partie 3** = « Proposer un nouveau chantier ». 

**Quand s'affiche** :
- Reviewer clique une zone AUTRE que jalon : ex chantier, ou cellule temps vide
- Optionnellement : "+" button dédié

**Contenu du popin** :
- Projet père (select)
- Axe rattachement (radio buttons PROCESSUS/ORG/OUTILS/KPI)
- Titre chantier (input)
- Constat/Proposition/Bénéfice (textareas)
- Bouton "Soumettre au CODIR"
- **Tableau des propositions déjà soumises** par ce reviewer (lecture seule, montre statut arbitrage CODIR)

### UX considérations

**Trigger du popin** :
- Clic sur "nom chantier" ou sur "cellule vide" dans la grille?
- Ou un bouton "Proposer chantier" séparé?

**Décision** : Clic sur chantier **existant** doit ouvrir les commentaires (Partie 2). Clic sur **cellule vide** (hors chantier) → popin Partie 3.

**Affichage tableau propositions** : 
- En haut du popin (liste compacte) ou en bas (après formulaire)?
- Scrollable indépendant?

---

## 4. Layout 2 parties + Partie 3 en bas

### Layout global

```
┌──────────────────────────────────────────────────────────────┐
│ Header : Bandeau deadline + « Soumettre ma revue »           │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Partie 2: Roadmap grille (lecture-seule, SANS drag/edit)    │
│ - Affichage identique roadmap CODIR actuellement             │
│ - Clic en-tête CHANTIER → panel commentaires                 │
│ - Clic pilule JALON → panel commentaires                     │
│ - Clic RACI CHANTIER (colonne droite) → panel commentaires   │
│                                                              │
│ [Grille avec RACI]                                          │
│ (scrollable H)                                              │
│                                                              │
│ [Panel commentaires s'ouvre au clic]                        │
│ - Formulaire réaction/decision                              │
│ - Commentaires historique                                   │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Partie 3: Proposer un chantier (section en bas, scroll)     │
│ - Projet père (select parmi V1)                             │
│ - Axe (PROCESSUS / ORG / OUTILS / KPI)                      │
│ - Titre chantier                                            │
│ - Constat / Proposition / Bénéfice                          │
│ - Submit button                                             │
│ - Tableau propositions déjà soumises                        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Responsive mobile

```
<600px:
┌──────────────────────────┐
│ Header                   │
├──────────────────────────┤
│ Roadmap grille (scroll H)│
│ (clic chantier/jalon)    │
│                          │
├──────────────────────────┤
│ Proposer un chantier     │ ← en bas (scroll)
│ - Formulaire + tableau   │
│                          │
└──────────────────────────┘

Panel commentaires → slide-up ou drawer fullscreen
```

---

## 5. Composants nouveaux à créer

| Composant | Fichier | Rôle |
|-----------|---------|------|
| **ReviewerRoadmapGrid** | `src/ReviewerRoadmapGrid.tsx` | Grille axes × temps, read-only |
| **ReviewerPageLayout** | `src/pages/ReviewerPage.tsx` (ou refactor `ReviewerSnapshotPage.tsx`) | Container principal 3 parties |
| **CommentPanel** | `src/components/CommentPanel.tsx` | Panneau droit : affiche jalon + form réaction/decision |
| **PropositionPopin** | `src/components/PropositionPopin.tsx` | Modal/Drawer : Partie 3, constat/prop/bénéfice + tableau propositions |
| **ProjectAccordion** | `src/components/ProjectAccordion.tsx` | Partie 1 : projets transformants, repliable |

---

## 6. Points de vigilance

1. **Synchronisation données grille ↔ sidebar** : si reviewer change de jalon via clic, update sidebar immédiatement (petite latence OK)
2. **Scroll mobile** : grille horizontale + sidebar = besoin CSS media query stricte
3. **Popin Partie 3** : si reviewer a déjà soumis une review (status=submitted), popin doit être fermé (lecture seule tableau propositions, pas création)
4. **Hiérarchie commentaires** : parent_id gestion — afficher réponses CODIR sous le feedback reviewer (accordion)
5. **Couleurs chantier/jalon** : maintenir cohérence avec roadmap CODIR (même `projectColorById`)

---

## 7. Implémentation séquence suggérée

1. **Créer `ReviewerRoadmapGrid.tsx`** (80% copie `RoadmapTimelineGrid`, 20% simplifie)
2. **Refactor `ReviewerSnapshotPage.tsx`** → `ReviewerPage.tsx` (3 parties layout)
3. **Créer `CommentPanel.tsx`** (form réaction + decision toggle)
4. **Créer `PropositionPopin.tsx`** (Partie 3)
5. **Wire data flow** (selectedJalon state, feedback submission, etc.)
6. **Style + responsive**
7. **Test intégration avec API REF-7b.2 futures**

---

## Résumé décisions

✅ **Grille** : `ReviewerRoadmapGrid` (Option B — variante légère)  
✅ **Commentaires** : Sidebar droit fixe (Pattern 2) + responsive mobile  
✅ **Partie 3** : Popin clic hors-chantier → propositions form + tableau  
✅ **Layout** : 3 sections (projets + grille/sidebar + popin modal)  
✅ **Responsive** : <768px basculer sidebar en onglets/drawer  
