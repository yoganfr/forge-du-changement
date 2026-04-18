# Règles métier — Maturity Roadmap

*Document de référence pour la construction du module Maturity Roadmap de La Forge du Changement. À conserver pour toute évolution future.*

---

## 1. Philosophie du module

La Maturity Roadmap est le **cœur** de l'outil. Elle transforme une intention stratégique (projet BUILD retenu par le CODIR) en réalisations concrètes, datées, sous la responsabilité de directions identifiées.

**Principe directeur** : *« Le processus est plus important que le résultat. »*

Ce n'est pas un outil de reporting. C'est un outil de **dialogue structuré** entre un DG, ses Directeurs et les équipes. La rédaction collective des jalons, les arbitrages sur le RACI, les réactions et réponses sur les points de controverse sont la vraie valeur — plus que la liste finale des jalons elle-même.

**Durée d'une transformation réelle** : 6 mois à 2 ans. L'outil devient la **mémoire vivante** de la transformation.

---

## 2. Hiérarchie complète de la structure

```
PROJET BUILD (retenu pour la transformation)
  └── CHANTIER (regroupement thématique du projet)
      └── 4 AXES — chaque axe raconte le cheminement du chantier
          ├── AXE 1. PROCESSUS MÉTIERS
          │   └── séquence de jalons (1.1 → 1.2 → 1.3)
          ├── AXE 2. ORGANISATION
          │   └── séquence de jalons
          ├── AXE 3. OUTILS (IT et autres)
          │   └── séquence de jalons
          └── AXE 4. KPI'S (mesure du changement)
              └── séquence de jalons
```

**Cascade future** (modules à construire ensuite) :

```
JALON (Maturity Roadmap — présent module)
  └── PAE — Plan d'Action d'Équipe (module futur)
      ├── Actions concrètes (Qui / Début / Fin)
      ├── Ressources nécessaires
      └── Plan de charge (faisabilité RUN/BUILD/TRANSFO)
```

Un jalon définit **ce qu'on veut atteindre et quand**. Le PAE définira **comment y arriver concrètement** au niveau terrain.

---

## 3. Les 4 axes de transformation

Chaque chantier se décline sur 4 dimensions complémentaires. Un chantier ne peut pas être une vraie transformation s'il ignore l'un des axes.

### Axe 1 — Processus métiers
La manière de réaliser les tâches métiers de l'entreprise. Les façons de faire concrètes du quotidien opérationnel.
**Couleur** : bordeaux `#8E3B46` (caramel-candy-600)

### Axe 2 — Organisation
La comitologie, les circuits de décision, le découpage des rôles et responsabilités, la synchronisation des informations.
**Couleur** : bleu acier `#4C86A8` (steel-blue-400)

### Axe 3 — Outils
Les supports de travail, qu'ils soient IT ou non (applicatifs, équipements, documents de référence, matériels).
**Couleur** : vert canard `#477890`

### Axe 4 — KPI's
La mesure du changement. Les indicateurs qui permettent de savoir si la transformation produit ses effets.
**Couleur** : ambre `#B45309` (orecchiette-600)

---

## 4. Définition rigoureuse du jalon

Un **jalon** est une **réalisation attendue à date**. Pas une action, pas une intention : une photographie d'un état cible atteint.

### Les 4 règles de rédaction

1. **Formulé au passé**
   - ✅ « L'ensemble de l'équipe a été formée »
   - ❌ « Former l'équipe »

   Le jalon renvoie à l'aboutissement des actions qui ont été mises en œuvre en amont. Il marque la fin d'une étape.

2. **À la bonne maille**
   Un jalon n'est pas une action, c'est une résultante d'une succession d'actions. Ne pas descendre trop bas en granularité.

3. **Spécifique**
   Éléments concrets facilement appréhendables. Éviter une formulation trop conceptuelle ou théorique.

4. **Concis**
   Pour favoriser la mémorisation en une phrase.

### Les 6 facettes à considérer

Pour construire une roadmap complète, il faut généralement penser à des jalons dans plusieurs de ces catégories :

