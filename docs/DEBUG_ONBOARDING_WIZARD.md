# Guide de Debug — Spinner infini à l'onboarding (InviteeSetupWizard)

Dernière mise à jour : **11 mai 2026**, 10 h 32 (Europe/Paris)

## 1. Vue d'ensemble

Ce document décrit les logs ajoutés au flux d'authentification et d'invitation pour tracer le bug du **spinner infini** lors de l'affichage du wizard `InviteeSetupWizard`.

### Points clés du flux

1. **Démarrage du résolution d'auth** → `reconcileAuthSession(user)`
2. **Récupération du profil utilisateur** → `getCurrentUser(sessionUser)`
3. **Vérification si super-admin** → `isPlatformSuperadmin()`
4. **Récupération des invitations** → `getLatestPendingInvitationForEmail()` ou `getAcceptedInvitationAwaitingUserRow()`
5. **Résolution du `serverAccess`** → décide de source = `users`, `invitation`, ou `superadmin`
6. **Évaluation du gate du wizard** → `needsInviteeSetupGate(serverAccess, platformSuperadmin)`
7. **Montée du wizard** ou **affichage du dashboard**

---

## 1 bis. Checklist — tests manuels à faire

Cocher au fil des releases / recettes (ordre indicatif).

### Profil et direction (workspace réel)

- [ ] **CODIR** : ouvrir **Mon profil**, saisir un **nom de direction** (nouveau libellé), type (ex. Géographique), **Enregistrer** → pas d’erreur ; `direction_id` renseigné côté base ; **Projets transformants** résout le périmètre.
- [ ] **CODIR** : modifier le nom pour matcher une direction **existante** non transverse → rattachement à l’`id` existant (pas de doublon inutile).
- [ ] **Admin / consultant** : création ou édition direction **transverse** (flux habituel back-office) → toujours autorisé via `can_manage_workspace`.

### Wizard invité (`InviteeSetupWizard`)

- [ ] Invitation **CODIR** : liste des directions + option **créer une nouvelle** ; enregistrement OK.
- [ ] Invitation **contributeur** avec `direction_id` sur l’invitation (ex. invité par un CODIR avec direction) → message de rattachement cohérent ; pas de choix contradictoire.
- [ ] Invitation **contributeur** **sans** `direction_id` → choix obligatoire (liste ou création), comme CODIR.

### Revue roadmap / rôle CODIR « réel »

- [ ] Depuis un compte **CODIR** avec revue ouverte (ou tout flux qui appelle `createInvitation` avec le bon `workspace_id`) : inviter un **contributeur** → vérifier en base que `invitations.direction_id` reprend la direction du CODIR **dans ce workspace** (cf. `resolveCurrentAppUserForInvitation` filtré par `workspace_id` dans `src/lib/api/invitations.ts`).
- [ ] Si impossible en recette : valider au minimum l’invitation **admin** + les blocs ci-dessus ; reporter le scénario CODIR-revue à un compte test dédié.

### Régressions connues à surveiller

- [ ] Après login invité : `getWorkspace` OK (`current_step_*` cohérents) — voir **§6 bis**.
- [ ] Pas de contamination cache **Mon profil** entre deux comptes sur le même navigateur — voir **§6 ter** (`savedForEmail`).

---

## 2. Logs ajoutés et leur rôle

Tous les logs utilisent les préfixes suivants pour filtrer aisément dans DevTools :
- `[lfdc:auth]` — logs du module `src/lib/auth.ts` (authentification)
- `[lfdc:wizard]` — logs du module `src/App.tsx` (gate et montée du wizard)

### 2.1 Logs dans `src/lib/auth.ts`

#### `getCurrentUser()`

```
[lfdc:auth] getCurrentUser start: email=ykassi@bara-k.com, authId=uuid-xxx
```
**Signification** : Début de la recherche du profil utilisateur. `email` = email de session, `authId` = ID d'auth Supabase.

```
[lfdc:auth] getCurrentUser authRow result: {...} (match=true)
```
**Signification** : Ligne `public.users` trouvée par `authId`. `match=true` si l'email correspond.

```
[lfdc:auth] getCurrentUser authRow query error: {...}
```
**Signification** : Erreur lors de la requête par `authId`. Cela n'est pas bloquant ; on passe aux étapes suivantes.

```
[lfdc:auth] getCurrentUser byId result found, match=true
```
**Signification** : Une ligne avec `storedUserId` explicite a été trouvée.

