# Session historique — fenêtre « Ouvrir la revue »

Date : 19 octobre 2026  
Statut : terminée

Dernière mise à jour : **19 octobre 2026**, 13 h 28 (Europe/Paris)

## 1) Contexte et objectif

Objectif de session : remplacer la saisie d’emails par une fenêtre pour choisir qui participe à la revue, sans envoyer d’email.

Contexte :

- Le raccourci des règles de refactor a d’abord été aligné sur la V2 (commit `bdc76f9`).
- Le lot retenu est la première tranche de **REF-7b.3**.
- Le magic link et l’audit d’ouverture restent pour plus tard.

## 2) Décisions prises

- Seuls les contributeurs actifs sont proposés. Les autres membres du CODIR, les consultants, les pilotes, les invités et les inactifs ne le sont pas.
- La liste de départ est celle de la direction du membre du CODIR.
- Les contributeurs des autres directions n’apparaissent que si la version figée contient un projet transverse (au moins une direction co-pilote).
- Si l’écran montre la roadmap en cours, la revue reste attachée à la dernière version figée. La fenêtre le dit, et nomme la version.
- La date limite déjà en place est conservée. L’annuler ne lance pas la revue et retrouve les cases cochées.
- Aucun email n’est envoyé. Le lien est copié pour être transmis à la main.

## 3) Changements réalisés

Fonctionnel :

- Fenêtre « Ouvrir la revue » à la place de la saisie d’emails.
- Avertissement : vérifier d’avoir figé la version à soumettre aux contributeurs.
- Message après ouverture : lien copié, aucun email envoyé.

Documentation :

- Backlog, journal du 19 octobre 2026, et point d’entrée REF-7b.

## 4) Tests et validations

- Règle de sélection : 4 tests automatiques passés.
- À l’écran, thèmes clair et sombre : avertissement, nom de version, deux listes, bouton inactif sans coche.
- Recette World Company, compte sans direction :
  - ouverture réelle de **V1 mai 2026**, 5 personnes, échéance 10/11/2026 23 h 59, message de lien copié ;
  - brouillon transverse : Corinne proposée sous « Sans direction » ;
  - sans coche, Valider est grisé ;
  - annuler la date ramène à la liste avec la case encore cochée ;
  - annuler la fenêtre laisse le brouillon en brouillon.

Validations métier :

- Un projet est transverse dès qu’il a une direction co-pilote.
- Une fiche sans direction ne propose pas de liste « ma direction ».

## 5) Risques / limites restantes

- Pas de magic link, pas d’email, pas d’audit `snapshot_review_opened`.
- La liste « Contributeurs de ma direction » n’a pas été vue remplie : le compte de recette n’a pas de direction.
- Une revue déjà ouverte garde le bouton « Fermer la revue ». On n’ajoute personne à une revue en cours.
- Les versions figées de la recette portent toutes le même nom « V1 mai 2026 » : le menu distingue le brouillon, le titre de la fenêtre ne distingue pas deux versions homonymes.

## 6) URLs et environnements impactés

- Tableau de bord local : `http://localhost:5173`
- Tableau de bord déployé : `https://forge-du-changement.vercel.app` après push de `main`
- Aucune migration Supabase

## 7) Prochaines étapes

Maintenant :

1. Choisir entre la fin des indicateurs sur la grille (**REF-7b.5ter**) et le masquage de la navigation des reviewers (**REF-7b.4**).

Après :

2. Magic link et audit d’ouverture (**REF-7b.3** restant).
3. Rejouer l’ouverture avec un membre du CODIR dont la fiche a une direction.

## 8) Références

- Backlog : `docs/backlog.md`
- Point d’entrée revue : `docs/README_ref7b-reviewerpage.md`
- Commit(s) : le commit `feat(roadmap)` de cette session sur `main`
