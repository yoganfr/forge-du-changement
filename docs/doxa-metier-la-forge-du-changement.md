# Doxa métier — La Forge du Changement

**Document de synthèse narrative** pour aligner produit, implémentations et agents IA sur le **sens métier** de l’outil. Il **ne remplace pas** les règles détaillées (`docs/# Règles métier — Maturity Roadmap.md`, `docs/# Règles métier — REF-7b.2 …`, matrice permissions, backlog) : il les **ordonne** et en donne la **lecture d’ensemble**.

Dernière mise à jour : **1 novembre 2026**, 16 h 19 (Europe/Paris)

---

## 1. À quoi sert ce document

| Pour qui | Utilité |
|----------|---------|
| **Humains** | Onboarding métier, cadrage fonctionnel, arbitrages produit sans relire 15 fichiers. |
| **Agents IA** | Point d’entrée **avant** les specs fines ; évite les réponses « hors rails » quand le contexte conversationnel est incomplet. |
| **Implémentation** | Chaîne de dépendance conceptuelle : **pourquoi** avant **comment** (tables, écrans, RLS). |

**En cas de conflit** entre ce résumé et un document détaillé, **la source détaillée et le backlog font foi**, et ce fichier doit alors être corrigé. Exception : les décisions du **1 novembre 2026** sur le dirigeant, la lecture entre CODIR, le reviewer, le chef de projet, l’administrateur de l’espace, le projet présent sur plusieurs directions, et l’écran de la revue. Elles priment ici tant que les pages détaillées disent encore l’ancienne règle. Ces pages sont `docs/# Règles métier — Maturity Roadmap.md` §1 bis, `docs/maturity-roadmap-synthese-evolutions-produit.md` §6 et `docs/proposition-regles-matrice-permissions.md`.

---

## 2. Promesse produit (une phrase)

**La Forge du Changement** est un SaaS d’**accompagnement de transformations d’entreprise** qui structure le **dialogue managérial** et la **mémoire** du changement — du **discours de transformation** au **pilotage par jalons**, en passant par la **revue collective** des roadmaps — sans se réduire à un outil de reporting.

---

## 3. Continuum méthodologique (ordre du récit métier)

La méthode sous-jacente suit un **continuum** déjà posé dans les documents fondateurs :

1. **Discours de transformation** (dirigeant / comité) — cadrage du sens, controverse utile, « nous » collectif ; amont de la dynamique *(voir `docs/Référence Discours de transformation.md` pour la méthode ; module produit distinct du roadmap).*  
2. **Projets transformants (BUILD)** — sélection et priorisation.  
3. **Maturity Roadmap** — pour chaque périmètre pertinent, transformation de l’intention en **jalons datés** sur 4 axes (Processus, Organisation, Outils, KPI).  
4. **Revue / controverse sur version figée** — passage **V1 → retours des équipes → arbitrages → V2** (cycle REF-7b).  
5. **À terme** : **PAE** (plan d’action d’équipe) et **plan de charge** — déclinaison opérationnelle **sous le jalon**, module séparé *(EPIC 4–5, hors cœur grille roadmap).*  

**Principe directeur** (règles roadmap) : *« Le processus est plus important que le résultat. »* La valeur est dans le **dialogue structuré**, les arbitrages traçables et la **mémoire vivante** (6 mois à 2 ans), pas dans une liste figée de jalons.

---

## 4. Organisation entreprise et rôles dans le récit

### 4.1 Côté « réel » entreprise

- La **direction générale** pilote le cap global.  
- Le **comité de direction** rassemble les **membres CODIR** par domaines (DRH, DAF, DSI, etc.) : **piliers fonctionnels**.  
- Sous chaque pilier, des **managers** (N‑1 hiérarchiques et dans le **périmètre métier** du CODIR) portent l’exécution.  
- Un **reviewer** est un N-1 du CODIR qui possède la roadmap, dans son périmètre fonctionnel. Ce n’est pas un rôle à part : au moment d’ouvrir la revue, on l’invite **comme contributeur**. Cela vient **après** une réunion réelle où la V1 a été partagée. Ces personnes commentent la version figée et nourrissent le passage **V1 → V2**.

### 4.2 Côté plateforme (rôles techniques)

Les **rôles métier** sont portés par la table `users.role` et la matrice documentée :