```
[lfdc:auth] getCurrentUser workspace=null
```
**Signification** : Aucun workspace en cache local (`localStorage.workspaceId`).

```
[lfdc:auth] getCurrentUser candidates count: 2
```
**Signification** : Plusieurs lignes `public.users` existent pour cet email. Heuristique de scoring en cours.

```
[lfdc:auth] getCurrentUser returning highest-scored candidate: found
```
**Signification** : Ligne `public.users` sélectionnée selon le score (profil, avatar, etc.).

#### `isPlatformSuperadmin()`

```
[lfdc:auth] isPlatformSuperadmin result: true
```
**Signification** : Cet utilisateur est un super-admin plateforme.

```
[lfdc:auth] isPlatformSuperadmin result: false
```
**Signification** : Pas un super-admin ; poursuite du flux normal (invitation ou accès refusé).

```
[lfdc:auth] isPlatformSuperadmin error: {...}
```
**Signification** : Erreur lors de l'appel RPC. Retour `false` par défaut (safe-default).

### 2.2 Logs dans `src/App.tsx`

#### `reconcileAuthSession()`

```
[lfdc:wizard] reconcileAuthSession: invitedUser=uuid-abc, platformSuper=false, email=ykassi@bara-k.com
```
**Signification** : Après `getCurrentUser()` et `isPlatformSuperadmin()`.
- `invitedUser` = ID du profil trouvé ou `null`
- `platformSuper` = true/false
- `email` = email normalisé

**DIAGNOSTIC** :
- Si `invitedUser=null` ET `platformSuper=false` → on passe à la branche invitation
- Si `invitedUser=uuid-xxx` → on prend la branche "utilisateur existant"

```
[lfdc:wizard] reconcileAuthSession invitation results: pendingInv=uuid-inv-1, acceptedInv=null
```
**Signification** : Résultats des requêtes `getLatestPendingInvitationForEmail()` et `getAcceptedInvitationAwaitingUserRow()`.
- `pendingInv` = invitation en attente trouvée
- `acceptedInv` = invitation acceptée sans profil `users` associé

**DIAGNOSTIC** :
- Si les deux sont `null` → accès refusé, l'utilisateur sort (ACCESS_DENIED_LOGIN_MESSAGE)
- Si un des deux existe → source d'accès = `invitation`

```
[lfdc:wizard] setServerAccess: source=users, workspace_id=uuid-workspace, role=codir
```
**Signification** : Un profil existant a été trouvé. `serverAccess` prend la source `users`.
- `workspace_id` = workspace dans la ligne `public.users`
- `role` = rôle de l'utilisateur dans ce workspace

```
[lfdc:wizard] setServerAccess: source=invitation, workspace_id=uuid-workspace, role=contributeur
```
**Signification** : Aucun profil `users`, mais une invitation trouvée. `serverAccess` prend la source `invitation`.
- `workspace_id` = workspace de l'invitation
- `role` = rôle proposé par l'invitation

```
[lfdc:wizard] setServerAccess: source=superadmin
```
**Signification** : L'utilisateur est un super-admin plateforme.

```
[lfdc:wizard] reconcileAuthSession ACCESS_DENIED: no user, no superadmin, no invitation
```
**Signification** : Aucun chemin d'accès trouvé. L'utilisateur ne peut pas accéder (email non invité, aucun profil).

#### Gate du wizard

```
[lfdc:wizard] gate check: needsInviteeSetupGate=true, inviteWizardWorkspaceId=uuid-workspace, serverAccess.source=invitation
```
**Signification** : Évaluation du gate. Le wizard va-t-il se montrer ?
- `needsInviteeSetupGate=true` → l'utilisateur a besoin du wizard
- `inviteWizardWorkspaceId` → ID du workspace où le wizard doit fonctionner
- `serverAccess.source` → source de l'accès actuel

**DIAGNOSTIC** :
- Si `needsInviteeSetupGate=true` ET `inviteWizardWorkspaceId` != `null` → **wizard monté**
- Sinon → **wizard NOT monté**, dashboard affiché

```
[lfdc:wizard] WIZARD MOUNTED: workspace_id=uuid-workspace, serverAccess.source=invitation
```
**Signification** : Le wizard vient de se monter (React Suspense + lazy load).

