# 2026-04-20 - Landing Workspace & Copywriting

## 1. Contexte et objectif

Conception de deux types de landing dans le produit :

- Landing publique (acquisition SEO via Next.js)
- Landing workspace (in-product, orientée usage et activation)

Objectif principal :
Transformer un discours abstrait de transformation en un parcours structuré, visible et actionnable via une timeline verticale.

---

## 2. Decisions prises

### Architecture globale

- Utilisation de Next.js App Router
- Route principale workspace : `/workspace/[id]/home`
- Suppression de React Router (routing natif Next.js)

### Double landing

1. Landing publique :
   - Rôle : acquisition
   - CTA : "Voir un parcours réel →"
   - Redirection vers workspace demo

2. Landing workspace :
   - Rôle : pilotage et activation
   - Interface centrale du produit

---

### Structure du parcours

Timeline verticale avec 6 étapes :

1. Prioriser les projets transformants
2. Construire une roadmap claire
3. Engager les équipes
4. Décliner en actions concrètes
5. Lancer réellement
6. Piloter dans la durée

Micro-copy associée :
"Chaque étape est un moment collectif. Pas un automatisme."

---

### Logique produit clé

- Progression pilotée manuellement (intelligence collective)
- Stockage : `workspaces.current_step` (1 à 6)
- Pas d'automatisation

---

### Logique UX timeline

3 états obligatoires :

- Étape active :
  - Pin avec point rouge
  - Carte mise en avant
  - CTA principal

- Étapes passées :
  - Visuellement validées
  - CTA secondaire (consultation)

- Étapes futures :
  - Désaturées
  - CTA verrouillé

---

### Positionnement produit

Ce n’est pas :

- une landing classique
- un dashboard
- un onboarding

C’est :

→ une interface de transformation

---

## 3. Changements réalisés

### Design

- Timeline verticale type "route"
- Pins en goutte avec cercle central
- Gradient bleu (progression visuelle)
- Cartes alignées à droite

### Hero

H1 validé :
"La transformation : du discours à l'action!"

### Navigation

- Ajout lien "Accueil" → `/workspace/[id]/home`
- Ajout menu "Décideur" (restreint aux rôles avancés)
- Suppression éléments "La Fabrique"

### Redirection

- Login → redirect automatique vers workspace home

---

## 4. Tests et validations

Validé côté landing publique :

- 404 workspace inexistant
- 404 workspace privé
- Sitemap dynamique (is_public)
- Metadata SEO
- ISR 1h
- URLs configurables

Validé côté produit :

- Logique des 6 étapes
- Cohérence avec philosophie transformation
- Progression manuelle

---

## 5. Risques / limites restantes

- Absence initiale de routage (résolu via Next.js)
- Risque de confusion si états visuels mal implémentés
- Timeline perçue comme décorative sans logique active
- Nécessité de cohérence forte entre landing publique et workspace

---

## 6. URLs et environnements impactés

- `/workspace/[id]/home` → landing workspace
- `/workspace/demo/home` → mode démonstration
- Landing publique → redirection vers workspace demo

Variable critique :
- `NEXT_PUBLIC_SITE_URL`

---

## 7. Prochaines étapes

1. Implémentation structure Next.js (App Router)
2. Création page `/workspace/[id]/home`
3. Développement composants :
   - LandingHero
   - LandingTimeline
   - LandingStepCard
4. Intégration logique `current_step`
5. Ajout scroll auto vers étape active
6. Mise en place mode démo
7. Panneau admin pour gestion étape

---

## 8. References

Documents :

- maturity-roadmap-synthese-evolutions-produit.md
- regles métier roadmap
- proposition permissions workspace

Assets :

- Route_VF.png
- pin_avec_point_rouge.png
- images hero responsive

Contexte technique :

- Next.js App Router
- Supabase (service role côté serveur)

---

## Synthèse finale

Le produit repose sur une idée centrale :

→ rendre visible, partageable et pilotable un parcours de transformation

La landing workspace devient :

- le point d’entrée opérationnel
- le support de l’alignement collectif
- le moteur de passage à l’action

"Un workspace. Une route. Une équipe alignée."