- **Conceptualisation / Formalisation / Diagnostic**
- **Formation / Sensibilisation**
- **Communication**
- **Acquisition d'une pratique / d'un réflexe**
- **Production / Contribution à la réalisation**
- **Autre**

Cette liste sert de checklist mentale pour vérifier qu'aucune dimension n'est oubliée.

---

## 5. Caractéristiques d'un jalon

| Attribut | Description |
|---|---|
| **Numéro** | Auto-calculé : 1.1, 1.2 pour axe Processus, 2.1 pour Organisation, etc. |
| **Nom** | Formulé au passé, spécifique, concis |
| **Description** | Texte libre, contexte et enjeux |
| **Date cible** | Mois + année (trimestre calculé automatiquement) |
| **Statut** | À venir / En cours / Réalisé / Bloqué |
| **Responsable** | Nom libre de la personne en charge |
| **Décideur** | Nom libre de la personne qui valide le jalon |
| **KPI** | Indicateur de suivi + valeur cible |
| **Facette** | Conceptualisation, Formation, Acquisition, Production, Communication, Autre |
| **RACI** | Pilote / Impliqué / Informé au niveau direction |
| **Dépendance** | Vers un autre jalon (optionnel) |
| **Note de contexte** | Texte libre pour les points spécifiques |

---

## 6. Macro RACI (3 niveaux + Décideur)

Le RACI classique (4 rôles) est trop lourd pour un pilotage de transformation. On utilise un RACI simplifié à 3 niveaux :

- **◉ PILOTE** → Responsable de la ligne. **Une seule direction par jalon.**
- **◎ IMPLIQUÉ** → Contribue activement. 1 à N directions.
- **○ INFORMÉ** → Tenu au courant. 0 à N directions.

Plus un champ libre **Décideur** : qui valide formellement le jalon ? (peut être une personne physique, différente de la direction Pilote).

### Contrainte technique
Un seul PILOTE par jalon (contrainte unique en base).

---

## 7. Maille temporelle

**Unité de positionnement** : mois + année

**Unité d'agrégation** : trimestre (calculé automatiquement à partir du mois)
- Mois 1-3 → Q1
- Mois 4-6 → Q2
- Mois 7-9 → Q3
- Mois 10-12 → Q4

**Horizon pertinent** : 1 an glissant maximum. Poser des jalons à plus d'un an à la maille trimestre serait antinomique de la dynamique agile de transformation — la roadmap doit pouvoir s'adapter au fil des réalisations et des évolutions de contexte.

---

## 8. Règles de pilotage

### Enchaînement logique
Les jalons d'un même axe dans un chantier doivent se succéder dans un enchaînement logique. Chaque jalon succède au précédent en racontant le cheminement dans le temps.

### Statut piloté manuellement
Le responsable déclare lui-même le passage d'un statut à l'autre. Pas de déclenchement automatique.

### Dépendances inter-jalons
Un jalon peut dépendre d'un autre jalon (d'un autre axe ou d'un autre chantier). Permet de visualiser le chemin critique.

### Alerte surcharge (règle future)
Si une direction est RACI Pilote ou Impliquée sur trop de jalons simultanés sur un même trimestre, une alerte est déclenchée.

---

## 9. Dialogue structuré — Réactions et réponses (phase future)

Chaque jalon peut recevoir des **réactions** des parties prenantes :

- **✋ Question** — « J'ai besoin d'éclaircissement »
- **💡 Proposition** — « Je propose une amélioration »
- **⚠️ Risque** — « Je vois un risque »

Le responsable du jalon apporte une **réponse** :

- **✅ OK** — accepté en l'état
- **❌ NOK** — refusé, avec motif
- **🔄 OUI, à condition que…** — accepté sous conditions explicitées

Chaque échange est horodaté et nominatif. C'est ça l'intelligence collective rendue visible et productive. Le **fil de controverse maîtrisée** est une feature différenciante de l'outil.

---

## 10. Exemples concrets

### Exemple 1 — Atelier Fouquet's (2017)

**Projet** : Obtenir un excellent niveau de service
**Chantier** : Améliorer la prise de réservations téléphoniques

