# Plan REF-7b.5 — ReviewerPage V1

## Story — révision 4

Dernière mise à jour : **3 novembre 2026**, 02 h 28 (Europe/Paris)

La révision 4 ajoute le retour du dernier commentaire dans le panneau de droite. La révision 3 reste le texte des trois incréments déjà écrits. Ses accords ne couvrent pas la révision 4.

| Ligne | État |
|---|---|
| Story | révision 4, approuvée. Phrase : « J'approuve la story REF-7b.5, révision de story 4. » L’approbation de la révision 3 est suspendue : elle ne couvre pas ce panneau. |
| Revue critique | écrite pour la révision 4. Aucun blocage ouvert. Elle n’est pas l’approbation. |
| Revue sensible | non requise, revérifiée pour la révision 4. Le reviewer revoit son propre brouillon sur la revue déjà ouverte. Cela ne crée pas de droit, n’ouvre pas une autre entreprise, et ne change pas la règle du 1 novembre 2026 sur la part de chaque direction. |
| Autorisation de planifier | donnée pour la révision 4. Phrase : « J'autorise la planification de REF-7b.5, révision de story 4. » |
| Plan technique | révision 2, ci-dessous. Elle couvre la story révision 4. La révision 1 reste le plan de la story révision 3. |
| Autorisation de coder | donnée. Phrase : « J'autorise le code de REF-7b.5, révision de story 4, révision de plan 2. » |

### Problème

La page de revue permet de lire la version figée et d’enregistrer un retour à la main. Trois restes du lot sont encore ouverts : les parties prenantes figées, le panneau sur petit écran, l’enregistrement au fil de la saisie.

### Valeur

Le reviewer commente la version qui a été figée, y compris les parties prenantes, sans perdre un texte et sans panneau inutilisable sur un écran étroit.

### Faits sourcés

- Backlog, EPIC 3 · **REF-7b.5** : cœur V1 livré. Restent le PCI figé (`raci_chantier`), le drawer plein écran sous 768 px, l’autosave. **REF-7b.5bis** est recetté. **REF-7b.5ter** est un autre numéro.
- `docs/# Règles métier — REF-7b.2 Cycle de revue feedback.md` §1.3 : un retour peut viser `raci_chantier`. §2.1 : en brouillon, le reviewer crée et édite ses retours en autosave.
- `docs/architecture-ux-reviewerpage-ref7b5.md` §2 : sous 768 px, la colonne de commentaires devient onglets ou drawer.
- Ce fichier, todos : le PCI figé est écrit « dans le snapshot ou flux dédié » ; le responsive est écrit « drawer plein écran » ; l’autosave est écrit « optionnel ».
- Code lu le 3 novembre 2026 : le panneau a un bouton « Enregistrer le feedback » (`src/pages/ReviewerSnapshotPage.tsx`). `src/lib/reviewerSnapshotRoadmap.ts` ne contient pas les parties prenantes. Aucun seuil 768 px dans les fichiers de la page de revue.

### Hypothèses

- Le cœur déjà livré n’est pas à refaire.
- **REF-7b.5ter** (pastilles sur la grille) et **REF-7b.6** (panneau flottant) restent hors de cette révision.
- L’autosave vaut pour les retours de la contribution en revue, jusqu’à « Soumettre ma revue ». Après soumission, l’édition suit le §2 de `docs/# Règles métier — REF-7b.2 Cycle de revue feedback.md`.
- La copie des parties prenantes a lieu au figement. Les versions déjà figées ne sont pas reconstruites par cette story. Hypothèse de lecture de la phrase citée.

### Réponses consignées

Ce ne sont pas des approbations.

