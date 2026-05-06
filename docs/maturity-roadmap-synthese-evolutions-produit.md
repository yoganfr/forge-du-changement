# Maturity Roadmap — Synthèse des évolutions produit (référence travail)

*Document de synthèse pour aligner implémentations futures. Complète le document principal `docs/# Règles métier — Maturity Roadmap.md` (règles détaillées) sans le remplacer.*

Dernière mise à jour : **6 mai 2026**, 22 h 10 (Europe/Paris)

---

## 1. Paramètres d’échéances (workspace)

**Qui configure** : consultant admin du client, ou client admin si client autonome — dans le panneau **paramètres du workspace** d’entreprise.

**Objectif** : adapter la **maille temporelle** et le **nombre de créneaux** affichés (au-delà du comportement par défaut trimestriel à 4 périodes + années + « Plus tard »).

**Pistes retenues pour une v1** :

- **Maille** : au choix parmi un ensemble fermé (ex. mois, trimestre, semestre, année).
- **Nombre d’échéances** : paramétrable avec **plafond technique** (lisibilité de la grille).
- **Option** : colonne « Plus tard » activable ou non.
- Les **révisions figées** de roadmap devront **conserver la config** d’échéances telle qu’au moment du figement pour une relecture fidèle.

*Détail d’implémentation* : dérivé de la même logique que `buildTimelineColumns()` / `defaultTargetMonthYearForColumn` aujourd’hui, mais **paramétrée** et stockée côté workspace (ex. JSON ou table dédiée).

---

## 2. Fenêtre temps glissante et lecture du retard

- **À venir** : conserver une **période glissante de 4 trimestres** (fenêtre « future » qui avance avec le calendrier).
- **Passé** : continuer d’afficher les **trimestres antérieurs échus** ; les jalons **non réalisés** y restent visibles = **retards**.
- Le **glissement** modifie surtout la **grille affichée** et le **placement en colonne** ; les **dates cibles** en base restent la référence pour statut / retard.

---

## 3. Déclinaison opérationnelle (hors module Roadmap cœur)

**Règle métier** : les **plans d’action** ne se déclinent en détail que pour les **2 premiers trimestres** de la fenêtre des 4 (logique d’**itération** : T+1 et T+2). Les deux derniers trimestres de la fenêtre restent une vision plus macro jusqu’à ce que le temps fasse entrer de nouvelles périodes dans T+1 / T+2.

**Périmètre produit** : les **plans d’action** et le **plan de charge** constituent un **autre module** (PAE / charge — déjà évoqué dans les règles métier comme cascade sous le jalon). **Ne pas** fondre cette logique dans la roadmap tant que le module n’existe pas ; prévoir seulement **repères UX** (zones « détail » vs « vision » sur les colonnes) quand l’écran sera prêt.

---

## 4. Versionnement de la roadmap

| Élément | Règle |
|--------|--------|
| **Mineur** (1.1, 1.2, 1.3, …) | **Incrément à chaque sauvegarde** de la roadmap (snapshot intermédiaire, traçabilité du travail). |
| **Majeur** (V1, V2, V3, …) | **Bouton explicite** réservé à l’**owner** ; aligné sur la **démarche de controverse** avec les équipes (jalon de pilotage collectif, pas seulement un numéro technique). |

**États visés** :

- **Révisions enregistrées** : historique `major.minor`.
- **Charger une version pour modification** : ramener l’état dans un **brouillon** sans muter les snapshots déjà stockés (principe d’immutabilité des révisions sauvegardées).

*Convention exacte `major.minor` et schéma SQL* : à figer au moment de l’implémentation.

---

## 5. Lecture / partage vs édition

- Une **version figée** peut être **lue et partagée** (lien, droits viewer, export — à définir).
- L’**édition** continue sur un **brouillon** / ligne de travail distincte de la version partagée.
- Après versionnement avancé, préciser si le partage pointe sur **une révision** `major.minor` nommée ou sur la **dernière publiée**.

---

## 6. Roadmaps transverses et droits

- **Disjonction BUILD par défaut** : en roadmap « par direction », les projets BUILD portés par un CODIR **ne se recoupent pas** avec ceux d’un autre CODIR du même workspace. Chaque CODIR a **son** périmètre BUILD.
- **Seul levier de recoupement** : une **roadmap transversale** — seul cas métier où les **mêmes** BUILD peuvent être portés ou co‑portés par **plusieurs** périmètres / CODIR, avec règles de gouvernance explicites.
- **Co-owners** : uniquement pour les **roadmaps projets transverses** impliquant **plusieurs périmètres métiers**.
- **Édition** : **CODIR** (titulaire) ; **consultant** avec autorisation **en renfort** si besoin.
- **Implémentation** : politiques RLS / table des membres éditeurs selon le type de roadmap (direction vs transverse) ; ne pas inférer un partage BUILD multi‑CODIR sans flag / type « transverse ».

---

## 7. Controverse et intelligence collective (parcours futur)

