# Doxa métier — La Forge du Changement

**Document de synthèse narrative** pour aligner produit, implémentations et agents IA sur le **sens métier** de l’outil. Il **ne remplace pas** les règles détaillées (`docs/# Règles métier — Maturity Roadmap.md`, `docs/# Règles métier — REF-7b.2 …`, matrice permissions, backlog) : il les **ordonne** et en donne la **lecture d’ensemble**.

Dernière mise à jour : **6 mai 2026**, 21 h 31 (Europe/Paris)

---

## 1. À quoi sert ce document

| Pour qui | Utilité |
|----------|---------|
| **Humains** | Onboarding métier, cadrage fonctionnel, arbitrages produit sans relire 15 fichiers. |
| **Agents IA** | Point d’entrée **avant** les specs fines ; évite les réponses « hors rails » quand le contexte conversationnel est incomplet. |
| **Implémentation** | Chaîne de dépendance conceptuelle : **pourquoi** avant **comment** (tables, écrans, RLS). |

**En cas de conflit** entre ce résumé et un document détaillé ultérieur, **la source détaillée et le backlog font foi** ; ce fichier doit alors être corrigé.

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
- Ce sont en général **ces managers** qui sont **sollicités comme reviewers** de la roadmap préparée par **leur** membre CODIR : ils donnent les **feedbacks** qui nourrissent le passage **V1 → V2**.

### 4.2 Côté plateforme (rôles techniques)

Les **rôles métier** sont portés par la table `users.role` et la matrice documentée :

| Rôle app | Qui c’est dans le récit |
|----------|-------------------------|
| **codir** | Membre du comité / pilier fonctionnel ; prépare et porte **sa** roadmap de direction ; lance la **revue** vers ses N‑1. |
| **pilote** | Chef de projet / conduit des projets transformants dans l’outil. |
| **contributeur** | Participation ciblée ; **les reviewers de revue roadmap** sont des contributeurs **invités** sur le périmètre (pas un rôle séparé « reviewer »). |
| **consultant** | Accompagne le client ; droits selon owner / collaborateur sur le workspace. |
| **admin** | Administrateur de **l’espace entreprise** (invitations, paramètres selon règles). |
| **superadmin** | Plateforme ; exceptionnel, traçable. |

**Invitations** : consultants (sur le dossier), admins client et **CODIR** peuvent inviter selon les règles *(voir `docs/proposition-regles-matrice-permissions.md`).*

**Vue décideur** (ex-DG) : accès **lecture / validation décideur / historique** pour certains rôles ; **exclus** pour `codir` et `contributeur` dans la matrice actuelle — la **validation décideur** est un **jalon de gouvernance** (date + commentaire obligatoires).

---

## 5. Espace de travail et directions

- Un **workspace** = une **entreprise cliente** (dossier fermé, isolation par RLS).  
- Les **directions** segmentent les roadmaps (ex. DRH, DAF) ; les utilisateurs peuvent avoir un `direction_id` (fondations REF-7b.0, invitations CSV).  
- La **roadmap par direction** est le support naturel du **CODIR** qui pilote ce domaine ; les roadmaps **transverses** (multi-domaines) sont un cas **plus tard** (co‑owners, REF synthèse §6).

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

**But** : après préparation **humaine** (réunion de mise en main, etc.), le **CODIR** ouvre la revue sur une **roadmap figée** ; les **reviewers** (managers N‑1 du périmètre) commentent ; le **CODIR** arbitre ; la roadmap évolue vers **V2**.

Points **structurels** *(détail exhaustif dans `docs/# Règles métier — REF-7b.2 Cycle de revue feedback.md`)* :

- Tables **reviewers par snapshot**, **feedbacks unifiés** (réaction / décision / proposition chantier), **deadline**, **RLS**.  
- **Isolation** par défaut entre reviewers ; option workspace de partage des propositions.  
- **Soumission unique** de la revue par reviewer ; arbitrage **OK / NOK / sous condition** sur les demandes structurées ; **réactions** gérées autrement (accusé réception).  

**Point d’entrée technique REF-7b** : `docs/README_ref7b-reviewerpage.md`.

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
| **Reviewer** | Contributeur **invité** à commenter un snapshot précis (souvent manager N‑1 du CODIR). |
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
