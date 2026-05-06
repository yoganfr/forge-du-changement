# Checkpoint — Colonne « Axe » roadmap : titre KPI long (6 mai 2026)

**Contexte** : libellé complet de l’axe KPI trop haut en une seule colonne verticale ; découpage en **deux bandes** + ordre de lecture vertical conforme au sens (« 4. Mesure des Effets » puis « & indicateurs de suivi »).

## Implémentation livrée

| Élément | Fichier / détail |
|--------|-------------------|
| Données | `src/lib/axeMeta.ts` — `AXE_META.KPI.axisColumnSplit: ['4. Mesure des Effets', '& indicateurs de suivi']` |
| Composant | `src/RoadmapTimelineGrid.tsx` — `AxisColumnTitle`, classes `mr-tgrid__axis-cell-title--split`, `-line` |
| Styles | `src/MaturityRoadmap.css` — `flex-direction: row-reverse` + `direction: ltr` sur le conteneur split (lecture fiable vs `direction: rtl`) |

## Abandonné

- **Centrage vertical** du bloc titre entre le haut et le bas de la cellule (rowspan) : tentative CSS puis **`git revert`** — rendu non satisfaisant ; **à ne pas réappliquer** sans maquette / validation produit.

## Documentation vivante

- [`docs/backlog.md`](../backlog.md) — bloc **6 mai 2026** sous EPIC 3 (timeline) + entrée **Journal d’avancement**.
- [`docs/maturity-roadmap-synthese-evolutions-produit.md`](../maturity-roadmap-synthese-evolutions-produit.md) — §10 État technique dans le dépôt.

Dernière mise à jour du présent fichier : **6 mai 2026**, 23 h 43 (Europe/Paris) — alignée sur `docs/backlog.md`.
