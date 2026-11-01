# Session historique - Stories, mots-clés et arbitrages

Date: 1 novembre 2026  
Statut: terminee

Dernière mise à jour : **1 novembre 2026**, 16 h 25 (Europe/Paris)

## 1) Contexte et objectif

Objectif de session: poser comment une demande passe de l'idée au code, et consigner les arbitrages métier encore ouverts.

Contexte:

- Les lots photos, historique et fiche entreprise étaient déjà sur `main` (`8ecd16a`, `0d1f2a1`, `f77424b`).
- Le masquage de la revue (**REF-7b.4**) reste un autre sujet : code local non recetté, laissé hors de ces commits.
- La doxa du 1 novembre 2026, 15 h 38, puis les précisions de 16 h 19, portent les décisions métier tant que trois pages détaillées disent encore l'ancienne formule.

## 2) Decisions prises

- Un membre du comité possède sa roadmap et les chantiers qui y sont rattachés. Il peut lire la roadmap d'un voisin.
- Un projet qui traverse plusieurs directions est porté sur la roadmap de chaque direction. Chacun contribue pour sa part, sur la sienne.
- Pendant une revue, l'écran se resserre seulement pour les personnes invitées à commenter cette revue-là. Le chef de projet garde le menu complet.
- L'administrateur de l'entreprise peut ouvrir une revue, comme le chef de projet. L'arbitrage des retours reste au comité.
- Hors correctif qualifié, le workflow du 1 novembre 2026 passe avant tout plan technique. L'agent ne s'accorde rien : il recopie une phrase explicite.
- Le mot-clé `historise:` enregistre le lot, le pousse, met à jour le backlog et l'historique, puis pousse ces textes.

## 3) Changements realises

Infrastructure:

- Aucun changement de code, de base ou d'écran.

Fonctionnel:

- Aucune fonction livrée. **REF-7b.4** reste 🚧.

Securite:

- [docs/sécurité à venir.md](../sécurité%20à%20venir.md) ne relance plus les lots fermés. Il garde l'ordre avant un premier client payant. Commit `f219a67`.

Configuration:

- Doxa mise à jour, commit `0315d3e`.
- Workflow, règles d'agent, miroir, `CLAUDE.md` et guide d'usage, commit `c516777`.
- Le guide tient les mots-clés, dont `historise:`.

## 4) Tests et validations

- Pas de test automatique : ce lot est documentaire.
- Pas de recette navigateur.

Validations metier:

- Les quatre arbitrages du 1 novembre 2026, 16 h 19, sont ceux choisis dans la conversation et recopiés dans la doxa.
- Aucune story n'est approuvée. Aucun plan ni code n'est autorisé par ce lot.

## 5) Risques / limites restantes

- Les règles métier §1 bis, la synthèse produit §6 et la matrice des permissions disent encore l'ancienne formule sur les projets. La doxa prime en attendant.
- Les cinq phases historiques du workflow disent encore « obligatoire » et un dossier de plans ignoré par Git. La décision en tête du fichier prime.
- Le masquage de revue codé le 19 octobre n'est ni recetté ni commité. L'arbitrage d'écran ne remplace pas cette recette.
- Les mots-clés orientent l'agent. Ils ne bloquent pas Git.

## 6) URLs et environnements impactes

- Dev: `http://localhost:5173` inchangé
- Preview: inchangé
- Prod: `https://forge-du-changement.vercel.app` inchangé. Le site public est inchangé.

## 7) Prochaines etapes

Maintenant:

1. Recette de **REF-7b.4**, avec l'arbitrage du 16 h 19 : écran resserré seulement pour les invités de cette revue, menu complet pour le chef de projet.

Apres:

2. Aligner les trois pages détaillées sur la doxa, quand ce sera demandé.
3. Avant un premier client payant, suivre l'ordre de [docs/sécurité à venir.md](../sécurité%20à%20venir.md).

Plus tard:

4. Le Gantt qui lirait toutes les directions ensemble (EPIC 2 · REF-3).

## 8) References

- Backlog: `docs/backlog.md`
- Doxa: `docs/doxa-metier-la-forge-du-changement.md`
- Workflow: `docs/AI-AGENT-FEATURE-PLANNING-WORKFLOW.md`
- Guide: `docs/GUIDE-UTILISATEUR-IA-CURSOR.md`
- Commit(s): `f219a67`, `0315d3e`, `c516777`
- PR: aucune, commits directs sur `main`
