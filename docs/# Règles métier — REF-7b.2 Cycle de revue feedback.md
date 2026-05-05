# Règles métier — REF-7b.2 Cycle de revue feedback

*Document de référence pour le module **REF-7b.2 : Schéma revue & cycle feedback roadmap**. Spécifie les règles métier, workflow et permissions du cycle de revue collectif (reviewer → propositions → arbitrage CODIR).*

Dernière mise à jour : **5 mai 2026**, 22 h 10 (Europe/Paris)

---

### Voir aussi
- **Plan d'implémentation backend** : [`.cursor/plans/ref-7b.2_schema_revue_final_implementation.plan.md`](.cursor/plans/ref-7b.2_schema_revue_final_implementation.plan.md) — Schéma SQL, RLS, API routes, audit trail, 5 todos
- **Architecture UX ReviewerPage** : [`docs/architecture-ux-reviewerpage-ref7b5.md`](docs/architecture-ux-reviewerpage-ref7b5.md) — Complément : Frontend + Partie 2/3
- **Backlog** : [`docs/backlog.md`](docs/backlog.md) (lignes 135 & 138) — REF-7b.2 et REF-7b.5 dans EPIC 3

---

## 1. Concepts fondamentaux

### 1.1 Lifecycle reviewer (états et transitions)

Un reviewer progresse lineairement dans la revue d'une roadmap snapshot :

| État | Transition | Condition | Action |
|------|-----------|-----------|--------|
| **pending** | → draft | Reviewer accepte magic link | Création user si needed |
| **draft** | → submitted | Reviewer clic « Soumettre ma review » | Notif CODIR owner + synthèse feedbacks |
| **submitted** | → closed | CODIR owner clic « Clôturer revue » | Audit trail |
| **submitted** | ↔ draft | CODIR owner clic « Ré-ouvrir » | Conserve feedbacks, réactions perte du "lu" si éditées |
| **closed** | → in_review | CODIR owner clic « Ré-ouvrir » (cas rare) | Peut relancer revue |

**Règle critique** : Une fois **submitted**, reviewer **NE PEUT PLUS créer de nouveaux feedbacks**. C'est un blocage fort pour éviter la chaos lors de l'arbitrage.

### 1.2 Trois kinds de feedbacks

Chaque feedback appartient à l'un des 3 kinds suivants :