| Rôle app | Qui c’est dans le récit |
|----------|-------------------------|
| **codir** | Membre du comité. Il **possède sa roadmap** et les **chantiers** qui y sont rattachés. Il lance la **revue** vers ses N-1. Il **lit** les roadmaps des autres CODIR du même espace. Sur un projet qui traverse plusieurs directions, il **contribue pour sa part, sur sa roadmap**. |
| **pilote** | Chef de projet. Il **voit et peut modifier toutes les roadmaps** de l’entreprise, et il peut **ouvrir une revue**. Quand il consulte une revue, il **garde le menu complet**. L’arbitrage des retours reste au CODIR. |
| **contributeur** | Personne invitée à commenter **cette** revue, en général le N-1 du comité, après la réunion de partage de la V1. Pendant cette revue, **son écran se resserre** : elle reste sur la revue, sans le reste du produit. |
| **consultant** | Accompagne le client ; droits selon owner / collaborateur sur le workspace. |
| **admin** | Administrateur de **l’espace entreprise** (invitations, paramètres). Il **voit et peut modifier toutes les roadmaps**, comme le chef de projet. Il peut **ouvrir une revue**. Il **n’arbitre pas** les retours : cela reste au comité. |
| **superadmin** | Plateforme ; exceptionnel, traçable. |

**Invitations** : consultants (sur le dossier), admins client et **CODIR** peuvent inviter selon les règles *(voir `docs/proposition-regles-matrice-permissions.md`).*

**Dirigeant** : ce n’est pas un rôle de la table `users`. C’est un membre **CODIR désigné** sur l’espace pour porter le discours de transformation. **Tant qu’il est désigné**, il ouvre la **Vue décideur** en plus de son rôle CODIR.

**Vue décideur** (ex-DG) : lecture, validation décideur et historique pour **superadmin**, **consultant**, **admin**, **pilote**, et pour le **dirigeant** désigné. Les autres **codir** et les **contributeurs** ne l’ouvrent pas. La **validation décideur** est un **jalon de gouvernance** (date + commentaire obligatoires).

### 4.3 Périmètre projet BUILD et CODIR (règle d’or)

Décision du **1 novembre 2026**, précisée à **16 h 19**. Elle remplace à la fois « les BUILD sont disjoints, sauf roadmap transversale explicite » et « le voisin ne modifie que les lignes du projet sur la roadmap de l’autre ».

- Chaque membre **CODIR** **possède sa roadmap** et les **chantiers** qui y sont rattachés. Ce n’est pas la grille du voisin.
- Il **lit** la roadmap d’un autre CODIR du même espace.
- Un projet qui traverse plusieurs directions est porté **sur la roadmap de chaque direction concernée**. Chaque comité **contribue pour sa part, sur sa propre roadmap**. Il ne réécrit pas la part du voisin.
- Dans l’outil aujourd’hui, un projet peut être **marqué transverse**. La fenêtre « Ouvrir la revue » propose alors les personnes des autres directions. Le Gantt qui lirait toutes les directions ensemble reste à faire (EPIC 2 · REF-3).

---

## 5. Espace de travail et directions

- Un **workspace** = une **entreprise cliente** (dossier fermé, isolation par RLS).  
- Les **directions** segmentent les roadmaps (ex. DRH, DAF) ; les utilisateurs peuvent avoir un `direction_id` (fondations REF-7b.0, invitations CSV).  
- La **roadmap par direction** est le support naturel du **CODIR** qui pilote ce domaine.  
- Un projet qui couvre **plusieurs directions** est porté **sur la roadmap de chaque direction**, chacun pour sa part. Le comité **lit** la part du voisin et ne la réécrit pas. Pour le **tableau de pilotage de revue**, la campagne reste classique : la fenêtre propose les autres directions quand la version figée contient un tel projet.

---

## 6. Module cœur — Maturity Roadmap

### 6.1 Structure des contenus

```
PROJET BUILD (retenu)
  └── CHANTIER (regroupement thématique)
      └── 4 AXES (Processus, Organisation, Outils, KPI)
          └── séquence de JALONS (cheminement dans le temps)
```

### 6.2 Jalons

- **Réalisation attendue à date**, formulée au **passé**, maille **mois + année**, statut piloté manuellement.  
- **Cascade future** : jalon → **PAE** → actions / ressources / plan de charge *(module futur ; pas fusionné dans la roadmap).*  

### 6.3 RACI macro (jalon) vs PCI (chantier)

- **Pilote / Impliqué / Informé** au niveau **jalon** : directions organisationnelles ; **un seul Pilote** par jalon.  
- **PCI chantier** (Parties prenantes sur le chantier) : modèle stakeholder-centric dans la grille principale — distinct du RACI jalon ; utile pour les **reviewers** qui découvrent les chantiers.

