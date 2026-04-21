# Mise à jour Backlog — 21 avril 2026, 21 h 18 (Europe/Paris)

## Contexte

Lot **EPIC 3 · REF-7b.1** (matrice PCI dans la roadmap) et **ergonomie de la grille timeline** (`RoadmapTimelineGrid`) après validation produit sur le scroll interne, les repères visuels et le refactor PCI.

## Périmètre livré

### 1. Intégration PCI · matrice chantier × parties prenantes

- Colonnes PCI à droite de la timeline dans `MaturityRoadmap`, alignées sur les lignes chantiers (travail antérieur consolidé dans ce commit).
- **Refactor** pour clarifier le code :
  - [`src/pciMatrixTypes.ts`](../src/pciMatrixTypes.ts) — types et helpers (ex. `roleBadge`) partagés.
  - [`src/usePciMatrix.tsx`](../src/usePciMatrix.tsx) — logique matrice / canonical stakeholders / ouverture cellules.
  - [`src/RaciChantiersPopover.tsx`](../src/RaciChantiersPopover.tsx) — popover création / édition partie prenante.
  - Allègement de [`src/RaciChantiersMatrix.tsx`](../src/RaciChantiersMatrix.tsx) et branchement dans [`src/MaturityRoadmap.tsx`](../src/MaturityRoadmap.tsx).

### 2. UX scroll horizontal · grille timeline (validation CODIR desktop-first)

| Élément | Description |
|--------|-------------|
| **P0** | Scroll horizontal **interne** au conteneur de la grille (pas de bascule vers le scroll de la page pour ce flux). |
| **P1** | Fonds des cellules / blocs d’axe **Processus** et **Organisation** opaques (`color-mix` avec `var(--theme-bg-card)`) pour éviter la transparence au défilement. |
| **P2** | Scrollbar plus visible (piste + curseur, `scrollbar-width` / WebKit). Texte d’intro explicite sur le défilement horizontal (échéances + parties prenantes). |
| **A** | Dégradé léger à droite **uniquement** s’il reste du contenu à défiler vers la droite (affinement ultérieur : bande étroite, très discret). |
| **D** | Boutons flèche gauche / droite, **trois repères verticaux** (haut · centre · bas) répartis sur la **hauteur visible** du tableau (intersection viewport), pas sur la hauteur totale du DOM — recalcul via `getBoundingClientRect`, `ResizeObserver`, `scroll`/`resize`. |
| **Git** | Mesure de bande `scrollNavStrip` `{ top, height }` pour positionner les colonnes de flèches ; `syncHorizontalScrollUi` unifié (overflow horizontal + fade + repères). |

### 3. Fichiers principaux

| Fichier | Rôle |
|---------|------|
| [`src/RoadmapTimelineGrid.tsx`](../src/RoadmapTimelineGrid.tsx) | Grille, PCI rows, scroll UI (fade, flèches, états). |
| [`src/MaturityRoadmap.css`](../src/MaturityRoadmap.css) | Styles axe, scroll, dégradé, navigation latérale. |
| [`src/MaturityRoadmap.tsx`](../src/MaturityRoadmap.tsx) | Composition roadmap + hook PCI. |
| [`src/RaciChantiersMatrix.tsx`](../src/RaciChantiersMatrix.tsx) | Matrice allégée. |
| [`src/RaciChantiersPopover.tsx`](../src/RaciChantiersPopover.tsx) | Popover PCI (nouveau). |
| [`src/usePciMatrix.tsx`](../src/usePciMatrix.tsx) | Hook PCI (nouveau). |
| [`src/pciMatrixTypes.ts`](../src/pciMatrixTypes.ts) | Types PCI (nouveau). |

## Statut backlog

- **REF-7b.1** reste **🚧** tant que la spec PCI / revue n’est pas bouclée (ReviewerPage, etc.).
- Les livrables ci-dessus constituent un **jalon UX + refactor** documenté pour traçabilité ; pas de nouvelle ligne REF dédiée dans le tableau EPIC 3 (journal compact dans [`backlog.md`](backlog.md)).

## Vérifications effectuées côté dépôt

- `npx tsc --noEmit` à la racine du projet Vite après les changements.

## Référence Git

Le hash du commit correspondant est visible via `git log -1 --oneline` sur la branche où ce lot a été intégré.