```
[lfdc:wizard] wizard NOT mounted: gate=false, workspaceId=null
```
**Signification** : Le gate a rejeté la montée du wizard. Pourquoi ?
- Si `gate=false` → `needsInviteeSetupGate()` a retourné false (voir section 3.1)
- Si `workspaceId=null` → `resolveInviteeWizardWorkspaceId()` n'a trouvé aucun workspace

---

## 3. Matrice de diagnostic

Utilise cette matrice pour identifier d'où vient le bug.

| Logs observés | Interprétation | Action |
|---|---|---|
| `[lfdc:auth] getCurrentUser start` puis rien après | Requête `public.users` bloquée ou timeout | Vérifier la RLS sur `users` ou les logs Supabase |
| `[lfdc:auth] isPlatformSuperadmin result: false` + `[lfdc:wizard] reconcileAuthSession: invitedUser=null` | Ni profil trouvé, ni super-admin | Passer à la branche invitation (voir suivant) |
| `[lfdc:wizard] reconcileAuthSession invitation results: pendingInv=null, acceptedInv=null` | Aucune invitation trouvée pour cet email | **EMAIL NON INVITÉ** — vérifier Supabase → table `invitations` |
| `[lfdc:wizard] setServerAccess: source=invitation, workspace_id=uuid` + pas de `WIZARD MOUNTED` après | Gate a rejeté le wizard | Lire section 3.1 ci-dessous |
| `[lfdc:wizard] WIZARD MOUNTED` puis spinner infini (pas de progression) | Le wizard s'est monté mais ne charge pas | Bug UI ou state stuck dans `InviteeSetupWizard` |
| `[lfdc:auth]` logs s'arrêtent soudainement | Crash ou erreur d'exception | Vérifier la console pour les erreurs JS |

### 3.1 Pourquoi le gate rejette-t-il le wizard ?

Condition pour montrer le wizard (voir `App.tsx` ligne 1221-1235) :

```typescript
function needsInviteeSetupGate(
  serverAccess: ServerAccess | null,
  platformSuperadmin: boolean,
): boolean {
  if (platformSuperadmin) return false  // Super-admin : pas de wizard
  if (!serverAccess) return false        // Pas d'accès : pas de wizard
  if (serverAccess.source === 'superadmin') return false  // Super-admin via source : pas de wizard
  if (serverAccess.source === 'invitation') return true   // Invitation : WIZARD OUI
  if (serverAccess.source === 'users') {
    const u = serverAccess.dbUser
    if (u.role === 'consultant') return false  // Consultant : pas de wizard (multi-workspace)
    return !u.prenom?.trim() && !u.nom?.trim() // User sans prénom ET sans nom : WIZARD OUI
  }
  return false
}
```

**Diagnostic** :

- `gate=false` car `platformSuperadmin=true` → OK, super-admin n'a pas besoin de wizard
- `gate=false` car `serverAccess.source=superadmin` → OK, même logique
- `gate=false` car `serverAccess.source=users` ET `role=consultant` → OK, consultant bypass wizard
- `gate=false` car `serverAccess.source=users` ET (`prenom` OU `nom` rempli) → **POTENTIEL BUG** : l'utilisateur a un profil partial; vérifier la colonne `prenom` / `nom` dans `public.users`
- `gate=true` + `workspaceId=null` → **BUG** : fonction `resolveInviteeWizardWorkspaceId()` n'a pas trouvé le workspace

### 3.2 Fonction `resolveInviteeWizardWorkspaceId()`

```typescript
function resolveInviteeWizardWorkspaceId(access: ServerAccess | null): string | null {
  if (!access) return null
  if (access.source === 'invitation') return access.workspaceId  // ← source invitation
  if (access.source === 'users') return access.dbUser.workspace_id ?? null  // ← source users
  return null
}
```

**Diagnostic** :
- Si `serverAccess.source=invitation` et `workspaceId=null` → **L'invitation n'a pas de workspace_id** (bug data Supabase ou invitation corrompue)
- Si `serverAccess.source=users` et `workspace_id=null` → **L'utilisateur n'a pas d'affiliation workspace** (profil orphelin)

---

## 4. Plan de test local — ykassi@bara-k.com

### Prérequis

1. **Dev server en cours** :
   ```bash
   cd d:/Le\ produit\ SaaS
   npm run dev  # Port 5173
   ```

2. **Console DevTools ouverte** : `F12` ou `Cmd+Option+I`