**Axe Processus métiers — séquence de jalons** :
- 1.1 « Les supports du standard ont été créés et distribués » (Juillet 2017)
- 1.2 « L'ensemble de l'équipe a été formée » (Août 2017)
- 1.3 « La procédure de contrôle a été déployée et le respect du standard est opérationnel » (Septembre 2017)

**Actions pour le jalon 1.1** (relèvera du PAE futur) :
- Créer et distribuer le support avec les détails du standard
- Rappel du standard : décrocher avant 3 sonneries / 10 secondes
- Formation sur la réponse standard : « Fouquet's Paris, [prénom], bonjour/bonsoir, en quoi puis-je vous aider ? »

### Exemple 2 — Construire sa maison (pédagogique)

**Projet** : Construire ma maison éco-responsable

**Séquence de jalons** (tous formulés au passé) :
- Jalon 1 : Le budget global est défini
- Jalon 2 : La recherche du terrain est effectuée avec le terrain choisi
- Jalon 3 : Le plan de construction est établi
- Jalon 4 : Le permis de construire est délivré
- Jalon 5 : Le terrain a été viabilisé
- Jalon 6 : Les prestataires sont retenus pour la construction avec devis validés
- Jalon 7 : La maison est livrée en bon fonctionnement

Chaque jalon a ses propres actions associées (qui seront dans le PAE).

### Exemple 3 — BEL Algérie (2016-2019)

**Structure constatée** : chaque direction (DAF, DRH, DSI, DC, SC) avait sa propre Maturity Roadmap.

**Numérotation par axe et par direction** :
- 1.1 DAF, 1.2 DAF (axe Processus — DAF)
- 2.1 DAF (axe Organisation — DAF)
- 3.1 DAF (axe Outils — DAF)
- 4.1 DAF (axe KPI — DAF)

**Exemple d'un jalon** :
- 1.1 DRH (axe Processus, direction DRH)
- Nom : « Le réseau documentaire HRBPs a été architecturé »
- Responsable : Zahia Tamendjari
- RACI Pilote : DRH
- RACI Impliqué : DSI
- Trimestre cible : Q1 2017

---

## 11. Philosophie de construction de la roadmap

**Être réaliste dans le timing** : prendre en compte la saisonnalité et la capacité du service à absorber les actions découlant des jalons.

**Rendre compte du cheminement dans le temps** : chaque jalon doit succéder au précédent dans un enchaînement logique.

**Capturer toutes les facettes** du chantier (voir section 4).

**Identifier des indicateurs simples** : capacité à mesurer ou observer l'indicateur + facilité d'accès aux données.

**Accepter que la roadmap évolue** : au fil des réalisations et des évolutions de contexte, les jalons peuvent être décalés, reformulés, ajoutés, retirés. La roadmap n'est pas gravée dans le marbre.

---

## 12. Différenciation vs Excel / outils classiques

Ce que la Maturity Roadmap apporte qu'un tableur ne peut pas faire :

| Tableur | Maturity Roadmap |
|---|---|
| Vue statique | Mémoire vivante sur 6 mois – 2 ans |
| Un fichier par direction | Vue consolidée multi-directions |
| Pas de dialogue | Réactions/Réponses horodatées |
| Pas de dépendances visuelles | Chemin critique entre jalons |
| Pas d'alerte | Surcharge RACI détectée auto |
| Pas de traçabilité | Journal des décisions et arbitrages |
| Statut déclaratif local | Statut consolidé multi-acteurs |

---

## 13. Ressources de référence

- **Atelier Fouquet's 7 juin 2018** — Y. Hedef & S. Lachaux — « Élaboration des jalons par projet »
- **Missions BEL Algérie 2016-2019** — Maturity Roadmaps DAF / DRH / DSI / DC / SC
- **Historique de conversation Claude du 17 avril 2026** — 117 pages de raisonnement méthodologique
- **Document régles permissions** — `docs/proposition-regles-matrice-permissions.md`

---

*Document créé le 18 avril 2026. À mettre à jour au fil des évolutions méthodologiques et des retours d'usage.*