1. **PCI figé.** Phrase du 3 novembre 2026 : « Elles sont copiées dans la version figée au moment du figement. » La question est fermée.
2. **Petit écran.** Phrase du 3 novembre 2026 : « Oui. Drawer plein écran, avec fermeture explicite. » La question est fermée.
3. **Enregistrement.** La phrase sur un nom spécifique est retirée. Phrase de correction : « je me suis trompé sur la dernière réponse, je croyais que tu parlais de la soumission d'une version de la roadmap et non pas de la contribution en revue. tu peux laisser l'autosave jusqu'à la soumission. » Le brouillon nommé sort du périmètre. L’autosave de la contribution reste, jusqu’à la soumission.
4. **Panneau de droite.** Phrase du 3 novembre 2026 : « Le dernier commentaire revient à droite, et un geste explicite permet d'en ajouter un second sur la même partie prenante. » Précision du geste, même jour : « on voit un encart avec le commentaire précédemment rentré, son type, et sa description avec la possibilité de l'éditer avec la présence d'un crayon icone, le second commentaire vierge est ouvert, prêt à l'écriture classiquement. » Les deux questions sont fermées.

### Incréments

1. Parties prenantes copiées dans la version figée, cible `raci_chantier`.
2. Sous 768 px, panneau de commentaires en drawer plein écran, avec fermeture explicite.
3. Autosave des retours en brouillon, jusqu’à la soumission. Pas de nom de brouillon.
4. Sur une partie prenante déjà commentée, chaque commentaire déjà enregistré par ce reviewer apparaît dans le panneau de droite comme un encart : type, texte, crayon pour le modifier. Sous ces encarts, un commentaire vierge est déjà ouvert, prêt à être saisi. L’historique du bas continue de lister chaque commentaire.

L’ordre des trois premiers est celui des todos déjà écrits. Le quatrième vient de la recette du 3 novembre 2026.

### Critères

- Au figement, les parties prenantes sont dans la version figée. Sur la revue, elles se voient, et un retour `raci_chantier` s’enregistre. Vérifiable à l’écran et dans les données.
- Sous 768 px, le panneau s’ouvre en plein écran et se ferme par un geste explicite. Vérifiable à l’écran.
- Avant la soumission, un texte saisi est retrouvé après rechargement : dans l’historique, et dans un encart du panneau de droite quand on rouvre la même partie prenante. L’encart montre le type, le texte, et un crayon qui permet de modifier ce commentaire. Vérifiable à l’écran et dans les données.
- Sous les encarts, un commentaire vierge est déjà ouvert. Le saisir crée une nouvelle ligne. Le commentaire précédent reste dans son encart et dans l’historique. Vérifiable à l’écran.
- Après « Soumettre ma revue », le reviewer ne réécrit pas un retour devenu immuable. Vérifiable à l’écran. La règle citée est le §2 de `docs/# Règles métier — REF-7b.2 Cycle de revue feedback.md`.

### Blocages ouverts

Aucun.

### Revue critique — révision 4

Résultat : aucun blocage. La story révision 4 peut être soumise à approbation. Cette revue ne l’approuve pas.

Contrôle :

- Les deux phrases citées ferment le panneau de droite : encart du commentaire déjà saisi, crayon pour le modifier, commentaire vierge déjà ouvert.
- Les critères se vérifient à l’écran ou dans les données.
- La revue sensible reste non requise pour la raison écrite dans le tableau. La révision 4 ne change pas un droit.
- Les accords de la révision 3 sont suspendus. Ils restent cités pour la révision 3 seulement.
- Hypothèse, pas une décision nouvelle : s’il y a plusieurs commentaires déjà enregistrés sur la même partie prenante, chacun a son encart. Le composer vierge reste unique, en dessous.
- L’historique du bas n’est pas retiré.

### Revue critique — révision 3

Résultat conservé : aucun blocage pour le périmètre de la révision 3. Cette revue ne l’approuve pas. Elle ne couvre pas la révision 4.

Contrôle :

- Les trois incréments ont une phrase citée. Le brouillon nommé de la révision 2 est retiré par la correction.
- Les critères se vérifient à l’écran ou dans les données.
- La revue sensible reste non requise pour la raison écrite dans le tableau.
- Les versions déjà figées restent sans copie nouvelle. C’est une limite, lue dans « au moment du figement ». Ce n’est pas une question ouverte.
- L’autosave s’arrête à la soumission. Il ne réécrit pas la règle déjà écrite sur ce qui devient immuable après.