3. **Filtre de logs** : Dans l'onglet Console, taper dans le champ de recherche :
   ```
   lfdc
   ```
   Cela affichera tous les logs `[lfdc:auth]` et `[lfdc:wizard]`.

### Étape 1 : Préparer une invitation de test

Via Supabase Dashboard (`kpgkxeilddeyfwiiqaha.supabase.co`) :

1. Aller à **SQL Editor** ou **Table Editor** → table `invitations`
2. Créer une nouvelle invitation pour `ykassi@bara-k.com` :
   - `email` = `ykassi@bara-k.com`
   - `workspace_id` = un workspace existant (ex. `550e8400-e29b-41d4-a716-446655440000`)
   - `role` = `'codir'` (ou un rôle qui ne soit pas `'consultant'`)
   - `status` = `'en_attente'`
   - `invited_by` = un ID utilisateur existant
   - `invited_at` = maintenant
   - `created_at` = maintenant

   Ou via une RPC si disponible :
   ```sql
   INSERT INTO public.invitations (email, workspace_id, role, status, invited_by, invited_at, created_at)
   VALUES (
     'ykassi@bara-k.com',
     'WORKSPACE_ID_HERE',
     'codir',
     'en_attente',
     'USER_ID_HERE',
     now(),
     now()
   );
   ```

3. **Vérifier** : Chercher `ykassi@bara-k.com` dans la table `invitations` et noter son `workspace_id`.

### Étape 2 : Nettoyer le navigateur

1. Ouvrir **DevTools** → **Application** (ou **Storage**)
2. Supprimer tous les cookies et localStorage pour le domaine `localhost:5173`
3. Fermer tous les onglets de l'app `localhost:5173`

### Étape 3 : Générer un lien magic

Deux options :

#### Option A : Via l'interface login (recommandé)

1. Naviguer vers `http://localhost:5173`
2. Cliquer sur **"Connexion avec lien magique"** (ou **"Magic link"**)
3. Entrer `ykassi@bara-k.com`
4. Cliquer sur **"Envoyer le lien"**
5. **Attendre l'email** (en dev local, vérifier les logs Supabase ou envoyer manuellement)

#### Option B : Via Supabase Dashboard (si magic link n'est pas accessible)

1. Aller à **Authentication** → **Users**
2. Chercher ou créer `ykassi@bara-k.com`
3. Cliquer sur **"Send confirmation link"** ou copier le lien de réinitialisation (`recovery`)

### Étape 4 : Ouvrir le lien de confirmation

1. Copier le lien reçu (format `http://localhost:5173/auth/callback?code=...&type=recovery`)
2. Ouvrir dans le navigateur
3. **Immédiatement après**, ouvrir **DevTools Console**

### Étape 5 : Observer les logs

1. Dans la **Console** de DevTools, vérifier les logs dans cet ordre :

   **Attendus** :
   ```
   [lfdc:auth] getCurrentUser start: email=ykassi@bara-k.com, authId=...
   [lfdc:auth] getCurrentUser: no candidates found (ou autre résultat)
   [lfdc:auth] isPlatformSuperadmin result: false
   [lfdc:wizard] reconcileAuthSession: invitedUser=null, platformSuper=false, email=ykassi@bara-k.com
   [lfdc:wizard] reconcileAuthSession invitation results: pendingInv=..., acceptedInv=null
   [lfdc:wizard] setServerAccess: source=invitation, workspace_id=WORKSPACE_ID, role=codir
   [lfdc:wizard] gate check: needsInviteeSetupGate=true, inviteWizardWorkspaceId=WORKSPACE_ID, serverAccess.source=invitation
   [lfdc:wizard] WIZARD MOUNTED: workspace_id=WORKSPACE_ID, serverAccess.source=invitation
   ```

2. **Si le wizard NE s'affiche pas** mais que `WIZARD MOUNTED` apparaît → bug React/CSS
3. **Si `gate check` montre `gate=false`** → relire section 3.1

### Étape 6 : Filtrer les logs pour isoler le problème

**Cas 1 : Spinner infini après montée du wizard**
```
Filtrer : [lfdc:wizard]
→ Chercher : "WIZARD MOUNTED"
→ Si présent, c'est un bug du composant InviteeSetupWizard lui-même (state, effect, requête API)
```

