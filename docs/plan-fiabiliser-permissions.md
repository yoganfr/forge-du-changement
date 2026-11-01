# Plan — Fiabiliser les permissions

Dernière mise à jour : **1 novembre 2026**, 13 h 38 (Europe/Paris)

Statut : temps 2b livré. Arrêt avant REF-104. Note de cadrage : 8/10.

Identifiants backlog : **EPIC 18 · REF-102, REF-103, REF-104**.

La stack ne change pas. On ne rejoue pas les SQL déjà appliqués. On ne découpe pas les gros fichiers. Une règle de sécurité n’est pas un refactor (`docs/refactor_rules.md`, V2).

## Constat au 21 octobre 2026

Lecture seule du projet Supabase `kpgkxeilddeyfwiiqaha`.

- Le dossier `assets` n’est plus public. Quatre règles laissent pourtant toute personne connectée lire, ajouter, modifier et supprimer n’importe quel fichier.
- 5 fichiers. 2 logos sont cités par une entreprise : ce sont ceux qu’on déplace. 1 logo et 2 photos de profil ne sont cités par aucune fiche : ils deviennent invisibles, ils ne sont pas effacés.
- Aucune photo de profil n’est enregistrée dans `users.avatar_url` vers ce dossier.
- À la création d’une entreprise, un déclencheur inscrit le consultant ou l’admin comme responsable. `can_manage_workspace` est donc vrai juste après la création.
- `audit_events` a déjà la RLS. Ajout : `can_access_workspace`. Lecture : `can_manage_workspace`. Aucune règle pour modifier ou effacer. Le rôle connecté a encore les droits SQL UPDATE et DELETE, déjà bloqués par la RLS.

Le lien temporaire d’une photo ne s’enregistre pas en base (session du 18 octobre). Un déplacement ne change que le chemin dans l’adresse stable.

## Décisions

- Fichiers orphelins masqués au temps 2b, non supprimés.
- Trois temps. Le temps 2 est coupé en deux : d’abord l’application, ensuite la base.
- Chaque temps s’arrête. Pas de modification de la base tant que ce n’est pas demandé à cet arrêt.
- Les fichiers déjà modifiés ailleurs (écran de revue, docs de revue, `recovery-codes vercel.txt`) ne sont pas embarqués.
- Hors lot : sauvegardes, alertes de panne, logo sur la page publique, limite de poids, découpage de fichiers, document métier de 200 lignes.

### Décisions du 1 novembre 2026, 12 h 58

Tranchées avec le produit avant d’écrire le temps 2.

- Le jour du temps 2b, on recompte. Tout logo ou toute photo cité par une fiche est déplacé. Le reste devient invisible, sans être effacé. Le constat du 21 octobre (2 logos, 0 photo, 3 orphelins) n’est pas une liste figée.
- Adresses Gravatar et Google inchangées. La fiche garde une adresse complète. Seul le dossier à l’intérieur change.
- Déplacement simple, fichiers d’essai : copier, mettre à jour la fiche, vérifier l’image, effacer l’ancien. Si ça rate, on renvoie le logo depuis la fiche. Pas de machine de retour arrière pour les fichiers.
- L’entreprise est créée d’abord. Si le logo échoue, elle reste sans logo. Un second clic renvoie le logo et ne crée pas une deuxième entreprise.
- Lecture du logo : toute personne de l’entreprise (CODIR, pilote, contributeur, admin), le consultant du dossier, le super-admin. On relie ça à `can_access_workspace` seulement si la fonction en base a ce sens. Sinon on s’arrête.
- Photo de profil : la personne elle-même, et quiconque voit une entreprise où elle est membre.
- Écriture du logo : qui gère l’entreprise. Écriture de la photo : seulement son propre dossier.
- Suppression : le gestionnaire peut effacer le logo de son entreprise, la personne sa propre photo. Remplacer une image efface l’ancien fichier une fois le nouveau enregistré. Retirer l’image de la fiche efface le fichier.
- La page publique vitrine ne change pas.
- Le temps 2a est commité après la preuve dans le navigateur, puis on s’arrête avant le SQL.
- Le SQL du temps 2b et de REF-104 est exécuté par l’agent sur le projet distant, seulement après un oui explicite dans le chat.
- REF-104 : les personnes dans l’application ne peuvent pas réécrire ni effacer une trace (« untel a ouvert la revue », « untel a retiré un membre »). Elles peuvent toujours les lire et en ajouter. L’outil de maintenance, hors écran, peut encore corriger une trace fausse. On ne change pas qui lit ni qui ajoute.

## Risques

- Un logo cité peut disparaître si le déplacement échoue. On le renvoie depuis la fiche.
- Si l’envoi du logo échoue à la création, l’entreprise existe sans logo. Un second clic renvoie le logo. Il ne crée pas une deuxième entreprise.
- La base n’est jamais verrouillée avant la nouvelle application.
- Le temps 1 signale un problème. Il n’empêche pas, à lui seul, Vercel de publier.
- Le temps 3 ne réécrit pas qui lit ni qui ajoute une trace.

## Cadrage d’exécution

Un temps = un sujet, une preuve, un arrêt. Si la preuve échoue, on ne continue pas. Ce cadrage prime sur tout rappel plus bas.

### REF-102 — Temps 1, contrôles automatiques

