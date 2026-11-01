# Guide pratique — Piloter l’IA dans Cursor

Dernière mise à jour : **1 novembre 2026**, 16 h 23 (Europe/Paris)

Ce guide dit comment formuler une demande, de l’idée jusqu’au code. Il ne crée pas de règle : la règle de contexte reconnaît les mots-clés de la section 3 et applique leurs arrêts. Le passage en vigueur est la décision du 1 novembre 2026, en tête de [docs/AI-AGENT-FEATURE-PLANNING-WORKFLOW.md](AI-AGENT-FEATURE-PLANNING-WORKFLOW.md). Les cinq phases plus bas dans ce fichier sont un exemple ancien. Ce n’est pas le parcours à suivre.

Les autres sources : [docs/backlog.md](backlog.md) pour l’index des sujets, [.cursor/rules/forge-du-changement-contexte.mdc](../.cursor/rules/forge-du-changement-contexte.mdc) et [.cursor/rules/R-gles-IA-SaaS-avec-Supabase-Vercel-et-GitHub.mdc](../.cursor/rules/R-gles-IA-SaaS-avec-Supabase-Vercel-et-GitHub.mdc) pour ce que l’agent charge, [docs/ai-agent-shared-context-rules.md](ai-agent-shared-context-rules.md) pour une IA hors Cursor, [CLAUDE.md](../CLAUDE.md) pour la liste de lecture.

Ces textes orientent l’agent. Ils n’empêchent pas Git d’accepter un fichier.

Les exemples utilisent `REF-XXXX`, la révision de story `1` et la révision de plan `1`. Ce ne sont pas des sujets du produit.

## 1. Le parcours

Deux chemins.

**Correctif qualifié.** On remet un comportement déjà écrit dans une source, sans décision métier nouvelle et sans changement de droit. L’agent cite l’écart entre ce qui est écrit et ce qui se passe. S’il n’est pas sûr de cette qualification, il demande. Il ne code pas sur une hypothèse. Il n’ouvre pas de fichier de story. Il ne passe pas par les conditions ci-dessous. Il reformule, propose un plan court, signale les points de vigilance, puis code.

**Tout autre sujet.** Le workflow passe avant tout plan technique.

1. Le besoin.
2. La story, dans `docs/plan-ref-XXXX.md`.
3. La revue critique, écrite dans ce fichier, avec son résultat. Aucune story n’est approuvée sans elle.
4. La revue sensible, seulement si le sujet touche un droit, l’isolation entre entreprises ou un changement transverse. C’est une conversation à part. Son résultat écrit doit être dans le fichier. S’il manque, on ne peut pas planifier. Si une nouvelle révision de story concerne l’un de ces trois points, cette revue est remise à jour avant la nouvelle approbation. Si le sujet n’en touche aucun, la ligne dit « non requise », avec la raison.
5. L’approbation de la story, par une phrase qui cite la REF et la révision de story.
6. L’autorisation de planifier, par une autre phrase, pour la même REF et la même révision de story. Elle ne suffit pas s’il reste un blocage.
7. Le plan technique, présenté dans le fichier, avec sa révision de plan. Avant cette autorisation, l’agent ne compare pas d’options techniques, ne recommande pas d’architecture et ne propose pas de structure de fichiers.
8. L’autorisation de coder, par une phrase qui vise ce plan : REF, révision de story, révision de plan. Aucun blocage ouvert.
9. La vérification, quand vous la demandez. Elle ne déclenche pas un enregistrement Git.
10. L’enregistrement, avec `historise:`. Il enregistre le lot, le pousse, met à jour le backlog et l’historique de session, puis pousse ces textes. Il n’invente pas de numéro de REF. Il n’approuve rien et n’autorise rien.

Planifier exige les quatre en même temps : revue critique disponible pour cette révision de story ; story approuvée par une phrase citée ; aucun blocage ouvert ; phrase d’autorisation de planifier qui vise cette REF et cette révision de story.

Coder exige ensuite les trois : plan présenté avec sa révision de plan ; phrase d’autorisation de coder qui vise ce plan ; aucun blocage ouvert.

Une question encore dans le périmètre, sans réponse, est un blocage. Une conclusion de revue marquée bloquante aussi. Un point ne sort du périmètre, et ne cesse de bloquer, qu’après votre accord explicite.

Une réponse à une question se note. Elle n’approuve rien et n’autorise rien.

L’agent peut noter les faits, les questions et le résultat d’une revue dont le texte est là. Il ne passe une ligne à « approuvée » ou « autorisé » que pour recopier votre phrase, avec la REF et les révisions.

