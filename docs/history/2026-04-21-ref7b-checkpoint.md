## Checkpoint REF-7b

Date: 21 avril 2026  
Statut: en cours

### Contexte utile

- Le cadrage fonctionnel REF-7b (A a F) est valide et consolide dans `docs/backlog.md`.
- Le commit de reference est `e0d90c6` (deja pousse sur `main`).
- Le prochain lot de dev est `REF-7b.0` (fondations utilisateur).

### Decisions verrouillees (a conserver)

- Reviewer = utilisateur `contributeur` standard avec UI resserree sur la page review.
- Visibilite reviewer = privee entre reviewers (seul CODIR + auteur voient le detail).
- Feedbacks: `reaction` et `demande de decision`; propositions de chantier structurees.
- Affichage auteur par trigramme, convention configurable workspace.
- Workflow review: soumission unique, puis arbitrage CODIR.

### Prochain lot a implementer (REF-7b.0)

1. Ajouter `users.direction_id` (FK `directions.id`).
2. Ajouter `users.trigram`.
3. Ajouter `workspaces.trigram_convention`.
4. Heriter `direction_id` a l'invitation quand l'inviteur est CODIR.
5. Etendre l'import CSV invitations avec colonnes optionnelles `direction` et `trigram`.

### Points de vigilance

- Garder des commits atomiques par sous-etape (schema, API, UI, CSV).
- Mettre a jour `docs/backlog.md` a la fin de chaque sous-lot.
- Ne pas derivier du perimetre REF-7b.0 avant recette.