**Cas 2 : Gate rejette le wizard**
```
Filtrer : [lfdc:wizard]
→ Chercher : "gate check" + "gate=false"
→ Lire le `workspaceId` et `serverAccess.source`
→ Valider avec section 3.1
```

**Cas 3 : Email non reconnu**
```
Filtrer : [lfdc:wizard]
→ Chercher : "reconcileAuthSession invitation results: pendingInv=null"
→ Vérifier table `invitations` dans Supabase : l'invitation existe-t-elle ?
```

---

## 5. Checklist de diagnostic

- [ ] Le dev server est en cours (`npm run dev`)
- [ ] L'invitation existe dans `invitations` pour `ykassi@bara-k.com`
- [ ] Le navigateur a un cache vide (localStorage et cookies supprimés)
- [ ] Le lien magic a été ouvert
- [ ] Les logs `[lfdc:auth]` apparaissent dans la console
- [ ] Les logs `[lfdc:wizard]` apparaissent après
- [ ] Si wizard monté : chercher dans `InviteeSetupWizard.tsx` (state stuck, requête infinie)
- [ ] Si gate=false : relire la logique de `needsInviteeSetupGate()` + valeurs de serverAccess

---

## 6. Points de vigilance

### Erreurs RLS (Supabase)

Si tu vois une erreur dans les logs type :
```
[lfdc:auth] getCurrentUser candidates query error: {"code": "PGRST116", "message": "The result exceeded ..."}
```
→ Cela signifie une vérification de permissions RLS. Vérifier les policies sur `public.users`.  
Pour un **membre connecté** dont le dashboard ne charge pas le parcours (`getWorkspace` / `workspaces`), voir **§6 bis** (RLS `workspaces` SELECT).

### Requête de réconciliation infinite

Si `reconcileAuthSession` s'appelle plusieurs fois :
```
[lfdc:wizard] reconcileAuthSession: invitedUser=null, platformSuper=false...
[lfdc:wizard] reconcileAuthSession: invitedUser=null, platformSuper=false... (again)
[lfdc:wizard] reconcileAuthSession: invitedUser=null, platformSuper=false... (again)
```
→ Bug useEffect ou état mutant. Vérifier `App.tsx` ligne 1278+.

### Cache localStorage pollué

Si tu vois des `workspaceId` inattendus :
```
[lfdc:auth] getCurrentUser workspace=550e8400-e29b-41d4-a716-446655440001
```
Mais c'est pas le bon → supprimer localStorage sur le navigateur.

Pour un **avatar ou un libellé de direction** incohérent dans **Mon profil** (mélange entre deux comptes sur la même machine), voir **§6 ter**.

---

## 6 bis. RLS `public.workspaces` (SELECT) — dashboard Vite (`/src`)

Cette section **synthétise** les règles et choix d’implémentation qui impactent le **chargement de l’espace entreprise** côté SPA (`getWorkspace` dans `src/lib/api/workspaces.ts`, effet dans `src/App.tsx`). Elle complète la section 6 (erreurs RLS) pour le cas précis **membre invité / parcours figé**.

### Pourquoi c’est critique pour `/src`

Après connexion, l’app lit la ligne `workspaces` pour :

- `company_name`, logo, métadonnées fiche entreprise ;
- **`current_step_codir`** et **`current_step_contributeur`** (parcours — `src/pages/WorkspaceHome.tsx`, menu parcours dans `App.tsx`).

Si le **SELECT** sur `workspaces` est refusé par la RLS (0 ligne côté PostgREST), `getWorkspace` échoue : l’UI retombe sur le snapshot local ou un état dégradé, et le parcours peut rester en **« Bientôt »** / bandeau *Parcours pas encore ouvert* **même si** la phase a déjà été ouverte par un admin sur cet espace.

### Modèle historique (risque)

Une policy de lecture du type :

- *« La ligne `workspaces` est visible si `id` est dans le sous-ensemble des `workspace_id` des lignes `users` où `users.id = auth.uid()` »*

est **correcte** tant que **`public.users.id` = `auth.users.id`** (UUID Supabase Auth) pour chaque membre.

**Écart observé (2026-05)** : certains profils créés via `createUser()` **sans** `id` explicite recevaient un **`id` généré** (≠ `auth.uid()`). La session Auth était valide et `getCurrentUser()` retrouvait bien la ligne `users` (email, scoring, ou `lfdc-user-id`), mais **`getWorkspace(workspace_id)`** ne passait plus la RLS → **aucune** ligne `workspaces` retournée.

