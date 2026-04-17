# Backlog — La Forge du Changement
Dernière mise à jour : 17 avril 2026

## Légende
- 🔴 Priorité haute
- 🟠 Priorité moyenne  
- 🟡 Priorité basse
- ✅ Terminé
- 🚧 En cours
- ⬜ À faire

---

## EPIC 1 — Stabilisation ✅ DONE
Tout l'epic 1 a été implémenté par Cursor le 17/04/2026.

---

## EPIC 2 — Vue DG Consolidée
| # | Titre | Priorité | Statut |
|---|-------|----------|--------|
| 1 | Vue DG — Dashboard consolidé toutes directions | 🔴 | ⬜ |
| 2 | Vue DG — Classement inter-directions top 5 BUILD | 🔴 | ⬜ |
| 3 | Vue DG — Gantt macro consolidé | 🟠 | ⬜ |

---

## EPIC 3 — Maturity Roadmap (Rôles & Rythmes)
| # | Titre | Priorité | Statut |
|---|-------|----------|--------|
| 4 | Structure 4 axes par projet BUILD (Processus/Orga/Outils/KPI) | 🔴 | ⬜ |
| 5 | Création et gestion des jalons | 🔴 | ⬜ |
| 6 | Macro RACI par jalon | 🔴 | ⬜ |
| 7 | Système Réactions/Réponses sur jalons | 🟠 | ⬜ |
| 8 | Vue matrice complète | 🟠 | ⬜ |
| 9 | Dépendances inter-jalons | 🟡 | ⬜ |

---

## EPIC 4 — Plan d'Action d'Équipe (PAE)
| # | Titre | Priorité | Statut |
|---|-------|----------|--------|
| 10 | Structure PAE par manager | 🟠 | ⬜ |
| 11 | Actions concrètes / Ressources / Abandons | 🟠 | ⬜ |
| 12 | Validation N+1 | 🟠 | ⬜ |
| 13 | Lien PAE ↔ Jalon | 🟠 | ⬜ |

---

## EPIC 5 — Plan de Charge
| # | Titre | Priorité | Statut |
|---|-------|----------|--------|
| 14 | Grille mensuelle RUN/BUILD/TRANSFO | 🟠 | ⬜ |
| 15 | Alerte surcharge | 🟠 | ⬜ |
| 16 | Vue synthèse par direction | 🟡 | ⬜ |

---

## EPIC 6 — Module SENS
| # | Titre | Priorité | Statut |
|---|-------|----------|--------|
| 17 | Diagnostic des 5 syndromes | 🟡 | ⬜ |
| 18 | Matrice d'implication | 🟡 | ⬜ |
| 19 | Kit NUI Manager | 🟡 | ⬜ |
| 20 | Modèle de l'aventure | 🟡 | ⬜ |
| 21 | Plan de communication | 🟡 | ⬜ |

---

## EPIC 7 — La Fabrique (Séminaires & Ateliers)
| # | Titre | Priorité | Statut |
|---|-------|----------|--------|
| 22 | Banque de séquences d'animation | 🟡 | ⬜ |
| 23 | Architecte de formats sur mesure | 🟡 | ⬜ |

---

## EPIC 8 — Gestion Managériale & Animation Terrain
| # | Titre | Priorité | Statut |
|---|-------|----------|--------|
| 24 | Assistant situationnel (Spirale/Courbe du changement) | 🟡 | ⬜ |
| 25 | Frise chronologique faits marquants + PASED | 🟡 | ⬜ |
| 26 | Réseau Change Agents | 🟡 | ⬜ |
| 27 | Guide de suivi managérial | 🟡 | ⬜ |
| 28 | Traitement des objections + Livret besoins | 🟡 | ⬜ |
| 29 | Croix de l'implication | 🟡 | ⬜ |

---

## EPIC 9 — Pilotage Projet
| # | Titre | Priorité | Statut |
|---|-------|----------|--------|
| 30 | Cartographie maturité au changement (niveaux 1→5) | 🟡 | ⬜ |
| 31 | Analyse d'impact OMOC | 🟡 | ⬜ |
| 32 | Quadrillage du terrain (cercles concentriques) | 🟡 | ⬜ |

---

## EPIC 10 — Infrastructure & Auth
| # | Titre | Priorité | Statut |
|---|-------|----------|--------|
| 33 | Auth Supabase — Connexion/déconnexion réelle | 🔴 | ⬜ |
| 34 | RLS Supabase sécurisé par workspace | 🔴 | ⬜ |
| 35 | Déploiement Vercel | 🔴 | ⬜ |
| 36 | Export PDF — Vue Synthèse Direction | 🟠 | ⬜ |
| 37 | Export PDF — PAE Manager | 🟡 | ⬜ |

---

## Stack technique
- React + TypeScript (Vite)
- Supabase (PostgreSQL + Storage + RLS)
- GitHub : yoganfr/forge-du-changement

## Tables Supabase
workspaces / users / invitations / directions / 
projets / raci_projets / plan_de_charge / jalons

## Composants principaux
- App.tsx — dashboard, navigation, persistance
- OnboardingFlow.tsx — création espace entreprise
- ProjectSelector.tsx — outil saisie/scoring projets
- CompanySheet.tsx — fiche entreprise
- ProfileSheet.tsx — drawer profil utilisateur
- MemberOnboarding.tsx — espace membre
- src/lib/api.ts — fonctions CRUD Supabase
- src/lib/types.ts — types TypeScript
- src/lib/supabase.ts — connexion Supabase

## Design system
- Couleur accent : #8E3B46 (bordeaux)
- Typo titres : Playfair Display
- Typo corps : Inter
- Thème : dark/light (toggle en haut à droite)
- Variables CSS : themes.css + design-system.css