- **Court terme** : la **V majeure** est le geste produit qui matérialise une étape de **controverse / alignement** avec les équipes.
- **Plus tard** : parcours dédié **« controverse »** pour que les équipes **se représentent collectivement** où elles en sont dans l’avancement (intelligence collective). Ce parcours pourra **s’articuler** avec le passage en V majeure sans être bloquant pour une première version du versionnement.

---

## 8. Check-list pour les prochains chantiers d’implémentation

1. Stockage paramètres **échéances** workspace + lecture dans la grille et le modal jalon.
2. Ajustement **timeline** : 4 trimestres à venir + zone **passé** / retards.
3. Modèle **révisions** `major.minor`, sauvegarde mineure, **bouton V majeure** owner.
4. **Brouillon** vs **révisions** + chargement pour édition sans corruption de l’historique.
5. Règles **transverse** : co-owners + permissions CODIR / consultant.
6. Module séparé **PAE / plan de charge** (hors scope roadmap cœur).
7. Parcours **controverse** (backlog produit distinct).

---

*Historique : synthèse des arbitrages produit convenus en session de cadrage ; section 10 ajoutée pour refléter l’implémentation et la solidification dans le dépôt.*

---

## 9. Proposition d’implémentation (phases)

### Phase A — Paramètres d’échéances workspace

- Stocker la configuration d’échéances du workspace (`grain`, `slot_count`, `include_later`, etc.) dans `workspaces` (JSON) ou table dédiée.
- Appliquer des policies RLS : lecture membres workspace, écriture admin autorisés (consultant admin client / client admin autonome).
- Refactor de la construction des colonnes pour utiliser les paramètres (`buildTimelineColumns(settings, now)`).

### Phase B — Fenêtre glissante et retards

- Afficher en permanence **4 trimestres à venir** (fenêtre future glissante).
- Conserver une zone de périodes **échues** pour visualiser l’historique et les jalons en retard (non réalisés).
- Garder `mois_cible` / `annee_cible` comme référence en base ; seul le mapping visuel en colonnes évolue.

### Phase C — Versionnement `major.minor`

- Créer une table de révisions roadmap (ex. `roadmap_revisions`) avec `major`, `minor`, `snapshot jsonb`, auteur, horodatage.
- **Mineur** : incrément automatique **à chaque sauvegarde**.
- **Majeur** : action explicite owner via bouton dédié (alignée avec le cycle de controverse).
- **Chargement d’une version pour modification** : restaurer la version dans un brouillon de travail sans muter les snapshots passés.

### Phase D — Lecture / partage d’une version figée

- Partager en lecture une révision précise `major.minor` (lien tokenisé ou droits viewer).
- Découpler strictement l’état partagé (figé) de l’état éditable (brouillon courant).

### Phase E — Roadmaps transverses et co-owners

- Introduire le type de roadmap (direction vs transverse) et la liste des éditeurs (`owner`, `co_owner`, `consultant_support`).
- Activer les co-owners uniquement pour les roadmaps transverses multi-périmètres.
- Appliquer les permissions d’édition selon vos règles CODIR + consultant en renfort.

### Phase F — Modules futurs (hors scope immédiat)

- Garder les **plans d’action** et le **plan de charge** dans un module séparé, relié plus tard aux jalons.
- Préparer le futur parcours de **controverse** (intelligence collective), articulé avec les bascules de versions majeures.

### Phase G — Intégration des managers contributeurs dans le champ Responsable

**Contexte métier** : Aujourd'hui, le champ **Responsable** d'un jalon est un texte libre où le membre CODIR inscrit manuellement le nom du manager opérationnel en charge de l'atteinte du jalon. Ce manager sera, à terme, la personne qui déclinera le jalon en Plan d'Action d'Équipe (PAE) dans le futur module EPIC 4.

**Évolution visée** : Transformer le champ Responsable en un **sélecteur** lié à une liste de managers contributeurs définis dans le workspace. Cela permettra :

- D'éviter les erreurs de saisie (fautes de frappe, doublons « Jean Dupont » vs « J. Dupont »)
- De pré-remplir automatiquement le champ « Manager » lors de la création d'un PAE à partir d'un jalon
- De filtrer la roadmap par responsable (ex. : « Tous les jalons de Sarah »)
- De détecter les surcharges : si un même manager est responsable de trop de jalons simultanés, alerte automatique

**Implémentation technique (à prévoir)** :

- Nouvelle table `managers` ou extension de la table `users` avec un flag `is_manager` et rattachement au workspace
- Migration des responsables actuels (texte libre) vers des références si possible (détection par similarité de nom)
- Fallback : garder le texte libre pour les cas où le manager n'est pas encore dans le système

**Prérequis** : Cette phase dépend de l'existence du module PAE (EPIC 4) ou au minimum d'une gestion des contributeurs terrain dans l'application. Elle n'est **pas prioritaire** tant que le PAE n'existe pas.

