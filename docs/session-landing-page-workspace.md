# Session Landing Page Workspace — Point de pause

**Date :** 20 avril 2026  
**Heure :** Pause demandée par Yogan  
**Contexte :** Préparation landing page workspace avec timeline verticale (route)

---

## 🎯 État actuel de la discussion

### ✅ **Éléments validés**

#### **1. Structure générale**
- **Landing page** : `/workspace/:id/home`
- **Timeline VERTICALE** (route de haut en bas, pas horizontale)
- **6 étapes** du parcours transformation
- **Design** : Inspiré de `Route_VF.png` et `pin_avec_point_rouge.png`

#### **2. Les 6 étapes — Titres définitifs**

| # | Titre | Module | État |
|---|-------|--------|------|
| 1 | Priorisation & sélection des projets transformants | Selector | ✅ Disponible |
| 2 | Déclinaison des projets transformants validés en Maturity Roadmap (1ère version) | Maturity Roadmap | ✅ Disponible |
| 3 | Engager les équipes pour faire évoluer la Maturity Roadmap (2nde version) | Évolution V2 | 🔜 Bientôt |
| 4 | Décliner les jalons en Plans d'actions managériaux et plans de charge | PAE | 🔜 Bientôt |
| 5 | Organiser le kick-off de la mise en œuvre | Kick-off | 🔜 Bientôt |
| 6 | Suivi et pilotage de la Maturity Roadmap & des plans d'action managériaux | Suivi | 🔜 Bientôt |

#### **3. Design timeline verticale**
- **Route verticale** bleue/grise sur le côté gauche
- **Pins en forme de goutte** pointant vers la droite
- **Cercle blanc** au centre de chaque pin
- **Point rouge** dans le cercle blanc = étape active (cf. `pin_avec_point_rouge.png`)
- **Gradient de couleur** des pins : bleu foncé (haut) → bleu clair (bas)

#### **4. Cartes étapes**
- Alignées à **droite de chaque pin**
- Contenu : numéro + titre + description (Lorem ipsum temporaire) + badge état + CTA
- **PAS d'avatar** (retiré par rapport à l'image de référence)
- Design : Reprend tokens du thème existant

#### **5. Hero section**
- Images responsive fournies (desktop/tablette/mobile)
- **H1** : "La transformation : du discours à l'action!"

#### **6. Navigation & Navbar**

**Changements navbar :**
- ✅ **Ajouter** : Lien "Accueil" (vers `/workspace/:id/home`)
- ❌ **Retirer** : Tout ce qui concerne "La Fabrique"
- ✅ **Ajouter** : Menu déroulant "Décideur" (au survol)
  - Discours transformation (grisé "Bientôt disponible")
  - Vue décideur (existante)
- **Visible seulement** pour : `consultant`, `admin`, `pilote`, `superadmin`

#### **7. Comportement au login**
- **Option A retenue** : Redirect automatique vers `/workspace/:id/home`

#### **8. Configuration étape active**
- **Stockage** : `workspaces.current_step` (INTEGER 1-6)
- **Changement** : Entièrement **manuel** (philosophie temps collectif)
- **Qui** : `superadmin`, `consultant`, `pilote`
- **Où** : Settings workspace (engrenage) > Onglet "Parcours transformation"

#### **9. Permissions menu Décideur**
- **Accès** : `consultant`, `admin`, `pilote`, `superadmin`
- **Masqué** pour : `codir`, `contributeur`

---

## 🚨 **POINT BLOQUANT IDENTIFIÉ**

### **Routage URL inexistant**

**Constat :** L'application actuelle **n'a pas de routage URL**.

**Décision Yogan :** 
> "Peut-être est-ce un projet préalable à la landing ?"

**Réponse Claude :** OUI, c'est un prérequis.

**Ordre d'implémentation proposé :**
1. ✅ **Phase 1** : Mise en place routage (React Router ou autre)
2. ✅ **Phase 2** : Création landing page
3. ✅ **Phase 3** : Menu Décideur navbar
4. ✅ **Phase 4** : Panneau admin configuration étape

---

## ❓ **6 QUESTIONS BLOQUANTES EN ATTENTE DE RÉPONSE**

### **1. Routage — Quel routeur ?**
Pour mettre en place le routage :
- **React Router** (standard SPA) ?
- **Next.js App Router** (si migration Next.js) ?
- **Autre solution** déjà utilisée dans le projet ?

**Impact :** Architecture complète de l'app à refactorer.

---

### **2. Routes modules existants — Où sont-ils actuellement ?**
Yogan dit : *"accessible dans l'espace personnel"*

**Question :**
- C'est un **composant conditionnel** affiché selon un état interne (pas de route) ?
- C'est un **hash router** (`#/selector`, `#/roadmap`) ?
- C'est **autre chose** ?

**But :** Comprendre l'architecture actuelle pour planifier la refonte.

---

### **3. "La Fabrique" — C'est quoi exactement ?**
Yogan demande de retirer tout ce qui concerne "La Fabrique".

**Question :**
- C'est un **lien navbar** à supprimer ?
- C'est un **module complet** à désactiver ?
- C'est un **nom de page** à renommer ?

**But :** Savoir quoi supprimer précisément dans le code.

---

### **4. Ordre d'implémentation — Confirmation**

**Scénario proposé :**