Si le comportement, un droit ou le périmètre change, la révision de story augmente. La revue critique est refaite. La revue sensible aussi, si elle est concernée. L’approbation et les deux autorisations sont à redonner. Si le plan change dans son fond, la révision de plan augmente et l’autorisation de coder tombe. Un ajustement technique qui reste dans le plan présenté ne redemande pas d’approbation du produit.

À la reprise, l’agent relit les sources citées et le code. Il retire seulement la validation que ce changement a rendue caduque, et il dit laquelle et pourquoi. Il ne la remet qu’après un nouvel accord explicite.

Un critère se vérifie à l’écran, par un test, par l’API ou dans les données. Cacher un menu n’est pas empêcher l’accès.

## 2. Le lien avec le backlog

Le détail des numéros est dans [docs/backlog.md](backlog.md). On ne le recopie pas ici.

Le backlog est l’index des sujets et des priorités. Une tâche s’appelle une REF. Elle se lit avec son EPIC. Un même numéro peut exister dans deux EPIC : le cas connu est REF-41. On dit alors « EPIC 2 · REF-41 » ou « EPIC 10 · REF-41 ». Un numéro GitHub (`GH-n`) n’est pas une REF.

Le fichier `docs/plan-ref-XXXX.md` porte la story, les revues, les validations, puis le plan technique une fois la planification autorisée. Il est lié depuis la ligne de cette REF. On le crée en préparant la story d’une REF qui existe déjà. Cette préparation ajoute le lien sur cette ligne.

Avant de créer quoi que ce soit, demandez à l’agent de chercher le sujet dans le backlog et d’ouvrir le fichier déjà lié, s’il existe.

Si le besoin n’a pas de REF, l’agent peut proposer une entrée : l’EPIC, un libellé, une priorité. Il n’invente pas le numéro et il ne modifie pas le backlog tant que vous n’avez pas accepté l’entrée. `historise:` met à jour le backlog pour le lot déjà enregistré. Il n’invente pas de numéro pour autant.

Une ligne dans le backlog, un statut « à faire », « en cours » ou « terminé », ne veut ni dire que la story est approuvée, ni que le plan ou le code est autorisé. Ces accords sont vos phrases, citées dans le fichier de la REF.

## 3. Les prompts prêts à copier

Écrivez le mot-clé en début de message, avec les deux-points, puis seulement ce qui change : le besoin, la REF, la révision, la réponse. L’accent est facultatif. Cela vaut le bloc entier, y compris l’arrêt. Vous pouvez aussi coller le bloc. Remplacez `REF-XXXX` et les numéros de révision par ceux du fichier. Sous chaque titre : ce que l’agent peut faire, puis où il s’arrête.

`approuve:`, `planifie:` et `code:` ne comptent que si le même message nomme la REF et les révisions. `planifie:` et `code:` ne partent pas tant qu’un blocage est ouvert. Un mot-clé au milieu d’une phrase ne compte pas.

- `cherche:` retrouver un besoin, sans rien créer
- `qualifie:` correctif qualifié, comportement nouveau, ou droit
- `explore:` faits et questions, sans story, plan ni code
- `story:` préparer la story d’une REF qui existe
- `reponds:` consigner une réponse, sans approuver
- `revue:` revue critique
- `sensible:` relecture dans une autre conversation
- `consigne:` coller le résultat de la revue sensible
- `approuve:` approuver la story
- `planifie:` autoriser le plan
- `code:` autoriser le code
- `correctif:` correctif qualifié
- `perimetre:` changer le périmètre
- `differe:` sortir un seul point du périmètre
- `reprise:` reprendre une session
- `verifie:` constater, sans Git
- `historise:` enregistrer le lot, pousser, mettre à jour le backlog, puis écrire l’historique de session
- `avis:` consigner un avis externe

Exemple :

```text
revue: REF-XXXX, révision de story 1
```

### Avant de s’engager

**`cherche:` Retrouver un besoin sans doublon.** Il lit l’index et signale un doublon. Il s’arrête avant toute création.

```text
Cherche dans docs/backlog.md un sujet déjà couvert par : [décrivez le besoin]. Liste les REF trouvées avec leur EPIC, et le lien vers docs/plan-ref-XXXX.md s’il existe. Ne crée rien. N’invente pas de numéro.
```

**`qualifie:` Qualifier le sujet.** Il cite l’écart, ou il pose la question. Tant que ce n’est pas net, il ne fait rien d’autre.

```text
Qualifie ce sujet : correctif qualifié, comportement nouveau, ou droit. Un correctif qualifié restaure un attendu déjà écrit, sans décision métier nouvelle et sans changement de droit. Cite la source. Si ce n’est pas net, demande. Ne code pas. Ne fais pas de plan technique.
```