### Synthèse des politiques côté `workspaces` (SELECT, `/src`)

Les policies **s’additionnent en OR** (comportement RLS permissif par défaut sur plusieurs politiques). Pour le dashboard authentifié, retenir :

| Mécanisme | Rôle |
|-----------|------|
| **Lecture « membre du workspace » (historique)** | Condition du type *workspace `id` lié à une ligne `users` dont l’identité correspond au JWT* (souvent via `auth.uid()` sur `users.id`). |
| **`workspaces_superadmin_select`** | Voir `docs/supabase-workspaces-superadmin-select.sql` — super-admin plateforme voit les espaces nécessaires au support. |
| **`workspaces_select_member_jwt_email_match`** (migration `supabase/migrations/20260511180000_workspaces_select_member_jwt_email.sql`) | **SELECT** autorisé si une ligne `public.users` du **même** `workspace_id` a un **email** égal à l’**email du JWT** (après `lower(trim(...))`), et que le workspace n’est pas archivé (`coalesce(archived, false) = false`). **Sert de filet** lorsque `users.id ≠ auth.uid()` tout en restant strictement lié à l’identité Auth par email. |

**Sécurité** : cette policy ne dépend pas d’un secret client ; elle repose sur le JWT Supabase. Elle n’ouvre pas un workspace arbitraire : il faut **une ligne `users` existante** pour cet email **dans** ce `workspace_id` (invitation / rattachement déjà validé côté métier).

### Choix applicatifs côté code (`/src`)

1. **Création de profil** : lors de l’insert `public.users` pour un invité (wizard ou fiche profil), passer explicitement **`id` = `session.user.id`** (Auth), pour rester aligné avec les policies qui utilisent `auth.uid()` et avec la convention Supabase « une ligne profil par identité Auth ».  
   Fichiers : `src/InviteeSetupWizard.tsx`, `src/ProfileSheet.tsx` (appel à `createUser`).

2. **`getCurrentUser()`** : la priorité documentée dans `src/lib/auth.ts` (auth row, `lfdc-user-id`, workspace local, scoring) **n’est pas modifiée** par la policy `workspaces` ; en revanche, une fois le workspace chargé, **`current_step_*`** ne sont fiables que si le SELECT `workspaces` réussit.

### Références utiles

- Migration appliquée en prod (exemple) : `supabase/migrations/20260511180000_workspaces_select_member_jwt_email.sql`
- API lecture workspace : `src/lib/api/workspaces.ts` — `getWorkspace(id)` (`select('*')`, cache `dedupedFetch`).
- Alignement invitation ↔ `users.workspace_id` : `src/lib/sessionWorkspace.ts` — `alignUserWorkspaceToLatestAcceptedInvitation` (ne remplace pas la RLS `workspaces` ; évite seulement un décalage métier d’espace sur la ligne `users`).

---

## 6 ter. Cache « Mon profil », rattachement `directions` et CODIR (`/src`)

### Chaîne de vérité produit

| Couche | Rôle |
|--------|------|
| `public.directions` | Périmètres métiers du workspace (dont une ligne **non transverse** par direction CODIR / équipe). |
| `public.users.direction_id` | Rattachement **persistant** du membre à **une** ligne `directions` — utilisé par `ProjectSelector` (`memberDirectionId`) pour `resolveEffectiveMemberDirectionId`. |
| `public.users.direction_nom` | Libellé affiché / saisi ; doit rester aligné avec la direction résolue après enregistrement. |
| Cache `localStorage` `lfdc-member-onboarding:<email>` | Préremplissage UI ; **ne remplace pas** la base. |

`ProjectSelector` affiche *« Aucune direction métier n’est résolue pour votre profil »* lorsque `restrictToMemberDirections` est vrai et qu’**aucun** périmètre hydraté ne correspond à `memberDirectionId` **ni** par matching de nom (`directionDisplayNamesMatch`).

### Création / résolution à l’enregistrement (`ProfileSheet`)

