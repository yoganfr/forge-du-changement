# AI Agent Shared Context Rules

This document is model-agnostic and can be shared with Claude AI and GPT Codex.
Its purpose is to define which project documents must be read before acting.

> **For agents running inside Cursor**: the authoritative, richer version of these rules lives at [`.cursor/rules/forge-du-changement-contexte.mdc`](../.cursor/rules/forge-du-changement-contexte.mdc) (applied automatically, `alwaysApply: true`). This file is the portable mirror for agents running outside Cursor. Keep both files aligned.

## Fast-path instruction for AI agents

AI agents should read and apply the **English section only** (`EN`) to save time.
The French section (`FR`) is a human-friendly mirror and does not add extra rules.

---

## EN

## Goal

Ensure consistent decisions by reading core business and process documents first, then loading additional documents based on the user request.

## Mandatory documents (always read)

Read in this order:

1. `docs/doxa-metier-la-forge-du-changement.md` — single narrative spine (method continuum, CODIR / N‑1 reviewers, **each CODIR owns its roadmap; a cross-direction project sits on each roadmap, each for its own part**, glossary); short; does not replace detailed rules below. The detailed pages may still state the older formula; the doxa prevails until they are aligned.
2. `docs/# Règles métier — Maturity Roadmap.md`
3. `docs/git-commit-conventions.md`
4. `docs/maturity-roadmap-synthese-evolutions-produit.md`

## Conditional documents (read when relevant)

- If the request is about refactoring (refactor, refacto, technical restructuring), also read:
  - `docs/refactor_rules.md`
- If the request adds a function, a header, a secret, or a database rule, also read:
  - `docs/regles-securite-codage.md`
- If the request is about product evolution (features, roadmap, priorities, sprint planning), also read:
  - `docs/backlog.md`
- If the request is a new behavior, a right, or a fix: read the 1 November 2026 decision at the top of `docs/AI-AGENT-FEATURE-PLANNING-WORKFLOW.md`. A qualified fix follows the existing short plan: no story file, no passage conditions. Any other subject follows that workflow before any technical plan. A critical review precedes any story approval; a new story revision refreshes it, and the sensitive review too when that review applies. Set « approuvée » or « autorisé » only to record an explicit user phrase, quoted and tied to the revisions. A clarification is not an agreement. A blocker leaves the scope only with an explicit user agreement. On resume, suspend only the validation actually invalidated, say why, and restore it only after a new explicit agreement. A message that starts with a keyword from section 3 of `docs/GUIDE-UTILISATEUR-IA-CURSOR.md` stands for that prompt and its stops. Accents are optional. `approuve`, `planifie`, and `code` require the REF and the revisions in the same message. `planifie` and `code` wait while a blocker is open. `historise` records the lot, pushes it, updates the backlog, writes the session history, then pushes those texts. It does not invent a REF number. It approves nothing and authorizes nothing. A keyword in the middle of a sentence does not count.
- If there is any doubt about roles, permissions, or access rights, also read:
  - `docs/proposition-regles-matrice-permissions.md`
- If the request touches UI, CSS, components styling, theme, or visual consistency, also read:
  - `docs/visual-coherence-theme-rules.md`
- If the request touches the migration from `/src` (Vite SPA) to `/web` (Next.js), also read:
  - `docs/backlog.md` (EPIC 15, sections "Critères de bascule" and "Risques majeurs")
  - `web/AGENTS.md` (Next.js 16 breaking changes)

## Git workflow (mandatory)

- Commit format: `type(scope): short business-oriented action` in French, subject ≤ 72 chars, no trailing dot. See `docs/git-commit-conventions.md`.
- Mandatory trailer for agent commits: empty line + `Made-with: Cursor AI` (or equivalent for the agent in use).
- After every agent commit, immediately `git push` to the current branch. Exception: only if the user explicitly asks not to push.
- Default working branch = `main`. If on a feature branch or if `main` diverges from `origin/main`, flag and ask for confirmation before committing.

