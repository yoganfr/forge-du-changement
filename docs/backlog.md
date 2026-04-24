# Backlog — La Forge du Changement
Dernière mise à jour : **25 avril 2026** (Europe/Paris)

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
| 51b | Extension CSV d'invitation : colonnes optionnelles `direction` (résolue en direction_id) + `trigram` (sinon dérivé via convention workspace) — couvre les fondations utilisateur nécessaires à REF-7b | 🟠 | ✅ |

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
| 7b.0 | Fondations utilisateur (users.direction_id + users.trigram + workspaces.trigram_convention + héritage direction à l'invitation + extension CSV REF-51 + propagation invitation → ProfileSheet + édition manuelle trigramme + UI convention CompanySheet) | 🔴 | ✅ |
| 7b.1 | Macro **PCI** chantier intégrée à la roadmap principale (`usePciMatrix` + colonnes « Parties prenantes » dans `RoadmapTimelineGrid` + édition cellule / entête / création / suppression / motivation) — brique cœur désormais livrée dans la grille principale ; `RaciChantiersMatrix` subsiste comme vue autonome secondaire si besoin | 🔴 | ✅ |
| 7b.1a | Réalignement documentaire de l’architecture PCI (backlog/docs : `RoadmapTimelineGrid` = vue principale, `RaciChantiersMatrix` = vue autonome secondaire) | 🟡 | ✅ |
| 7b.1bis | Affichage côte à côte « Macro PCI chantier hérité » + « PCI fine jalon » dans le panneau latéral jalon (lot complémentaire de 7b.1) | 🟠 | ⬜ |
| 7b.1c | Harmonisation sémantique PCI / RACI entre chantier et jalon (labels, aide, docs, backlog) | 🟠 | ⬜ |
| 7b.1d | Polish UX final du module PCI (remplacement `alert`/`confirm`, feedbacks homogènes, confirmations destructives cohérentes) | 🟡 | ⬜ |
| 7b.1e | Durcissement technique / performance PCI (bulk updates batch, robustesse gros volumes, recette accessibilité clavier) | 🟡 | ⬜ |
| 7b.2 | Schéma revue (`roadmap_snapshot_reviewers`, `roadmap_review_feedbacks`, `roadmap_snapshots.review_deadline`, RLS) | 🔴 | ⬜ |
| 7b.3 | Modal "Ouvrir la revue" côté CODIR (multi-sélect reviewers + deadline + magic link + transition draft→in_review + audit) | 🔴 | ⬜ |
| 7b.4 | Routing conditionnel reviewer (redirect /review/:snapshotId + masquage nav principale pour les contributeurs-reviewers) | 🟠 | ⬜ |
| 7b.5 | ReviewerPage V1 (header + bandeau deadline avec pastille 🟢/🟠/🔴 + accordéon projets + roadmap lecture seule + partie 3 propositions + autosave commentaires + modal "Soumettre ma review") | 🔴 | ⬜ |
| 7b.6 | Panneau flottant déplaçable (migration drawer latéral → `react-rnd` floating panel, multi-ouverture, persistence position) | 🟠 | ⬜ |
| 7b.7 | Écran récap arbitrages (tableau global + badges inline + email/in-app cumulatif quand 0 feedback pending restant pour le reviewer) | 🟠 | ⬜ |
| 7c | Propositions reviewers (ajout/suppression/évolution chantiers-jalons) + justification structurée Constat/Proposition/Bénéfice — **intégré à REF-7b.5** | 🔴 | ⬜ |
| 7d | Arbitrage responsable roadmap : OK / NOK / Sous condition (propositions + demandes de décision) + Accusé réception (réactions) + clôture cycle feedback + notif cumulative reviewer | 🔴 | ⬜ |
| 7e | Workflow de relance automatique (email avant/après deadline reviewer, rappels dégradés) | 🟡 | ⬜ |
| 7f | Vue consolidée cross-direction (CODIR peut consulter roadmaps V1/V2 des autres directions, voire devenir reviewer cross-direction) | 🟡 | ⬜ |
| 8 | Vue matrice complète (grille temps × 4 axes, chantiers typés par axe) | 🟠 | ✅ |
| 9 | Dépendances inter-jalons (séquence ligne + `jalon_dependance_id` conservée, **UI masquée**) | 🟡 | ✅ |

**Livraison par vagues (détail jalon / roadmap, avril 2026)**  
- **V1** : backdrop drawer/modales (mousedown+mouseup), RACI typographie + grilles 2 col (pilote radio, autres cases), échéance = maille timeline.  
- **V2** : pas de saisie dépendance en UI ; création **Direction** inline (modal chantier + drawer RACI) avec détection de doublon.  
- **V3** : jalon KPI **miroir** sync indicateur/cible/échéance parent, verrou nom+date sur miroir, suppression miroir → vide KPI parent. Script : `docs/supabase-jalons-kpi-source.sql`.

**21 avril 2026 — UX grille timeline + PCI (jalon livré)**  
- Scroll horizontal **interne** à la carte grille (P0). Fonds d’axe Processus / Organisation **opaques** au scroll (P1). Scrollbar plus lisible, **dégradé droit** discret si contenu à droite, texte d’aide (échéances + parties prenantes), **flèches** latérales en **3 repères** (haut / centre / bas) calés sur la **hauteur visible** (viewport), pas sur la hauteur totale du tableau.  
- **Refactor PCI** : `pciMatrixTypes.ts`, `usePciMatrix.tsx`, `RaciChantiersPopover.tsx` ; allègement `RaciChantiersMatrix.tsx` et `MaturityRoadmap.tsx`.  
- Bilan détaillé : [`docs/backlog_update_roadmap_grille_pci_21avril2026.md`](backlog_update_roadmap_grille_pci_21avril2026.md).

**22 avril 2026 — réalignement backlog / architecture PCI**  
- Le backlog est réaligné sur l’architecture réellement livrée : la **vue principale** du PCI chantier est désormais la grille `RoadmapTimelineGrid` (colonnes « Parties prenantes » dans la roadmap), alimentée par `usePciMatrix`, et non plus seulement la vue autonome `RaciChantiersMatrix`.  
- `RaciChantiersMatrix.tsx` est reclassé comme **vue autonome secondaire / détachée si besoin**.  
- De nouveaux sous-lots sont explicités : **7b.1c** (harmonisation PCI/RACI), **7b.1d** (polish UX final), **7b.1e** (durcissement technique/perf).

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
  target_id uuid null,
  comment text null,
  constat text null,
  proposition text null,
  benefice text null,
  projet_pere_id uuid null,
  axe text null check (axe in ('PROCESSUS','ORGANISATION','OUTILS','KPI')),
  titre_chantier text null,
  codir_status text null check (codir_status in ('pending','noted','ok','nok','sous_condition')),
  codir_motivation text null,
  codir_user_id uuid null references public.users(id) on delete set null,
  codir_at timestamptz null,
  parent_id uuid null references public.roadmap_review_feedbacks(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Table PCI chantiers (REF-7b.1) — modèle stakeholder-centric + simplification PCI
create table public.raci_chantiers (
  id uuid primary key default gen_random_uuid(),
  chantier_id uuid not null references public.chantiers(id) on delete cascade,
  entite_type text not null check (entite_type in ('direction','autre')),
  entite_nom text not null,
  direction_id uuid null references public.directions(id) on delete set null,
  personne_nom text null,
  user_id uuid null references public.users(id) on delete set null,
  is_pilote boolean not null default false,
  is_contributeur boolean not null default false,
  is_informe boolean not null default false,
  motivation text null,
  ordre_affichage int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid null references public.users(id) on delete set null,
  constraint raci_chantier_at_least_one_role
    check (is_pilote or is_contributeur or is_informe)
);
```

**Note modèle PCI (choix produit 21 avril 2026)** : le RACI classique (R/A/C/I) est simplifié en **PCI** (Pilote / Contributeur / Informé) : le Pilote combine Responsible + Accountable. Plus lisible pour les reviewers N-1 qui découvrent les chantiers. Modèle **stakeholder-centric** (1 ligne = 1 partie prenante avec 3 booléens) pour mapper directement 1 ligne = 1 colonne dans la matrice UI. Multi-rôles autorisés. La **motivation** texte libre documente pourquoi la partie prenante est impliquée (tooltip dans la matrice, utile pour les arbitrages CODIR).

### Fondations utilisateur (REF-7b.0)

Indispensable avant tout le reste :

```sql
alter table public.users add column if not exists direction_id uuid null references public.directions(id) on delete set null;
alter table public.users add column if not exists trigram text null;
alter table public.workspaces add column if not exists trigram_convention text not null default 'prenom_nom_3';
```

- `users.direction_id` : rattachement opérationnel du contributeur à une direction. Hérite **automatiquement** de la direction du CODIR qui l'invite (règle métier). Si l'inviteur est Super Admin ou Consultant, la direction doit être précisée (drawer invite : sélecteur ; CSV batch : colonne `direction`).
- `users.trigram` : stocké en dur (3 chars). Dérivé à l'invitation selon `workspaces.trigram_convention` si non fourni, éditable ensuite.
- `workspaces.trigram_convention` : valeurs `prenom_nom_3`, `nom_prenom_3`, `custom`.

### Hors scope REF-7b.0 → REF-7b.7

- **REF-7c** est **intégré** à REF-7b.5.
- **REF-7d** reste un item distinct.
- **REF-7e** : workflow email avant/après deadline.
- **REF-51b** : nécessaire à REF-7b.0.

### Ordre d'exécution recommandé

```
REF-7b.0 (users.direction_id + trigrammes + héritage invite + CSV)
    ↓
REF-7b.1 (macro PCI chantier intégrée à la roadmap principale)
    ↓
REF-7b.1bis (macro PCI chantier ↔ granularité jalon)
    ↓
REF-7b.1c (harmonisation PCI / RACI)
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
REF-7b.1d / REF-7b.1e (polish final + durcissement technique) — en parallèle opportuniste
REF-7e (relances automatiques) — itération ultérieure
```

Chaque lot est livré en commit atomique, avec recette utilisateur dédiée avant de passer au suivant.

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

*Note (EPIC 13 · REF-36)* : v1 **impression navigateur** sur la Vue décideur (`window.print` + styles `dg-print`). Export PDF dédié encore à traiter si besoin CODIR. Suivi GitHub : **GH-14**.

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

*Note (EPIC 14 · REF-73)* : le nom de composant retenu en code est `LandingRoadmapTrajectoire`.

---

## EPIC 15 — Migration dashboard `/src` (Vite) → `/web` (Next.js) 🟠 PROPOSÉE

Objectif : unifier progressivement l'application sur **Next.js 16 App Router** pour réduire la surface de maintenance (1 stack, 1 design system, 1 projet Vercel cible), **sans freeze fonctionnel** et sans régression visible pour l'utilisateur.

Principe : chaque vague migre un périmètre isolé, **conserve la parité comportementale** et doit être validée en production avant la vague suivante.

| REF | Titre | Priorité | Statut |
|---|-------|----------|--------|
| 76 | **Vague 0 · Fondations partagées** | 🔴 | ⬜ |
| 77 | **Vague 1 · Auth SSR Supabase** | 🔴 | ⬜ |
| 78 | **Vague 2 · Routage et layout applicatif** | 🟠 | ⬜ |
| 79 | **Vague 3 · Écrans simples** | 🟠 | ⬜ |
| 80 | **Vague 4 · Vue décideur** | 🟠 | ⬜ |
| 81 | **Vague 5 · Selector projets** | 🟠 | ⬜ |
| 82 | **Vague 6 · Maturity Roadmap (cœur métier)** | 🔴 | ⬜ |
| 83 | **Vague 7 · API layer** | 🟠 | ⬜ |
| 84 | **Vague 8 · Modales et flows secondaires** | 🟡 | ⬜ |
| 85 | **Vague 9 · Bascule routage prod** | 🔴 | ⬜ |
| 86 | **Vague 10 · Décommissionnement `/src`** | 🟠 | ⬜ |

---

## EPIC 16 — Discours de transformation (Vue décideur) 🚧 EN COURS

Module performatif porté par le **dirigeant CODIR** pour cadrer la narration de la transformation à destination du CODIR et du collectif. Inspiré du document `docs/Référence Discours de transformation.md` (§2.3 — modèle performatif 8 blocs). Accessible depuis le nouveau menu **« Vue décideur »** de la navbar (à côté de « Mon parcours de transformation »), aux côtés du **Cockpit Projet transfo** (ancienne Vue décideur consolidée).

| REF | Titre | Priorité | Statut |
|---|-------|----------|--------|
| 87 | Navbar : menu « Vue décideur » + routing `discours_transfo` / `dg` (cockpit consolidé renommé) | 🔴 | ✅ |
| 88 | Éditeur V1 : 8 blocs performatifs (constituer / nommer la bascule / naming / principes / vision / trajectoire / engagement / ouverture), champs `text` / `longtext` / `list` / **`cards`**, textareas auto-resize, autosave, badge d'état de complétion | 🔴 | ✅ |
| 88a | Bloc 2 « Nommer la bascule » : 3 cartouches colonnes (fait observé / impact CODIR / risque si on ne réagit pas) | 🟠 | ✅ |
| 88b | Bloc 4 « Nouveaux principes du jeu » : cartouches Principe 1..3 obligatoires + bouton d'ajout optionnel Principe 4/5 | 🟠 | ✅ |
| 88c | Introduction manifeste en tête du module (cadrage performatif du discours) | 🟡 | ✅ |
| 88d | **Lot 2 (règles locales)** : `scoring.ts` + `jargon.ts`, panneau **Diagnostic** (5 dimensions /20, total /100, niveau 1–3, forces / vigilances / recommandations), comptage jargon §3.2.A, alertes phrases longues §3.2.B, persistance `score_snapshot` via `updateVersionScore` | 🟠 | ✅ |
| 89 | Désignation **dirigeant CODIR** porteur du Discours : `workspaces.dirigeant_user_id`, section dédiée dans `CompanySheet` (sélecteur membres CODIR actifs, chip récap, retrait, trace audit `workspace_dirigeant_set`) | 🔴 | ✅ |
| 90 | ACL module Discours : édition réservée à superadmin / consultant / admin / **dirigeant CODIR** du workspace ; pilote = lecture seule ; autres rôles = module invisible | 🔴 | ✅ |
| 90a | ACL « Vue décideur » globale : superadmin + consultant owner + admin + pilote (read-only cockpit) ; CODIR non-dirigeant et contributeur = menu invisible | 🔴 | ✅ |
| 91 | Backend proxy IA : Edge Function Deno Supabase (auth JWT + accès workspace + consultant via `workspace_consultants`) — OpenRouter **`openai/gpt-oss-120b`**, `response_format: json_object`, Zod, secret `OPENROUTER_API_KEY` | 🔴 | ✅ |
| 92 | Scoring **IA** (enrichit l’analyse règles) + diagnostic LLM, aligné `DiscoursScoreSnapshot` (`source: 'ai'`) — bouton « Analyser avec l’IA et enregistrer » | 🔴 | ✅ |
| 93 | Reformulation IA par bloc (suggestions alternatives, préservation intention) | 🟠 | ⬜ |
| 94 | Surlignage **inline** des termes jargon dans l’éditeur + tooltips (détection texte : voir 88d) | 🟡 | ⬜ |
| 95 | Comparaison de versions (V1 / V2 côte à côte, diff par bloc) | 🟡 | ⬜ |

**Granularité produit** : 1 Discours vivant par workspace (pas de multi-discours). Versions stockées pour traçabilité et comparaison V1→V2 (REF-95).

**Choix LLM** : OpenRouter.ai retenu pour simplicité d'intégration et coût minimal. Pas de lock-in clé provider (compte `yoganhedef` déjà opérationnel).

---

## EPIC 17 — Gouvernance parcours & déverrouillage progressif ✅ DONE

Objectif : permettre à un administrateur de **piloter l'avancement du parcours de transformation** d'un workspace (CODIR et Contributeur indépendamment), déverrouillant dynamiquement les modules correspondants sans redéploiement. Finit le hardcoding `status: 'active' | 'soon'` des modules de navigation.

| REF | Titre | Priorité | Statut |
|---|-------|----------|--------|
| 96 | Migration Supabase : remplacer `workspaces.current_step` (deprecated) par `current_step_codir smallint (0..6)` + `current_step_contributeur smallint (0..3)` ; RLS UPDATE via `can_manage_workspace` (superadmin + consultant owner + admin client) | 🔴 | ✅ |
| 97 | Types `Workspace` mis à jour + API `updateWorkspaceCurrentStep(id, { codir?, contributeur? })` avec dedup fetch | 🔴 | ✅ |
| 98 | `buildJourneyModules(defs, currentStep)` : statut `active` si `idx + 1 ≤ currentStep`, `soon` sinon (y compris si `currentStep` null ou 0 → tout verrouillé) | 🔴 | ✅ |
| 99 | Pilule **« Étape en cours »** par parcours : affichage dans la nav **indépendamment** de la page active (module courant visible même sur la home) ; deux pilules indépendantes pour les rôles qui voient les deux sections (consultants / superadmins) | 🟠 | ✅ |
| 100 | Section **« Phase du parcours de transformation »** dans Paramètres : 2 selects (CODIR 0..6 + Contributeur 0..3) avec autosave, placée en tête de page avant « Missions & entreprises clientes » ; mode lecture seule avec message explicatif pour rôles non autorisés | 🔴 | ✅ |
| 101 | `WorkspaceHome` : étapes passées (`done`) restent cliquables (description + bouton actif) pour permettre le retour sur un module déjà parcouru ; seules les étapes `upcoming` sont verrouillées | 🟠 | ✅ |

**Comportement produit retenu** : `current_step = 0 / null` signifie **« parcours non démarré, tous modules verrouillés »** (et non « phase 1 toujours ouverte par défaut »). L'admin doit explicitement ouvrir la phase 1 pour déverrouiller le premier module.

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
- `chantiers` — lignes thématiques sous projet BUILD ; colonne `axe`
- `jalons` — jalons roadmap
- `raci_jalons` — macro RACI par jalon (pilote / impliqué / informé par direction)
- `raci_chantiers` — macro PCI par chantier (stakeholder-centric : entité/personne + rôles P/C/I + motivation)
- `raci_projets` — relations RACI projet
- `plan_de_charge` — charges mensuelles

## Composants principaux

- `App.tsx` — dashboard, navigation, garde d'auth, entrées La Fabrique / Vue décideur / roadmap
- `OnboardingFlow.tsx` — création espace entreprise + invitations
- `ProjectSelector.tsx` — outil saisie/scoring projets (Supabase)
- `CompanySheet.tsx` — fiche entreprise + invitations unitaires/CSV
- `ProfileSheet.tsx` — drawer profil utilisateur
- `MemberOnboarding.tsx` — espace membre
- `pages/DashboardDG.tsx` — synthèse décideur
- `pages/Login.tsx` — écran connexion premium
- `pages/AuthCallback.tsx` — retour OAuth/Magic Link
- `MaturityRoadmap.tsx` — orchestration roadmap (projets, snapshots, tiroirs, intégration PCI)
- `RoadmapTimelineGrid.tsx` — grille 4 axes × échéances **+ colonnes Parties prenantes PCI**
- `RaciChantiersMatrix.tsx` — vue autonome secondaire / détachée de la matrice PCI si besoin
- `usePciMatrix.tsx` — hook cœur du module PCI (chargement, canonicalisation, édition, popover)
- `RaciChantiersPopover.tsx` — popover PCI (cellule / création / édition entête)
- `DgProjectAccordion.tsx` — détail projet dans la Vue décideur
- `ChantierLineModal.tsx` / `JalonQuickAddModal.tsx` — édition chantiers et jalons
- `src/lib/api.ts` — façade CRUD + réexport roadmap
- `src/lib/api/roadmap.ts` — chantiers, jalons, RACI jalons
- `src/lib/api/raci-chantiers.ts` — CRUD PCI chantier
- `src/lib/auth.ts` — Auth helpers + rate limit client
- `src/lib/supabase.ts` — client Supabase
- `src/lib/types.ts` — types TypeScript

**Landing Next.js (`web/`) — homepage publique et SEO**

- `web/app/page.tsx` — homepage commerciale (sections éditoriales, CTA mailto, bloc trajectoire)
- `web/components/LandingNav.tsx` — navigation
- `web/components/LandingRoadmapTrajectoire.tsx` — trajectoire route + jalons + cartes d’étapes
- `web/components/ThemeToggle.tsx` — bascule clair / sombre
- `web/public/fonts/` — Satoshi + Clash Display (`fonts.css`)
- `web/app/acces-membres/page.tsx` / `web/app/bientot-disponible/page.tsx` — pages de transition vers le parcours membre

## Navigation canonique (source de vérité)

Ce bloc est la référence produit pour la navbar applicative `/src` (workspace authentifié).

- **Entrées historiques supprimées** en navigation principale : `La Fabrique`, `Mon Espace`.
- **Macro-menu unique** : `Mon parcours de transformation`.
- **Rôles CODIR** (`codir`) : section `Parcours membre CODIR` avec les modules (ordre canonique) :
  1. `Projets transformants`
  2. `Roadmap`
  3. `Feedbacks Roadmap`
  4. `Plans d'action (PAE) & Plans de charge (version membre CODIR)`
  5. `Kick-off`
  6. `Suivi PAE (vue membre CODIR)`
- **Rôles contributeur** (`contributeur`) : section `Parcours membre contributeur` avec les modules (ordre canonique) :
  1. `Review Roadmap`
  2. `Plans d'action (PAE) & Plans de charge (version contributeur)`
  3. `Suivi PAE (vue contributeur)`
- **Asymétrie volontaire** : si un module n'est pas défini côté contributeur, il n'est pas affiché (pas de trou visuel, pas de placeholder forcé).
- **Rôles avancés** (`consultant`, `admin`, `pilote`, `superadmin`) : affichent les deux sections dans le macro-menu.
- **Review vs Feedbacks** : deux pages/modules distincts (pas de fusion sémantique).
- **UX états non livrés** : item visible avec badge `Bientôt` et action désactivée.

---

## Trajectoire suggérée

La trajectoire de référence est désormais la section **Priorisation produit — Maintenant / Après / Plus tard** ci-dessous.

- **Maintenant** : finaliser le dialogue structuré roadmap (EPIC 3 · REF-7), puis fermer le gap décideur transverse (EPIC 2 · REF-3). Le prochain lot roadmap le plus naturel après la base déjà livrée est **REF-7b.1bis**.
- **Après** : poser les fondations de l'EPIC 15 (REF-76 + REF-77), renforcer gouvernance/sécurité (EPIC 11), arbitrer l'export PDF autonome (EPIC 13), puis lancer l’harmonisation **PCI / RACI** et le polish final du module PCI (REF-7b.1c → 7b.1e).
- **Plus tard** : poursuivre la migration EPIC 15 par vagues (REF-78 → REF-86) en parallèle des modules d'extension (EPIC 4, 5, 6, 7, 8, 9) et l'extension design premium complète.

---

## Priorisation produit — Maintenant / Après / Plus tard

### Maintenant

1. EPIC 16 · **REF-91 → REF-92** — backend proxy IA (Edge Function OpenRouter) + scoring par bloc du Discours de transformation. Premier palier IA produit, déjà cadré et dé-risqué par l'éditeur V1 livré.
2. EPIC 3 · **REF-7a → REF-7d** — figer une roadmap V1, ouvrir un cycle reviewers, collecter des propositions typées, puis arbitrer/clôturer.
3. EPIC 3 · **REF-7b.1bis** — relier la macro PCI chantier déjà intégrée à la granularité jalon.
4. EPIC 2 · **REF-3** — livrer le Gantt macro consolidé pour fermer le gap décideur transverse.

### Après

5. EPIC 16 · **REF-93 / REF-94 / REF-95** — reformulation IA, détection jargon, comparaison V1/V2 du Discours.
6. EPIC 3 · **REF-7b.1c / REF-7b.1d / REF-7b.1e** — harmonisation PCI/RACI, polish UX final et durcissement technique du module PCI.
7. EPIC 15 · **REF-76 / REF-77** — fondations partagées + Auth SSR Supabase dans `/web`.
8. EPIC 11 · **REF-50 / REF-51** — MFA super-admin + journal des imports CSV.
9. EPIC 13 · **REF-36** — arbitrage explicite : finaliser export PDF autonome uniquement si besoin client avéré au-delà de l'impression navigateur.

### Plus tard

8. EPIC 15 · **REF-78 à REF-86** — suite migration `/src` → `/web` par vagues.
9. EPIC 4 · **REF-10–13** — PAE complet.
10. EPIC 5 / 6 / 7 / 8 / 9 — modules complémentaires.
11. EPIC 12 (complet) — extension du design premium au-delà des quick wins ciblés.

---

## Journal d'avancement (historique opérationnel)

### 25 avril 2026 — plan Discours synchronisé + Lot 2 règles (scoring + jargon + panneau)

#### Fait
- Mise à jour du plan Cursor **Module Discours de transformation V1** (fichier `.cursor/plans/module_discours_de_transformation_v1_*.plan.md`) : Lot 1 et Lot 2 marqués **terminés** (sauf surlignage inline jargon = **lot2b**), Lots 3–4 **en attente** ; alignement des décisions d’édition (pilote lecture seule, EPIC 17 hors périmètre strict).
- **EPIC 16 · REF-88d** : `src/lib/discours/scoring.ts`, `jargon.ts`, panneau **Diagnostic** dans `DiscoursTransformation.tsx`, styles `App.css`, persistance `updateVersionScore` pour le snapshot règles.

#### À suivre
- **REF-91** Edge `discours-analyze` (OpenRouter) ; **92** couche IA sur le même `DiscoursScoreSnapshot` ; **94** surlignage inline.

### 23-24 avril 2026 — Vue décideur, Discours de transformation, gouvernance parcours

#### Fait
- **EPIC 16 · REF-87** : nouveau menu **« Vue décideur »** dans la navbar (à côté de « Mon parcours de transformation »), regroupant **Discours de transformation** et **Cockpit Projet transfo** (ex-Vue décideur consolidée renommée). L'ancien bouton « Vue décideur » a été retiré du menu Parcours.
- **EPIC 16 · REF-88 / 88a / 88b / 88c** : éditeur V1 du **Discours de transformation** livré — 8 blocs performatifs (§2.3 document de référence), champs `text` / `longtext` / `list` / **`cards`** (nouvelle kind pour structures répétables), composant `AutoTextarea` pour auto-resize, autosave, badge de complétion par bloc. Harmonisation visuelle complète avec la fenêtre « Sélection de projets transformants » (mêmes cartes, champs, focus). Bloc 2 en 3 colonnes (fait observé / impact CODIR / risque), Bloc 4 en cartouches avec ajout optionnel P4/P5. Largeur single-column réduite à ~50 % et `Enter` actif pour les sauts de ligne. Texte d'introduction manifeste ajouté en tête.
- **EPIC 16 · REF-89** : **désignation du dirigeant CODIR** porteur du Discours — colonne `workspaces.dirigeant_user_id`, section dédiée dans `CompanySheet` (sélecteur parmi membres CODIR actifs, chip récap, retrait, trace audit `workspace_dirigeant_set`).
- **EPIC 16 · REF-90 / 90a** : ACL complète — édition Discours réservée à superadmin / consultant / admin / dirigeant CODIR ; pilote = lecture seule ; reste du CODIR + contributeurs = menu « Vue décideur » entièrement invisible. ACL fiche entreprise restreinte à superadmin / consultant owner / admin / pilote (CODIR et contributeurs n'y accèdent plus).
- **EPIC 17 · REF-96 → REF-101** : gouvernance parcours livrée. Migration Supabase `workspaces_split_current_step_by_role` (colonnes `current_step_codir smallint 0..6` + `current_step_contributeur smallint 0..3`, RLS `can_manage_workspace`, pré-init `current_step_contributeur = 1`). API `updateWorkspaceCurrentStep` + types. Section « Phase du parcours de transformation » en tête de `SettingsPage` avec 2 selects (autosave, mode lecture seule pour rôles non autorisés). `WorkspaceHome` corrigé : étapes passées (`done`) restent cliquables (description + bouton actifs), seules les `upcoming` sont verrouillées. Pin bleu pour `done` et `upcoming`, rouge pour `current`.
- **Navigation mobile** : harmonisation drawer hamburger — suppression du cartouche « Mon parcours de transformation » (aplati en labels discrets de type `Parcours de [Nom]`), suppression du bouton vestigial « Accueil — choix des modules », séparateur fin (25 % largeur) entre « Parcours » et « Compte et espace ».
- **Pilule « Étape en cours »** : affichée en nav desktop **et** mobile sur le module courant de chaque parcours, indépendamment de la page active (visible aussi sur la home). Double pilule (CODIR + Contributeur) pour les rôles qui voient les deux sections.
- **Polish** : badge entreprise en lecture seule avec `cursor: default !important` pour éviter la main inadaptée ; fix overlap pilule mobile sur cartes WorkspaceHome (positionnement static + padding adapté) ; spacing vertical inter-cartes dans Paramètres.
- **Test users** : création d'un jeu complet de comptes de recette (superadmin / consultant / admin / pilote / CODIR dirigeant / CODIR non-dirigeant / contributeur) avec fix SQL pour champs `auth.users` NULL-sensibles (`confirmation_token` et co. → chaîne vide) afin de débloquer l'erreur GoTrue « Database error querying schema » en local.

#### Correctifs déploiement notables
- **Build Vercel TS** (commit `b0d1903`) : `JourneyModuleDef.id` typé `string` au lieu de `JourneyModuleId` (union de literals) — caché par `tsc --noEmit` local mais cassé par le `tsc -b` strict de Vercel. Fix en alignant le type.
- **React runtime #310** (commit `9993281`) : `useMemo` placés après des early returns conditionnels (`authLoading`, `!authUser`) dans `App.tsx` → hooks count variable → écran blanc. Fix en retirant ces `useMemo` (calculs triviaux, <= 6 items) et en ajoutant le chaînage optionnel complet `workspaceData?.workspace?.current_step_codir`.
- **Visibilité section Paramètres** (commit `9c1c64f`) : section Phase du parcours invisible car placée après la très grande carte « Missions & entreprises clientes ». Fix en la déplaçant en tête de `SettingsPage` avec spacing inter-cartes et texte de lead actualisé.

#### À suivre
- **EPIC 16 · REF-91** : Edge Function Deno Supabase encapsulant OpenRouter `openai/gpt-oss-120b` (auth JWT + RLS workspace + Zod) — prochain lot naturel pour brancher l'IA sur les 8 blocs.
- **Recette par rôle** : passer les 7 rôles test en revue sur le parcours complet (Vue décideur / Discours / Paramètres / parcours membre) pour valider la matrice ACL en production.

### Session avril 2026 — synthèse des travaux réalisés

#### Fait
- Titres des issues GitHub **GH-1–GH-27** : préfixe **`[REF-…]`** harmonisé avec les tableaux de ce fichier.
- Convention **REF-** (tâche dans ce document) vs **GH-** (issue GitHub), colonnes de tableaux renommées en *REF*, traçabilité et plan d’implémentation alignés.
- Création des issues GitHub **GH-16–GH-27** et tableau d’extension en tête de `docs/backlog.md`.
- Synchronisation issues **GH-1–GH-15** avec ce backlog.
- Maturity Roadmap : amélioration UX drawer/popins, simplification dépendances, création de direction inline avec anti-doublon, KPI miroir synchronisé, drag & drop chantier/jalon, polish visuel de la grille.
- Documentation métier/technique mise à jour.
- Vue décideur / sélection projets : harmonisation itérative des frises et mini-frises.
- Vue décideur : garde d'accès rôle, validation/retrait avec revue obligatoire, historique des décisions via `audit_events`.
- Landing Next.js : homepage publique, composant `LandingRoadmapTrajectoire`, pivot produit RDV-only et correctifs thème / dev local.
- **REF-7a** livré : schéma `roadmap_snapshots`, API, bouton “Figer la V1”, puis correctifs de gouvernance (`created_by`, `created_by_email`, label par défaut).
- **REF-7b** cadré : cycle reviewers détaillé, éclatement en sous-lots 7b.0 → 7b.7.
- **REF-7b.0** livré : fondations utilisateur (`direction_id`, `trigram`, convention workspace, extension CSV, héritage invitation → profil) + polish UX du drawer entreprise.
- **REF-7b.1** livré au-delà de la V1 initialement documentée : la macro **PCI** chantier n’est plus seulement une matrice autonome sous la timeline ; elle est désormais **intégrée à la grille principale** via `RoadmapTimelineGrid` + `usePciMatrix`, avec colonnes Parties prenantes, édition cellule, édition entête, création/suppression de colonne, motivation, read-only, sticky columns et scroll horizontal assisté. `RaciChantiersMatrix.tsx` reste une vue autonome secondaire si besoin.
- **Backlog réaligné** (22 avril 2026) : REF-7b.1 passe en ✅, ajout des sous-lots **7b.1c** (harmonisation PCI/RACI), **7b.1d** (polish UX final) et **7b.1e** (durcissement technique/perf), plus clarification explicite du rôle de `RaciChantiersMatrix`.
- **REF-7b.0 étape 5/5 recette** reportée : onboarding magic link end-to-end bloqué par le rate limit SMTP built-in Supabase ; utilitaire `scripts/generate-magic-link.mjs` préparé pour reprise.

#### En cours
- Validation visuelle fine des frises sur tous les contextes d'affichage.

#### À faire
- Navigation historique navigateur : brancher la navigation interne sur l'URL/historique.
- Export PDF DG final (si attendu hors impression navigateur).
- Phase G roadmap (future) : intégration managers contributeurs dans le champ Responsable.
