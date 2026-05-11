# Récap — Périmètre CODIR, Projets transformants et projets transverses

Dernière mise à jour : **11 mai 2026**, 03 h 10 (Europe/Paris)

Document de reprise rapide suite aux travaux sur le dashboard Vite (`/src`), Supabase (RLS) et le comportement « membre CODIR » dans **Projets transformants** (sélection et scoring des projets, `ProjectSelector`) et la **Maturity Roadmap**.

---

## 1. Problème initial

- Un **CODIR** voyait des projets **d’autres directions** après connexion / onboarding.
- La synchro chargeait **toutes** les directions du workspace et sélectionnait souvent la **première** comme périmètre actif.
- Les onglets utilisaient des IDs fictifs (`perim-direction` / `perim-transverse`) qui ne correspondaient plus aux UUID Supabase après hydratation.

---

## 2. Règles métier retenues (produit)

1. **BUILD disjoint par CODIR** : hors roadmap transversale explicite documentée ailleurs, le périmètre BUILD d’un CODIR est **local** ; le **partage** entre CODIR passe par des mécanismes **transverses** (direction dédiée ou, désormais, **co-pilotes** — voir §4).

2. **Transverse côté Projets transformants (vue CODIR / contributeur)**  
   - **Ajouter un projet** = projet rattaché à **ma direction** (`direction_id` = ligne `directions` alignée sur `users.direction_id`).  
   - Dès qu’on sélectionne au moins une **direction co-pilote** (autres directions métier), le projet est considéré comme **transverse** pour l’affichage.  
   - **Pas** de second « dépôt » obligatoire sur une ligne `directions` avec `is_transverse = true` pour les projets créés par le CODIR.

3. **Filtrage UI** (CODIR / contributeur) : pastilles **Ma direction** vs **Projets transverses**  
   - *Ma direction* : projets **sans** co-pilote (`directions_contributrices` vide).  
   - *Projets transverses* : projets **avec** au moins un co-pilote.

4. **Alignement profil** : le libellé « Nom de ma direction » doit pouvoir être réconcilié avec la ligne `directions` (tolérance **article** La/Le/L’, casse, espaces) pour remplir `direction_id` à l’enregistrement du profil.

---

## 3. Implémentation technique (résumé)

### 3.1 `ProjectSelector.tsx` (Projets transformants)

- **`restrictToMemberDirections`** (activé pour `codir` et `contributeur` dans `App.tsx`) : **un seul** périmètre chargé = direction du membre (`getDirectionProjets` sur l’UUID résolu).
- **Pastilles** : plus un onglet séparé sur la ligne DB `is_transverse` pour les CODIR ; à la place, **Ma direction** / **Projets transverses** (filtre sur la présence de co-pilotes).
- **`resolveEffectiveMemberDirectionId`** + **`directionDisplayNamesMatch`** (`src/lib/directionLabels.ts`) pour matcher profil ↔ ligne `directions`.
- **Co-pilotes** : liste issue des **vraies** directions métier du workspace (`nonTransverseDirectionNames`), **sans** la direction courante du membre (`copilotDirectionChoicesForForm`).
- **Auto-save / formulaire projet** : correction du **draft** qui était réinitialisé à chaque mise à jour du prop `project` (effacement BUILD/RUN et scores). Resync du draft **uniquement** à l’ouverture de la fiche ou changement d’**id** projet.
- **`persistProject`** : en mode restreint, `direction_id` d’écriture = **`effectiveMemberDirIdRef`** (toujours la direction du membre).

### 3.2 Profil — `ProfileSheet.tsx`

- À la sauvegarde, si le nom de direction correspond à une ligne **`directions`** non transverse, mise à jour de **`direction_id`** (avec matching tolérant).

### 3.3 Supabase — RLS `projets`

- Migration **`20260511120000_projets_rls_member_self_serve.sql`** (appliquée sur le projet distant lors du chantier) :
  - Fonction **`can_member_self_serve_projet(workspace_id, direction_id)`** : rôles `codir` / `contributeur` / `pilote` peuvent insérer/mettre à jour/supprimer des projets sur **leur** `users.direction_id` **ou** sur une direction **`is_transverse`** (règle large côté DB ; le produit CODIR n’utilise plus le second cas pour *créer* depuis Projets transformants — voir dette §5).
  - Policies **`projets_select` / `insert` / `update` / `delete`** remplaçant la policy unique **`projets_all`** à **`WITH CHECK`** trop restrictive pour les membres terrain.

### 3.4 Maturity Roadmap — `MaturityRoadmap.tsx` + API

- **`resolveMemberDirectionId`** : `direction_id` utilisateur, puis nom tolérant ; **plus** de repli sur « première direction non transverse ».
- **`getRoadmapEligibleProjectsForRestrictedMember`** (`src/lib/api/directions.ts`) : uniquement les projets **`getDirectionProjets(memberDirectionId)`** filtrés BUILD retenu + validé DG (`selected_for_transfo` + `dg_validated_transfo`) — **plus** de fusion avec la ligne `directions.is_transverse`.
- État vide métier vs erreur technique : message sans mention « script SQL » pour le vide éligibilité (`eligibleEmptyInfo`).

---

## 4. Fichiers clés à rouvrir

| Zone | Fichiers |
|------|----------|
| Projets transformants — UI / logique | `src/ProjectSelector.tsx` |
| Matching noms direction | `src/lib/directionLabels.ts` |
| Profil / `direction_id` | `src/ProfileSheet.tsx` |
| Props `ProjectSelector` | `src/App.tsx` (`ProjectSelector`) |
| Roadmap chargement | `src/MaturityRoadmap.tsx`, `src/lib/api/directions.ts` |
| RLS | `supabase/migrations/20260511120000_projets_rls_member_self_serve.sql` |

---

## 5. Points ouverts / dettes (pour la suite)

1. **Visibilité côté CODIR co-pilote** : aujourd’hui un projet transverse reste stocké avec **`direction_id` = porteur**. Les CODIR des directions **co-pilotes** ne voient **pas** automatiquement le projet dans leur liste Projets transformants sans évolution (requête « projets où mon nom de direction est dans `directions_contributrices` » + éventuel alignement RLS).

2. **Données legacy** : d’anciens projets uniquement rattachés à la ligne DB **`is_transverse`** (création historique) **n’apparaissent plus** dans la vue CODIR basée sur **sa** direction. À traiter par migration data ou par vue admin / consultant (qui voit encore les onglets par direction).

3. **RLS `can_member_self_serve_projet`** : autorise encore techniquement insert sur une direction **`is_transverse`** pour codir/pilote/contributeur ; le flux UI CODIR actuel n’y pousse plus les créations. À resserrer en SQL si on veut coller au strict **porteur + co-pilotes textuels** uniquement.

4. **Pilote** : `restrictToMemberDirections` dans `App.tsx` est surtout **codir / contributeur** ; vérifier si **pilote** doit avoir le même filtre que le CODIR dans Projets transformants.

---

## 6. Branche / livraison

Travaux intégrés et poussés sur **`main`** au fil des commits (dont `feat(selector): transverse = co-pilotes…`, correctifs RLS, auto-save, roadmap).

---

*Fin du récap — reprise : commencer par §5 si tu enchaînes sur la visibilité co-pilotes ou la migration des anciens projets transverses en base.*
