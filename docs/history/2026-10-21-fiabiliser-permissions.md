# Session — fiabiliser les permissions

Date : 21 octobre 2026  
Statut : en cours, plan enregistré, aucun des trois temps commencé

Dernière mise à jour : **21 octobre 2026**, 03 h 14 (Europe/Paris)

## 1) Contexte et objectif

Objectif : garder la stack, et fermer le trou du dossier photos sans casser les logos, les photos de profil ni l’historique.

Contexte :

- Revue externe : la stack React, Vite, Next et Supabase se garde. Le risque est dans les droits non prouvés.
- Le 18 octobre, le dossier `assets` a cessé d’être public. Toute personne connectée peut encore ouvrir n’importe quel fichier.
- La base a été lue le 21 octobre au matin, en lecture seule, sur `kpgkxeilddeyfwiiqaha`.

## 2) Décisions prises

- Priorité la plus haute du backlog : **EPIC 18 · REF-102, REF-103, REF-104**, devant le fil revue.
- Trois temps, avec un arrêt entre chaque. Le temps 2 envoie d’abord l’application, et ne touche la base qu’après vérification des images.
- Les 3 fichiers orphelins (1 logo, 2 photos) deviennent invisibles. Ils ne sont pas effacés. Les 2 logos encore cités sont déplacés.
- L’historique ne change pas de lecteurs ni d’auteurs. On retire seulement les droits SQL de modification et d’effacement.
- Pas de sauvegardes, pas d’alertes de panne, pas de logo public, pas de découpage de fichiers dans ce lot.
- Les modifications déjà présentes sur l’écran et la revue ne sont pas embarquées. `recovery-codes vercel.txt` non plus.

## 3) Changements réalisés

Documentation :

- Plan : `docs/plan-fiabiliser-permissions.md`
- Backlog : EPIC 18 en tête de « Maintenant »

Fonctionnel :

- Aucun. Les trois temps ne sont pas commencés.

Sécurité :

- Aucune règle de la base n’a été modifiée dans cette session.

## 4) Tests et validations

- Lecture des règles du dossier `assets`, de `workspaces` et de `audit_events` : faite.
- Comptage : 5 fichiers, 2 logos cités, 3 orphelins, 0 photo de profil enregistrée sur une fiche.
- Parcours navigateur : non fait. Il appartient au temps 2a.
- Contrôles automatiques : non branchés. Ils appartiennent au temps 1.

## 5) Risques / limites restantes

- Le trou du dossier photos est toujours ouvert.
- Le plan est noté 8/10. Avant le temps 2b, il faut le droit d’exécuter les deux fonctions, et le SQL de retour arrière.
- Le temps 1 ne bloque pas Vercel à lui seul.
- Les 38 documents de `docs/` n’ont pas été relus un par un. Les règles de refactor, la session du 18 octobre et le constat de base gouvernent ce lot.

## 6) URLs et environnements impactés

- Tableau de bord : `https://forge-du-changement.vercel.app` — inchangé
- Site public : `https://forge-du-changement-kgyg-xi.vercel.app` — inchangé
- Base : `kpgkxeilddeyfwiiqaha` — lue, non modifiée
- Local : `http://localhost:5173` si le dashboard tourne. Le serveur Next local ne se lance pas.

## 7) Prochaines étapes

Maintenant :

1. **REF-102** — contrôles automatiques, puis arrêt.
2. **REF-103** — application, preuve des images, arrêt, puis base seulement sur accord.
3. **REF-104** — retrait des droits SQL de modification et d’effacement de l’historique.

Après :

4. Reprendre **REF-7b.4** (recette et commit du masquage), puis le fil revue.

Plus tard :

5. Sauvegardes Supabase et alertes quand l’application plante.

## 8) Références

- Plan : `docs/plan-fiabiliser-permissions.md`
- Backlog : `docs/backlog.md` — EPIC 18
- Session précédente : `docs/history/2026-10-18-invites-photos-vitrine-refactor.md`
- Règles de refactor : `docs/refactor_rules.md`
- Commit : non fait dans cette session pour le code. Ce document enregistre le plan.
