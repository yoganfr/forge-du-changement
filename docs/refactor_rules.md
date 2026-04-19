Refactor Decision Rules
Avant toute modification, valider toutes les conditions suivantes :

1. Problème concret obligatoire
Le refactor doit résoudre un problème réel :

bug
performance mesurable
duplication claire
complexité bloquante

❌ Refuser si le problème est :

esthétique (“plus propre”)
théorique (“meilleure archi”)
anticipé (“ça servira plus tard”)


2. Comportement utilisateur inchangé

✅ Identique → refactor OK  
❌ Différent → ce n’est pas un refactor

Aucune régression, même subtile.

3. Ratio coût / gain

gain mesurable et immédiat obligatoire
refactor court priorisé
éviter tout chantier large sans impact clair


4. Interdictions explicites
Refuser si la justification est :

“c’est plus propre”
“c’est plus scalable”
“c’est best practice”
“on anticipe”


5. Règle finale

Si le gain ne tient pas en 1 phrase simple, ne pas faire.


6. Règles sur useEffect et setState
✅ Autorisé si :

synchronisation avec API / async  
réaction à un événement externe  
reset contrôlé (modal, sheet, ouverture/fermeture)

❌ Interdit si :

simple dérivation de props/state  
calcul faisable inline  
logique pouvant être dans un handler


7. Principe global

Supprimer > simplifier > ajouter

Toujours préférer :

moins de code
moins d’abstraction
comportement évident


8. Anti-patterns fréquents

contourner un lint au lieu de comprendre le problème
ajouter une couche pour éviter un cas simple
introduire de l’asynchrone inutile (ex: queueMicrotask)
sur-ingénierie “préventive”


9. Standard attendu
Chaque modification doit être :

lisible immédiatement
explicable rapidement
prête à commit sans débat


✅ Si un doute existe → ne pas refactor


10. ESLint : ne pas hacker, challenger

- **Interdit** : contourner une règle par artifices techniques (`queueMicrotask`, `setTimeout(0)`, etc.) lorsque le seul « gain » est de faire taire le linter sans problème produit ou perf derrière.
- **Avant modification** : expliciter en une phrase le **problème concret** (bug, perf, duplication, complexité bloquante) — comme en §1.
- **`useEffect`** : en cas de doute, privilégier **suppression** ou **calcul / synchro inline** (dérivation depuis props/state, handler) plutôt qu’un effet supplémentaire.
- **Si une règle ESLint pousse à un contournement** → traiter la **règle** (désactivation documentée dans la config, exception ciblée, ticket vers le plugin), pas dégrader le code métier pour la satisfaire.

11. Niveau d’exigence (précédent validé)

Décisions d’audit validées — par ex. retrait des `queueMicrotask` et ajustement de la règle `react-hooks/set-state-in-effect` lorsqu’elle imposait un hack sans gain mesurable — servent de **référence** : conserver ce niveau d’exigence pour la suite.