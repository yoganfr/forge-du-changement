# Conventions de commit — La Forge du Changement

Objectif: garder un historique clair, lisible par l'equipe et exploitable par des outils de changelog/release.

## Format standard

`type(scope): action courte orientee metier`

Exemple:

- `fix(roadmap): corriger chevauchement des labels mini-frise`

## Types autorises

- `feat`: nouvelle fonctionnalite
- `fix`: correction de bug
- `refactor`: amelioration interne sans changement fonctionnel visible
- `style`: ajustement UI/UX sans changement de logique metier
- `perf`: optimisation de performance
- `test`: ajout/modification de tests
- `docs`: documentation
- `chore`: maintenance/outil/configuration

## Scopes recommandes dans ce repo

- `dg`
- `roadmap`
- `selector`
- `gantt`
- `auth`
- `supabase`
- `rls`
- `ui`
- `docs`
- `rules`

## Regles de redaction

- Sujet en francais, verbe d'action au present (`aligner`, `corriger`, `simplifier`)
- Sujet court (idealement <= 72 caracteres)
- Pas de point final dans la ligne de sujet
- Un commit = une intention principale
- Corps optionnel si utile:
  - pourquoi le changement
  - impact fonctionnel/technique
  - migration/eventuels risques

## Trailer "Made-with"

Quand le commit est prepare par l'agent Cursor (Composer/Auto), ajouter:

`Made-with: Cursor AI`

Quand il est redige manuellement dans l'IDE, option possible:

`Made-with: Cursor`

## Exemples adaptes au projet

- `feat(roadmap): ajouter synchronisation jalon KPI miroir`
- `fix(dg): aligner mini-frise sur l'aperçu de saisie`
- `refactor(gantt): mutualiser les marqueurs de plage active`
- `style(selector): harmoniser l'entete des cartes RUN et BUILD`
- `docs(roadmap): clarifier role Responsable versus Decideur`

## Option stricte (plus tard)

Si souhaite: activer une validation automatique du message de commit (hook Git)
pour refuser les messages hors format.
