# Backlog — La Forge du Changement
Dernière mise à jour : **21 avril 2026**, 15 h 45 (Europe/Paris)

Les **dates et heures** de mise à jour dans ce fichier sont exprimées en **heure de France** (fuseau **Europe/Paris**), sauf mention contraire.

## Convention de notation

| Préfixe | Signification |
|--------|----------------|
| **`REF-n`** | Identifiant de **tâche dans ce document** : numéro de la colonne *REF* du tableau de l’EPIC concerné (ex. `REF-36` = export Vue Synthèse dans **EPIC 13**). Toujours lire une REF **avec son EPIC** ; seul cas ambigu documenté ici : **`REF-41`** existe à la fois en **EPIC 2** (validation décideur) et en **EPIC 10** (super-admin) — utiliser « EPIC 2 · REF-41 » ou « EPIC 10 · REF-41 ». |
| **`GH-n`** | Numéro d’[**issue GitHub**](https://github.com/yoganfr/forge-du-changement/issues) sur `yoganfr/forge-du-changement`. Les titres d’issues reprennent en tête le préfixe **`[REF-…]`** (plage ou numéro unique) pour lecture immédiate alignée sur ce document. |
| **`EPIC k`** | Bloc thématique du backlog (priorisation et périmètre). |

Les valeurs **`REF-*`** et **`GH-*`** sont indépendantes (ex. `GH-11` = plan de charge côté GitHub, alors que **`REF-11`** en **EPIC 4** = actions PAE).

## Traçabilité GitHub ([yoganfr/forge-du-changement](https://github.com/yoganfr/forge-du-changement))

### Jeu historique (GH-1–GH-15)

Comparaison du **20 avril 2026** : les issues dont le périmètre est ✅ dans le backlog ont été **fermées** sur GitHub avec un commentaire de référence à ce fichier.

| GH | État (après sync) | Tâche backlog (REF) / commentaire |
|----|-------------------|-----------------------------------|
| [GH-1](https://github.com/yoganfr/forge-du-changement/issues/1) | Fermée | EPIC 2 · REF-1 — dashboard consolidé ✅ |
| [GH-2](https://github.com/yoganfr/forge-du-changement/issues/2) | Fermée | EPIC 2 · REF-2 — top 5 BUILD ✅ |
| [GH-3](https://github.com/yoganfr/forge-du-changement/issues/3) | Ouverte | EPIC 2 · REF-3 — Gantt macro consolidé ⬜ |
| [GH-4](https://github.com/yoganfr/forge-du-changement/issues/4) | Fermée | EPIC 3 · REF-4 — 4 axes ✅ |
| [GH-5](https://github.com/yoganfr/forge-du-changement/issues/5) | Fermée | EPIC 3 · REF-5 — jalons ✅ |
| [GH-6](https://github.com/yoganfr/forge-du-changement/issues/6) | Fermée | EPIC 3 · REF-6 — macro RACI ✅ |
| [GH-7](https://github.com/yoganfr/forge-du-changement/issues/7) | Ouverte | EPIC 3 · REF-7 — réactions / réponses ⬜ |
| [GH-8](https://github.com/yoganfr/forge-du-changement/issues/8) | Fermée | EPIC 3 · REF-8 — vue matrice ✅ |
| [GH-9](https://github.com/yoganfr/forge-du-changement/issues/9) | Fermée | EPIC 3 · REF-9 — dépendances (données conservées, UI masquée) ✅ |
| [GH-10](https://github.com/yoganfr/forge-du-changement/issues/10) | Ouverte | EPIC 4 · REF-10 — PAE structure ⬜ |
| [GH-11](https://github.com/yoganfr/forge-du-changement/issues/11) | Ouverte | EPIC 5 · REF-14 — plan de charge (grille) ⬜ |
| [GH-12](https://github.com/yoganfr/forge-du-changement/issues/12) | Fermée | EPIC 10 · REF-33 — auth réelle ✅ |
| [GH-13](https://github.com/yoganfr/forge-du-changement/issues/13) | Fermée | EPIC 10 · REF-35 — Vercel ✅ |
| [GH-14](https://github.com/yoganfr/forge-du-changement/issues/14) | Ouverte | EPIC 13 · REF-36 — export PDF / impression navigateur 🚧 |
| [GH-15](https://github.com/yoganfr/forge-du-changement/issues/15) | Ouverte | EPIC 6 · REF-17 — module SENS (diagnostic) ⬜ |

### Extensions (GH-16+ — avril 2026)

Issues créées pour ancrer les lots **hors jeu GH-1–GH-15**. **GH-16** et **GH-17** sont des *jalons de livraison* refermées tout de suite ; le reste est **ouvert** tant que le backlog indique ⬜ ou 🚧.

| GH | État | Tâche backlog (REF) / commentaire |
|----|------|-----------------------------------|
| [GH-16](https://github.com/yoganfr/forge-du-changement/issues/16) | Fermée | EPIC 10 · REF-38–46 — permissions / audit / scaling ✅ (jalon GitHub) |
| [GH-17](https://github.com/yoganfr/forge-du-changement/issues/17) | Fermée | EPIC 11 · REF-47–49 — invitations v1 ✅ (jalon GitHub) |
| [GH-18](https://github.com/yoganfr/forge-du-changement/issues/18) | Ouverte | EPIC 11 · REF-50 — MFA super-admin ⬜ |
| [GH-19](https://github.com/yoganfr/forge-du-changement/issues/19) | Ouverte | EPIC 11 · REF-51 — journal import lot CSV en UI ⬜ |
| [GH-20](https://github.com/yoganfr/forge-du-changement/issues/20) | Ouverte | EPIC 12 · REF-52–58 — design premium ⬜ |
| [GH-21](https://github.com/yoganfr/forge-du-changement/issues/21) | Ouverte | EPIC 4 · REF-11–13 — PAE suite (complète [GH-10](https://github.com/yoganfr/forge-du-changement/issues/10) · REF-10) ⬜ |
| [GH-22](https://github.com/yoganfr/forge-du-changement/issues/22) | Ouverte | EPIC 5 · REF-15–16 — plan de charge suite (complète [GH-11](https://github.com/yoganfr/forge-du-changement/issues/11) · REF-14) ⬜ |
| [GH-23](https://github.com/yoganfr/forge-du-changement/issues/23) | Ouverte | EPIC 6 · REF-18–21 — module SENS suite (complète [GH-15](https://github.com/yoganfr/forge-du-changement/issues/15) · REF-17) ⬜ |
| [GH-24](https://github.com/yoganfr/forge-du-changement/issues/24) | Ouverte | EPIC 7 · REF-22–23 ⬜ |
| [GH-25](https://github.com/yoganfr/forge-du-changement/issues/25) | Ouverte | EPIC 8 · REF-24–29 ⬜ |
| [GH-26](https://github.com/yoganfr/forge-du-changement/issues/26) | Ouverte | EPIC 9 · REF-30–32 ⬜ |
| [GH-27](https://github.com/yoganfr/forge-du-changement/issues/27) | Ouverte | EPIC 13 · REF-37 — export PDF PAE Manager ⬜ |
| GH-28 | Fermée | EPIC 14 · fusion PR homepage Next.js ✅ (merge le 21 avril 2026) |
| (à créer) | Ouverte | EPIC 15 · REF-76–86 — migration dashboard /src → /web (proposée) ⬜ |

## Légende
- 🔴 Priorité haute
- 🟠 Priorité moyenne  
- 🟡 Priorité basse
- ✅ Terminé
- 🚧 En cours
- ⬜ À faire

---

## EPIC 1 — Stabilisation & Fondations ✅ DONE
Implémenté le 17/04/2026. Gantt 24 mois, scoring, onboarding, logos Storage, connexion Supabase.

---

## EPIC 10 — Infrastructure & Sécurité ✅ DONE

| REF | Titre | Statut |
|---|-------|--------|
| 33 | Auth Supabase — Connexion email/password + Google OAuth + Magic Link | ✅ |
| 34 | RLS Supabase sécurisé par workspace | ✅ |
| 35 | Déploiement Vercel avec variables d'env et routing SPA | ✅ |
| 38 | **NEW** Refonte architecture permissions (consultants/owner/collaborator) | ✅ |
| 39 | **NEW** Table `workspace_consultants` + fonctions helper | ✅ |
| 40 | **NEW** Table `audit_events` pour traçabilité | ✅ |
| 41 | **NEW** Super admin plateforme en base (`is_platform_superadmin`) | ✅ |
| 42 | **NEW** Rôle `admin` workspace (administrateur espace entreprise) | ✅ |
| 43 | **NEW** Rate limiting client OTP (anti double-clic) | ✅ |
| 44 | **NEW** Cache/deduplication côté API (scaling) | ✅ |
| 45 | **NEW** Documentation permissions en langage métier | ✅ |
| 46 | **NEW** Scripts SQL de vérification RLS | ✅ |

---

## EPIC 11 — Invitations ✅ DONE (partiel)

| REF | Titre | Priorité | Statut |
|---|-------|----------|--------|
| 47 | Invitation unitaire avec email + rôle | — | ✅ |
| 48 | Invitation par lot CSV (parsing + import) | — | ✅ |
| 49 | Renvoi d'email de connexion pour invitation en attente | — | ✅ |
| 50 | MFA sur comptes super-admin | 🟠 | ✅ |
| 51 | Journal "qui a lancé le lot" visible UI | 🟡 | ✅ |
| 51b | Extension CSV d'invitation : colonnes optionnelles `direction` (résolue en direction_id) + `trigram` (sinon dérivé via convention workspace) — couvre les fondations utilisateur nécessaires à REF-7b | 🟠 | ⬜ |

---

## EPIC 2 — Vue décideur consolidée 🟠 PARTIEL (priorité restante : macro transverse)

| REF | Titre | Priorité | Statut |
|---|-------|----------|--------|
| 1 | Dashboard consolidé toutes directions | 🔴 | ✅ |
| 2 | Classement inter-directions top 5 BUILD | 🔴 | ✅ |
| 3 | Gantt macro consolidé (lecture transverse multi-directions) | 🟠 | ⬜ |
| 41 | Vue décideur + validation avec revue obligatoire + historique | 🔴 | ✅ |

---

## EPIC 3 — Maturity Roadmap (Rôles & Rythmes) 🚧 EN COURS

| REF | Titre | Priorité | Statut |
|---|-------|----------|--------|
| 4 | Structure 4 axes par projet BUILD (Processus/Orga/Outils/KPI) | 🔴 | ✅ |
| 5 | Création et gestion des jalons | 🔴 | ✅ |
| 6 | Macro RACI par jalon | 🔴 | ✅ |
| 7a | Snapshot roadmap figée (V1) + label + created_by + created_by_email + back-fill | 🟠 | ✅ |
| 7b | Invitation et périmètre reviewers (cycle de revue V1 complet) — **voir spec détaillée ci-dessous** | 🟠 | 🚧 |
| 7b.0 | Fondations utilisateur (users.direction_id + users.trigram + workspaces.trigram_convention + héritage direction à l'invitation + extension CSV REF-51) | 🔴 | ⬜ |
| 7b.1 | RACI chantier (table `raci_chantiers` + matrice cochable dans MaturityRoadmap + accordéon latéral droit) — indispensable avant ReviewerPage | 🔴 | ⬜ |
| 7b.2 | Schéma revue (`roadmap_snapshot_reviewers`, `roadmap_review_feedbacks`, `roadmap_snapshots.review_deadline`, RLS) | 🔴 | ⬜ |
| 7b.3 | Modal "Ouvrir la revue" côté CODIR (multi-sélect reviewers + deadline + magic link + transition draft→in_review + audit) | 🔴 | ⬜ |
| 7b.4 | Routing conditionnel reviewer (redirect /review/:snapshotId + masquage nav principale pour les contributeurs-reviewers) | 🟠 | ⬜ |
| 7b.5 | ReviewerPage V1 (header + bandeau deadline avec pastille 🟢/🟠/🔴 + accordéon projets + roadmap lecture seule + partie 3 propositions + autosave commentaires + modal "Soumettre ma review") | 🔴 | ⬜ |
| 7b.6 | Panneau flottant déplaçable (migration drawer latéral → `react-rnd` floating panel, multi-ouverture, persistence position) | 🟠 | ⬜ |
| 7b.7 | Écran récap arbitrages (tableau global + badges inline + email/in-app cumulatif quand 0 feedback pending restant pour le reviewer) | 🟠 | ⬜ |
| 7c | Propositions reviewers (ajout/suppression/évolution chantiers-jalons) + justification structurée Constat/Proposition/Bénéfice — **intégré à REF-7b.5** | 🔴 | ⬜ |
| 7d | Arbitrage responsable roadmap : OK / NOK / Sous condition (propositions + demandes de décision) + Accusé réception (réactions) + clôture cycle feedback + notif cumulative reviewer | 🔴 | ⬜ |
| 7e | Workflow de relance automatique (email avant/après deadline reviewer, rappels dégradés) | 🟡 | ⬜ |
| 8 | Vue matrice complète (grille temps × 4 axes, chantiers typés par axe) | 🟠 | ✅ |
| 9 | Dépendances inter-jalons (séquence ligne + `jalon_dependance_id` conservée, **UI masquée**) | 🟡 | ✅ |

**Livraison par vagues (détail jalon / roadmap, avril 2026)**  
- **V1** : backdrop drawer/modales (mousedown+mouseup), RACI typographie + grilles 2 col (pilote radio, autres cases), échéance = maille timeline.  
- **V2** : pas de saisie dépendance en UI ; création **Direction** inline (modal chantier + drawer RACI) avec détection de doublon.  
- **V3** : jalon KPI **miroir** sync indicateur/cible/échéance parent, verrou nom+date sur miroir, suppression miroir → vide KPI parent. Script : `docs/supabase-jalons-kpi-source.sql`.

**Drag & drop — grille matrice (compléments avril 2026)**  
- **Vague 1** : déplacement d’une **ligne chantier** entre axes (Processus / Organisation / Outils ; pas KPI), refetch ciblé — **sans rechargement complet de page**.  
- **Vague 2** : déplacement des **pilules jalons** sur la **même ligne** (même `chantier_id` + même `axe`) pour ajuster l’échéance (`mois_cible` / `annee_cible`) ; **une pilule par cellule** temps (sinon toast + drop refusé) ; **renumérotation automatique** des `ordre_sequentiel` sur l’axe si l’ordre chronologique change ; mode **lecture seule** sans drag. API : `recalculateOrdreSequentielForChantierAxe` dans `src/lib/api/roadmap.ts`.

---

## EPIC 3 — Spec détaillée REF-7b (ReviewerPage & cycle de revue) 🚧 NOUVEAU

Session de cadrage produit du **21 avril 2026** entre Yogan et l'agent Cursor. Spec consolidée ici pour guider l'implémentation des lots 7b.0 → 7b.7.

### Persona reviewer

- **N-1 d'un membre CODIR** (managers / contributeurs opérationnels de la direction du CODIR).
- Rôle technique plateforme : `contributeur` classique (pas de nouveau rôle spécifique). La revue est l'une des activités possibles du contributeur (au même titre que les plans d'action / plans de charge).
- Invité via le flux magic link **standard** (REF-47 unitaire ou REF-48 CSV), avec onboarding classique.
- Différence d'expérience : UI **resserrée à la page de revue** tant qu'un snapshot `in_review` lui est assigné ; le reste de la plateforme est masqué.

### Cycle d'usage cible

1. Le CODIR Finance construit sa roadmap, la fige en V1 (REF-7a ✅).
2. Réunion CODIR → N-1 : présentation de la V1 en direct, annonce de la démarche de revue.
3. Le CODIR clique **« Ouvrir la revue »** sur le snapshot → sélectionne les reviewers (ses N-1), fixe une deadline. Les reviewers manquants reçoivent un magic link ; les membres existants reçoivent une notif + email.
4. Les reviewers accèdent à la page dédiée, explorent, commentent, soumettent des propositions.
5. Chacun clique **« Soumettre ma review »** avant la deadline (modal de confirmation). Une seule soumission par reviewer.
6. Le CODIR reçoit les feedbacks, les arbitre dans son écran dédié (REF-7d).
7. Une fois **tous** les feedbacks d'un reviewer arbitrés → email + notif in-app cumulative au reviewer (« vos contributions ont été arbitrées »).
8. Seconde réunion CODIR → N-1 : présentation de la V2 qui intègre les retours → passe d'intelligence collective.

### Architecture de la page (3 parties sur une seule page scrollable)

**Header minimaliste** · `[Logo] REVUE ROADMAP · Direction Finance   |   avatar ▾` (pas de nom de workspace)

**Bandeau deadline** (toujours visible en haut)
- Label du snapshot (ex: `V1 avril 2026`).
- Deadline humanisée (`vendredi 2 mai 2026 à 18h00 (Europe/Paris)`).
- Pastille couleur fondée sur **temps restant / durée totale** :
  - `≥ 50 %` → 🟢 VERT
  - `30 % – 50 %` → 🟠 ORANGE
  - `< 30 %` → 🔴 ROUGE
  - `dépassé` → ⚫ bandeau "En retard" mais page reste commentable.
- Bouton **« Soumettre ma review »** (désactivé si déjà soumis → remplacé par un bandeau `Revue soumise le XX/YY à HHhmm`).

**Partie 1 · Accordéon projets transformants**
- Ordre **par score transformation décroissant** mais **score non affiché** (règle : le score est un outil amont d'arbitrage, pas une info à montrer aux N-1).
- En-tête repliée = `Thématique · Nom · Période consolidée` (ex: `Systèmes & outillage · Refonte CG · Jan 26 → Juin 27`).
- Bouton global **« Tout déplier / Tout replier »**.
- Carte dépliée = `Thématique / Problématique / Description / Planning consolidé (début = mois du premier jalon du projet dans le snapshot, fin = mois du dernier) / zone commentaire`.
- Zone commentaire avec **toggle Réaction / Demande de décision** (voir "Modèle unifié feedbacks" ci-dessous).
- Indicateur commentaire : icône 💬 avec compteur + fond légèrement coloré sur l'en-tête repliée.

**Partie 2 · Roadmap visuelle (lecture seule + commentable)**
- Rendu identique à `MaturityRoadmap` CODIR, mais **scroll horizontal** avec colonnes de gauche (Axe + Titre chantier) figées (sticky).
- Zoom / labels timeline **adaptatifs** (mensuel / trimestriel / semestriel selon densité affichée).
- Toute interaction d'édition désactivée (pas de drag, pas d'ajout, pas de suppression, pas d'édition inline).
- Clic sur en-tête chantier OU jalon → **panneau flottant déplaçable** (lib `react-rnd` en REF-7b.6 ; drawer latéral droit en REF-7b.5 comme V1 acceptable).
- Panneau affiche : contexte de l'élément + zone commentaire (Réaction/Demande de décision) + fil de discussion si réponses CODIR.
- Badge 💬 compteur + bordure colorée sur les éléments qui ont au moins un commentaire du reviewer connecté.
- **RACI** : accordéon latéral droit à l'issue de chaque chantier, matrice cochable (chantier × entités/personnes) — pose les fondations de **REF-7b.1** (nouvelle feature côté CODIR) puis version read-only commentable côté reviewer.

**Partie 3 · Proposer un nouveau chantier**
- Formulaire à champs fixes :
  - `Projet transformant père` (select parmi les projets du snapshot).
  - `Axe de rattachement` (select parmi les 4 axes fixes : `PROCESSUS`, `ORGANISATION`, `OUTILS`, `KPI` — déjà en enum `Axe` côté code).
  - `Titre du chantier` (texte court).
  - `Constat` (textarea, obligatoire — ce qui est observé).
  - `Proposition` (textarea, obligatoire — ce qui est suggéré).
  - `Bénéfice anticipé` (textarea, obligatoire — pourquoi ça vaut le coup).
  - **Pas** de période souhaitée : si le reviewer veut décaler une échéance, il commente sur le chantier/jalon en Partie 2.
- Bouton **« Soumettre au CODIR »**.
- Tableau récap **des propositions déjà soumises par ce reviewer** : `Projet · Axe · Titre · Soumis le · Statut · Motivation CODIR (si arbitrée)`.
- Édition / suppression d'une proposition possible **jusqu'à l'arbitrage CODIR**, figée ensuite.

### Modèle unifié feedbacks (transverse aux 3 parties)

Chaque feedback est d'un `kind` parmi : `reaction`, `decision`, `proposition_chantier`.

| Kind | Contenu | Où on le saisit | Action CODIR |
|---|---|---|---|
| `reaction` | `comment` texte libre | Partie 1 (projet), Partie 2 (chantier/jalon) | **Accusé réception** + commentaire optionnel |
| `decision` | 3 champs obligatoires : `constat`, `proposition`, `benefice` | Partie 1 ou Partie 2 via toggle "Demande de décision" | **OK / NOK / Sous condition** + motivation obligatoire |
| `proposition_chantier` | Idem `decision` + `projet_pere_id`, `axe`, `titre_chantier` | Partie 3 | **OK / NOK / Sous condition** + motivation obligatoire |

Toggle dans chaque champ commentaire : **`Réaction` (défaut) / `Demande de décision`**. Les propositions Partie 3 sont implicitement des demandes de décision (pas de toggle visible).

### Workflow "Soumettre ma review"

1. Avant 1ʳᵉ soumission : statut reviewer = `draft`, tous les feedbacks enregistrés en autosave **invisibles du CODIR**.
2. Clic sur « Soumettre ma review » → modal de confirmation avec récap (nb réactions / nb demandes de décision / nb propositions) + rappel de l'implication (notification CODIR).
3. Après confirmation :
   - Statut reviewer → `submitted`, `submitted_at` daté.
   - Email + notif in-app au CODIR owner avec synthèse des feedbacks.
   - Bandeau `Revue soumise le XX/YY à HHhmm` en haut de page.
4. Édition post-soumission :
   - **Réactions** : éditables tant que le CODIR n'a pas accusé réception, figées ensuite.
   - **Demandes de décision + propositions** : figées dès soumission.
5. **Une seule soumission possible** — pas de re-soumission d'une nouvelle vague.
6. Ré-ouverture par le CODIR : en 1 clic (action considérée légitime) → statut reviewer revient à `draft` + audit `review_reopened`.

### Visibilité & notifications

- **Entre reviewers** : toujours privé (scénario 3). Chaque reviewer ne voit que ses propres commentaires et les réponses du CODIR. La synthèse partagée se fait en **présentiel** lors de la 2ᵉ réunion CODIR.
- **Réponses CODIR** : visibles uniquement par l'auteur du commentaire/proposition.
- **Auteurs affichés** : par **trigramme** (ex: `MDU` pour Marie DUpont). Convention configurable par workspace pour reprendre celle de l'entreprise cliente → **REF-7b.0**.
- **Notifications** :
  - Reviewer invité → email magic link (REF-7b.3).
  - CODIR owner au clic "Soumettre ma review" du reviewer → email + notif in-app.
  - Reviewer, **une seule fois**, quand le CODIR a traité **tous** ses feedbacks sur cette revue (0 feedback `pending` restant) → email + notif in-app `vos contributions ont été arbitrées`.

### Modèle de données cible (REF-7b.2)

```sql
-- Table reviewers (une ligne par reviewer invité sur un snapshot)
create table public.roadmap_snapshot_reviewers (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid not null references public.roadmap_snapshots(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'draft', 'submitted', 'closed')),
  invited_at timestamptz not null default now(),
  submitted_at timestamptz null,
  closed_at timestamptz null,
  invited_by uuid null references public.users(id) on delete set null,
  invited_by_email text null,
  unique (snapshot_id, user_id)
);

-- Colonne deadline sur le snapshot
alter table public.roadmap_snapshots add column if not exists review_deadline timestamptz null;

-- Table feedbacks unifiée
create table public.roadmap_review_feedbacks (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid not null references public.roadmap_snapshots(id) on delete cascade,
  reviewer_user_id uuid not null references public.users(id) on delete cascade,
  kind text not null check (kind in ('reaction', 'decision', 'proposition_chantier')),
  target_type text not null check (target_type in ('projet', 'chantier', 'jalon', 'proposition')),
  target_id uuid null,                       -- nullable si kind='proposition_chantier'
  comment text null,                          -- si kind='reaction'
  constat text null,                          -- si kind='decision' ou 'proposition_chantier'
  proposition text null,
  benefice text null,
  projet_pere_id uuid null,                   -- si kind='proposition_chantier'
  axe text null check (axe in ('PROCESSUS','ORGANISATION','OUTILS','KPI')),
  titre_chantier text null,
  codir_status text null check (codir_status in ('pending','noted','ok','nok','sous_condition')),
  codir_motivation text null,
  codir_user_id uuid null references public.users(id) on delete set null,
  codir_at timestamptz null,
  parent_id uuid null references public.roadmap_review_feedbacks(id) on delete cascade,  -- threads
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Table RACI chantiers (REF-7b.1)
create table public.raci_chantiers (
  id uuid primary key default gen_random_uuid(),
  chantier_id uuid not null references public.chantiers(id) on delete cascade,
  direction_id uuid null references public.directions(id) on delete cascade,
  user_id uuid null references public.users(id) on delete cascade,
  role text not null check (role in ('R','A','C','I')),
  created_at timestamptz not null default now(),
  check ((direction_id is not null) or (user_id is not null)),
  unique (chantier_id, direction_id, role),
  unique (chantier_id, user_id, role)
);
```

### Fondations utilisateur (REF-7b.0)

Indispensable avant tout le reste :

```sql
alter table public.users add column if not exists direction_id uuid null references public.directions(id) on delete set null;
alter table public.users add column if not exists trigram text null;
alter table public.workspaces add column if not exists trigram_convention text not null default 'prenom_nom_3';
```

- `users.direction_id` : rattachement opérationnel du contributeur à une direction. Hérite **automatiquement** de la direction du CODIR qui l'invite (règle métier). Si l'inviteur est Super Admin ou Consultant, la direction doit être précisée (drawer invite : sélecteur ; CSV batch : colonne `direction`).
- `users.trigram` : stocké en dur (3 chars). Dérivé à l'invitation selon `workspaces.trigram_convention` si non fourni, éditable ensuite.
- `workspaces.trigram_convention` : valeurs `prenom_nom_3` (ex: `MAD` = **MA**rie **D**upont), `nom_prenom_3` (ex: `DUM` = **DU**pont **M**arie), `custom` (édition manuelle obligatoire sur chaque user).

### Hors scope REF-7b.0 → REF-7b.7

- **REF-7c** est **intégré** à REF-7b.5 (propositions de chantier Partie 3 couvertes par le modèle unifié feedbacks).
- **REF-7d** (écran d'arbitrage CODIR) reste un item distinct : il traite tous les `target_type` et tous les `kind` (pas seulement les propositions). Actions : Accusé réception sur réactions, OK/NOK/Sous condition + motivation obligatoire sur demandes de décision et propositions. Émet la notif cumulative reviewer quand 0 feedback pending restant.
- **REF-7e** (relances automatiques) : workflow email avant/après deadline. Pas bloquant pour le cycle de base.
- **REF-51b** (extension CSV) : nécessaire à REF-7b.0 pour permettre au Super Admin / Consultant d'importer des reviewers en batch avec leur direction et leur trigramme.

### Ordre d'exécution recommandé

```
REF-7b.0 (users.direction_id + trigrammes + héritage invite + CSV)
    ↓
REF-7b.1 (RACI chantier : matrice cochable dans MaturityRoadmap)
    ↓
REF-7b.2 (schéma revue : tables reviewers + feedbacks + deadline)
    ↓
REF-7b.3 (modal "Ouvrir la revue" côté CODIR)
    ↓
REF-7b.4 (routing conditionnel reviewer)
    ↓
REF-7b.5 (ReviewerPage V1 avec drawer latéral droit, pas encore flottant)
    ↓
REF-7d (écran arbitrage CODIR)  ← peut démarrer en parallèle après 7b.2
    ↓
REF-7b.6 (migration vers panneau flottant déplaçable react-rnd)
REF-7b.7 (récap arbitrages côté reviewer + notif cumulative)
REF-7e (relances automatiques) — itération ultérieure
```

Chaque lot est livré en commit atomique, avec recette utilisateur dédiée avant de passer au suivant (respect strict de `docs/refactor_rules.md` §2).

---

## EPIC 12 — Design Premium (audit agence) 🟠 NOUVEAU

| REF | Titre | Priorité | Statut |
|---|-------|----------|--------|
| 52 | Monochromatiser l'échelle des scores (caramel clair→intense) | 🟠 | ⬜ |
| 53 | Unifier l'identité clair/sombre (bordeaux constant) | 🟠 | ⬜ |
| 54 | Ajouter grain et ombres longues (effet artisanat) | 🟡 | ⬜ |
| 55 | Augmenter les white spaces et paddings | 🟡 | ⬜ |
| 56 | Micro-identité visuelle par module (bord gauche coloré) | 🟡 | ⬜ |
| 57 | Retravailler tableaux style "premium" (dividers fantômes) | 🟡 | ⬜ |
| 58 | Harmoniser header (pas de bleu/rouge vif hors palette) | 🟠 | ⬜ |

---

## EPIC 4 — Plan d'Action d'Équipe (PAE)

| REF | Titre | Priorité | Statut |
|---|-------|----------|--------|
| 10 | Structure PAE par manager | 🟠 | ⬜ |
| 11 | Actions concrètes / Ressources / Abandons | 🟠 | ⬜ |
| 12 | Validation N+1 | 🟠 | ⬜ |
| 13 | Lien PAE ↔ Jalon | 🟠 | ⬜ |

---

## EPIC 5 — Plan de Charge

| REF | Titre | Priorité | Statut |
|---|-------|----------|--------|
| 14 | Grille mensuelle RUN/BUILD/TRANSFO | 🟠 | ⬜ |
| 15 | Alerte surcharge | 🟠 | ⬜ |
| 16 | Vue synthèse par direction | 🟡 | ⬜ |

---

## EPIC 6 — Module SENS

| REF | Titre | Priorité | Statut |
|---|-------|----------|--------|
| 17 | Diagnostic des 5 syndromes | 🟡 | ⬜ |
| 18 | Matrice d'implication | 🟡 | ⬜ |
| 19 | Kit NUI Manager | 🟡 | ⬜ |
| 20 | Modèle de l'aventure | 🟡 | ⬜ |
| 21 | Plan de communication | 🟡 | ⬜ |

---

## EPIC 7 — La Fabrique (Séminaires & Ateliers)

| REF | Titre | Priorité | Statut |
|---|-------|----------|--------|
| 22 | Banque de séquences d'animation | 🟡 | ⬜ |
| 23 | Architecte de formats sur mesure | 🟡 | ⬜ |

---

## EPIC 8 — Gestion Managériale & Animation Terrain

| REF | Titre | Priorité | Statut |
|---|-------|----------|--------|
| 24 | Assistant situationnel (Spirale/Courbe du changement) | 🟡 | ⬜ |
| 25 | Frise chronologique faits marquants + PASED | 🟡 | ⬜ |
| 26 | Réseau Change Agents | 🟡 | ⬜ |
| 27 | Guide de suivi managérial | 🟡 | ⬜ |
| 28 | Traitement des objections + Livret besoins | 🟡 | ⬜ |
| 29 | Croix de l'implication | 🟡 | ⬜ |

---

## EPIC 9 — Pilotage Projet

| REF | Titre | Priorité | Statut |
|---|-------|----------|--------|
| 30 | Cartographie maturité au changement (niveaux 1→5) | 🟡 | ⬜ |
| 31 | Analyse d'impact OMOC | 🟡 | ⬜ |
| 32 | Quadrillage du terrain (cercles concentriques) | 🟡 | ⬜ |

---

## EPIC 13 — Exports

| REF | Titre | Priorité | Statut |
|---|-------|----------|--------|
| 36 | Export PDF — Vue Synthèse Direction | 🟠 | 🚧 |
| 37 | Export PDF — PAE Manager | 🟡 | ⬜ |

*Note (EPIC 13 · REF-36)* : v1 **impression navigateur** sur la Vue décideur (`window.print` + styles `dg-print`). Export PDF dédié (génération fichier, branding contrôlé, hors navigateur) encore à traiter si besoin CODIR. Suivi GitHub : **GH-14**.

---

## EPIC 14 — Landing Pages SEO (Next.js) 🟠 PARTIEL

Objectif : créer des landing pages publiques SEO pour les workspaces avec ISR, cache CDN Vercel et coût infra minimal ; étendre le site Next.js avec une **homepage commerciale** et une **preuve visuelle** (trajectoire / roadmap).

Les tâches **59–72** (fondations Next.js + landing workspace SEO) sont **terminées**. Les tâches **73–75** portent sur la **conversion** et le **polish visuel** de la homepage publique.

| REF | Titre | Priorité | Statut | GH |
|---|-------|----------|--------|----|
| 59 | Setup Next.js App Router (`web/`) séparé de Vite | 🔴 | ✅ | — |
| 60 | Configuration base (colonnes `is_public`, `archived`, `current_step`, `updated_at`) | 🔴 | ✅ | — |
| 61 | Page workspace dynamique `/workspace/[id]` avec ISR (`revalidate=3600`) | 🔴 | ✅ | — |
| 62 | Metadata SEO complète (title, description, OG, Twitter, canonical) | 🔴 | ✅ | — |
| 63 | JSON-LD structured data (Organization schema) | 🟠 | ✅ | — |
| 64 | Sitemap dynamique (`is_public=true`, `archived=false`) | 🔴 | ✅ | — |
| 65 | Robots.txt avec URL sitemap dynamique | 🔴 | ✅ | — |
| 66 | Clients Supabase anon + admin server-only | 🔴 | ✅ | — |
| 67 | React cache pour mutualiser les fetchs par requête | 🟠 | ✅ | — |
| 68 | Variable d’environnement `NEXT_PUBLIC_SITE_URL` (fallback localhost) | 🟠 | ✅ | — |
| 69 | Standardisation Supabase `SUPABASE_SERVICE_ROLE_KEY` | 🟠 | ✅ | — |
| 70 | Tests 404 (workspace inexistant + privé) | 🔴 | ✅ | — |
| 71 | Tests sitemap dynamique (avec/sans workspaces publics) | 🔴 | ✅ | — |
| 72 | Documentation déploiement (`web/README.md`) | 🟡 | ✅ | — |
| 73 | Composant trajectoire publique (`LandingRoadmapTrajectoire` — route SVG + jalons + étapes) | 🟠 | ✅ | — |
| 74 | ~~Images hero responsive (desktop/tablet/mobile)~~ — annulée (pivot produit RDV-only, 21 avril 2026) | 🟡 | ❌ | Revert commit — hero revenu au bloc éditorial texte |
| 75 | ~~CTA vers dashboard (deep link si auth, modal sinon)~~ — annulée (pivot produit RDV-only, 21 avril 2026) | 🟠 | ❌ | Revert commit — CTA unique = mailto RDV ; `LandingSmartCta.tsx` supprimé |

*Note (EPIC 14 · REF-73)* : le nom de composant retenu en code est `LandingRoadmapTrajectoire` (bloc « Une transformation visible » + assets `/public/images/SVG roadmap assets/`). Ancien libellé backlog : `LandingTimeline`.

---

## EPIC 15 — Migration dashboard `/src` (Vite) → `/web` (Next.js) 🟠 PROPOSÉE

Objectif : unifier progressivement l'application sur **Next.js 16 App Router** pour réduire la surface de maintenance (1 stack, 1 design system, 1 projet Vercel cible), **sans freeze fonctionnel** et sans régression visible pour l'utilisateur.

Principe : chaque vague migre un périmètre isolé, **conserve la parité comportementale** (cf. [`docs/refactor_rules.md`](refactor_rules.md) §2) et doit être validée en production avant la vague suivante.

Contexte de déclenchement : incident du 21 avril 2026 — la PR #28 a mergé la branche `feat/nextjs-landing-pages` dans `main` avant que tous les commits landing ne soient poussés distant, provoquant un état prod Vercel qui affichait le template `create-next-app` par défaut. Résolu par un merge complémentaire (commit `e62a98a`). Point d'attention durable intégré à la règle Cursor consolidée : branche de travail par défaut = `main`.

| REF | Titre | Priorité | Statut |
|---|-------|----------|--------|
| 76 | **Vague 0 · Fondations partagées** — extraire les tokens CSS (`themes.css`, `design-system.css`) en dossier partagé ou les synchroniser explicitement entre `/src` et `/web` ; aligner `eslint` / `tsconfig` ; supprimer le couplage `turbopack.root = ..` dans [web/next.config.ts](web/next.config.ts) | 🔴 | ⬜ |
| 77 | **Vague 1 · Auth SSR Supabase** — introduire `@supabase/ssr` dans `/web` (cookies, middleware de session), migrer [src/pages/Login.tsx](src/pages/Login.tsx) et [src/pages/AuthCallback.tsx](src/pages/AuthCallback.tsx) vers `web/app/(auth)/login` et `web/app/auth/callback` | 🔴 | ⬜ |
| 78 | **Vague 2 · Routage et layout applicatif** — créer `web/app/(app)/layout.tsx` (navbar dashboard, thème, garde d'auth), brancher `acces-membres` et `bientot-disponible` déjà présents, router `/workspace/[id]/home` (landing authentifiée distincte de la landing SEO publique `/workspace/[id]`) | 🟠 | ⬜ |
| 79 | **Vague 3 · Écrans simples** — migrer [src/pages/Settings.tsx](src/pages/Settings.tsx), [src/ProfileSheet.tsx](src/ProfileSheet.tsx), [src/CompanySheet.tsx](src/CompanySheet.tsx) (écrans à faible logique temps-réel) | 🟠 | ⬜ |
| 80 | **Vague 4 · Vue décideur** — migrer [src/pages/DashboardDG.tsx](src/pages/DashboardDG.tsx) + [src/DgProjectAccordion.tsx](src/DgProjectAccordion.tsx) + frises partagées ; garder la parité impression navigateur (EPIC 13 · REF-36 v1) | 🟠 | ⬜ |
| 81 | **Vague 5 · Selector projets** — migrer [src/ProjectSelector.tsx](src/ProjectSelector.tsx) (CRUD + scoring, dépend de `src/lib/api/projets.ts`) | 🟠 | ⬜ |
| 82 | **Vague 6 · Maturity Roadmap (cœur métier)** — migrer [src/MaturityRoadmap.tsx](src/MaturityRoadmap.tsx), [src/RoadmapTimelineGrid.tsx](src/RoadmapTimelineGrid.tsx), [src/ChantierLineModal.tsx](src/ChantierLineModal.tsx), [src/JalonQuickAddModal.tsx](src/JalonQuickAddModal.tsx), [src/GanttRangeMarkers.tsx](src/GanttRangeMarkers.tsx) ; drag & drop + `ordre_sequentiel` + KPI miroir à valider en Server/Client Components | 🔴 | ⬜ |
| 83 | **Vague 7 · API layer** — rapatrier `src/lib/api/*` sous `web/lib/api/*`, maintenir les signatures ; `src/lib/api.ts` devient un reexport deprecated. Tests Vitest migrés vers la config Next.js | 🟠 | ⬜ |
| 84 | **Vague 8 · Modales et flows secondaires** — [src/OnboardingFlow.tsx](src/OnboardingFlow.tsx), [src/WorkspaceCreation.tsx](src/WorkspaceCreation.tsx), [src/MemberOnboarding.tsx](src/MemberOnboarding.tsx), [src/CreateDirectionDialog.tsx](src/CreateDirectionDialog.tsx) | 🟡 | ⬜ |
| 85 | **Vague 9 · Bascule routage prod** — une fois toutes les routes couvertes côté Next.js, basculer le domaine principal (`forge-du-changement.vercel.app`) sur le projet Next.js ; l'ancien projet Vite reste en miroir temporaire | 🔴 | ⬜ |
| 86 | **Vague 10 · Décommissionnement `/src`** — supprimer `/src`, [vite.config.ts](../vite.config.ts), [tsconfig.app.json](../tsconfig.app.json), `eslint.config.js` Vite, [vitest.config.ts](../vitest.config.ts), [index.html](../index.html) racine ; archiver le `package.json` Vite ; un seul projet Next.js reste | 🟠 | ⬜ |

### Critères de bascule (DoD de chaque vague)

1. **Parité fonctionnelle** validée (même scénario utilisateur, mêmes données Supabase, mêmes messages d'erreur).
2. **Aucun hardcoding** couleur / typo / espacement / radius introduit (cf. [`visual-coherence-theme-rules.md`](visual-coherence-theme-rules.md)).
3. **RLS et rôles** respectés (cf. [`proposition-regles-matrice-permissions.md`](proposition-regles-matrice-permissions.md)).
4. Tests **Vitest / unitaires** correspondants passés.
5. Commit `feat(migration)` poussé sur `main`, **déploiement Vercel vert** sur les deux projets tant qu'ils coexistent.
6. Vague suivante **seulement après retour utilisateur réel** sur la vague précédente (respect strict de `refactor_rules.md` §2 — aucune régression même subtile).

### Risques majeurs à anticiper

- **Auth SSR** : le dashboard actuel est client-only (`persistSession` Supabase) ; basculer vers cookies SSR change tout le flux d'hydratation. REF-77 est le jalon bloquant de toute la migration.
- **Design tokens** : `themes.css` (13 k) + `design-system.css` (16 k) sont volumineux. Arbitrer en REF-76 entre duplication synchronisée et package partagé.
- **Drag & drop roadmap** : [src/RoadmapTimelineGrid.tsx](../src/RoadmapTimelineGrid.tsx) et [src/MaturityRoadmap.tsx](../src/MaturityRoadmap.tsx) utilisent des hooks bas-niveau ; migration à préparer avec soin pour HMR Turbopack (voir [web/AGENTS.md](../web/AGENTS.md) — Next.js 16 a des breaking changes).
- **Tests** : ré-outillage Vitest côté Next.js (ou Jest). Prévu en REF-83.
- **Deux déploiements Vercel** : tant que la migration n'est pas finie, maintenir `forge-du-changement.vercel.app` (Vite) et `forge-du-changement-kgyg-xi.vercel.app` (Next.js). Documenter qui pointe où dans le README racine.

### Impact sur la stack technique du repo

Tant que l'EPIC 15 n'est pas finie, la section **Stack technique** plus bas reste valable (double projet). À la fin de REF-86, elle devra être simplifiée (Next.js seul).

---

## Stack technique

- **Frontend** : React + TypeScript (Vite) + Next.js App Router (`web/`) pour landing SEO
- **Backend** : Supabase (PostgreSQL + Storage + RLS + Auth)
- **Déploiement** : Vercel (2 projets : dashboard Vite + landing Next.js)
- **Repo** : yoganfr/forge-du-changement
- **URL prod** : https://forge-du-changement.vercel.app

## Tables Supabase (métier)

- `workspaces` — espaces entreprise
- `users` — profils (avec `is_platform_superadmin`, `role: admin/consultant/codir/pilote/contributeur`)
- `invitations` — invitations en attente
- `workspace_consultants` — rattachement consultant ↔ workspace (owner/collaborator)
- `audit_events` — traçabilité actions sensibles
- `directions` — directions/périmètres
- `projets` — projets RUN/BUILD avec scoring (`dg_validated_transfo`, etc.)
- `chantiers` — lignes thématiques sous projet BUILD ; colonne `axe` (voir `docs/supabase-chantiers-axe.sql`)
- `jalons` — jalons roadmap (dates cible, statut, facette, `jalon_dependance_id`, `kpi_source_jalon_id` — voir `docs/supabase-jalons-kpi-source.sql`)
- `raci_jalons` — macro RACI par jalon (pilote / impliqué / informé par direction)
- `raci_projets` — relations RACI projet (héritage / autres usages)
- `plan_de_charge` — charges mensuelles

## Fonctions SQL helper

- `jwt_email()` — email du JWT courant
- `current_app_user_id()` — UUID user métier courant
- `is_platform_superadmin()` — check super admin plateforme
- `current_member_workspace_id()` — workspace du membre courant
- `is_workspace_org_admin(p_workspace_id)` — admin du workspace ?
- `has_workspace_consultant_access(p_workspace_id)` — consultant accès ?
- `is_workspace_consultant_owner(p_workspace_id)` — owner du dossier ?

## Composants principaux

- `App.tsx` — dashboard, navigation, garde d'auth, entrées La Fabrique / Vue décideur / roadmap
- `OnboardingFlow.tsx` — création espace entreprise + invitations
- `ProjectSelector.tsx` — outil saisie/scoring projets (Supabase)
- `CompanySheet.tsx` — fiche entreprise + invitations unitaires/CSV
- `ProfileSheet.tsx` — drawer profil utilisateur
- `MemberOnboarding.tsx` — espace membre
- `pages/DashboardDG.tsx` — synthèse décideur (KPI, validation BUILD, top 5, impression, historique)
- `pages/Login.tsx` — écran connexion premium
- `pages/AuthCallback.tsx` — retour OAuth/Magic Link
- `MaturityRoadmap.tsx` — roadmap maturité (chantiers, jalons, RACI, dépendances)
- `RoadmapTimelineGrid.tsx` — grille 4 axes × échéances (drag chantier entre axes, drag jalon sur la ligne pour ajuster l’échéance)
- `DgProjectAccordion.tsx` — détail projet dans la Vue décideur
- `ChantierLineModal.tsx` / `JalonQuickAddModal.tsx` — édition chantiers et jalons
- `src/lib/api.ts` — façade CRUD + réexport roadmap
- `src/lib/api/roadmap.ts` — chantiers, jalons, RACI jalons
- `src/lib/auth.ts` — Auth helpers + rate limit client
- `src/lib/supabase.ts` — client Supabase (vars d'env)
- `src/lib/types.ts` — types TypeScript

**Landing Next.js (`web/`) — homepage publique et SEO**

- `web/app/page.tsx` — homepage commerciale (sections éditoriales, CTA mailto, bloc trajectoire)
- `web/components/LandingNav.tsx` — navigation (logo, RDV `#rdv`, lien membre, menu mobile, thème)
- `web/components/LandingRoadmapTrajectoire.tsx` — trajectoire route + jalons + cartes d’étapes
- `web/components/ThemeToggle.tsx` — bascule clair / sombre (landing)
- `web/public/fonts/` — Satoshi + Clash Display (`fonts.css`)
- `web/app/acces-membres/page.tsx` / `web/app/bientot-disponible/page.tsx` — pages de transition vers le parcours membre (à connecter au dashboard)

## Documentation projet

- `docs/# Règles métier — Maturity Roadmap.md` — référence métier module roadmap
- `docs/maturity-roadmap-synthese-evolutions-produit.md` — pistes versionnement, param workspace, etc.
- `docs/supabase-chantiers-axe.sql` — migration `chantiers.axe` (typage par axe de création)
- `docs/proposition-regles-matrice-permissions.md` — règles en langage métier
- `docs/history/README.md` — index des historiques de sessions importantes
- `docs/security-quick-wins.md` — MFA, rate limits, RLS, audit
- `docs/supabase-evolution-permissions-alignement.sql` — script SQL principal
- `docs/supabase-verify-permissions-setup.sql` — vérifs post-migration
- `docs/supabase-verify-rls-all-public-tables.sql` — audit RLS global
- `docs/supabase-storage-assets-hardening.sql` — durcissement Storage

## Design system

- Couleur accent : `#8E3B46` (bordeaux / caramel-candy-600)
- Palettes : `caramel-candy` (chaud bordeaux), `orecchiette` (doré paille), `muted-yellow-green` (validation)
- Aliases compat : `--dark-red-500`, `--coral-400`, `--straw-400`, `--steel-blue-400`
- Typo titres : Playfair Display
- Typo corps : Inter
- Thème : dark/light (toggle en haut à droite)
- Variables CSS : `themes.css` + `design-system.css`

---

## Trajectoire suggérée

La trajectoire de référence est désormais la section **Priorisation produit — Maintenant / Après / Plus tard** ci-dessous.

- **Maintenant** : finaliser le dialogue structuré roadmap (EPIC 3 · REF-7), puis fermer le gap décideur transverse (EPIC 2 · REF-3).
- **Après** : **poser les fondations de l'EPIC 15** (REF-76 tokens partagés + REF-77 Auth SSR) avant tout, renforcer gouvernance/sécurité (EPIC 11), arbitrer l'export PDF autonome (EPIC 13), puis lancer les évolutions roadmap avancées (versionnement, fenêtre glissante, paramètres).
- **Plus tard** : poursuivre la migration EPIC 15 par vagues (REF-78 → REF-86) en parallèle des modules d'extension (EPIC 4, 5, 6, 7, 8, 9) qui seront idéalement construits directement dans `/web`, et l'extension design premium complète.

---

## Priorisation produit — Maintenant / Après / Plus tard

### Maintenant

1. EPIC 3 · **REF-7a → REF-7d** — figer une roadmap V1, ouvrir un cycle reviewers, collecter des propositions typées, puis arbitrer/clôturer.
2. EPIC 2 · **REF-3** — livrer le Gantt macro consolidé pour fermer le gap décideur transverse.
3. EPIC 11 · **REF-50 / REF-51** — enclencher gouvernance/sécurité opérationnelle (MFA super-admin + journal import CSV) si fenêtre disponible avant REF-76/77.

### Après

4. EPIC 15 · **REF-76 / REF-77** — fondations partagées + Auth SSR Supabase dans `/web` : **prérequis bloquant** avant toute grosse feature dashboard dans Next.js (migration progressive `/src` → `/web`).
5. EPIC 11 · **REF-50 / REF-51** — MFA super-admin + journal des imports CSV (gouvernance/sécurité opérationnelle).
6. EPIC 13 · **REF-36** — arbitrage explicite : finaliser export PDF autonome uniquement si besoin client avéré au-delà de l'impression navigateur.
7. EPIC 3 (évolutions avancées) — lancer les phases de `maturity-roadmap-synthese-evolutions-produit.md` : paramètres d'échéances workspace, fenêtre glissante, versionnement major/minor.

### Plus tard

8. EPIC 15 · **REF-78 à REF-86** — suite migration `/src` → `/web` par vagues (routage applicatif, écrans simples, Vue décideur, Selector, Maturity Roadmap, API layer, flows secondaires, bascule prod, décommissionnement Vite).
9. EPIC 4 · **REF-10–13** — PAE complet (structure, actions, validation N+1, lien jalons). Livrer de préférence **directement dans `/web`** si l'EPIC 15 est avancée.
10. EPIC 5 / 6 / 7 / 8 / 9 — modules complémentaires (plan de charge, SENS, Fabrique, management terrain, pilotage projet). Idem : construire dans `/web` si possible.
11. EPIC 12 (complet) — extension du design premium au-delà des quick wins ciblés.

---

## Plan d'implémentation détaillé (tâches prêtes dev)

### Sprint 1 — CODIR-ready (2 semaines)

*État code (19/04/2026)* : **T1–T3 et T4** sont largement couverts par `DashboardDG` + agrégations locales (KPI, tableaux validation BUILD, top 5). **T5** (Gantt macro consolidé) et **T7** (PDF autonome) restent les gros morceaux ouverts ; **T6** (design) inchangé.

#### T1 — Cadrage KPI DG consolidé (GH-1 · EPIC 2 · REF-1)
- **Objectif** : figer les indicateurs de la Vue DG pour éviter les allers-retours de définition en cours de dev.
- **Scope** :
  - définir les KPI: volume RUN/BUILD, score moyen BUILD, nb directions actives, nb projets en alerte.
  - définir filtres: workspace, période.
  - définir règles de calcul (source tables, arrondis, valeurs nulles).
- **Critères d'acceptation** :
  - doc validée (1 page max) avec formule de chaque KPI.
  - liste des endpoints/queries nécessaires validée.
- **Dépendances** : aucune.
- **Estimation** : 0.5 jour.

#### T2 — Couche agrégations backend/API Vue DG (GH-1 · EPIC 2 · REF-1)
- **Objectif** : fournir des données consolidées fiables et rapides pour le dashboard DG.
- **Scope** :
  - créer fonctions d'agrégation dans `src/lib/api.ts` (ou RPC Supabase si plus pertinent).
  - ajouter types TS dédiés (`DashboardDgMetrics`, `DirectionRankingItem`, etc.).
  - gérer pagination/limite si dataset volumineux.
- **Critères d'acceptation** :
  - temps de réponse cible < 500ms sur dataset nominal.
  - fallback propre si aucune donnée.
  - requêtes compatibles RLS actuelle.
- **Dépendances** : T1.
- **Estimation** : 1.5 jours.

#### T3 — UI Dashboard consolidé DG (GH-1 · EPIC 2 · REF-1)
- **Objectif** : rendre visible la synthèse DG multi-directions dans l'app.
- **Scope** :
  - nouvelle vue/module dans `App.tsx` + composant dédié.
  - cartes KPI + tableau synthèse directions.
  - états loading/empty/error.
- **Critères d'acceptation** :
  - navigation fonctionnelle depuis le menu.
  - rendu correct desktop (et lisible tablette).
  - aucun blocage si données partielles.
- **Dépendances** : T2.
- **Estimation** : 2 jours.

#### T4 — Classement inter-directions top 5 BUILD (GH-2 · EPIC 2 · REF-2)
- **Objectif** : mettre en évidence les directions les plus avancées en BUILD.
- **Scope** :
  - calcul top 5 côté data.
  - composant UI classement + indicateur variation (optionnel v1).
  - tri stable en cas d'égalité.
- **Critères d'acceptation** :
  - top 5 exact et déterministe.
  - comportement défini si < 5 directions.
- **Dépendances** : T2, T3.
- **Estimation** : 1 jour.

#### T5 — Gantt macro consolidé (GH-3 · EPIC 2 · REF-3)
- **Objectif** : donner une lecture transverse des jalons/projets.
- **Scope** :
  - vue macro en lecture seule (v1).
  - regroupement par direction.
  - fenêtres temporelles (M-1, trimestre, semestre).
- **Critères d'acceptation** :
  - affichage stable sur datasets volumineux.
  - lisibilité des jalons critiques.
- **Dépendances** : T2, T3.
- **Estimation** : 2 jours.

#### T6 — Design premium quick wins (EPIC 12 · REF-52, REF-53, REF-58 — GH-20)
- **Objectif** : élever la perception premium sans refonte lourde.
- **Scope** :
  - score monochromatique caramel.
  - identité clair/sombre cohérente autour du bordeaux.
  - harmonisation header (suppression bleus/rouges non palette).
- **Critères d'acceptation** :
  - conformité visuelle validée sur 3 écrans clés (Login, Dashboard, CompanySheet).
  - aucun contraste critique régressif.
- **Dépendances** : T3.
- **Estimation** : 1 jour.

#### T7 — Export PDF Vue Synthèse Direction (GH-14 · EPIC 13 · REF-36)
- **Objectif** : générer un livrable partageable pour CODIR/clients.
- **Scope** :
  - aujourd’hui : **impression navigateur** sur la Vue DG (bouton + styles dédiés) — acceptable en v0.
  - cible : export PDF d'une vue synthèse (KPI + tableau + date + workspace), génération fichier si besoin.
  - gestion des cas sans données.
  - cohérence branding.
- **Critères d'acceptation** :
  - PDF ou PDF équivalent imprimable en temps raisonnable (< 5 s côté utilisateur pour une génération dédiée si implémentée).
  - rendu lisible A4 (portrait ou paysage défini).
  - contenu fidèle à la vue écran.
- **Dépendances** : T3, T4, T6.
- **Estimation** : 1.5 jours.

#### T8 — Recette, perf et mise en prod Sprint 1
- **Objectif** : sécuriser la mise en production.
- **Scope** :
  - tests manuels multi-rôles (consultant/admin/codir).
  - vérification Vercel (build/runtime logs).
  - smoke tests navigation + auth + workspace switch.
- **Critères d'acceptation** :
  - aucune erreur bloquante.
  - pas de régression majeure sur modules existants.
  - checklist de déploiement validée.
- **Dépendances** : T1 à T7.
- **Estimation** : 1 jour.

### Sprint 2 — Cœur métier roadmap (EPIC 3)

*État 20/04/2026* : **T9 à T11, T13 et T14** sont couverts par l’app (axes, CRUD jalons, RACI, grille, dépendance). Complément **grille matrice** : drag chantier entre axes + drag jalon sur la ligne (échéance), sans reload page. **T12** (réactions / réponses) et **T15** (recette ciblée + perf) restent pertinents ; ajouter au besoin versionnement / param workspace depuis `docs/maturity-roadmap-synthese-evolutions-produit.md`.

#### T9 — Structure 4 axes BUILD (GH-4 · EPIC 3 · REF-4)
- **Estimation** : 1 jour.

#### T10 — CRUD jalons (GH-5 · EPIC 3 · REF-5)
- **Estimation** : 1.5 jours.

#### T11 — Macro RACI par jalon (GH-6 · EPIC 3 · REF-6)
- **Estimation** : 1 jour.

#### T12 — Dialogue structuré roadmap versionnée (GH-7 · EPIC 3 · REF-7a→7d)
- **Scope** :
  - figer une version roadmap V1 (snapshot),
  - ouvrir une fenêtre de review sur périmètre invité,
  - collecter des propositions structurées (ajout/suppression/évolution chantier/jalon, justification obligatoire),
  - arbitrer (OK/NOK/conditionnel) puis clôturer le cycle.
- **Estimation** : 6 à 8 jours (découpage en 4 sous-vagues).

#### T13 — Vue matrice complète (GH-8 · EPIC 3 · REF-8)
- **Estimation** : 1.5 jours.

#### T14 — Dépendances inter-jalons (GH-9 · EPIC 3 · REF-9)
- **Estimation** : 1 jour.

#### T15 — Recette EPIC 3 + optimisation perf
- **Estimation** : 1 jour.

### Sprint 3 — Plan d'Action d'Équipe (EPIC 4)

#### T16 — Structure PAE manager (GH-10 · EPIC 4 · REF-10)
- **Estimation** : 1 jour.

#### T17 — Actions / Ressources / Abandons (EPIC 4 · REF-11 — lot **GH-21** ; ne pas confondre avec **GH-11**)
- **Estimation** : 1 jour.

#### T18 — Validation N+1 (EPIC 4 · REF-12 — lot **GH-21** ; ne pas confondre avec **GH-12** auth)
- **Estimation** : 1 jour.

#### T19 — Lien PAE ↔ jalon (EPIC 4 · REF-13 — lot **GH-21** ; ne pas confondre avec **GH-13** Vercel)
- **Estimation** : 1 jour.

#### T20 — Recette PAE + préparation export PAE (GH-27 · EPIC 13 · REF-37)
- **Estimation** : 1 jour.

### Récap dépendances critiques
- T2 dépend de T1
- T3 dépend de T2
- T4 dépend de T2/T3
- T5 dépend de T2/T3
- T6 dépend de T3
- T7 dépend de T3/T4/T6
- T8 dépend de T1→T7

### Capacity planning (indicatif)
- **Sprint 1** : ~10.5 jours
- **Sprint 2** : ~8 jours
- **Sprint 3** : ~5 jours
- **Total** : ~23.5 jours ouvrés (hors aléas)

---

## Pilotage hebdo (ordre d'exécution recommandé)

### Rôles projet (proposition)
- **Lead Produit / Métier** : arbitrage KPI, validation UX métier, priorisation
- **Lead Tech** : architecture, qualité code, intégration finale
- **Dev Front** : UI/UX, composants, états de chargement/erreur
- **Dev Data/Supabase** : agrégations, requêtes, RLS, perf SQL
- **QA** : scénarios de recette, non-régression, validation pré-prod

### Semaine 1 — Cadrage + fondations data (Sprint 1)

#### Jour 1 (lundi)
- T1 cadrage KPI DG consolidé (atelier 60-90 min)
- sortie: mini-spec validée + définition done de T2/T3
- **Jalon** : go/no-go scope Sprint 1 figé

#### Jour 2 (mardi)
- démarrage T2 (agrégations backend/API)
- création types TS et contrats de données
- **Contrôle** : revue technique rapide (15 min) sur modèle de données

#### Jour 3 (mercredi)
- fin T2 + tests unitaires/validation manuelle API
- début T3 (squelette UI Dashboard DG)
- **Jalon** : démo interne “data branchée à la vue”

#### Jour 4 (jeudi)
- continuation T3 (cards KPI, tableau synthèse, états loading/error)
- démarrage T4 (top 5 BUILD)
- **Contrôle** : revue UX métier des libellés et priorités visuelles

#### Jour 5 (vendredi)
- fin T4
- initialisation T5 (Gantt macro v1 read-only)
- **Jalon hebdo** : démo CODIR interne (v0 Dashboard + Top5 + Gantt embryon)

### Semaine 2 — Finalisation Sprint 1 + mise en prod

#### Jour 6 (lundi)
- finalisation T5 (Gantt macro consolidé)
- démarrage T6 (polish design REF-52 / REF-53 / REF-58)
- **Contrôle** : point accessibilité contraste + cohérence palette

#### Jour 7 (mardi)
- fin T6
- démarrage T7 (export PDF vue synthèse)
- **Jalon** : première génération PDF exploitable

#### Jour 8 (mercredi)
- finalisation T7 (robustesse “pas de données”, branding)
- début T8 (recette multi-rôles)
- **Contrôle** : test perf et logs Vercel

#### Jour 9 (jeudi)
- continuation T8: correction bugs et régressions
- gel fonctionnel sprint (feature freeze)
- **Jalon** : décision release candidate

#### Jour 10 (vendredi)
- T8 final: smoke tests, validation métier finale, déploiement prod
- rétrospective courte + préparation Sprint 2
- **Jalon** : Sprint 1 livré en production

### Semaine 3-4 — Sprint 2 (EPIC 3)
- S3: T9/T10/T11 (structure axes + CRUD jalons + macro RACI)
- S4: T12/T13/T14/T15 (interactions, matrice, dépendances, recette)
- **Jalon fin Sprint 2** : roadmap maturité exploitable de bout en bout

### Semaine 5 — Sprint 3 (EPIC 4 PAE)
- T16/T17/T18/T19/T20 en flux continu
- démo intermédiaire milieu de semaine + finalisation fin de semaine
- **Jalon fin Sprint 3** : PAE opérationnel + lien jalons

## Cadence de gouvernance

### Rituels
- **Daily** 15 min (blocages + plan du jour)
- **Revue hebdo** 45 min (démo + décisions)
- **Comité produit** 30 min (priorisation backlog)

### Indicateurs de pilotage
- avancement tâches sprint (% done)
- bugs bloquants ouverts
- temps moyen de chargement vue DG
- taux de réussite export PDF

### Définition de Done (DoD) commune
- code mergé + build vert
- lints sans erreur
- logs Vercel sans erreur bloquante
- scénario métier clé testé (consultant/admin/codir)
- documentation backlog mise à jour

---

## Journal d'avancement (historique opérationnel)

### Session avril 2026 — synthèse des travaux réalisés

#### Fait
- Titres des issues GitHub **GH-1–GH-27** : préfixe **`[REF-…]`** harmonisé avec les tableaux de ce fichier.
- Convention **REF-** (tâche dans ce document) vs **GH-** (issue GitHub), colonnes de tableaux renommées en *REF*, traçabilité et plan d’implémentation alignés (correction des confusions PAE REF-11–13 vs GH-11–13).
- Création des issues GitHub **GH-16–GH-27** (jalons livrés + lots ouverts par epic) et tableau d’extension en tête de `docs/backlog.md`.
- Synchronisation issues **GH-1–GH-15** avec ce backlog (fermeture des issues livrées, tableau de traçabilité en tête de document).
- Maturity Roadmap: amélioration UX drawer/popins (fermeture backdrop robuste), uniformisation RACI (grilles 2 colonnes, pilote unique), échéance alignée sur la timeline.
- Maturity Roadmap: simplification dépendances (masquées en UI, `jalon_dependance_id` conservée en base).
- Maturity Roadmap: création de direction inline avec anti-doublon (normalisation + proximité de libellé).
- KPI roadmap: mise en place du jalon KPI miroir synchronisé (création/mise à jour/suppression), verrouillage nom + échéance côté miroir.
- Maturity Roadmap — **grille matrice** : drag & drop **chantier** entre axes (Vague 1), puis drag & drop **jalon** sur la même ligne pour l’échéance (Vague 2) — collision par cellule, renumérotation `ordre_sequentiel`, pas de reload page.
- Maturity Roadmap — **polish design grille** : alignement tokens thème (couleurs axes), harmonisation typographique en-têtes/axes, centrages verticaux/horizontaux (`Axe`, `Chantiers`, labels d’axes) et séparateurs visuels adoucis.
- Documentation métier/technique mise à jour (règles roadmap, synthèse évolutions, backlog, script SQL `supabase-jalons-kpi-source.sql`).
- Vue décideur / sélection projets: harmonisation itérative des frises et mini-frises (édition + décideur), puis composant partagé pour marqueurs début/fin.
- Vue décideur: renommage UX, garde d'accès rôle (`consultant/admin/pilote/superadmin`), validation/retrait avec revue obligatoire, historique des décisions via `audit_events`.
- Sécurité backend: script de garde SQL sur `projets.dg_validated_transfo` pour bloquer `codir`/`contributeur`.
- Cartes RUN: alignement visuel avec BUILD sur l'entête (placement mini-gantt et pastille criticité).
- Gouvernance Git: règle projet enrichie avec trailer `Made-with: Cursor AI`, convention commit formalisée dans `docs/git-commit-conventions.md`.
- Landing Next.js (EPIC 14): déploiement Vercel opérationnel sur `https://forge-du-changement-kgyg-xi.vercel.app`.
- Landing Next.js (EPIC 14): validation confidentialité en production de test (workspaces privés -> 404 homogène, aucune fuite d'information).
- Landing Next.js (EPIC 14): confirmation du modèle opt-in (`is_public = false` par défaut), publication explicite uniquement.
- Landing Next.js (EPIC 14 · REF-73 + homepage) : homepage publique `web/app/page.tsx` (parcours éditorial hero → constat → preuve → CTA mailto), composant `LandingRoadmapTrajectoire` (route SVG, pins, étapes statut done/current/upcoming), `LandingNav` + `ThemeToggle`, polices Satoshi / Clash Display dans `web/public/fonts/`, assets PNG/SVG roadmap, pages transition `/acces-membres` et `/bientot-disponible`, ajustements `layout` / `globals.css` / `next.config.ts`. Commit `51c390e`.
- **Pivot produit landing (21 avril 2026)** : décision "RDV-only" pour la landing publique. Revert de REF-74 (hero responsive image) et REF-75 (CTA intelligent vers dashboard) — la landing revient à un hero éditorial texte et un unique lien `mailto:` RDV. Suppression de `web/components/LandingSmartCta.tsx`, des assets `web/public/images/hero-{desktop,tablet,mobile}.png` et du CSS associé (`.landing-hero__*` responsive, `.landing-cta-actions`, `.landing-cta-secondary`, `.landing-modal-*`, `.landing-hero--bleed`).
- **Fix lint `react-hooks/set-state-in-effect` — `web/components/ThemeToggle.tsx`** (21 avril 2026) : migration du composant vers `useSyncExternalStore` (source de vérité = `document.documentElement.dataset.theme`) + script inline dans `<head>` de `web/app/layout.tsx` qui applique le thème **avant** hydration React. Élimine à la fois la cascade setState-in-effect (4 rendus pré-fix → 2 rendus post-fix, 0 event `effect-*`) et le FOUC (flash of unstyled theme). Preuve runtime capturée en debug mode (voir logs session `82b244`). Reste 3 warnings ESLint pré-existants hors périmètre (`@next/next/no-css-tags` x1, `@next/next/no-img-element` x2).
- **Fix dev local SPA Vite — Supabase placeholder** (21 avril 2026) : création de `.env.local` à la racine avec `VITE_SUPABASE_URL` / `VITE_SUPABASE_KEY` du projet `kpgkxeilddeyfwiiqaha` (mêmes valeurs que `web/.env.local`, mais variables préfixées `VITE_*`). Fichier ignoré par git via le pattern `*.local`. Cause initiale : `src/lib/supabase.ts` retombait sur un fallback dev `https://example.supabase.co` → `ERR_NAME_NOT_RESOLVED` au clic "Se connecter". Preuve runtime : redirection OAuth complète jusqu'à `/auth/callback?code=...`.
- **Convention dev local formalisée** (21 avril 2026) : deux terminaux désormais nécessaires en dev → racine `Le produit SaaS` = SPA Vite (port 5173), `web/` = landing Next.js (port 3000). À reporter dans `web/AGENTS.md` et `web/README.md` (tâche suivante).
- **REF-50 MFA super-admin livré et validé en recette** (21 avril 2026) : helpers `enrollMfaTotp`, `verifyMfaTotp`, `unenrollMfaFactor`, `listMfaFactors`, `isMfaEnrollmentRequiredForSuperadmin`, `auditMfaEvent` dans `src/lib/auth.ts`. Section "Sécurité super-admin" dans `ProfileSheet.tsx` (QR + champ code 6 chiffres + bouton désactiver). Garde bloquante dans `App.tsx` qui empêche l'usage de l'app tant que le MFA n'est pas activé pour un super-admin. Audit `mfa_totp_enrolled` / `mfa_totp_disabled` dans `audit_events`.
- **Fix runtime popin MFA vs drawer profil** (21 avril 2026) : le backdrop plein écran de la guard MFA (z-index 3000, inset 0) interceptait les clics destinés au drawer profil. Correctif 1 ligne dans `App.tsx` : conditionner le rendu de la guard à `!showProfile`. Dès que l'utilisateur ouvre son profil, la guard se démonte → drawer pleinement interactif. Si le drawer se referme sans MFA activé, la guard réapparaît automatiquement. Preuve runtime : capture montrant le drawer ouvert derrière la guard + validation post-fix utilisateur.
- **Fix RLS super-admin sur `workspaces`** (21 avril 2026) : la seule policy SELECT (`authenticated_read_own_workspace`) filtrait par appartenance membre ; les policies INSERT/UPDATE/DELETE appelaient `is_platform_superadmin()` mais pas la SELECT. Un super-admin plateforme ne voyait qu'un seul workspace (celui dont il était membre). Ajout de la policy `workspaces_superadmin_select` → permet à un super-admin de lister tous les workspaces de la plateforme. Migration appliquée sur `kpgkxeilddeyfwiiqaha` + sauvegardée dans `docs/supabase-workspaces-superadmin-select.sql`. Ajout d'un `invalidateCache(['workspaces:list'])` dans `refreshWorkspacesCatalog` (`App.tsx`) pour fiabiliser le bouton "Actualiser la liste".
- **REF-51 Journal des imports CSV livré et validé en recette** (21 avril 2026) : `CompanySheet.tsx` insère un event `invitation_batch_import` dans `audit_events` à chaque import batch (payload : `count_ok`, `count_mail_fail`, `count_errors`, `sample_errors`, `csv_hash` SHA-256, `default_role`). Section "Historique des imports CSV" dans le drawer "Mon entreprise" qui liste les 20 derniers imports via `listWorkspaceAuditEvents` (date, auteur, compteurs). Fix timing : `await insertAuditEvent` avant `setMembersRefreshKey(+1)` pour que la relecture voie la nouvelle ligne immédiatement.
- **REF-7a — schéma roadmap_snapshots** (21 avril 2026) : migration appliquée sur `kpgkxeilddeyfwiiqaha` → tables `roadmap_snapshots` (workspace_id, projet_id, label, status draft/in_review/closed, frozen_at, closed_at, created_by) et `roadmap_snapshot_items` (snapshot_id, kind chantier/jalon, source_id, payload jsonb). RLS SELECT/INSERT avec `is_platform_superadmin()` + `is_workspace_org_admin()` + `has_workspace_consultant_access()`. API `createRoadmapSnapshot` / `listRoadmapSnapshots` dans `src/lib/api/roadmapSnapshots.ts`. Bouton "Figer la V1 (snapshot)" dans `MaturityRoadmap.tsx` + affichage des snapshots récents. Recette à dérouler dans la foulée (REF-7b/c/d viennent ensuite).
- **REF-7a — fixes gouvernance snapshots** (21 avril 2026, commit `aa720e2`) : `createRoadmapSnapshot` exploite désormais la session auth pour renseigner `created_by` (UUID utilisateur) et `created_by_email` (dénormalisation pour lisibilité humaine). Migration SQL `alter table roadmap_snapshots add column if not exists created_by_email text` + back-fill via jointure `users`. `window.prompt` dans `MaturityRoadmap.tsx` enrichi d'un `defaultValue` type `V1 avril 2026` pour éviter les labels incorrects. `.gitignore` étendu avec `recette/` pour les exports CSV Supabase locaux.
- **REF-7b — session de cadrage produit "ReviewerPage & cycle de revue"** (21 avril 2026) : cadrage complet en 6 blocs (A Header & pastille / B Accordéon projets / C Roadmap visuelle & commentaires / D Proposer un chantier / E Visibilité & notifications / F Workflow Soumettre ma review) entre Yogan et l'agent. Éclatement de REF-7b en **8 sous-lots** (7b.0 → 7b.7) et spec détaillée consolidée dans une section dédiée de `docs/backlog.md`. Apprentissages structurants : (1) les reviewers sont des contributeurs N-1 des CODIR, invités via le flux magic link standard mais avec UI resserrée à la page de revue ; (2) les 4 axes `PROCESSUS / ORGANISATION / OUTILS / KPI` sont fixes dans la démarche FdC (déjà en enum code) ; (3) modèle unifié feedbacks avec 3 kinds (reaction / decision / proposition_chantier) et toggle Réaction vs Demande de décision dans chaque commentaire ; (4) demandes de décision structurées en 3 champs obligatoires `constat / proposition / bénéfice` ; (5) visibilité "scénario 3" toujours privé entre reviewers, la synthèse se fait en présentiel ; (6) affichage par trigramme avec convention configurable par workspace ; (7) notification reviewer cumulative envoyée **une fois** quand 0 feedback pending restant ; (8) soumission unique par reviewer, ré-ouverture possible par le CODIR en 1 clic. Nouveaux items backlog identifiés : REF-7b.0 fondations utilisateur (users.direction_id + trigrammes), REF-7b.1 RACI chantier (matrice cochable), REF-7b.6 panneau flottant déplaçable (react-rnd), REF-7e relances automatiques, REF-51b extension CSV avec colonnes `direction` + `trigram`. Prochain lot à démarrer : **REF-7b.0** (fondations utilisateur) après validation de ce cadrage.

#### En cours
- Validation visuelle fine des frises sur tous les contextes d'affichage (édition, Vue décideur consolidée, Ma Direction, états RUN/BUILD variés).

#### À faire
- Navigation historique navigateur: brancher la navigation interne sur l'URL/historique (retour arrière cohérent sans sortie du site).
- Export PDF DG final (si attendu hors impression navigateur).
- Phase G roadmap (future): intégration managers contributeurs dans le champ Responsable (actuellement texte libre).