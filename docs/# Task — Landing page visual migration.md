# Task — Landing page visual migration (Next.js)

## Context

The project originally exists as a React app with an established visual system.

The migration to Next.js was done mainly for:
- SEO
- scalability
- public landing pages

The migration is not visually complete yet.

Current source of truth for visual language:
- `themes.css`
- `design-system.css`
- `App.css`
- module CSS files from the React app

Current target file to update:
- `web/app/globals.css`
- landing page component in Next.js

## Goal

Align the Next.js landing page with the existing product visual system, while keeping the page a landing page and not a dashboard.

The landing must feel:
- premium
- sober
- executive-facing
- consistent with the product
- visually structured

It must NOT feel:
- generic SaaS
- flat
- purely decorative
- like a dashboard clone

## Constraints

- Reuse existing design tokens from `themes.css`
- Reuse existing typography system:
  - `var(--font-display)` for major headings
  - `var(--font-body)` for body text
- Do not invent a new design system
- Do not hardcode arbitrary new color families
- Do not change the content structure unless explicitly requested
- Keep one main CTA only
- Keep the landing oriented toward meeting booking / contact

## Current issues to solve

1. Flat visual rhythm
2. Weak section contrast
3. Typography hierarchy not strong enough
4. Some sections feel like raw text blocks
5. Roadmap section is disconnected:
   - roadmap image is decorative
   - the 6 transformation steps are just a list
   - no visual link between route and steps

## Required roadmap transformation

The roadmap section must become:
- a visual route on the left
- 6 connected step cards on the right
- each card aligned to a visual point on the route
- each card displaying one of the 6 steps:

1. Prioriser les projets transformants
2. Construire une roadmap claire
3. Engager les équipes
4. Décliner en actions concrètes
5. Lancer réellement
6. Piloter dans la durée

Desktop:
- route image left
- cards right
- subtle connector lines between image side and cards

Mobile:
- stack vertically
- route image first
- cards below
- connector lines can disappear

## Expected behavior from Cursor

- Inspect existing files first
- Patch existing CSS and JSX
- Do not rebuild from scratch
- Prefer focused changes
- If a structural refactor is needed, keep it minimal
- Show diffs or updated code blocks