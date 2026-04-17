# La Forge du Changement — Qui peut quoi ? (version simple)

*Les règles de gestion expliquées avec des mots d’humain. À partager avec produit, métier ou clients sans jargon technique.*

---

## L’idée centrale

Chaque **entreprise cliente** a son **espace de travail** dans l’app : c’est comme un **dossier fermé**.  
On n’ouvre un dossier **que** si on y est **autorisé** : soit on en est **membre**, soit on est **consultant** rattaché à ce dossier, soit on est **l’équipe plateforme** (super admin) pour du support ou de la maintenance.

Personne ne « tombe » par hasard sur les données d’une autre entreprise.

---

## Trois façons de « faire vivre » l’outil (modèle éco)

Ce sont des **canaux commerciaux** ; les règles de droits ci-dessous s’appliquent **dans tous les cas**, seul le **premier responsable** du dossier change un peu au départ.

1. **Tu utilises l’outil et le vends à tes clients** — Tu crées ou pilotes les espaces ; en général tu es **consultant responsable** (*owner*) sur les dossiers que tu portes.
2. **Tu vends la démarche et des modules à d’autres consultants** (licence + formation) — Chaque consultant gère **ses** dossiers clients ; **consultant responsable** vs **collaborateur** sur le dossier restent la règle.
3. **Le client utilise la plateforme en autonomie** (abonnement, sans conseil permanent) — L’entreprise a besoin d’un **référent interne** pour les comptes et les droits : c’est le rôle **administrateur de l’espace entreprise** (voir plus bas). Tu peux proposer une **prestation de soutien** ponctuelle sans être dans la chaîne opérationnelle au quotidien.

---

## Les grands types de personnes

### Toi (super admin **plateforme**)

C’est le **gardien du produit** : tu peux intervenir sur n’importe quel espace **quand c’est nécessaire** (bug, urgence, migration).  
Ce n’est **pas** le même rôle que l’« admin » **à l’intérieur** d’une entreprise cliente.

En pratique, ce pouvoir plateforme doit rester **l’exception** : on le trace (qui a fait quoi, quand), et plus tard on peut ajouter des règles du type « accès temporaire avec une raison obligatoire ».

### Administrateur de l’**espace entreprise** (client autonome)

C’est le **super-utilisateur côté client** : une personne **interne** au workspace de **son** entreprise, responsable de la **bonne gestion des droits** (invitations, cohérence des rôles métier, paramètres de la fiche entreprise lorsque le pilotage est interne).

- **Périmètre** : **un seul** espace entreprise (celui où il est membre avec ce rôle), pas la plateforme entière.
- **À ne pas confondre** avec le super admin **plateforme** : vocabulaire conseillé côté client — « **administrateur de l’espace** », « **responsable des accès** » — plutôt que « super admin » seul.
- **Premier jour** : en général le **créateur du compte** entreprise en autonomie, ou la personne désignée à l’onboarding ; **sortie** de la personne : prévoir un **second administrateur** ou une **procédure** (support) pour ne pas bloquer l’entreprise.

### Les consultants

Ce sont les personnes qui **accompagnent** les entreprises clientes (quand le modèle n’est pas 100 % solo).

- **Consultant « responsable du dossier »** (*owner*) : en général **celui ou celle qui a créé l’espace** pour ce client, ou la personne que tu désignes comme référent. C’est lui qui **pilote** l’accès des autres consultants sur ce client.
- **Consultant « invité sur le dossier »** (*collaborateur*) : un collègue qu’on ajoute pour aider **sur ce client-là** seulement. Il ne voit pas **automatiquement** tous les autres clients des autres consultants.

**Règle simple** : un consultant ne voit dans la liste que **les entreprises auxquelles il est rattaché**. Il ne voit ni ton espace perso de démo, ni les dossiers d’un autre cabinet, sauf si tu l’y as **explicitement** ajouté.

**Invitations** : tout **consultant** rattaché au dossier — **y compris un collaborateur** — peut **inviter des membres de l’entreprise cliente** (CODIR, chefs de projet, contributeurs), comme convenu avec le client. **L’administrateur de l’espace entreprise** peut le faire aussi lorsque le client est en autonomie (même logique que dans l’app : invitations + fiche entreprise côté client).

### Les membres côté entreprise cliente

- **CODIR** : vision stratégique, pilotage. Ils peuvent **inviter des personnes de leurs équipes** (autres CODIR, chefs de projet, contributeurs) dans le même espace entreprise, pour faire vivre le collectif sans tout remonter au consultant à chaque fois.
- **Chef de projet** : conduit les projets de transformation dans l’outil. *(Invitation d’autres membres : selon version produit, réservée aux consultants, à l’administrateur de l’espace et aux CODIR.)*
- **Contributeur** : participe sur des parties précises (saisie, suivi, etc.).

Ce sont des **rôles métier** : ils ne remplacent pas le rôle « consultant La Forge » ni le super admin **plateforme**.

---