**Ordre de livraison** : après les Phases A→E (paramètres échéances, fenêtre glissante, versionnement, lecture/partage figé, co-owners transverses). Peut être livrée en même temps ou juste avant le module PAE pour maximiser la valeur.

### Dépendance explicite (décision UI / données)

- La colonne **`jalon_dependance_id`** est **conservée** en PostgreSQL pour réversibilité et usages éventuels (reporting, ré-import).
- L’**interface de détail jalon** ne propose **plus** la sélection d’une dépendance : la **lecture métier** privilégie l’ordre des jalons sur la ligne de chantier.
- Document associé : alignement avec `docs/# Règles métier — Maturity Roadmap.md` (section dépendances).

### KPI ↔ jalon KPI auto (cohérence axe KPI)

- Lorsque le **parent** (hors miroir) porte un couple **indicateur + valeur cible** renseigné, l’app crée ou met à jour un **jalon miroir** sur l’**axe KPI**, dans un chantier KPI au **même intitulé** que le chantier parent, avec la **même échéance**.
- **Intitulé + échéance** du jalon miroir sont **verrouillés** côté UI sur le jalon KPI (pilotés depuis le parent).
- **Suppression manuelle** du jalon miroir : les champs KPI du **parent** sont **vidés** (le parent n’est pas supprimé).
- Script SQL : `docs/supabase-jalons-kpi-source.sql` (`kpi_source_jalon_id` + index unique).

### Ordre de livraison recommandé

1. Paramètres d’échéances (Phase A).
2. Fenêtre glissante + retards (Phase B).
3. Versionnement mineur/majeur + brouillon (Phase C).
4. Lecture/partage figé (Phase D).
5. Co-owners transverses et permissions avancées (Phase E).
6. Intégration managers contributeurs dans le champ Responsable (Phase G, conditionné au PAE ou à une gestion des contributeurs terrain).
7. Parcours controverse et module plans d’action (Phase F, ultérieur).

---

## 10. État technique dans le dépôt (référence)

*Mis à jour le 20 avril 2026 — aligné sur le code et les scripts SQL versionnés.*

### Phase 1 (fonctionnelle)

- Écran **Maturity Roadmap** (chantiers, jalons 4 axes, RACI, grille timeline) branché sur Supabase.
- Schéma / évolutions SQL documentées dans `docs/` (ex. `supabase-maturity-roadmap-phase1.sql`, contraintes jalons/axes, validation décideur projets, etc.).

### Phase 2 — Solidification (livré)

- **Vagues 1–3 (avril 2026)** : fermeture modales/drawer sans faux positifs (sélection texte), RACI en grilles homogènes, **échéance jalon** alignée sur les colonnes timeline, **dépendance explicite masquée en UI**, **création de direction inline** (anti-doublon), **jalon KPI miroir** synchronisé avec le parent (`kpi_source_jalon_id`).
- **Vue décideur (MVP gouvernance)** : renommage UX, garde d’accès lecture/action par rôle, validation/retrait avec revue obligatoire, et historique des décisions via `audit_events`.
- **Sécurité backend** : garde SQL dédiée sur `projets.dg_validated_transfo` (autoriser `consultant/admin/pilote/superadmin`, bloquer `codir/contributeur`).
- **Mode test léger** : environnement unique maintenu, avec sandbox interne et script `docs/reset-demo.sql` pour remettre à zéro les données de recette manuelle.
- **API modulaire** : logique découpée en `src/lib/api/*.ts` (roadmap, workspaces, users, projets, directions, invitations, cache, audit, storage) avec **`src/lib/api.ts`** qui réexporte l’ensemble pour ne pas casser les imports existants.
- **Performances** : `getWorkspaceDirectionsWithProjects` charge les directions puis **tous les projets du workspace en une requête**, puis groupe côté client par `direction_id` (plus de requête projet par direction).
- **Qualité** : tests **Vitest** ciblés (`npm run test`) sur `normalizeAxeForDb`, tri des jalons par axe/ordre, construction des colonnes timeline et placement jalon / date cible (`src/lib/api/roadmap.test.ts`, `src/lib/roadmapTimelineColumns.test.ts`).
- **Storage** : les uploads d’images continuent d’exposer une **URL publique** via `getPublicUrl` ; une utilitaire **`createSignedAssetUrl`** est disponible pour une migration progressive vers des **URLs signées** (bucket assets — voir aussi `docs/supabase-storage-assets-hardening.sql`).

### Suite logique côté produit / code

Les **phases A à G** et le **volet Phase F** (controverse / plans d’action, ultérieur) ci-dessus restent la feuille de route fonctionnelle ; la Phase 2 prépare surtout la maintenance, les perfs liste directions/projets, et la bascule storage sécurisée sans bloquer les évolutions métier (paramètres workspace, fenêtre glissante, révisions, etc.).

---

*Dernière mise à jour du document : 20 avril 2026 — synthèse métier + point d’ancrage technique repo.*
