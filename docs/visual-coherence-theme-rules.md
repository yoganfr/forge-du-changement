# Visual Coherence Rules (Theme-based)

This document defines mandatory visual consistency rules for the website.
It is anchored on the CSS theme tokens and must be followed for any UI change.

## Source of truth

- Primary theme tokens: `src/themes.css`
- Supporting usage examples: `src/design-system.css`

Note: if a future file named `theme.css` is introduced, this document still applies and the active token file becomes the source of truth.

## Mandatory principles

1. Never hardcode colors, typography, spacing, radius, shadows, or transitions in components when a token exists.
2. Always use CSS variables from the theme layer (for example `--theme-accent`, `--theme-text`, `--space-md`, `--radius-md`, `--transition`).
3. Any new visual style must work in both `[data-theme='light']` and `[data-theme='dark']`.
4. Bright accent colors are reserved for CTAs, active states, and badges (not for long-form body text).

## Color system rules

- Use semantic tokens first:
  - Surface/background: `--theme-bg-page`, `--theme-bg-card`, `--theme-bg-raised`
  - Text: `--theme-text`, `--theme-text-muted`
  - Accent/action: `--theme-accent`, `--theme-on-accent`, `--theme-support`
  - Border: `--theme-border`
- Avoid direct palette usage (`--caramel-*`, `--orecchiette-*`, `--muted-yellow-green-*`) unless extending the design system intentionally.
- For status/badges, rely on existing semantic badge tokens before creating new colors.

## Typography rules

- Titles/headings use display font tokens (`--font-display`) and the heading scale from the theme.
- Body UI text uses `--font-body` and body scale (`--text-sm`, `--text-base`, `--text-lg`).
- Do not enforce full uppercase by default; preserve natural casing unless a component explicitly requires otherwise.

## Spacing, shape, and motion rules

- Spacing must use spacing tokens (`--space-*`), not arbitrary pixel values.
- Border radii must use radius tokens (`--radius-*`, `--ui-radius-*`).
- Animations/transitions must use the shared motion token `--transition` unless a justified exception is documented.
- Shadows must use theme shadow tokens (`--shadow-sm`, `--shadow-md`, `--shadow-lg`).

## Interaction and accessibility rules

- Ensure visible focus styles for keyboard users (`:focus-visible`) with theme-compatible contrast.
- Hover/active states must remain perceivable in both light and dark modes.
- Contrast should remain readable against themed surfaces (especially muted text and badges).

## Implementation checklist (before merge)

1. No avoidable hardcoded visual values remain.
2. New/updated UI is checked in light mode.
3. New/updated UI is checked in dark mode.
4. Interactive states (default, hover, focus-visible, active, disabled) are covered.
5. Any new token is added to `src/themes.css` and named semantically.

## Patterns UI existants à réutiliser

Avant de créer de nouvelles classes CSS, vérifier les patterns existants :

| Besoin | Pattern existant | Fichier |
|--------|------------------|---------|
| Badge de statut | `.mr-review-status-badge` | `MaturityRoadmap.css:163` |
| Banner informatif | `.mr-review-banner` | `MaturityRoadmap.css:195` |
| Empty state | `.dg__empty` (texte muted) | `App.css:3151` |
| Icône | SVG inline (pas de bibliothèque) | Pattern dans `MemberOnboarding.tsx` |

**Règle** : Le projet n'utilise PAS de bibliothèque d'icônes (Lucide, Heroicons). Toutes les icônes sont des **SVG inline**.

## AI execution note

For any UI, CSS, component styling, theme, or design-system request:
- Read this file first, then apply changes according to `src/themes.css`.