## Invitations : unitaire ou par lot (CSV)

Après **discussion avec le client** (ou validation interne en mode autonome) sur la liste des personnes à embarquer :

- **Invitation une par une** : email + rôle, envoi du lien de connexion.
- **Invitation par lot** : coller ou importer un fichier **CSV** avec une ligne par personne.  
  - Colonnes : **email** et, si besoin, **rôle** (virgule ou point-virgule).  
  - Si le rôle est absent sur une ligne, un **rôle par défaut** choisi dans l’interface s’applique.  
  - Cela permet d’aligner l’outil sur une liste validée en réunion (export Excel → CSV, etc.).

*(Les invitations de masse doivent rester un geste réfléchi : prévoir plus tard un journal « qui a lancé le lot » pour la conformité.)*

---

## Trois niveaux de « pouvoir » dans l’app (pour s’y retrouver)

| Niveau | En une phrase | Qui typiquement |
|--------|----------------|-----------------|
| **Gérer la fiche entreprise** | Logo, nom, secteur, taille — structure du dossier « client ». | Consultant **responsable** ou **administrateur de l’espace entreprise** (rôle **admin** dans l’outil) (+ super admin **plateforme** si besoin). **Pas** le seul collaborateur consultant, sauf règle produit ouverte plus tard. |
| **Inviter des membres** | Une par une ou par lot CSV, renvoyer le mail de connexion. | **Tout consultant** sur le dossier (responsable ou collaborateur), **l’administrateur de l’espace entreprise**, et les **membres CODIR**. |
| **Travailler dans l’espace** | Fabrique, projets, contenus du quotidien. | CODIR, chefs de projet, contributeurs (selon les modules). |

---

## Ce que chacun peut faire, concrètement

### Super admin (**plateforme**)

- Voir et intervenir sur **tous** les espaces **si nécessaire**, de façon **traçable**.

### Consultant (responsable ou collaborateur)

- **Inviter** des membres de l’entreprise cliente (y compris via **CSV** après accord client).
- **Renvoyer** le lien de connexion pour une invitation en attente.
- **Modifier la fiche entreprise** : **uniquement** le consultant **responsable** (pas le seul collaborateur, sauf évolution produit).

### Administrateur de l’**espace entreprise** (rôle **admin** dans l’outil)

- **Inviter** et gérer le flux d’invitations sur **son** espace (comme un référent interne).
- **Modifier la fiche entreprise** de **son** workspace (client en autonomie ou pilotage interne des paramètres du dossier).
- **Ne pas confondre** avec l’accès transversal **plateforme** : il ne voit pas les autres entreprises.

### Membre CODIR

- **Inviter** des membres de **son équipe** dans le même espace (rôles métier : CODIR, chef de projet, contributeur).
- **Renvoyer** les mails d’invitation si besoin.
- **Ne modifie pas** la fiche « entreprise » globale : elle reste du ressort du **consultant responsable** ou de l’**administrateur de l’espace entreprise** (affichage clair dans l’UI).

### Chef de projet / contributeur

- **Travailler** dans l’espace selon les droits des modules.
- **Pas d’invitation** dans la version décrite ici pour le seul chef de projet / contributeur (périmètre clair ; à rouvrir si le métier le demande).

---

## Correspondance avec les mots de votre métier

| Vous dites | Dans l’outil / la base, souvent |
|------------|----------------------------------|
| Membre CODIR | rôle **codir** |
| Chef de projet | rôle **pilote** |
| Contributeur | rôle **contributeur** |
| Consultant sur le client | rattachement **consultant** au workspace (responsable ou collaborateur) |
| Administrateur de l’espace entreprise (client) | rôle **admin** sur un `users` dont le `workspace_id` est celui de **cette** entreprise |

---

## La vie d’un accès, du début à la fin (sans jargon)

1. **Création de l’espace** pour une nouvelle entreprise → souvent un **consultant responsable** ; en **client autonome**, peut être une personne désignée qui devient **administrateur de l’espace**.
2. **Autres consultants** ajoutés sur le dossier → ils peuvent **aussi inviter** des membres client (quand le conseil est dans la boucle).
3. **Administrateur de l’espace** ou **membres CODIR** invitent les **équipes** sur la base d’accords internes au client.
4. **Liste validée** → possible d’utiliser l’**import CSV** pour inviter en une fois.
5. **Retrait d’une personne** → elle ne doit plus accéder au dossier (à matérialiser côté technique et procédure).

---

## Pourquoi on parle aussi de « technique » plus tard

Pour que les règles ci-dessus soient **vraies** dans l’app : table des **rattachements consultant ↔ workspace**, rôle **admin** côté client, règles de sécurité en base, et **journal** des actions sensibles (lots d’invitations, retraits, super admin **plateforme**). Voir le script SQL dédié `docs/supabase-evolution-org-admin-rls.sql` pour aligner Supabase.

---

*Document La Forge du Changement — règles de gestion en langage clair.*