**`explore:` Explorer sans plan ni code.** Il lit les sources et décrit le besoin. Il s’arrête avant la story, le plan et le code.

```text
Explore ce besoin : [besoin]. Faits sourcés, hypothèses, questions. Pas de plan technique, pas d’options d’architecture, pas de structure de fichiers, pas de code.
```

### Préparer

**`story:` Préparer la story d’une REF qui existe.** Il crée le fichier, le lien, et note les faits et les questions. Il s’arrête avant la revue, l’approbation, le plan et le code.

```text
Prépare la story de REF-XXXX dans docs/plan-ref-XXXX.md et lie ce fichier depuis sa ligne du backlog. Problème, valeur, faits sourcés, hypothèses, points à valider, incréments, critères vérifiables. Ne recopie pas les règles métier : cite-les. Ne tranche pas les hypothèses. Pas de plan technique. Pas de code.
```

**`reponds:` Répondre sans approuver.** Il note la réponse et ferme la question si elle est tranchée. Il ne passe pas la story à « approuvée » et n’autorise rien.

```text
Voici ma réponse à la question ouverte : [réponse]. Consigne-la dans la story de REF-XXXX. Ce n’est pas une approbation. Ce n’est pas une autorisation.
```

### Faire relire

**`revue:` Demander la revue critique.** Il écrit le résultat dans le fichier. Il s’arrête avant votre phrase d’approbation.

```text
Fais la revue critique de REF-XXXX, révision de story 1. Écris le résultat dans le fichier. Ne l’approuve pas. Ne planifie pas. Ne code pas.
```

**`sensible:` et `consigne:` Revue sensible, dans une autre conversation.** Il recopie le texte disponible. Il n’approuve pas, n’autorise pas, et n’invente pas un résultat absent.

D’abord, ailleurs, `sensible:` :

```text
Relis uniquement ce sujet au regard des droits, de l’isolation entre entreprises ou du changement transverse : [coller la story, sans secret]. Rends un résultat écrit : conclusions et blocages.
```

Puis dans Cursor, `consigne:` :

```text
Voici le résultat écrit de la revue sensible de REF-XXXX, révision de story 1 : [coller le texte]. Consigne-le. S’il manque, laisse « pas de résultat disponible ». Ce n’est pas une approbation.
```

### Donner un accord

**`approuve:` Approuver la story.** Il passe la ligne à « approuvée » pour cette révision, en citant la phrase. Il s’arrête avant le plan.

```text
J’approuve la story REF-XXXX, révision de story 1. Cite cette phrase. Ne planifie pas. Ne code pas.
```

**`planifie:` Autoriser le plan.** Il écrit le plan seulement si la revue critique est là, la story est approuvée pour cette révision, et aucun blocage n’est ouvert. Il s’arrête avant le code.

```text
J’autorise la planification de REF-XXXX, révision de story 1. Cite cette phrase. Écris le plan dans le fichier avec la révision de plan 1. Pas de code.
```

**`code:` Autoriser le code.** Il code ce plan seulement s’il est présenté sous cette révision et qu’aucun blocage n’est ouvert. Il reste dans ce plan.

```text
J’autorise le code de REF-XXXX, révision de story 1, révision de plan 1. Cite cette phrase.
```

### Corriger, changer, reprendre

**`correctif:` Demander un correctif qualifié.** Il suit le plan court, puis le code, si la qualification tient. S’il faut une décision nouvelle ou un droit, il bascule sur le parcours story.

```text
Correctif qualifié. L’attendu est écrit ici : [source]. L’écart constaté : [écart]. Restaure cet attendu. Cite la source. Si la qualification est ambiguë, arrête-toi et demande. Pas de fichier story. Pas de décision métier. Pas de changement de droit.
```

**`perimetre:` Changer le périmètre.** Il augmente la révision, refait les revues et retire les accords. Il attend une nouvelle approbation, puis une autorisation de plan, puis une autorisation de code.

```text
Le périmètre de REF-XXXX change : [changement]. Augmente la révision de story. Refais la revue critique. Refais la revue sensible si le sujet touche un droit, l’isolation entre entreprises ou un changement transverse. Retire l’approbation et les autorisations. N’en remets aucune.
```

**`differe:` Différer un blocage.** Il note ce seul point comme hors périmètre. Les autres blocages restent. Ce n’est ni une approbation ni une autorisation.

```text
J’accepte de sortir du périmètre de REF-XXXX, révision de story 1, le point suivant : [point]. Il ne bloque plus. Cite cette phrase. Ne l’étends pas à un autre point.
```

**`reprise:` Reprendre une session.** Il relit, suspend avec la raison, et nomme l’étape suivante. Il ne la franchit pas.