### 6.4 Triple distinction opérationnelle (à ne pas confondre)

| Concept | Question métier |
|---------|-----------------|
| **Responsable** (texte / futur lien user) | Qui porte l’atteinte **terrain** ? Souvent **manager N‑1/N‑2** ; futur rédacteur du **PAE**. |
| **Décideur** | Qui **valide formellement** le jalon ? Souvent le **CODIR** owner ou délégué. |
| **Pilote RACI** | Quelle **direction** porte la ligne macro ? (pas une personne.) |

### 6.5 Validation décideur (projets)

Traitement dédié **Vue décideur** : pas un clic anodin ; **traçabilité** via `audit_events`.

---

## 7. Versionnement et snapshots

- La roadmap **vit** : ajustements permanents dans le **brouillon courant**.  
- Une **version majeure (V1, V2…)** matérialise une étape de **pilotage collectif** et de **controverse** — pas seulement un numéro technique *(synthèse évolutions §4).*  
- Les **snapshots** figent l’état pour relecture / revue ; distinction future **mineur / majeur** et **partage lecture** documentée dans `docs/maturity-roadmap-synthese-evolutions-produit.md`.  
- **Cohérence long terme** : tout module aval (PAE, charges) devra référencer **quelle révision / snapshot** il utilise pour éviter les dérives.

---

## 8. Cycle de revue roadmap (REF-7b)

**But** : une réunion réelle partage la **V1**. Ensuite seulement, le **CODIR** ouvre la revue sur la roadmap figée et invite ses **N-1** comme **contributeurs**. Ils commentent. Le **CODIR** arbitre. La roadmap évolue vers **V2**. Le chef de projet et l’administrateur de l’espace peuvent ouvrir une revue ; ils n’arbitrent pas les retours. Quand le chef de projet consulte la revue, il garde le menu complet. L’écran se resserre seulement pour les personnes invitées à commenter **cette** revue.

Points **structurels** *(détail exhaustif dans `docs/# Règles métier — REF-7b.2 Cycle de revue feedback.md`)* :

- Tables **reviewers par snapshot**, **feedbacks unifiés** (réaction / décision / proposition chantier), **deadline**, **RLS**.  
- **Isolation** par défaut entre reviewers ; option workspace de partage des propositions.  
- **Soumission unique** de la revue par reviewer ; arbitrage **OK / NOK / sous condition** sur les demandes structurées ; **réactions** gérées autrement (accusé réception).  

**Point d’entrée technique REF-7b** : `docs/README_ref7b-reviewerpage.md`.

### 8.1 Décisions produit — pilotage de la revue (cadrage validé)

*Synthèse de sessions Q&R ; à tenir alignée avec la matrice permissions et les REF d’implémentation.*

| Thème | Décision |
|--------|----------|
| **Première victoire visible** | Le **CODIR** dispose d’un **tableau simple** par campagne de revue basé sur une **chaîne d’états** lisible (voir §8.2) — sans attendre un chantier « organisation hiérarchique » complet en base. |
| **Constitution de l’équipe de revue** | Après la réunion réelle de partage de la V1, le CODIR invite ses N-1 **comme contributeurs** en ouvrant la revue. S’il y a un projet transverse, la fenêtre propose aussi les personnes des autres directions. |
| **Visibilité du tableau de pilotage** | **CODIR** concerné ; **consultants** rattachés au dossier ; **super admin** plateforme ; **administrateur de l’espace entreprise** (`admin`) lorsqu’il existe ; **chef de projet** (`pilote`) lorsqu’il existe. *(À recouper avec `docs/proposition-regles-matrice-permissions.md` lors de l’implémentation RLS / écran.)* |
| **Projet transverse** | Le même projet est porté sur la roadmap de chaque direction, chacun pour sa part. Le tableau de pilotage reste celui d’une campagne classique. La fenêtre d’ouverture propose les autres directions quand la version figée contient un tel projet. |
| **Écran pendant la revue** | Seules les personnes invitées à commenter **cette** revue voient l’écran resserré. Le chef de projet garde le menu complet. Décision du 1 novembre 2026, 16 h 19. |
| **Pilotage sans « flicage »** | **Pas d’horodatage** (heure / minute) sur les états pour les managers : l’objectif est la **clarté du pilotage** et la **responsabilisation**, pas la surveillance fine. Les échéances métier (deadline de revue) restent un cadre **collectif** affiché ailleurs, pas une traque individuelle. |

