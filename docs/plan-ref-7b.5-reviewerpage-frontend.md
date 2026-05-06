# Plan REF-7b.5 — ReviewerPage V1

**Architecture UX** : [`docs/architecture-ux-reviewerpage-ref7b5.md`](architecture-ux-reviewerpage-ref7b5.md)  
**Page** : [`src/pages/ReviewerSnapshotPage.tsx`](../src/pages/ReviewerSnapshotPage.tsx)  
**Hydratation snapshot** : [`src/lib/reviewerSnapshotRoadmap.ts`](../src/lib/reviewerSnapshotRoadmap.ts)

## Livré (itération courante)

- Grille lecture seule (`RoadmapTimelineGrid` + `buildTimelineColumns(frozen_at)`).
- Clic chantier en `readOnly` si `onChantierCellClick` (correctif `RoadmapTimelineGrid`).
- Panneau latéral : réaction / demande de décision sur `chantier` | `jalon`.
- Partie 3 : `proposition_chantier` + liste des feedbacks.
- Bandeau deadline + modal « Soumettre ma review ».
- Statut reviewer via `getReviewerRowForUser`.

## Todos restants

1. [ ] PCI figé dans le snapshot ou flux dédié pour `raci_chantier` + colonnes Parties prenantes.
2. [ ] Responsive : drawer plein écran &lt; 768px pour le panneau commentaires.
3. [ ] Autosave / debounce optionnel sur le panneau.
4. [ ] Badges 💬 sur chantiers/jalons commentés.
5. [ ] REF-7b.6 : panneau flottant `react-rnd` si validé produit.