```text
Reprise de REF-XXXX. Relis les sources citées et le code concerné. Dis quelles validations tiennent encore. Suspends seulement celle qu’un changement a rendue caduque, et dis pourquoi. Ne la rétablis pas. Dis le prochain passage autorisé, sans le franchir. Pas de plan technique nouveau. Pas de code.
```

**`verifie:` Vérifier après le code.** Il constate et résume. Il n’enregistre rien dans Git tant que vous ne l’avez pas demandé.

```text
Vérifie REF-XXXX, révision de story 1, révision de plan 1, au regard des critères du fichier. Dis ce qui est constaté à l’écran, par un test, par l’API ou dans les données. Un menu caché n’est pas un contrôle d’accès. Fais le bilan. N’enregistre rien dans Git.
```

### Enregistrer la session

**`historise:` Enregistrer, pousser, mettre à jour le backlog, puis écrire l’historique.** Il enregistre le lot de cette session et le pousse. Il met ensuite à jour le backlog, écrit l’historique, indexe le tout, enregistre ces textes et les pousse. Il s’arrête avant un autre sujet. Ce n’est ni une approbation ni une autorisation.

```text
historise: Enregistre le lot de cette session et pousse-le. Un commit, une intention, au format du dépôt, avec Made-with: Cursor AI. Pas de secret. Laisse de côté les fichiers d’un autre sujet encore ouvert. Si la branche n’est pas main, ou si main a divergé, arrête-toi et dis-le. Ensuite mets à jour docs/backlog.md pour ce lot : statut et trace de ce qui est fait. N’invente pas de numéro de REF. Une ligne du backlog n’approuve pas la story et n’autorise rien. Écris l’historique selon docs/history/_template-session.md, indexe-le dans docs/history/README.md, avec l’heure Europe/Paris. Enregistre le backlog et l’historique, puis pousse-les. N’approuve rien. N’autorise rien. Ne commence pas un autre sujet.
```

## 4. L’usage d’une IA externe

Vous pouvez coller à une IA hors Cursor un extrait déjà écrit : la story, la question, le passage du workflow. Demandez-lui une relecture ou une exploration. Pour une revue sensible, `sensible:` est le prompt à coller là-bas. Ramenez ensuite son texte dans Cursor avec `consigne:` s’il s’agit de cette revue, ou avec `avis:` : « Voici un avis externe. Consigne-le comme un avis. Ce n’est pas une source métier. Ce n’est pas mon approbation. Ce n’est pas une autorisation. »

Pour savoir quels documents lire, cette IA peut s’appuyer sur [docs/ai-agent-shared-context-rules.md](ai-agent-shared-context-rules.md). Le règlement du produit reste la doxa, la matrice et les règles métier citées par le workflow.

N’y collez pas de mot de passe, de clé, de code de secours, ni de donnée confidentielle d’une entreprise.

## 5. Les pièges à éviter

- « Vas-y », « continue », « c’est bon » : sans REF, sans révision, et sans dire si c’est l’approbation, le plan ou le code, l’agent ne doit pas deviner l’accord.
- Répondre à une question n’approuve pas la story.
- Hors correctif qualifié, comparer des options techniques, recommander une architecture ou proposer une structure de fichiers attend l’autorisation de planifier.
- L’agent ne sort pas un blocage du périmètre tout seul.
- Une validation suspendue ne revient pas toute seule. Il faut un nouvel accord explicite.
- Cacher un bouton ou un menu n’empêche pas l’accès aux données.
- Une ligne du backlog n’est ni une story approuvée, ni une autorisation de planifier, ni une autorisation de coder.
- `verifie:` constate. `historise:` enregistre et pousse.

## Résumé

Pour un comportement déjà écrit, `correctif:` fait citer la source. Pour le reste : `story:`, `revue:`, `sensible:` si le sujet l’exige, `approuve:`, `planifie:`, le plan, `code:`, puis `verifie:`. Chaque accord nomme la REF et la révision. Le mot-clé en début de message remplace le bloc à coller. `historise:` enregistre le lot, le pousse, met à jour le backlog, puis écrit l’historique de session. Le backlog reste l’index. Il ne remplace pas ces phrases.

## Ambiguïtés restantes

La doxa du 1 novembre 2026, précisée à 16 h 19, dit qu’un membre du comité possède sa roadmap et ses chantiers, et qu’un projet qui traverse plusieurs directions est porté sur la roadmap de chaque direction, chacun pour sa part. Trois pages détaillées disent encore l’ancienne formule. Le workflow demande de citer la doxa, pas de la recopier.

Les cinq phases historiques du workflow disent encore « obligatoire » et un dossier de plans ignoré par Git. La décision en tête de ce fichier prime, et elle dit de ne pas les rouvrir.