- `resolveOrCreateMemberDirection` (`src/lib/profileDirectionResolve.ts`) : cherche une direction **non transverse** dont le nom matche ; sinon **INSERT** `directions` avec `user_id` = **`auth.uid()`** (session), pas une ligne `getCurrentUser()` potentiellement ambiguë.
- Si l’INSERT / le SELECT échoue (RLS, réseau), l’enregistrement **s’interrompt** et un message d’erreur s’affiche : sans `direction_id`, le CODIR ne peut pas verrouiller son périmètre dans **Projets transformants**.
- **Erreur UI « ([object Object]) »** : l’objet d’erreur PostgREST renvoyé par `supabase-js` n’est pas toujours une `instanceof Error` — utiliser `formatClientErrorMessage` (`src/lib/formatClientErrorMessage.ts`) dans les `catch` affichés à l’utilisateur.

### RLS `public.directions` (INSERT) — CODIR / pilote / contributeur

Historiquement, une policy **FOR ALL** `directions_all` combine :

- `USING (can_access_workspace(workspace_id))` — lecture / visibilité ;
- **`WITH CHECK (can_manage_workspace(workspace_id))`** — s’applique notamment aux **INSERT**.

Les rôles **CODIR / contributeur / pilote** ont en général `can_access_workspace` mais **pas** `can_manage_workspace` → l’**INSERT** d’une nouvelle direction depuis le profil ou le wizard était **refusé** (message PostgREST du type *new row violates row-level security policy*).

**Correctif (prod + fichier migration)** : policy permissive supplémentaire **`directions_insert_member_self_serve`** + fonction `can_member_self_serve_direction_insert(workspace_id, is_transverse)` — autorise l’INSERT d’une direction **non transverse** dans le workspace du membre dont le rôle est `codir`, `contributeur` ou `pilote`. Les directions **transverses** restent réservées aux comptes qui passent `can_manage_workspace` (policy `directions_all`).

- Migration : `supabase/migrations/20260511183200_directions_insert_member_self_serve.sql`

### Cache local et contamination entre comptes

- Chaque entrée cache inclut désormais **`savedForEmail`** (email normalisé) ; la migration **legacy** (`lfdc-member-onboarding` sans suffixe) vers la clé par email **ne se fait** que si le JSON legacy porte déjà le même `savedForEmail` (évite de recoller le profil d’un autre rôle, ex. super-admin, sur un nouvel invité).
- Si un navigateur a encore d’anciennes données douteuses : vider la clé `lfdc-member-onboarding` et les clés `lfdc-member-onboarding:<email>` concernées, ou ré-enregistrer le profil après correction.

---

## 7. Fichiers pertinents

- `src/App.tsx` — Gate du wizard, logs `[lfdc:wizard]`
- `src/lib/auth.ts` — `getCurrentUser()`, `isPlatformSuperadmin()`, logs `[lfdc:auth]`
- `src/InviteeSetupWizard.tsx` — Composant wizard (si montage OK mais spinner infini, chercher ici)
- `src/lib/api/index.ts` — Requêtes invitations (`getLatestPendingInvitationForEmail`)
- `src/lib/api/workspaces.ts` — `getWorkspace` (parcours / fiche entreprise) ; voir aussi §6 bis (RLS `workspaces`)
- `supabase/migrations/20260511180000_workspaces_select_member_jwt_email.sql` — policy SELECT email JWT (§6 bis)
- `supabase/migrations/20260511183200_directions_insert_member_self_serve.sql` — policy INSERT membre terrain sur `directions` (§6 ter)
- `src/lib/formatClientErrorMessage.ts` — libellé d’erreur client (évite `[object Object]`)
- `src/lib/profileDirectionResolve.ts` — résolution / création direction à l’enregistrement profil (§6 ter)
- `src/lib/memberProfileStorage.ts` — clés cache et migration legacy sécurisée (§6 ter)

---

## 8. Commandes utiles

**Activer les logs étendus** (optionnel, pour la perf) :
```javascript
// Dans Console → tapez :
localStorage.setItem('lfdc:debug:auth-boot', '1')
```
Ensuite recharger. Cela ajoute des logs temporels pour chaque étape.

**Purger le cache localStorage** :
```javascript
localStorage.clear()
sessionStorage.clear()
```

**Exporter les logs** :
```javascript
// Dans Console, cliquer droit sur les logs → Save as
```

---

## Notes additionnelles

- Les logs ne sont jamais remis à zéro automatiquement ; ils persistent jusqu'à rechargement/fermeture d'onglet.
- Les timestamps des logs sont en millisecondes (`performance.now()`), pas en UTC.
- Si aucun log `[lfdc:...]` n'apparaît, c'est que le bundle n'a pas été recompilé après les changements. Vérifier que `npm run dev` a bien redémarré.