## Plan technique — révision 1

Ce plan couvre la story révision 3. Il ne couvre pas la story révision 4. Il n’autorise pas le code de la révision 4.

### Parti pris

Les parties prenantes sont copiées dans le payload du chantier, au figement, sous `parties_prenantes`. Pas de nouveau `kind` : la contrainte actuelle de `roadmap_snapshot_items` n’accepte que `chantier` et `jalon` (`docs/supabase-roadmap-snapshots.sql`). Une nouvelle valeur demanderait une migration. Le payload jsonb suffit, et la revue lit cette copie, pas la table vivante `raci_chantiers`.

Les versions déjà figées ne sont pas reconstruites.

### Incrément 1 — Copie au figement

Dans `persistFreezeRoadmapSnapshot` (`src/MaturityRoadmap.tsx`), avant l’insert, charger les lignes PCI des chantiers du figement avec `getRaciChantiersByChantierIds` (`src/lib/api/raci-chantiers.ts`). Les ranger dans `payload.parties_prenantes` de l’item `chantier`. Chaque ligne garde son `id` d’origine, pour que le retour vise cet id.

`buildChantiersAndJalonsFromSnapshotItems` (`src/lib/reviewerSnapshotRoadmap.ts`) expose ces lignes avec le chantier reconstruit.

Sur `ReviewerSnapshotPage`, le chantier figé affiche ses parties prenantes. Un clic ouvre le même panneau, avec `target_type: 'raci_chantier'` et `target_id` égal à l’id copié. Le type est déjà accepté par `roadmap_review_feedbacks`. Pas de changement de policy.

### Incrément 2 — Drawer sous 768 px

Le panneau latéral actuel reste le panneau de bureau. Sous 768 px, le même contenu passe en couche fixe qui couvre l’écran, avec un bouton Fermer et Échap. La grille réapparaît à la fermeture. Les couleurs, l’espacement et le rayon passent par les tokens déjà utilisés sur la page. Les deux thèmes sont visés. Pas de panneau flottant : c’est **REF-7b.6**.

### Incrément 3 — Autosave jusqu’à la soumission

Tant que la revue est en brouillon et que l’édition n’est pas bloquée, une pause de saisie enregistre le retour en cours. Le premier enregistrement crée la ligne. Les pauses suivantes mettent à jour cette ligne, sans doublon. Cela vaut pour la réaction, la demande de décision et la proposition de chantier.

Le bouton « Enregistrer le feedback » reste un enregistrement immédiat. Il n’est plus le seul geste. Après « Soumettre ma revue », aucun autosave. La règle d’immutabilité du §2 de `docs/# Règles métier — REF-7b.2 Cycle de revue feedback.md` ne change pas.

### Hors plan

- Pastilles sur la grille (**REF-7b.5ter**).
- Panneau flottant (**REF-7b.6**).
- Reconstruction des versions déjà figées.
- Nom de brouillon.

### Vérification prévue

- Figer une version après le changement : les parties prenantes sont dans l’item chantier. Une version antérieure n’en gagne pas.
- Ouvrir la revue, poser un retour `raci_chantier`, le retrouver en base.
- Sous 768 px, ouvrir et fermer le drawer.
- Saisir un texte, recharger avant la soumission, retrouver le texte.
- Soumettre, puis constater qu’un retour immuable ne se réécrit pas.

## Plan technique — révision 2

Ce plan couvre la story révision 4. Il n’autorise pas le code.

La révision 1 reste en vigueur pour la copie au figement, le drawer et l’autosave du composer. Le clic sur la lettre d’une partie prenante figée est déjà rétabli dans `RoadmapTimelineGrid` par `onCommentCell`. La révision 2 ajoute seulement le panneau quand la cible est une partie prenante.