#### Kind 1 : **reaction** (commentaire simple)
- **Contenu** : texte libre dans `comment` (sans limite de longueur)
- **Exemple** : "Cette étape est effectivement trop longue", "Bonne idée", "D'accord"
- **CODIR action** : Coche "lu" (marque `reaction_acknowledged_at`) + réponse optionnel
- **Éditable par reviewer** : OUI, tant que snapshot ouvert (même après CODIR l'a lu)
- **Figée après** : Non, reste éditable

#### Kind 2 : **decision** (demande de décision structurée)
- **Contenu requis (obligatoire)** :
  - `constat` = Ce qui ne va pas / doit être amélioré (observation du présent ou problème)
  - `proposition` = L'action/changement concret suggéré
  - `bénéfice` = Impacts positifs attendus (métier, qualité, RH, etc.)
- **Exemple** : 
  - Constat : "Le jalon J3 est prévu Q2 mais les ressources ne seront libérées qu'en Q3"
  - Proposition : "Décaler J3 à Q3"
  - Bénéfice : "Évite crunch, calendrier cohérent"
- **CODIR action** : Arbitrage obligatoire = **ok / nok / sous_condition** + texte motivation obligatoire
- **Éditable par reviewer** : NON après soumission (figée dès soumission)

#### Kind 3 : **proposition_chantier** (créer nouveau chantier)
- **Contenu** : Idem decision (constat/proposition/bénéfice) + `projet_pere_id`, `axe`, `titre_chantier`
- **Où** : Saisie en Partie 3 de ReviewerPage (en bas de page)
- **Projet père** : Choix parmi les projets transformants de V1 (pas création nouveau projet)
- **Axe** : Placement dans PROCESSUS / ORGANISATION / OUTILS / KPI
- **CODIR action** : ok / nok / sous_condition + motivation
- **Éditable** : NON après soumission

**Distinction réactions ≠ propositions** : Les **réactions** peuvent rester brouillons et éditées même après ACK CODIR. Les **décisions/propositions** sont des engagements structurés et deviennent immuables.

### 1.3 Types de feedbacks par target

Les feedbacks sont toujours émis sur des **éléments existants** de la roadmap V1 :

| Target type | Description | Exemple |
|-------------|-------------|---------|
| **'chantier'** | Feedback sur un chantier existant | "Ce chantier manque de détail sur les jalons" |
| **'jalon'** | Feedback sur un jalon existant | "Ce jalon doit être décalé de Q2 à Q3" |
| **'raci_chantier'** | Feedback sur les parties prenantes RACI du chantier | "Direction Finance ne devrait pas être pilote, mais impliquée" |

**Les propositions de NOUVEAUX chantiers** (Kind 3) se font en Partie 3 via formulaire structuré (pas de `target_type = 'proposition'` : c'est kind = 'proposition_chantier' avec champs dédiés).

### 1.4 États arbitrage CODIR

Pour chaque feedback, CODIR définit un `codir_status` :

| Status | Applicable à | Signification | Motivation |
|--------|-------------|---------------|-----------|
| **pending** | Tous kinds | Pas encore arbitré | N/A |
| **ok** | decision, proposition_chantier | Validé, on le fait | Optionnel (court texte peut suffire) |
| **nok** | decision, proposition_chantier | Rejeté, on le fait pas | Obligatoire (expliquer pourquoi) |
| **sous_condition** | decision, proposition_chantier | Validé sous conditions | Obligatoire (détailler conditions) |

**Pour reactions** : Pas de status arbitrage. Le "lu" (timestamp `reaction_acknowledged_at`) suffit. Pas d'obligation de répondre avec texte.

---

## 2. Workflow soumission reviewer

### 2.1 Phase brouillon (draft)

1. Reviewer accède ReviewerPage (3 parties : projets + roadmap + propositions)
2. Crée/édite feedbacks en **autosave** :
   - Partie 1 : Réactions/décisions sur **projets**
   - Partie 2 : Réactions/décisions sur **chantiers/jalons** (via panneau flottant)
   - Partie 3 : Propositions de nouveaux chantiers
3. **Aucune limite** : peut écrire, supprimer, corriger autant qu'il veut
4. Feedbacks en draft sont **invisibles au CODIR**

### 2.2 Soumission (transition draft → submitted)

1. Reviewer clic « Soumettre ma revue »
2. Modal confirmation affiche :
   - Nombre réactions
   - Nombre demandes de décision (decisions + propositions_chantier)
   - Rappel : "CODIR owner sera notifié et arbitrera vos contributions"
3. Clic confirmation → transaction atomique :
   - `reviewer.status` : draft → submitted
   - `reviewer.submitted_at` = now()
   - Audit event : `reviewer_submitted`
   - Email + notif in-app CODIR owner (synthèse : nb réactions / décisions / propositions)

### 2.3 Blocage post-soumission

Une fois `status = submitted` :
- **Impossible créer nouveaux feedbacks** (UI/RLS bloquent)
- **Réactions** : restent éditables tant que snapshot ouvert
- **Décisions/propositions** : **immuables** (pas d'édition, pas de suppression par reviewer)
- Reviewer peut **lire réponses CODIR** et **consulter son arbitrage** (quand il arrive)

---

## 3. Workflow arbitrage CODIR

### 3.1 Vue arbitrage (écran REF-7d)

1. CODIR owner accède page « Arbitrage feedbacks »
2. **Filtrages disponibles** :
   - Voir tous feedbacks du snapshot
   - OU filtrer par reviewer (multi-select parmi reviewers)
   - OU filtrer par kind (réactions / décisions / propositions)
3. **Affichage** : tableau ou liste détaillée par feedback

### 3.2 Arbitrage par feedback

**Pour reactions** :
1. CODIR voit réaction du reviewer
2. Coche "lu" (set `reaction_acknowledged_at = now()`)
3. Zone texte optionnel pour réponse
4. Clic « Marquer comme lu »
5. Feedback inaccessible en édition pour reviewer désormais (mais reste lisible)

**Pour decisions/propositions_chantier** :
1. CODIR voit les 3 champs (constat/proposition/bénéfice)
2. Dropdown : ok / nok / sous_condition
3. Texte obligatoire dans `codir_motivation` :
   - Si ok : brève justification (ex: "Aligné roadmap")
   - Si nok : raison du rejet
   - Si sous_condition : détailer précisément les conditions requises
4. Clic « Arbitrer »
5. Update incremental avec idempotence check (version field)

### 3.3 Notification cumulative "contributions arbitrées"

Dès que **tous les feedbacks d'un reviewer** passent de `codir_status = pending` → {ok, nok, sous_condition} :
- Notif unique email + in-app au reviewer : « Vos contributions à la revue XXX ont été arbitrées par Laurent »
- **Une seule fois par reviewer/snapshot** (dédup timestamp `reviewer_notified_contributions_arbitrated_at`)

---

## 4. Ré-ouverture de revue

### 4.1 Trigger ré-ouverture

CODIR owner peut cliquer « Ré-ouvrir revue » sur un reviewer en statut **submitted** ou **closed**.

### 4.2 Comportement

| Élément | Comportement |
|--------|-------------|
| **Reviewer status** | submitted → draft (ou closed → draft) |
| **Réactions non-lues** | Restent non-lues (no change) |
| **Réactions lues** | Conservent leur `reaction_acknowledged_at` **SAUF** si reviewer les édite → redeviennent "non lu" |
| **Décisions/propositions arbitrées** | **Immuables** : pas d'édition, pas de suppression |
| **Décisions/propositions pending** | Figées (pas d'édition par reviewer) |
| **Nouvelles propositions** | Reviewer peut créer des **nouvelles** propositions en Partie 3 |
| **Audit** | Enregistrer `snapshot_review_reopened` + qui a rouvert |

---

## 5. Isolations & visibilité entre reviewers

### 5.1 Défaut (isolation totale)

Par défaut, chaque reviewer est **complètement isolé** :
- Reviewer A voit juste ses propres feedbacks
- Reviewer A ne voit PAS les feedbacks de Reviewer B (même sur le même chantier)
- Reviewer A ne voit PAS les réponses CODIR adressées à Reviewer B

### 5.2 Configuration workspace "partage propositions"

Au niveau **workspace** (pas snapshot), on peut activer option « Partage propositions entre reviewers ».

| Config | Visibilité Reviewer A des propositions de Reviewer B |
|--------|--------|
| **OFF (défaut)** | Invisible |
| **ON** | Visible : titre + constat + proposition + bénéfice + arbitrage CODIR |

**Niveau de granularité** : propositions_chantier uniquement. Réactions/décisions sur éléments existants restent privées.

### 5.3 Configuration workspace "partage réponses CODIR"

Au niveau **workspace**, option « Réponses CODIR visibles à tous reviewers ».

| Config | Visibilité Reviewer A des réponses CODIR à Reviewer B |
|--------|--------|
| **OFF (défaut)** | Invisible (juste auteur voit) |
| **ON** | Visible à tous reviewers |

### 5.4 CODIR voit tous

CODIR owner voit **tous les feedbacks du snapshot** (pas d'isolation).

---

## 6. Permissions & RLS (Row-Level Security)

### 6.1 Reviewer

- **Voit** : ses propres feedbacks + réponses CODIR à ses feedbacks
- **Crée** : feedbacks tant que `status = draft`
- **Édite** : réactions tant que snapshot ouvert; décisions/propositions jamais après submission
- **Supprime** : feedbacks en draft seulement
- **Arbitre** : non (pas de droits arbitrage)

### 6.2 CODIR owner (qui a lancé la revue)

- **Voit** : tous les feedbacks du snapshot
- **Crée** : réponses aux feedbacks (feedback parent_id = feedback reviewer)
- **Arbitre** : oui, arbitrage obligatoire des décisions/propositions
- **Gère** : transition reviewer (submitted → closed, ré-ouvrir, retirer si not submitted)

### 6.3 Consultant du workspace

- **Voit** : tous les feedbacks du snapshot
- **Arbitre** : oui (mêmes droits que CODIR owner)
- **Crée réponses** : oui
- **Gère reviewers** : non (juste CODIR owner)

### 6.4 Superadmin

- **Accès total** : lecture/écriture/suppression
- **Peut supprimer snapshot** même in_review (cascade delete feedbacks)

---

## 7. Notifications

### 7.1 Invitation reviewer (magic link)

- **Trigger** : CODIR owner sélectionne reviewers + clic « Ouvrir revue »
- **Contenu email** : Magic link + contexte (snapshot label, deadline, "vous êtes invité à reviewr")
- **Dédup** : Champ `invitation_sent_at` sur reviewer; vérif avant re-envoi

### 7.2 Reviewer soumis (notification CODIR)

- **Trigger** : Reviewer clic « Soumettre ma revue »
- **Destinataire** : CODIR owner (qui a lancé la revue)
- **Contenu** : Synthèse (X réactions, Y décisions, Z propositions) + lien page arbitrage
- **Timing** : Sync (immédiat)

### 7.3 Contributions arbitrées (notification reviewer)

- **Trigger** : Dernier feedback du reviewer passe pending → {ok, nok, sous_condition}
- **Destinataire** : Reviewer
- **Contenu** : "Vos contributions à la revue [snapshot] ont été examinées par Laurent Dupont"
- **Timing** : Sync après arbitrage
- **Dédup** : Timestamp `reviewer_notified_contributions_arbitrated_at`; envoi une seule fois

---

## 8. Audit trail

### 8.1 Événements à enregistrer (minimaliste)

5 actions clés enregistrées dans `audit_events` :

| Action | Payload |
|--------|---------|
| `snapshot_review_opened` | snapshot_id, reviewer_ids, deadline |
| `reviewer_submitted` | snapshot_id, reviewer_id, submitted_at |
| `feedback_arbitrated` | snapshot_id, feedback_id, codir_status, codir_motivation, codir_user_id |
| `snapshot_review_closed` | snapshot_id, closed_at |
| `snapshot_review_reopened` | snapshot_id, reopened_at, who_reopened |

### 8.2 Qui voit l'audit

- **Superadmin** : accès total
- **Consultant** : accès total
- **CODIR owner** : accès uniquement ses snapshots
- **Reviewer** : aucun accès

---

## 9. Validations & contraintes

### 9.1 Feedback vide

**Règle** : Un feedback doit obligatoirement contenir du contenu.

- `reaction` : `comment` texte non-vide
- `decision` : tous les 3 champs (constat, proposition, bénéfice) remplis
- `proposition_chantier` : tous les 3 champs + titre_chantier remplis

### 9.2 Longueur

- **Sans limite** (tant que Postgres stock la donnée)
- Pas de soft limit UI (laisser les gens s'exprimer)

### 9.3 Motivation CODIR

- **ok** : motivation optionnel (peut être vide)
- **nok** : motivation obligatoire (expliquer pourquoi rejeté)
- **sous_condition** : motivation obligatoire (détailler conditions)

### 9.4 Retrait reviewer

Possible **seulement si** `status ≠ submitted` (i.e., en pending ou draft).

---

## 10. Edge cases

### 10.1 Users non-existants

Si on invite par email quelqu'un sans compte :
- Créer record `roadmap_snapshot_reviewers` avec `user_id = NULL` et `invited_by_email = email`
- Envoyer magic link
- À 1er clic, créer user Supabase + backfill `user_id` sur reviewer record

### 10.2 Suppression snapshot

- **Possible** pour superadmin même si `status = in_review`
- Cascade delete tous les feedbacks associés
- Audit event : `snapshot_deleted`

### 10.3 Snapshot fermé (closed)

- **Peut être ré-ouvert** (transition closed → in_review)
- Cas rare : CODIR veut relancer la revue après un cycle d'ajustements

### 10.4 Hiérarchie feedbacks (parent_id)

- **2 niveaux max par défaut** : feedback reviewer (parent=null) → réponse CODIR (parent=feedback_id)
- **N niveaux optionnel** : config workspace pour activer discussion profonde
- **Affichage** : Accordion (réponses dépliables sous le feedback principal)

### 10.5 Suppression feedback

| Cas | Possible? |
|-----|-----------|
| Reviewer supprime réaction en draft | OUI |
| Reviewer supprime décision en draft | OUI |
| Reviewer supprime réaction après submitted | NON |
| Reviewer supprime décision après submitted | NON |
| Superadmin supprime n'importe quel feedback | OUI (hard delete + audit) |

### 10.6 Trigrammes & affichage

- Chaque feedback signé par **trigramme** du reviewer (ex: `MDU` pour Marie Dupont)
- Réponse CODIR signée par trigramme CODIR (ex: `LTH` pour Laurent Thevenet)
- Config workspace pour convention trigramme (si entreprise a ses propres conventions)

---

## 11. Configuration par workspace

| Config | Scope | Défaut | Impact |
|--------|-------|--------|--------|
| **Propositions partagées** | Workspace | OFF (isolation totale) | Si ON : propositions_chantier visibles tous reviewers |
| **Réponses CODIR partagées** | Workspace | OFF (privées) | Si ON : réponses visibles tous reviewers |
| **Hiérarchie profondeur** | Workspace | 2 niveaux | Si upgrader : N niveaux (discussion freeform) |
| **Convention trigramme** | Workspace | Standard (prénom+nom) | Custom regex si entreprise spécifique |

---

## 12. Cas spécial : Roadmap transverse

Pour roadmaps **transverses** (multi-directions), règle :
- Plusieurs **CODIR owners** possibles (un par direction qui participe)
- Chaque CODIR owner arbitre feedbacks de ses reviewers
- Consultant peut arbitrer tous feedbacks (rôle transversal)

---

## 13. Récapitulatif règles critiques

✅ **Immuable une fois submitted** : décisions/propositions du reviewer  
✅ **Réactions éditables** : tant que snapshot ouvert  
✅ **Pas de nouveaux feedbacks** : une fois submitted (blocage fort)  
✅ **Arbitrage CODIR obligatoire** : pour toutes décisions/propositions  
✅ **Isolation défaut** : entre reviewers (partagé opt-in)  
✅ **Dédup notifications** : via timestamps (invitation_sent_at, reviewer_notified_*)  
✅ **RLS strict** : reviewer voit juste sien, consultant voit tout, CODIR gère  
✅ **Audit minimaliste** : 5 événements clés  
✅ **Ré-ouverture possible** : reviewer repasse draft, nouvelles propositions créables  

---

## 14. Références & dépendances

- [docs/backlog.md](docs/backlog.md) — EPIC 3, REF-7b (cycle revue complet)
- [docs/# Règles métier — Maturity Roadmap.md](docs/#%20Règles%20métier%20—%20Maturity%20Roadmap.md) — Concepts roadmap parent
- [docs/proposition-regles-matrice-permissions.md](docs/proposition-regles-matrice-permissions.md) — Matrice permissions workspaces
