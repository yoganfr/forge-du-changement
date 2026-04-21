# Roadmap section target

## Objective

Transform the current roadmap section from:

- a decorative route image
- and a simple text list

into:

- a coherent visual roadmap block
- with 6 connected step cards

## Desktop target

- roadmap visual left
- cards right
- subtle connector line from left side toward each card
- each card aligned with a route point

## Mobile target

- roadmap visual on top
- cards below
- no connector lines if needed

## Cards content

01 — Prioriser les projets transformants  
02 — Construire une roadmap claire  
03 — Engager les équipes  
04 — Décliner en actions concrètes  
05 — Lancer réellement  
06 — Piloter dans la durée

## Card design principles

- premium
- sober
- rounded
- lightly elevated
- not generic marketing cards
- use existing tokens
- title uses `var(--font-display)`
- number uses `var(--font-body)`

## Technical preference

Prefer:
- updating existing landing section JSX
- adding focused CSS in `globals.css`

Avoid:
- new abstraction layers
- large refactors
- unrelated changes