**Phase 1 — Routage (préalable) :**
1. Installer React Router
2. Créer routes pour modules existants (`/selector`, `/roadmap`)
3. Refactorer navigation actuelle
4. Tester

**Phase 2 — Landing page :**
1. Créer route `/workspace/:id/home`
2. Créer composants landing (hero, timeline, cartes)
3. Intégrer dans navbar
4. Configurer redirect au login

**Phase 3 — Menu Décideur :**
1. Ajouter dropdown navbar
2. Lien "Discours transformation" (grisé)
3. Lien "Vue décideur" (existant)

**Phase 4 — Panneau admin :**
1. Ajouter onglet "Parcours transformation" dans settings
2. UI de sélection `current_step`
3. Persistance en base

**Question :** Validez-vous cet ordre ?

---

### **5. Assets hero — Intégration**

Les 3 images hero fournies :
- Comment gérer le **responsive** ? `<picture>` avec srcset ? CSS `background-image` avec media queries ?
- Où stocker les assets ? `/public/images/hero/` ?

---

### **6. Mise à jour doc — Maintenant ou après ?**

Faut-il mettre à jour `maturity-roadmap-synthese-evolutions-produit.md` :
- **Maintenant** (Section 11 — Landing Page) ?
- **Après implémentation** (pour refléter le code réel) ?

---

## 📦 **Assets fournis**

**Visuels hero responsive :**
- `/mnt/user-data/uploads/1_-_Desktop_hero_image_-_2560x1440.png`
- `/mnt/user-data/uploads/2_-_Tablette_hero_image_-_1536x2048.png`
- `/mnt/user-data/uploads/3_-_Mobile_hero_image_-_1080x1920_v2.png`

**Références design timeline :**
- `/mnt/user-data/uploads/Route_VF.png` (timeline verticale complète)
- `/mnt/user-data/uploads/pin_avec_point_rouge.png` (détail pin actif)

**Captures d'écran références étapes 1 & 4 :**
- `/mnt/user-data/uploads/1776680284871_image.png` (étape 1 — Sélection projets)
- `/mnt/user-data/uploads/1776680353634_image.png` (étape 4 — Rédaction roadmap)

---

## 🎯 **Prochaine étape au retour**

**Action attendue de Yogan :**
Répondre aux **6 questions bloquantes** ci-dessus.

**Action Claude ensuite :**
Selon les réponses, préparer :

**A)** Prompt pour **Phase 1 — Mise en place routage** (si nécessaire)

**OU**

**B)** Si routage déjà existant (surprise), passer directement à :  
Prompt pour **Phase 2 — Création landing page** (hero + timeline verticale + cartes)

---

## 📚 **Documents de référence consultés**

- `/mnt/project/__Règles_métier___Maturity_Roadmap.md`
- `/mnt/project/proposition-regles-matrice-permissions.md`
- `/mnt/project/maturity-roadmap-synthese-evolutions-produit.md`
- `/mnt/project/git-commit-conventions.md`

---

## 💾 **Schéma base de données à ajouter**

```sql
-- Table workspaces
ALTER TABLE workspaces 
ADD COLUMN current_step INTEGER DEFAULT 1 
CHECK (current_step >= 1 AND current_step <= 6);
```

---

## 🔧 **Composants à créer (architecture proposée)**

```
src/
├── pages/
│   └── WorkspaceLanding.tsx (page principale)
├── components/
│   ├── LandingHero.tsx (hero avec image responsive)
│   ├── LandingTimeline.tsx (timeline verticale route)
│   └── LandingStepCard.tsx (carte étape individuelle)
└── lib/
    └── routes.ts (définition routes si routage créé)
```

---

## 📝 **Notes importantes**

### **Philosophie produit rappelée par Yogan**
> "Cela doit être manuel, ça c'est le temps collectif qui est important ! On développe l'intelligence collective !"

→ Pas de progression automatique des étapes. C'est un **jalon humain** (réunions, séminaires, engagement terrain), pas un trigger technique.

### **Contenu temporaire**
- Descriptions des cartes : **Lorem ipsum** pour l'instant
- Yogan rédigera les vrais textes après implémentation de la structure

### **Design cohérent**
- Reprendre les **tokens du thème existant** pour les cartes
- Pas d'ajout de nouvelles couleurs/polices arbitraires
- S'inspirer du design system déjà en place

---

## ✅ **État de la session précédente (contexte)**

**Travail accompli avant cette session :**
- ✅ Suppression checkboxes pilules jalons roadmap (commits `1d6e0c0` + `4febe69`)
- ✅ Sync Git réussie après plusieurs tentatives (Cursor oubliait de push)
- ✅ Lecture règles métier roadmap
- ✅ Compréhension permissions Vue décideur

**Workflow établi :**
1. Yogan propose un besoin/visuel
2. Claude challenge tous les aspects
3. Questions/réponses itératives
4. Synthèse validée
5. Prompt pour Cursor préparé
6. Yogan exécute dans Cursor
7. Commit + push Git

---

## 🎯 **Rappel final**

**Au retour de Yogan :**
1. Lire ce fichier de sauvegarde
2. Répondre aux 6 questions bloquantes
3. Claude prépare le(s) prompt(s) adapté(s)
4. Exécution dans Cursor
5. Validation/itération

**Fichier sauvegardé :** `/home/claude/session-landing-page-workspace-pause.md`

---

**Session mise en pause. À reprendre exactement ici.** 🚀
