# Règles de décision — refactor

Dernière mise à jour : **19 octobre 2026**, 00 h 08 (Europe/Paris)

Version en vigueur : **V2**. L’historique V1 est en bas de ce fichier. On ne l’applique plus.

## Quand ce document s’applique

Il s’applique dès qu’un agent s’apprête à créer, déplacer ou supprimer un module, un composant ou une fonction publique, sans que le produit change.

Il ne s’applique pas à un renommage local fait au passage d’une correction. Il ne s’applique pas non plus à une fonctionnalité, à un correctif dont le résultat change, ni à une règle de sécurité. Une policy, un droit, ou une règle RLS n’est jamais un refactor, même lorsque l’intention est de conserver les mêmes droits.

Si un autre document demande de découper le code pour le rendre plus propre, ce document-ci l’emporte. Le type de commit `refactor` nomme seulement le commit. Il n’autorise pas le changement.

## Définition

Un refactor est un changement interne. Après lui, la personne voit les mêmes écrans, peut faire les mêmes actions, et obtient les mêmes résultats. Les textes, les parcours, les droits et les données rendues restent les mêmes.

Si un libellé, un parcours, un droit ou un résultat change, le travail n’est pas un refactor. On suit alors la demande produit ou la demande de correction.

## Décision, dans l’ordre

1. Écrire une phrase qui nomme un problème déjà présent. Sans cette phrase, on ne modifie pas la structure, et on le dit.
2. Vérifier que la phrase est un motif accepté. Sinon, on s’arrête.
3. Vérifier que l’écran reste le même. Si le moindre doute demeure, on s’arrête.
4. Faire le plus petit changement qui tient dans la phrase. Un morceau veut dire une fonction, un composant, ou un fichier déjà nommé dans la demande.
5. Montrer que le comportement n’a pas bougé, sur le parcours cité dans la phrase : le cas normal et le cas limite nommé dans cette phrase.

## Motifs acceptés

- Un bug reproductible.
- Une lenteur déjà mesurée, dont le chiffre est cité avant le changement.
- La même règle métier écrite à deux endroits. Changer la règle oblige à modifier les deux. Exemple valide dans ce produit : le rôle d’un invité était calculé de deux façons, et l’une contredisait l’autre.

## Motifs refusés

- « Le fichier est long. »
- « Ce serait plus propre, plus scalable, ou une bonne pratique. »
- « Cela servira plus tard. »
- Deux éléments d’interface qui se ressemblent.
- Exemple refusé dans ce produit : découper le sélecteur de projets parce qu’il fait plusieurs milliers de lignes.

La longueur d’un fichier n’est jamais un motif à elle seule.

## Exception

Une seule exception existe. La demande en cours dit explicitement de déplacer un morceau nommé, malgré l’absence de motif. Un agent ne déduit pas cette exception d’un accord vague.

On ne déplace que le morceau nommé. L’écran reste identique. L’exception ne couvre pas un chantier plus large.

## Outils automatiques

ESLint, TypeScript et les contrôles de build signalent des problèmes. Ils ne choisissent pas la forme du code métier.

Il est interdit d’ajouter un délai artificiel, comme `queueMicrotask`, `setTimeout(0)` ou un équivalent, dans le seul but de faire taire une règle. Le cas déjà rencontré ici est `react-hooks/set-state-in-effect`.

Si une règle d’outil pousse à ce contournement, on modifie la règle : désactivation documentée, exception ciblée, ou correctif de l’outil.

## Moyen

Une fois la décision prise, on retire d’abord le code dont on peut montrer qu’aucun parcours ne l’exécute. On réécrit ensuite. On n’ajoute un fichier, une couche ou une abstraction que si la phrase-motif ne peut pas être tenue sans cet ajout.

---

# Historique — V1

Ne plus appliquer. Texte d’origine, conservé tel quel.

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

- **Pas de solution « lint-driven »** : le lint informe, il ne pilote pas le design du code sans problème produit ou perf derrière.
- **Interdit** : contourner une règle par artifices techniques (`queueMicrotask`, `setTimeout(0)`, etc.) lorsque le seul « gain » est de faire taire le linter sans problème produit ou perf derrière.
- **Avant modification** : expliciter en une phrase le **problème concret** (bug, perf, duplication, complexité bloquante) — comme en §1.
- **`useEffect`** : en cas de doute, privilégier **suppression** ou **calcul / synchro inline** (dérivation depuis props/state, handler) plutôt qu’un effet supplémentaire.
- **Si une règle ESLint pousse à un contournement** → traiter la **règle** (désactivation documentée dans la config, exception ciblée, ticket vers le plugin), pas dégrader le code métier pour la satisfaire.

11. Niveau d’exigence (précédent validé)

Décisions d’audit validées — par ex. retrait des `queueMicrotask` et ajustement de la règle `react-hooks/set-state-in-effect` lorsqu’elle imposait un hack sans gain mesurable — servent de **référence** : conserver ce niveau d’exigence pour la suite.


12. Ligne directrice (résumé)

- Pas de solution « lint-driven ».
- Problème concret obligatoire (cf. §1).
- Suppression > ajout (cf. §7).
