# Session historique - Commandes des mots-clés

Date: 1 novembre 2026  
Statut: terminee

Dernière mise à jour : **1 novembre 2026**, 16 h 27 (Europe/Paris)

## 1) Contexte et objectif

Objectif de session: pouvoir lancer chaque mot-clé du workflow en tapant `/` dans le chat.

Contexte:

- Le guide et les mots-clés étaient déjà sur `main` (`c516777`, `eee352d`).
- Cursor nomme une commande d'après le fichier. Un seul fichier n'aurait créé qu'une commande.
- Le masquage de la revue (**REF-7b.4**) reste hors de ce lot.

## 2) Decisions prises

- Une commande par mot-clé, dans `.cursor/commands`.
- Le texte de chaque commande est celui du guide, avec les mêmes arrêts.
- Ce lot n'approuve aucune story et n'autorise ni plan ni code.

## 3) Changements realises

Infrastructure:

- Aucun changement de code, de base ou d'écran.

Fonctionnel:

- Aucune fonction livrée.

Securite:

- Aucun changement.

Configuration:

- Dix-huit fichiers : `cherche`, `qualifie`, `explore`, `story`, `reponds`, `revue`, `sensible`, `consigne`, `approuve`, `planifie`, `code`, `correctif`, `perimetre`, `differe`, `reprise`, `verifie`, `historise`, `avis`. Commit `54f09b8`.

## 4) Tests et validations

- Pas de test automatique.
- Pas de recette navigateur. Le menu `/` se recharge avec la fenêtre si les commandes n'apparaissent pas tout de suite.

Validations metier:

- Aucune.

## 5) Risques / limites restantes

- Les commandes recopient le guide. Si le guide change, il faut les reprendre.
- Les mots-clés orientent l'agent. Ils ne bloquent pas Git.
- **REF-7b.4** n'est toujours ni recetté ni commité.

## 6) URLs et environnements impactes

- Dev: `http://localhost:5173` inchangé
- Preview: inchangé
- Prod: inchangé

## 7) Prochaines etapes

Maintenant:

1. Recette de **REF-7b.4**.

Apres:

2. Aligner les trois pages détaillées sur la doxa, quand ce sera demandé.

Plus tard:

3. Le Gantt qui lirait toutes les directions ensemble (EPIC 2 · REF-3).

## 8) References

- Backlog: `docs/backlog.md`
- Guide: `docs/GUIDE-UTILISATEUR-IA-CURSOR.md`
- Commandes: `.cursor/commands`
- Commit(s): `54f09b8`
- PR: aucune, commit direct sur `main`