Aucun écran, aucun SQL. Fichiers : `eslint.config.js` (ignorer `web/`), `.github/workflows/quality-gates.yml`.

1. En local : `npm test`, `npm run lint`, lint de `web`.
2. Si le lint est déjà rouge hors de ce sujet, on ne l’ajoute pas à la CI et on ne corrige pas le dépôt pour le faire taire. Les tests y entrent s’ils sont verts.
3. Ensuite seulement, modifier la CI.

Preuve du **1 novembre 2026**, rejouée à 12 h 41 : `npm test` vert (42 tests). Lint de `web` : 0 erreur, 3 avertissements. Lint racine encore rouge après avoir ignoré `web/` : 4 erreurs déjà présentes (`ProjectSelector.tsx`, `ReviewDeadlineDialog.tsx`, `RoadmapTimelineGrid.tsx`, `supabase/functions/discours-analyze/index.ts`). Elles ne sont pas corrigées. Le lint n’entre pas dans la CI. `npm test` y entre, après `npm ci` à la racine. Arrêt avant le temps 2.

### REF-103 — Temps 2a, application

Nouveaux dossiers : `workspaces/{id}/logos/` et `users/{id}/avatars/`. L’ancienne règle du dossier reste ouverte. Fichiers : `src/lib/api/storage.ts`, `src/lib/api/storagePath.test.ts`, `src/CompanySheet.tsx`, `src/ProfileSheet.tsx`, `src/OnboardingFlow.tsx`. Le constructeur de chemin reste dans `storage.ts`.

1. Créer l’entreprise, puis envoyer le logo dans son dossier. Si l’envoi échoue, l’entreprise reste. Un second clic met à jour le logo sans recréer l’entreprise.
2. La fiche entreprise et la photo de profil envoient dans le dossier de l’identifiant.
3. Remplacer ou retirer une image efface le fichier précédent, une fois le nouveau enregistré ou la fiche vidée.
4. L’adresse enregistrée reste une adresse complète.

Preuve du **1 novembre 2026**, 13 h 09 : 46 tests verts. Dans le navigateur, compte Recette Consultant : « Changer le logo » et « Retirer » sur World Company ; « Changer la photo » et « Retirer » sur le profil (fermé sans enregistrer). Création de l’espace **Essai REF-103** sans logo, une seule fois, fiche ouverte ensuite avec « Changer le logo ». L’envoi d’un fichier et le second clic après échec n’ont pas pu être joués : le navigateur de contrôle ne peut pas choisir un fichier. Arrêt, avant tout SQL.

### REF-103 — Temps 2b, base, après un oui explicite

La nouvelle application est déjà en place et commitée. Sinon on n’applique pas. L’agent exécute le SQL sur le projet distant.

Avant les règles : relire `can_manage_workspace` et `can_access_workspace`. Si la lecture du logo ne couvre pas les personnes de l’entreprise, on s’arrête. Vérifier que `authenticated` peut exécuter ces deux fonctions.

Ensuite :

1. Recompter les fichiers cités par une fiche. Montrer la liste. Pas de Gravatar.
2. Pour chacun : copier vers le nouveau dossier, mettre à jour l’adresse, vérifier l’image, effacer l’ancien. Les orphelins restent sans droit, non effacés.
3. Écriture logo : qui gère l’entreprise, sur l’identifiant du dossier. Lecture logo : les personnes de l’entreprise, le consultant du dossier, le super-admin.
4. Photo : écriture seulement dans son dossier. Lecture pour soi et pour qui voit une entreprise où la personne est membre.
5. Suppression : le gestionnaire pour le logo de son entreprise, la personne pour sa photo.

Le SQL inverse des règles est écrit avant de les appliquer. Les fichiers d’essai n’ont pas de retour arrière automatique : un logo perdu se renvoie depuis la fiche.

Preuve du **1 novembre 2026**, 13 h 38. `can_access_workspace` couvre le super-admin, le consultant du dossier et la personne dont l’entreprise est la sienne. `authenticated` peut exécuter les deux fonctions. Recomptage : trois logos cités (World Company, La Forge du Changement, Essai avec logo), aucune photo citée. Les deux logos encore dans le dossier commun ont été copiés, l’adresse mise à jour, l’image vérifiée, puis l’ancien fichier effacé. Essai avec logo était déjà au bon endroit. Trois fichiers non cités restent sur le disque et ne sont plus lisibles. Une personne de World Company voit le logo de World Company et pas celui d’une autre entreprise. L’admin de World Company peut gérer ce logo, pas celui d’une autre. Le super-admin voit les trois logos cités, pas les fichiers non cités. Arrêt avant REF-104.

### REF-104 — Temps 3, historique

Ne pas modifier qui lit une trace ni qui en ajoute une. Retirer au rôle `authenticated` les droits SQL UPDATE et DELETE. Le rôle de maintenance les garde.

Preuve : une trace s’ajoute encore, l’historique reste lisible, une personne connectée ne peut ni modifier ni effacer une trace. Arrêt.

## Temps de travail

- Temps 1 : 30 à 60 minutes.
- Temps 2 : 2 à 3 heures, navigateur compris.
- Temps 3 : environ 1 heure.
- Ensemble : une demi-journée si rien ne surprend, une journée sinon. Les arrêts de validation allongent le calendrier.