### Parti pris

Le composer du bas reste vierge à l’ouverture. Il sert au commentaire nouveau. Les commentaires déjà enregistrés sur cette partie prenante ne sont pas rechargés dans ce composer. Ils s’affichent au-dessus, chacun dans un encart.

Cela vaut pour `selection.kind === 'raci'` sur `ReviewerSnapshotPage`. Chantier, jalon et proposition de chantier gardent le panneau actuel.

### Encars

Pour la partie prenante ouverte, prendre les `feedbacks` du reviewer courant dont `target_type` est `raci_chantier` et `target_id` est l’id de cette partie. Une ligne dont l’id est le brouillon en cours du composer n’est pas montrée en encart : elle est déjà dans le composer.

Chaque encart affiche le type (Réaction ou Demande de décision) et le texte déjà saisi. Réaction : le commentaire. Demande de décision : constat, proposition, bénéfice anticipé.

Le crayon n’apparaît que si `canEditFeedback` est vrai. Il édite cet encart sur place. Cette édition a son propre état, séparé du composer vierge. Une pause de 800 ms met à jour cette ligne par `updateReviewFeedback`. Elle ne crée pas une ligne nouvelle.

### Composer vierge

Il reste sous les encarts tant que l’édition n’est pas bloquée. L’autosave actuel crée une ligne à la première pause, puis met à jour cette ligne. Le bouton « Enregistrer le feedback » garde son rôle : il enregistre, vide le composer, et oublie l’id de brouillon. La ligne quitte alors le composer et apparaît en encart. Le composer est de nouveau vierge.

Après rechargement, le composer n’a plus d’id de brouillon. Le texte enregistré est donc un encart, et le composer est vide.

Après « Soumettre ma revue », pas de crayon si le retour n’est plus éditable, pas de composer, pas d’autosave. `canEditFeedback` et `editsDisabled` restent les gardes. Le §2 de `docs/# Règles métier — REF-7b.2 Cycle de revue feedback.md` ne change pas.

### Hors plan

- Le même encart sur un chantier ou un jalon.
- Pastilles sur la grille (**REF-7b.5ter**).
- Panneau flottant (**REF-7b.6**).

### Vérification prévue

- Rouvrir **DRH** après rechargement : l’encart montre **Réaction** et `Recette autosave DRH`, avec un crayon. Le composer du dessous est vide.
- Le crayon modifie ce texte. Une seule ligne en base pour cet encart.
- Saisir un second texte dans le composer vide, attendre l’enregistrement, cliquer « Enregistrer le feedback ». Deux lignes. L’historique et les encarts montrent les deux. Le composer redevient vide.

### Constat de recette — 3 novembre 2026

Parcours fait avec Corinne Contributrice sur **V10 novembre 2026**, après fermeture de la revue déjà ouverte. Ce constat ne historise pas le lot.

- L’encart **Réaction** de **DRH** montrait le texte enregistré, avec un crayon. Le formulaire du dessous était vide.
- Le crayon a modifié ce texte. Phrase constatée : le nouveau texte est bon.
- Deux encarts étaient visibles, et le formulaire **Commentaire** en dessous était vide.
- Sous 768 px, le panneau de **DRH** couvrait l’écran. **Fermer** et Échap le fermaient.
- Après **Soumettre ma review**, les encarts restaient lisibles. Le formulaire vide n’était pas là. Les crayons restaient. C’est le §2.3 de `docs/# Règles métier — REF-7b.2 Cycle de revue feedback.md` : une réaction reste éditable tant que la version est ouverte. Une demande de décision devenue immuable n’a pas été rejouée dans cette recette.

## Constat déjà écrit

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
4. [ ] Badges 💬 sur chantiers/jalons commentés — lot **REF-7b.5ter** (ne pas le confondre avec REF-7b.6, panneau flottant).
5. [ ] REF-7b.6 : panneau flottant `react-rnd` si validé produit.
