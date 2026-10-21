# Plan — Fiabiliser les permissions

Dernière mise à jour : **21 octobre 2026**, 03 h 14 (Europe/Paris)

Statut : enregistré, non commencé. Note de cadrage : 8/10.

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
- Chaque temps s’arrête. Pas de publication ni de modification de la base tant que ce n’est pas demandé à cet arrêt.
- Les fichiers déjà modifiés ailleurs (écran, docs de revue, `recovery-codes vercel.txt`) ne sont pas embarqués.
- Hors lot : sauvegardes, alertes de panne, logo sur la page publique, limite de poids, découpage de fichiers, document métier de 200 lignes.

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

Preuve : tests verts, et lint vert ou lint laissé dehors. Arrêt.

### REF-103 — Temps 2a, application

Nouveaux dossiers : `workspaces/{id}/logos/` et `users/{id}/avatars/`. L’ancienne règle du dossier reste ouverte. Fichiers : `src/lib/api/storage.ts`, `src/lib/api/storagePath.test.ts`, `src/CompanySheet.tsx`, `src/ProfileSheet.tsx`, `src/OnboardingFlow.tsx`. Le constructeur de chemin reste dans `storage.ts`.

Preuve dans le navigateur : logo de fiche, photo de profil, création d’entreprise avec logo, second clic sans deuxième entreprise. Arrêt, avant tout SQL.

### REF-103 — Temps 2b, base, après accord

La nouvelle application est déjà en place. Sinon on n’applique pas.

Avant le SQL : vérifier que `authenticated` peut exécuter `can_manage_workspace` et `can_access_workspace`. Si non, on s’arrête.

En une transaction :

1. Montrer la liste des 2 logos à déplacer. Pas de Gravatar.
2. Les déplacer et mettre à jour `logo_url`. Les orphelins restent sans droit, non effacés.
3. Écriture logo : `can_manage_workspace` sur l’identifiant du dossier. Lecture logo : `can_access_workspace`.
4. Photo de profil : écriture seulement dans son propre dossier. Lecture si la personne est dans une entreprise visible par l’appelant.

Le SQL inverse est écrit avant l’application. Si le renommage est refusé, on annule tout.

Preuve : le logo s’affiche encore pour les bonnes personnes ; une autre entreprise ne peut pas l’ouvrir. Arrêt.

### REF-104 — Temps 3, historique

Ne pas modifier `audit_events_select` ni `audit_events_insert`. Retirer au rôle `authenticated` les droits SQL UPDATE et DELETE.

Preuve : une trace s’ajoute encore, l’historique reste lisible, la modification et l’effacement sont refusés. Arrêt.

## Temps de travail

- Temps 1 : 30 à 60 minutes.
- Temps 2 : 2 à 3 heures, navigateur compris.
- Temps 3 : environ 1 heure.
- Ensemble : une demi-journée si rien ne surprend, une journée sinon. Les arrêts de validation allongent le calendrier.
