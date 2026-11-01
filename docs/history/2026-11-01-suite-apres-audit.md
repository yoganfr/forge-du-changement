# 1 novembre 2026 — Suite après l'audit

Dernière mise à jour : **1 novembre 2026**, 15 h 17 (Europe/Paris)

## Contexte

Après la fermeture des photos et de l'historique, une passe a listé ce qui restait avant de reprendre le backlog. Le plan est [docs/plan-suite-apres-owasp.md](../plan-suite-apres-owasp.md).

## Décisions

- On ne reconstruit pas un plafond d'e-mails dans l'application. Celui de Supabase Auth suffit.
- On ne change pas le nombre lu : 30 e-mails par heure.
- On n'active pas le refus des mots de passe déjà compromis tant que le projet est sur l'offre gratuite. Ce réglage n'existe que sur l'offre payante.
- Aucun e-mail de test n'est envoyé.

## Preuve

Le 1 novembre 2026, 14 h 39, la page des plafonds Auth du projet `forge-du-changement` affiche « Rate limit for sending emails » à 30. L'avertisseur Supabase confirme que la protection des mots de passe compromis est éteinte.

## Tranche C

- Les alertes de dépendances apparaissent dans la porte qualité et ne bloquent pas la publication.
- Le dossier photos est limité à 10 Mo et aux types JPEG, PNG, WebP, GIF et HEIC. Les fichiers déjà présents restent en place.
- Le script du site public n'est pas passé en bloquant. Le cadre de la page ajoute d'autres scripts que celui du thème.

## Fiche entreprise

Hors du plan de sécurité. Le couple Modifier / Enregistrer est retiré. Le nom, le secteur et la taille partent après une courte pause, ou quand on quitte le champ. Le logo et la convention partent au clic. Un nom vide n’est pas envoyé : l’ancien nom revient, avec un message. Les champs restent du texte, avec un crayon. La convention ne s’ouvre plus dans une liste coupée : trois choix, nom court et exemple en dessous.

Essayé sur Essai REF-103 : le secteur part et revient, le logo part et revient, la convention s’ouvre en entier. Le choix déjà retenu a été reposé, sans changer l’espace.

## Relecture du 1 novembre 2026, 15 h 17

Les avertisseurs Supabase ont été relus après ce lot.

- Aucun avertissement nouveau.
- Les 22 fonctions sensibles restent appelables par une personne connectée. C’est le choix de la tranche A : ce sont les droits et les déclencheurs. Une personne non connectée ne les appelle plus.
- Le refus des mots de passe déjà compromis reste éteint, offre gratuite.
- L’enregistrement à la volée n’ouvre pas un nouveau chemin : il passe par la même mise à jour d’entreprise. Le nom de fichier du logo est nettoyé avant l’envoi.
- Le script du site public n’est toujours pas bloquant.

## Prochaines étapes

La recette du masquage de la revue (**REF-7b.4**). Le plan après l'audit est traité, hors le refus des mots de passe compromis (offre gratuite) et le script bloquant du site public (essai de prévisualisation).