## Consistency rules

1. Use business rules and permissions matrix as the primary source for functional decisions.
2. Follow commit conventions for any proposed commit message or git workflow guidance.
3. If two documents conflict, explicitly flag the conflict, propose a resolution, and ask for user confirmation before applying a conflicting decision.
4. If a document appears obsolete or contradictory, explicitly warn before implementation.

## Recommended usage in prompts

Use this instruction in AI prompts:

"Before answering, read and apply `docs/ai-agent-shared-context-rules.md`, then read the required documents listed inside."

---

## FR (miroir humain)

### Objectif

Garantir des decisions coherentes en lisant d'abord les documents socles metier et process, puis les documents complementaires selon la demande.

### Documents obligatoires (toujours lire)

Ordre recommande :

1. `docs/doxa-metier-la-forge-du-changement.md` — fil narratif unique (continuum methode, organisation CODIR / reviewers N-1, **chaque CODIR possède sa roadmap ; un projet transverse est porté sur chaque roadmap, chacun pour sa part**, glossaire) ; court ; ne remplace pas les regles detaillees ci-dessous. Les pages détaillées peuvent encore dire l'ancienne formule ; la doxa prime tant qu'elles ne sont pas alignées.
2. `docs/# Règles métier — Maturity Roadmap.md`
3. `docs/git-commit-conventions.md`
4. `docs/maturity-roadmap-synthese-evolutions-produit.md`

### Documents conditionnels (lire si pertinent)

- Si la demande concerne la refactorisation (refactor, refacto, restructuration technique), lire aussi:
  - `docs/refactor_rules.md`
- Si la demande ajoute une fonction, un en-tete, un secret ou une regle de base, lire aussi:
  - `docs/regles-securite-codage.md`
- Si la demande concerne l'evolution produit (features, roadmap, priorites, sprint planning), lire aussi:
  - `docs/backlog.md`
- Si la demande est un comportement nouveau, un droit ou un correctif : lire la décision du 1 novembre 2026 en tête de `docs/AI-AGENT-FEATURE-PLANNING-WORKFLOW.md`. Même consigne que dans `.cursor/rules/forge-du-changement-contexte.mdc`, y compris les mots-clés de la section 3 de `docs/GUIDE-UTILISATEUR-IA-CURSOR.md`.
- Au moindre doute sur les roles, permissions ou droits d'acces, lire aussi:
  - `docs/proposition-regles-matrice-permissions.md`
- Si la demande touche l'UI, le CSS, le styling de composants, le theme ou la coherence visuelle, lire aussi:
  - `docs/visual-coherence-theme-rules.md`
- Si la demande touche la migration `/src` (Vite) vers `/web` (Next.js), lire aussi:
  - `docs/backlog.md` (EPIC 15, sections "Critères de bascule" et "Risques majeurs")
  - `web/AGENTS.md` (ruptures de compat Next.js 16)

### Workflow git (obligatoire)

- Format commit : `type(scope): action courte orientee metier` en francais, sujet ≤ 72 caracteres, sans point final. Voir `docs/git-commit-conventions.md`.
- Trailer obligatoire pour les commits agent : ligne vide + `Made-with: Cursor AI` (ou equivalent selon l'agent).
- Apres chaque commit agent, faire immediatement `git push` vers la branche courante. Exception : uniquement si l'utilisateur demande explicitement de ne pas pusher.
- Branche de travail par defaut = `main`. Si l'agent est sur une branche feature ou si `main` diverge de `origin/main`, signaler et demander confirmation avant de committer.

### Regles de coherence

1. Utiliser les regles metier et la matrice de permissions comme source principale des decisions fonctionnelles.
2. Respecter les conventions de commit pour toute proposition de message de commit ou de workflow git.
3. En cas de conflit entre deux documents, signaler explicitement le conflit, proposer une resolution, puis demander confirmation avant d'appliquer une decision contradictoire.
4. Si un document parait obsolete ou contradictoire, le signaler avant implementation.
