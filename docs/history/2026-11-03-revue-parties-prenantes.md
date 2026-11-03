# Session historique - Revue des parties prenantes

Date: 3 novembre 2026  
Statut: terminee

Dernière mise à jour : **3 novembre 2026**, 02 h 32 (Europe/Paris)

## 1) Contexte et objectif

Objectif de session: mener **EPIC 3 · REF-7b.5** jusqu'à la recette, puis l'enregistrer.

Contexte:

- Le cœur V1 de la page de revue était déjà livré. Restaient les parties prenantes figées, le tiroir sous 768 px et l'enregistrement jusqu'à la soumission.
- La story révision 4 et le plan révision 2 décrivent l'encart, le crayon et le commentaire vierge.
- La recette s'est faite dans World Company, sur la version V10 novembre 2026, avec Corinne Contributrice.

## 2) Decisions prises

- Les parties prenantes sont copiées dans la version figée au moment du figement. Les versions déjà figées ne sont pas reconstruites.
- Sous 768 px, le panneau de commentaire couvre l'écran et se ferme par un geste explicite.
- L'enregistrement de la contribution reste jusqu'à la soumission. Pas de brouillon nommé.
- Sur une partie prenante déjà commentée, chaque commentaire déjà saisi est un encart, avec un crayon. Un commentaire vierge est ouvert en dessous.
- Après soumission, une réaction reste modifiable tant que la version est ouverte. Le formulaire d'un commentaire nouveau disparaît. Phrase de constat : le crayon n'a pas été retiré.

## 3) Changements realises

Infrastructure:

- Aucun changement de schéma. Les parties prenantes sont dans le payload jsonb de l'item chantier.

Fonctionnel:

- Au figement, les lignes PCI du chantier sont copiées. Sur la revue, la lettre d'une partie prenante ouvre le commentaire.
- L'enregistrement crée une ligne, puis met à jour cette ligne. L'encart et le commentaire vierge sont sur la partie prenante.
- Commit `7a91113` sur `main`.

Securite:

- Aucun droit nouveau. La copie reste dans la revue déjà ouverte. La revue sensible de la story révision 4 est non requise pour cette raison.

Configuration:

- Aucune variable d'environnement nouvelle.

## 4) Tests et validations

- Figement de V10 : quatre parties prenantes sur Logiciel de planning. V1 mai 2026 n'en gagne pas.
- Clic sur le C de DRH : le panneau dit Partie prenante DRH.
- Rechargement : l'encart Réaction montre le texte, avec un crayon. Le formulaire du dessous est vide.
- Second commentaire : deux encarts, formulaire vide après enregistrement.
- Sous 768 px : le panneau couvre l'écran. Fermer et Échap le ferment.
- Après Soumettre ma review : les encarts restent. Le formulaire nouveau n'est pas là. Les crayons des réactions restent.

Validations metier:

- Le statut ✅ du backlog constate cette recette. Il n'approuve pas de story et n'autorise rien.

## 5) Risques / limites restantes

- Une demande de décision devenue immuable après soumission n'a pas été rejouée.
- Le même encart sur un chantier ou un jalon est hors plan.
- Les versions figées avant ce lot n'ont pas de parties prenantes copiées.

## 6) URLs et environnements impactes

- Dev: `http://localhost:5173/`
- Preview: déploiement Vercel du dashboard à partir de `main`
- Prod: `https://forge-du-changement.vercel.app`

## 7) Prochaines etapes

Maintenant:

1. **REF-7b.5ter** — indicateurs de feedbacks sur la grille.

Apres:

2. **REF-7b.6** — panneau flottant.

Plus tard:

3. Rejouer, si besoin, une demande de décision après soumission.

## 8) References

- Backlog: `docs/backlog.md`
- Story et plan: `docs/plan-ref-7b.5-reviewerpage-frontend.md`
- Commit: `7a91113`
- Regle: `docs/# Règles métier — REF-7b.2 Cycle de revue feedback.md` §2.3
