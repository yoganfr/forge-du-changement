# 2026-04-20 - Analyse de situation (version nettoyée)

Statut : note de pilotage nettoyée (non canonique backlog)  
Source : synthèse issue de l'analyse `20-04-26 - Analyse situation par GPT.md`, consolidée avec les documents métier du projet.

## 1) Diagnostic consolidé

### Résumé

Au 20 avril 2026, le projet est solide sur :

- socle technique et sécurité (auth, permissions, audit)
- cœur produit roadmap (largement livré)
- canal acquisition SEO via l'app Next.js `web/`

Les manques majeurs sont fonctionnels/séquentiels :

- fermer la boucle conversion/activation de la landing (EPIC 14 restant)
- livrer le dialogue structuré (`REF-7`)
- fermer le gap décideur transverse (`REF-3`)

### Lecture exécutive (direction)

| Dimension | Diagnostic | Implication |
|---|---|---|
| Produit | Solide mais incomplet | Le cadrage est crédible, l'exécution terrain reste partielle. |
| Technique | Base saine | Architecture hybride Vite + Next.js validée. |
| Acquisition | Bien engagée | SEO en place, conversion encore à fermer. |
| Pilotage | Priorisé mais peu daté | Priorités claires, calendriers officiels encore faibles. |

## 2) Points ouverts prioritaires

1. **Navigation cible publique/privée**  
   Clarifier officiellement les rôles respectifs de `/workspace/[id]` (public SEO) et d'une éventuelle route privée type `/workspace/[id]/home`.

2. **EPIC 14 restant - REF-73/74/75**  
   Finaliser `LandingTimeline`, hero responsive, CTA intelligent.

3. **EPIC 3 - REF-7**  
   Livrer réactions/réponses sur jalons (feature différenciante du dialogue structuré).

4. **EPIC 2 - REF-3**  
   Livrer le Gantt macro consolidé multi-directions.

## 3) Écarts documentaires à surveiller

- Certains documents de plan intermédiaire ne sont plus alignés avec les arbitrages de livraison (variables d'env, logique de sécurité publique).
- Les décisions de navigation (public/privé, place de "La Fabrique") doivent être consolidées dans une source de référence unique.
- Le copywriting V3 est la référence active et doit rester l'unique base de contenu.

## 4) Plan recommandé (proposition)

### Maintenant

1. ADR navigation et IA (routes publiques/privées + rôle des menus)
2. EPIC 14: REF-73/74/75
3. EPIC 3: REF-7
4. EPIC 2: REF-3

### Apres

5. EPIC 11 : REF-50/51 (MFA super-admin + journal CSV)
6. Arbitrage EPIC 13 : REF-36 (export PDF autonome selon besoin réel)

### Plus tard

7. EPIC 4/5 (PAE + plan de charge)
8. Phases roadmap avancées (paramètres d'échéances, fenêtre glissante, versionnement)

## 5) Règles d'usage de ce document

- Cette note sert de synthèse de pilotage.
- La source canonique de priorisation reste `docs/backlog.md`.
- Les règles métier restent dans :
  - `docs/# Règles métier — Maturity Roadmap.md`
  - `docs/maturity-roadmap-synthese-evolutions-produit.md`
  - `docs/proposition-regles-matrice-permissions.md`