#### §8.2 Chaîne d’états — pilotage reviewer (décision produit)

Pour chaque personne assignée comme **reviewer** sur une campagne (snapshot), le tableau suit **quatre jalons** successifs (affichage **état courant** ou pastilles cochées, sans heure) :

1. **E-mail envoyé** — l’invitation à participer à cette revue a été envoyée.  
2. **Compte créé** — la personne a un **accès actif** à l’espace (compte rattaché au workspace / invitation honorée côté identité).  
3. **Revue commencée** — **premier feedback enregistré** par ce reviewer sur cette campagne (snapshot), quel que soit le type de feedback (réaction, demande de décision, proposition chantier, etc.).  
4. **Revue soumise** — la personne a actionné **« Soumettre ma revue »** pour cette campagne (aligné sur le cycle REF-7b.2).

**Principe** : responsabiliser les acteurs et donner au CODIR une **vision d’avancement** ; **pas** d’outil de contrôle horaire ni de journal individuel timestampé dans ce tableau.

---

## 9. Autres modules (aperçu)

| Thème | Rôle dans le récit |
|-------|-------------------|
| **Discours** | Amont symbolique et méthodologique ; outil d’assistant à la structuration — pas le cœur roadmap. |
| **Vue décideur / dashboard** | Consolidation et **validation** à la gouvernance. |
| **EPIC 17 — Parcours** | Déverrouillage progressif des modules **CODIR** vs **contributeur** (`current_step_codir` / `current_step_contributeur`). |
| **EPIC 15** | Cohabitation **Vite / Next.js** ; pas une règle métier mais une contrainte d’architecture front. |

---

## 10. Principes transverses pour l’implémentation

1. **Vérité métier** : ne pas inventer APIs, colonnes ou politiques RLS non documentées.  
2. **Sécurité** : RLS par workspace ; **jamais** service role côté client ; matrice permissions avant toute nouvelle permission.  
3. **Thème UI** : tokens CSS (`src/themes.css`, design system), pas de couleurs magiques.  
4. **Traçabilité** : actions sensibles → `audit_events` où prévu.  
5. **Refactor** : pas de refactor sans problème concret *(voir `docs/refactor_rules.md`).*

---

## 11. Glossaire express

| Terme | Sens |
|-------|------|
| **BUILD** | Projet transformant retenu. |
| **Chantier** | Regroupement thématique sous un projet. |
| **Jalon** | État cible atteint à une date (pas une « todo »). |
| **Snapshot** | Copie figée de la roadmap à un instant T (revue, historique). |
| **Reviewer** | N-1 du CODIR propriétaire, invité **comme contributeur** au moment de la revue, après la réunion réelle de partage de la V1. Pas un rôle à part. |
| **Dirigeant** | Membre CODIR désigné sur l’espace pour porter le discours. Tant qu’il l’est, il ouvre la Vue décideur. |
| **Projet transverse** | Même projet porté sur la roadmap de chaque direction concernée, chacun pour sa part. |
| **PCI** | Parties prenantes au niveau **chantier** (matrice dans la grille). |
| **PAE** | Plan d’action d’équipe — module **futur**, sous le jalon. |

---

## 12. Cartographie des sources (lire selon le chantier)

| Sujet | Document principal |
|-------|---------------------|
| Philosophie roadmap, jalons, RACI jalon, exemples | `docs/# Règles métier — Maturity Roadmap.md` |
| Versionnement, phases futures (échéances, transverse, PAE) | `docs/maturity-roadmap-synthese-evolutions-produit.md` |
| Cycle revue, feedbacks, arbitrage | `docs/# Règles métier — REF-7b.2 Cycle de revue feedback.md` |
| Permissions en langage clair | `docs/proposition-regles-matrice-permissions.md` |
| REF-7b point d’entrée code / état | `docs/README_ref7b-reviewerpage.md` |
| UX ReviewerPage | `docs/architecture-ux-reviewerpage-ref7b5.md` |
| Priorisation, REF, état implémentation | `docs/backlog.md` |
| Méthode discours (hors roadmap) | `docs/Référence Discours de transformation.md` |
| Git / commits agents | `docs/git-commit-conventions.md` |
| Règles agents (portable) | `docs/ai-agent-shared-context-rules.md` |

---

*Ce document est volontairement stable dans sa structure : les évolutions fines doivent rester dans les documents listés en section 12 ; mettre à jour la section concernée ici lorsque le récit global change.*
