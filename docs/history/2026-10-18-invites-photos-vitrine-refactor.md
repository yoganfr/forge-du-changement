# Session historique — invitations, photos, vitrine, règles de refactor

Date : 18 octobre 2026, clôturée le **19 octobre 2026**, 00 h 10 (Europe/Paris)  
Statut : terminée

## 1) Contexte et objectif

Objectif de session : fermer les trous constatés à l’audit du tableau de bord, sans changer le parcours normal des personnes invitées, puis décider quoi faire du découpage des gros fichiers.

Contexte :

- Le rôle d’un invité devait venir uniquement de son invitation, jamais d’un rôle deviné.
- Les photos étaient dans un dossier public. Le site public ne devait pas lire les espaces d’essai.
- Le découpage des gros fichiers était prévu ensuite. Les règles de refactor ont été relues avant de le lancer.

## 2) Décisions prises

- Un invité reçoit le rôle de son invitation la plus récente (même email, même espace, en attente ou acceptée). Si le rôle manque, la fiche n’est pas créée. On ne retombe pas sur « membre CODIR ».
- Le premier responsable, qui a déjà sa fiche avant de créer son espace, n’est pas concerné par ce verrou.
- Le dossier des photos n’est plus public. Les personnes connectées voient leurs photos via un lien temporaire. Les photos d’essai pouvaient disparaître le temps du basculement : c’était accepté.
- Le site public lit un seul espace, créé à part : **Entreprise de démonstration**. Il ne lit ni « La Forge du Changement », ni « World Company », ni un futur espace client.
- À la création d’une fiche, hors superadmin déjà en place, personne ne choisit un rôle libre et personne ne se déclare superadmin. Le drapeau superadmin ne se modifie pas non plus, sauf par un superadmin déjà en place.
- Un consultant en mission chez son client peut changer le rôle d’une fiche déjà créée. Ce n’est pas un trou. On ne le referme pas.
- On ne découpe pas les gros fichiers. Aucun bug, aucune lenteur mesurée, aucun doublon de règle métier ne le justifie aujourd’hui.
- Les règles de refactor passent en V2. La V1 reste dans le même fichier, comme historique, et ne s’applique plus.

## 3) Changements réalisés

Fonctionnel :

- Le parcours d’invitation et la fiche profil enregistrent le rôle lu sur l’invitation.
- Les photos et les logos s’affichent pour une personne connectée, sans réécrire le lien signé dans la base.
- Le site public ne publie que l’espace vitrine.

Sécurité :

- La base refuse une création dont le rôle n’est pas celui de l’invitation.
- Le dossier `assets` n’est plus public.
- La création et la modification ne permettent plus de poser ou de changer le drapeau superadmin, sauf pour un superadmin déjà en place.

Documentation :

- `docs/refactor_rules.md` : V2 en tête, V1 archivée en bas. Ce fichier n’est pas encore commité.

## 4) Tests et validations

- Parcours humain : invitation « Pilote de projet », assistant en deux étapes, la fiche affiche Pilote.
- Photos et logos : validés à l’écran (« c’est bon »).
- Construction du site public après la vitrine : succès (`npm run build` dans `web`).
- Le contrôle GitHub du correctif sitemap était vert sur le commit `fb63513` (exécution `39164082490`). Les commits suivants ont été poussés ; leur résultat de contrôle n’est pas revérifié ici.

Validations métier :

- Le rôle est obligatoire pour envoyer une invitation. Le test « invitation sans rôle » a été arrêté.
- L’espace vitrine est une démonstration, séparé des espaces d’essai.

## 5) Risques / limites restantes

- Un consultant peut toujours changer le rôle d’une fiche déjà créée. C’est voulu.
- Le dossier des photos n’a pas de limite de type ni de poids côté stockage. Le contrôle existe dans l’application.
- Le lien d’affichage d’une photo dure environ une heure. Au-delà, un rechargement de la page le renouvelle.
- L’étape 2 de l’assistant peut marquer l’invitation comme acceptée avant la validation finale.
- Le raccourci de la règle agent cite encore l’ancienne liste des motifs de refactor, dont « complexité bloquante ». Le document de référence V2 fait foi.
- `docs/refactor_rules.md` est modifié en local et n’est pas encore enregistré dans Git.

## 6) URLs et environnements impactés

- Tableau de bord : `https://forge-du-changement.vercel.app`
- Site public : `https://forge-du-changement-kgyg-xi.vercel.app`
- Base : projet Supabase `kpgkxeilddeyfwiiqaha`
- Local : dashboard Vite `http://localhost:5173`. Le serveur Next.js local de `/web` n’a pas été lancé.

## 7) Prochaines étapes

Maintenant :

1. Enregistrer la V2 des règles de refactor si la relecture convient.
2. Aligner le raccourci de la règle agent sur la V2, pour qu’il ne cite plus « complexité bloquante ».

Après :

3. Rien d’autre n’est ouvert par cette session. Le découpage des gros fichiers n’est pas planifié.

## 8) Références

- Règles de refactor : `docs/refactor_rules.md`
- Commit(s) : `fd9ea15`, `5353ea2`, `8e321ad`, `c8bad99`, `fb63513`, `57a09c0`, `60098a3`, `5288fd6`
- Migrations : `supabase/migrations/20261018222100_users_insert_role_matches_invitation.sql`, `supabase/migrations/20261018222900_close_public_assets_bucket.sql`, `supabase/migrations/20261018234100_workspace_showcase.sql`, `supabase/migrations/20261018234900_users_insert_locks_role_and_superadmin.sql`

Dernière mise à jour : **19 octobre 2026**, 00 h 10 (Europe/Paris)
