# Sécurité à venir

Dernière mise à jour : **21 octobre 2026**, 03 h 23 (Europe/Paris)

Ce document dit ce qu’il resterait à faire pour un très bon niveau de défense, du genre de ce qu’un grand client demande. Il ne remplace pas le lot déjà décidé.

Le lot en cours est **EPIC 18 · REF-102, REF-103, REF-104**. Son plan : [plan-fiabiliser-permissions.md](plan-fiabiliser-permissions.md).

## Déjà en place

- Les projets, les membres et les invitations sont séparés par entreprise dans la base.
- La connexion existe. L’historique des décisions est déjà difficile à modifier.
- La clé la plus puissante de la base n’est pas dans l’écran.
- Le dossier des photos n’est plus visible par n’importe qui sur internet.

## Ce que le lot EPIC 18 apporte

Une personne connectée ne pourra plus ouvrir, remplacer ou supprimer le logo d’une entreprise qui n’est pas la sienne.

- Lire un logo : les personnes de cette entreprise, le consultant qui la suit, ou l’administrateur de la plateforme.
- Changer ou supprimer un logo : ceux qui peuvent déjà modifier la fiche entreprise.
- Photo de profil : chacun dans son propre dossier.
- Les fichiers qui ne sont rattachés à personne deviennent inaccessibles. Ils ne sont pas effacés.
- L’historique ne pourra pas être modifié ni effacé, y compris sur le papier. C’est déjà bloqué dans les faits.
- Des contrôles automatiques tournent à chaque publication. Ils ne ferment pas une porte à eux seuls.

Ce lot ne renforce pas les projets, les invitations ni la connexion. Ils sont déjà cloisonnés.

## Ce qui manque encore

Par ordre d’importance. Rien de cette liste n’est commencé.

1. **Une preuve, pas seulement une règle.** Deux comptes de deux entreprises. Chacun essaie d’ouvrir les projets, les membres et les photos de l’autre, en passant par la base et non par l’écran. On note le résultat.
2. **Une sauvegarde déjà restaurée une fois.** Vérifier qu’une copie rend bien les entreprises. Savoir que l’hébergeur « sauvegarde » ne suffit pas. Cette répétition n’est pas faite.
3. **Les comptes qui donnent les clés.** GitHub, Vercel et Supabase exigent une confirmation en deux étapes. Peu de personnes y ont accès. Les codes de récupération ne restent pas dans le dossier du projet. Un fichier de ce type est encore présent, non publié. Il n’a rien à y faire.
4. **Une limite sur les fichiers.** L’application vérifie le type d’image. Le dossier, lui, n’impose ni type ni taille. On fixe une limite côté dossier.
5. **Une alerte quand l’application casse en production.** Sans y envoyer les données des clients. Aujourd’hui une erreur peut passer inaperçue.
6. **Les failles connues des briques utilisées.** Un outil qui les signale, et une décision de les corriger. Ce n’est pas branché.
7. **Le départ d’une entreprise.** Pouvoir exporter ses données, puis les effacer. Une page courte dit où sont les données, qui les héberge, et combien de temps on les garde.
8. **Une feuille : que fait-on si un compte est volé.** Qui on prévient, comment on coupe l’accès, comment on le note. Un standard international (ISO, SOC 2) repose surtout sur cette organisation, plus les preuves des points 1 à 3.

## Ordre

D’abord fermer le dossier photos (EPIC 18). Ensuite prouver la séparation entre deux entreprises, vérifier une restauration, puis ranger les accès et les codes.

Un test d’intrusion par quelqu’un d’extérieur vient juste avant le premier client payant. Le faire avec les quelques photos d’essai actuelles apporterait peu.

## Hors de ce document

Pas de changement de stack. Pas de nouveau module produit. Pas de modification de la base tant que le plan EPIC 18 n’a pas atteint son temps 2b, et seulement avec un accord explicite.
