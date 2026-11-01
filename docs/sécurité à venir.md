# Sécurité à venir

Dernière mise à jour : **1 novembre 2026**, 15 h 24 (Europe/Paris)

Ce document dit ce qu’il resterait à faire pour un très bon niveau de défense, du genre de ce qu’un grand client demande. Il ne relance pas les lots déjà fermés.

**EPIC 18 est terminé** le 1 novembre 2026. Son plan : [plan-fiabiliser-permissions.md](plan-fiabiliser-permissions.md). La suite proche, [plan-suite-apres-owasp.md](plan-suite-apres-owasp.md), est traitée le même jour. La relecture est dans [OWASP audit.md](OWASP%20audit.md). Ce document-ci garde ce qui attend un premier client payant.

Le prochain sujet métier est **REF-7b.4**, la recette du masquage de la revue. On n’avance pas la liste ci-dessous tant que ce fil n’est pas repris.

## Déjà en place

- Les projets, les membres et les invitations sont séparés par entreprise dans la base.
- La connexion existe. Une personne connectée peut ajouter une trace et la lire. Elle ne peut plus la modifier ni l’effacer.
- La clé la plus puissante de la base n’est pas dans l’écran.
- Le dossier des photos n’est plus public. Une personne connectée ne voit que les logos de son entreprise, et sa propre photo. Les fichiers sans rattachement sont inaccessibles. Ils ne sont pas effacés.
- Changer ou retirer un logo reste réservé à ceux qui peuvent déjà modifier la fiche entreprise.
- Le dossier refuse plus de 10 Mo, et n’accepte que JPEG, PNG, WebP, GIF et HEIC. L’écran vérifie la même chose avant l’envoi.
- Le tableau de bord envoie les protections de page. Le script du site public reste en observation : le passer en bloquant sans essai sur une prévisualisation casserait la page.
- Les deux fonctions appelées depuis le navigateur n’acceptent plus tous les sites.
- Une personne non connectée ne peut plus appeler les fonctions sensibles. Une personne connectée le peut encore : ce sont les droits et les déclencheurs. Les retirer casserait les écrans.
- Le plafond d’envoi des e-mails de connexion est de 30 par heure. On ne le change pas.
- Les codes de secours Vercel sont ignorés par Git. On ne les remet pas dans le dépôt.
- La porte qualité signale les failles connues des briques, sans bloquer la publication. Le lint racine reste dehors à cause de quatre erreurs anciennes.

## On ne relance pas

- Le dossier photos, ni son plafond.
- Le droit d’exécution des 22 fonctions pour les personnes connectées.
- Le refus des mots de passe déjà compromis, tant que le projet est sur l’offre gratuite. Ce réglage n’existe que sur l’offre payante.
- Un nouveau plafond d’e-mails dans l’application.
- Le script bloquant du site public, sans essai préalable sur une prévisualisation.

## Ce qui manque encore

Par ordre. Rien de cette liste n’est commencé.

1. **Une preuve, pas seulement une règle.** Deux comptes de deux entreprises. Chacun essaie d’ouvrir les projets, les membres et les photos de l’autre, en passant par la base et non par l’écran. On note le résultat.
2. **Une sauvegarde déjà restaurée une fois.** Vérifier qu’une copie rend bien les entreprises. Savoir que l’hébergeur sauvegarde ne suffit pas.
3. **Les comptes qui donnent les clés.** GitHub, Vercel et Supabase exigent une confirmation en deux étapes. Peu de personnes y ont accès.
4. **Une alerte quand l’application casse en production.** Sans y envoyer les données des clients. Aujourd’hui une erreur peut passer inaperçue.
5. **Le départ d’une entreprise.** Pouvoir exporter ses données, puis les effacer. Une page courte dit où sont les données, qui les héberge, et combien de temps on les garde.
6. **Une feuille : que fait-on si un compte est volé.** Qui on prévient, comment on coupe l’accès, comment on le note.
7. **Trois questions de trop sur l’API.** Une personne connectée qui connaît déjà un identifiant peut demander si une autre personne est super-admin, si elle a tel rôle dans telle entreprise, ou si une invitation appartient à telle entreprise. Ce sont des oui ou non, sans liste et sans modification. Avant un regard extérieur, on les retire de l’API. On ne retire pas le droit qui fait tourner les écrans.
8. **Décider des alertes de dépendances déjà signalées.** Le rapport existe. Il ne dit pas encore lesquelles on corrige.

## Ordre

D’abord la preuve entre deux entreprises, puis une restauration, puis les accès aux comptes d’hébergement. L’alerte de production, le départ d’une entreprise et la feuille « compte volé » viennent ensuite.

Les trois questions de trop et le tri des alertes de dépendances se font avant le regard extérieur. Un test d’intrusion par quelqu’un d’extérieur vient juste avant le premier client payant. Le faire avec les quelques photos d’essai actuelles apporterait peu.

## Hors de ce document

Pas de changement de stack. Pas de nouveau module produit. Pas de modification de la base sans accord explicite, et avec le SQL de retour arrière écrit avant.
