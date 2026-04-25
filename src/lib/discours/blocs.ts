/**
 * Modèle des 8 blocs « performatifs » du discours de transformation.
 * Référence méthodo : docs/Référence Discours de transformation.md §2.3.
 *
 * Chaque bloc est défini par :
 *   - un intitulé (titre + sous-titre question),
 *   - son « but » méthodologique,
 *   - son effet performatif (ce qu'il doit produire chez les auditeurs),
 *   - ses effets recherchés,
 *   - ses champs d'écriture (text / long / list) avec éventuellement une aide ou un max,
 *   - la question séminaire associée à ce bloc.
 *
 * Le payload stocké côté Postgres (`transformation_discourse_versions.blocs`)
 * est un JSON de la forme :
 *   {
 *     [blocKey]: {
 *       [fieldKey]: string | string[] | null
 *     }
 *   }
 */

export type DiscoursFieldKind = 'text' | 'long' | 'list' | 'cards'

export type DiscoursSubField = {
  key: string
  label: string
  kind: 'text' | 'long'
  aide?: string
}

export type DiscoursField = {
  key: string
  label: string
  kind: DiscoursFieldKind
  /** Pour `list` : nombre max d'items. Pour `text` / `long` : longueur indicative (non bloquante). */
  max?: number
  /** Aide à la rédaction affichée en placeholder / tooltip (extraits de §2.3). */
  aide?: string
  /** Marque un champ optionnel (non bloquant pour le scoring). */
  optional?: boolean
  /**
   * Pour `kind: 'cards'` :
   *   - `minCards` cartouches toujours présents (non supprimables),
   *   - jusqu'à `maxCards` via le bouton « Ajouter »,
   *   - `subFields` : les sous-champs empilés verticalement dans chaque cartouche,
   *   - `cardTitle(i)` : libellé du cartouche (« Changement #1 », « Principe #1 »),
   *   - `addLabel` : texte du bouton d'ajout.
   */
  minCards?: number
  maxCards?: number
  subFields?: readonly DiscoursSubField[]
  cardTitle?: (index: number) => string
  addLabel?: string
}

export type DiscoursBloc = {
  /** Identifiant stable utilisé comme clé JSON (snake_case). */
  key: string
  /** Numéro d'ordre (1..8). */
  order: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
  title: string
  subtitle: string
  but: string
  effetPerformatif: string
  effetsRecherches: string[]
  fields: DiscoursField[]
  questionSeminaire: string
}

export const PERFORMATIVE_BLOCS: readonly DiscoursBloc[] = [
  {
    key: 'nous_reconnaitre',
    order: 1,
    title: 'Nous reconnaître',
    subtitle: "D'où venons-nous ?",
    but: "Créer un « nous » légitime, un ancrage identitaire et reconnaître les acquis.",
    effetPerformatif: 'Constituer le collectif.',
    effetsRecherches: ['Fierté lucide', 'Légitimité', 'Réduction des défenses'],
    fields: [
      {
        key: 'acquis_majeurs',
        label: 'Nos 3 acquis majeurs (maximum !)',
        kind: 'list',
        max: 3,
        aide: 'Ex : « Nous avons construit une relation client reconnue sur notre marché » — « Nous avons développé une expertise industrielle robuste ».',
      },
      {
        key: 'ce_qui_a_fait_reussite',
        label: 'Ce qui a fait notre réussite jusqu’ici',
        kind: 'long',
        aide: "Décrivez les qualités, choix ou comportements qui ont permis cette réussite.",
      },
      {
        key: 'a_preserver',
        label: 'Ce que nous voulons absolument préserver',
        kind: 'long',
        aide: "Nommez l’élément identitaire ou culturel à ne pas perdre dans la transformation.",
      },
      {
        key: 'enseignement_passe',
        label: 'Ce que nous avons appris de notre parcours',
        kind: 'long',
        aide: 'Quel enseignement du passé doit nous guider pour la suite ?',
      },
    ],
    questionSeminaire:
      "Qu’est-ce qui, dans notre identité, doit survivre coûte que coûte à la transformation ?",
  },
  {
    key: 'nommer_la_bascule',
    order: 2,
    title: 'Nommer la bascule',
    subtitle: 'Pourquoi devons-nous nous lancer maintenant ?',
    but: "Faire apparaître que rester identique n’est plus une option. Créer l’appel à l’aventure.",
    effetPerformatif: "Autoriser le départ dans l’aventure.",
    effetsRecherches: [
      'Compréhension commune de la nécessité',
      'Sentiment d’urgence juste',
      'Sortie du déni',
    ],
    fields: [
      {
        key: 'changements_bascule',
        label: 'Les 3 changements majeurs de notre contexte',
        kind: 'cards',
        minCards: 3,
        maxCards: 3,
        cardTitle: (i) => `Changement #${i + 1}`,
        aide:
          "Un cartouche par changement majeur. De haut en bas : le fait observé, son impact sur nous (le comité de direction), puis le risque si on ne réagit pas.",
        subFields: [
          {
            key: 'fait_observe',
            label: 'Le fait observé',
            kind: 'long',
            aide: 'Décrire factuellement le changement de contexte (marché, techno, social…).',
          },
          {
            key: 'impact_codir',
            label: 'Son impact sur nous (CODIR)',
            kind: 'long',
            aide: 'En quoi ce changement touche déjà, ou va toucher, notre façon de diriger et d’opérer.',
          },
          {
            key: 'risque_si_pas_reaction',
            label: 'Le risque si on ne réagit pas',
            kind: 'long',
            aide: 'Ce qui arrive si on laisse filer : perte de marché, décrochage, tension sociale…',
          },
        ],
      },
      {
        key: 'limites_modele_actuel',
        label: 'En quoi notre modèle actuel atteint ses limites',
        kind: 'long',
        aide: "Nommer 1 ou 2 limites concrètes : ce qui fonctionnait hier mais ralentit, fragilise ou coûte trop aujourd’hui.",
      },
      {
        key: 'risque_statu_quo',
        label: 'Le risque principal du statu quo',
        kind: 'long',
        aide: "Le vrai risque n’est pas le changement, mais l’immobilisme…",
      },
      {
        key: 'pourquoi_maintenant',
        label: 'Pourquoi il faut agir maintenant',
        kind: 'long',
        aide: 'Nous avons encore la main, mais pas pour toujours…',
      },
    ],
    questionSeminaire:
      "Qu’est-ce que nous sous-estimons encore aujourd’hui dans notre environnement ou dans notre manière de fonctionner ?",
  },
  {
    key: 'futur_desirable',
    order: 3,
    title: 'Dire le futur désirable',
    subtitle: 'Vers quoi voulons-nous aller ?',
    but: "Donner envie d’entrer dans l’effort. Donner le cap et le graal.",
    effetPerformatif: "Orienter l’imaginaire collectif.",
    effetsRecherches: ['Désir', 'Projection', 'Partage'],
    fields: [
      {
        key: 'ambition_une_phrase',
        label: 'Notre ambition en une phrase',
        kind: 'text',
        aide: "Notre ambition n’est pas seulement de réagir…",
      },
      {
        key: 'dans_3_ans',
        label: 'À 3 ans, si nous réussissons, qu’est-ce qui aura changé ?',
        kind: 'long',
        aide: 'Nous voulons devenir…',
      },
      {
        key: 'mieux_pour_clients',
        label: 'Ce qui sera mieux pour nos clients / usagers / patients',
        kind: 'long',
        aide: 'Demain, nos clients devront percevoir…',
      },
      {
        key: 'mieux_pour_equipes',
        label: 'Ce qui sera mieux pour nos équipes',
        kind: 'long',
        aide: "Décrire le bénéfice vécu par les équipes : moins de friction, plus de clarté, de soutien ou de pouvoir d’agir.",
      },
      {
        key: 'mieux_pour_entreprise',
        label: 'Ce qui sera mieux pour l’entreprise',
        kind: 'long',
        aide: "Relier le futur désiré à un effet d’entreprise observable : qualité, vitesse, robustesse, confiance, impact ou modèle économique.",
      },
      {
        key: 'preuves_reussite',
        label: 'Les 3 preuves concrètes que « nous avons réussi »',
        kind: 'list',
        max: 3,
        aide: 'Nous pourrons dire que nous avons réussi si…',
      },
    ],
    questionSeminaire:
      'À quelles conditions ce futur serait-il réellement désirable et crédible pour nous tous ?',
  },
  {
    key: 'nouveaux_principes',
    order: 4,
    title: 'Poser les nouveaux principes du jeu',
    subtitle: 'Comment gagnerons-nous autrement ?',
    but: 'Montrer que la transformation n’est pas un slogan mais un changement de logique.',
    effetPerformatif: 'Instituer une nouvelle norme.',
    effetsRecherches: ['Clarification', 'Crédibilité', 'Passage du slogan au modèle'],
    fields: [
      {
        key: 'principes',
        label: 'Les nouveaux principes du jeu',
        kind: 'cards',
        minCards: 3,
        maxCards: 5,
        cardTitle: (i) => `Principe #${i + 1}`,
        addLabel: '+ Ajouter un principe (optionnel)',
        aide:
          "3 principes structurants (min), jusqu’à 5 si nécessaire. Chaque cartouche se lit de haut en bas : intitulé, ce que cela veut dire, ce que cela change, ce que cela exige du CODIR.",
        subFields: [
          {
            key: 'intitule',
            label: 'Intitulé du principe',
            kind: 'text',
            aide: 'Formuler le principe comme une règle de décision simple, pas comme une valeur abstraite.',
          },
          {
            key: 'veut_dire',
            label: 'Ce que cela veut dire concrètement',
            kind: 'long',
            aide: 'Traduire le principe en comportements visibles, arbitrages ou pratiques de pilotage.',
          },
          {
            key: 'change',
            label: 'Ce que cela change par rapport à aujourd’hui',
            kind: 'long',
            aide: 'Nommer clairement ce qu’on arrête, ce qu’on simplifie ou ce qu’on décide autrement.',
          },
          {
            key: 'exige',
            label: 'Ce que cela exige des dirigeants du CODIR',
            kind: 'long',
            aide: 'Dire l’exigence de posture ou de discipline collective portée par les dirigeants.',
          },
        ],
      },
      {
        key: 'ce_qui_change_decider_cooperer_piloter',
        label: 'Ce qui change dans notre façon de décider, collaborer, piloter',
        kind: 'long',
        aide: "« Le premier changement de logique est… » — « Cela signifie concrètement que… »",
      },
    ],
    questionSeminaire:
      'Parmi ces principes, lequel sera le plus difficile à rendre réel dans nos pratiques ?',
  },
  {
    key: 'concentrer_efforts',
    order: 5,
    title: 'Concentrer nos efforts',
    subtitle: 'Où devons-nous mettre notre énergie ?',
    but: "Transformer l’ambition en trajectoire et la rendre crédible.",
    effetPerformatif:
      "Aligner le collectif sur ce qu’il faut prioriser et sur ce qu’il faut simplifier pour rendre la transformation crédible et exécutable.",
    effetsRecherches: ['Priorisation', 'Simplification', 'Discipline collective'],
    fields: [
      {
        key: 'directions_strategiques',
        label: 'Nos priorités — directions stratégiques d’entreprise (3 max)',
        kind: 'list',
        max: 3,
        aide: 'Écrire uniquement les priorités qui concentrent réellement l’énergie collective. Une priorité = un choix, pas un thème.',
      },
      {
        key: 'simplifications',
        label: 'Ce que nous devons simplifier (3 max)',
        kind: 'list',
        max: 3,
        aide: 'Identifier ce qu’il faut retirer, clarifier ou alléger pour rendre la transformation exécutable.',
      },
    ],
    questionSeminaire:
      'Quelles dépendances critiques devons-nous mieux traiter entre nous pour rendre notre travail collectif réaliste ?',
  },
  {
    key: 'reconnaitre_epreuves',
    order: 6,
    title: 'Reconnaître les épreuves',
    subtitle: 'Qu’allons-nous devoir surmonter ?',
    but: "Légitimer les peurs, éviter le déni. Créer de la lucidité et autoriser la parole vraie.",
    effetPerformatif: 'Rendre la vérité dicible.',
    effetsRecherches: [
      'Crédibilité',
      'Reconnaissance des peurs',
      'Réduction du cynisme',
      'Préparation à la coopération',
    ],
    fields: [
      {
        key: 'risques_contexte_marche',
        label: 'Les risques de contexte / marché',
        kind: 'long',
        aide: 'Décrire les pressions externes déjà visibles : marché, usages, réglementation, concurrence, attentes sociales.',
      },
      {
        key: 'risques_metiers_business',
        label: 'Les risques liés à nos processus métiers / business',
        kind: 'long',
        aide: 'Identifier les points de fragilité opérationnelle : processus trop lourds, qualité, délais, coûts, dépendances.',
      },
      {
        key: 'risques_manageriaux',
        label: 'Les risques managériaux / gouvernance / organisation',
        kind: 'long',
        aide: 'Nommer ce qui peut bloquer la transformation dans nos façons de décider, coopérer ou arbitrer.',
      },
      {
        key: 'risques_humains_emotionnels',
        label: 'Les risques humains / émotionnels',
        kind: 'long',
        aide: 'Je sais que ce que nous engageons peut susciter…',
      },
      {
        key: 'ce_que_dirigeants_doivent_changer',
        label: 'Ce que nous, dirigeants, devons changer',
        kind: 'long',
        aide: 'Nous aurons aussi à changer nous-mêmes sur…',
      },
      {
        key: 'doutes_legitimes',
        label: 'Ce sur quoi nous sommes légitimes de douter',
        kind: 'long',
        aide: "« Nous n’avons pas la réponse à tout, le doute fait partie du voyage… »",
      },
    ],
    questionSeminaire:
      'Quels sont les obstacles les plus sous-estimés, y compris dans nos propres pratiques de direction ?',
  },
  {
    key: 'distribuer_roles',
    order: 7,
    title: 'Distribuer les rôles et ouvrir la contribution',
    subtitle: 'Qui va rendre cela possible ?',
    but: "Faire exister le collectif comme acteur de la transformation.",
    effetPerformatif: 'Mettre le collectif en mouvement.',
    effetsRecherches: ['Engagement', 'Responsabilisation', 'Coopération', 'Appropriation'],
    fields: [
      {
        key: 'engagement_personnel_dirigeant',
        label: 'Mon engagement personnel de dirigeant',
        kind: 'long',
        aide: 'Mon rôle sera de…',
      },
      {
        key: 'attente_codir',
        label: 'Ce que j’attends de nous en tant que CODIR',
        kind: 'long',
        aide: 'Notre rôle collectif comme CODIR sera de…',
      },
      {
        key: 'attente_managers',
        label: 'Ce que j’attends des managers',
        kind: 'long',
        aide: 'J’attends de chacun une contribution lucide…',
      },
      {
        key: 'equipes_peuvent_attendre',
        label: 'Ce que les équipes peuvent attendre de nous',
        kind: 'long',
        aide: 'Formuler une promesse de gouvernance crédible : soutien, clarté, décisions, écoute, arbitrages tenus.',
      },
      {
        key: 'non_negociable',
        label: 'Ce qui est non négociable (postures, rôles)',
        kind: 'long',
        aide: 'Lister les invariants : ce qui ne sera pas ouvert au débat car nécessaire au cap, à la sécurité ou à la cohérence.',
      },
      {
        key: 'discutable',
        label: 'Ce qui est discutable',
        kind: 'long',
        aide: 'Délimiter l’espace de controverse utile : ce que le CODIR accepte de discuter, ajuster ou challenger.',
      },
      {
        key: 'a_co_construire',
        label: 'Ce qui reste à co-construire',
        kind: 'long',
        aide: "Cette transformation ne réussira pas par décret…",
      },
    ],
    questionSeminaire:
      'Qu’attendez-vous concrètement du CODIR pour que cette transformation soit crédible et praticable ?',
  },
  {
    key: 'sceller_engagement',
    order: 8,
    title: "Sceller l’engagement",
    subtitle: 'Promesse, reconnaissance, prochaine étape.',
    but: "Conclure par un acte mobilisateur. Transformer la fin du discours en début d’action.",
    effetPerformatif: 'Créer une obligation morale et opérationnelle partagée.',
    effetsRecherches: ['Énergie', 'Engagement', 'Clarification des suites'],
    fields: [
      {
        key: 'pourquoi_vaut_leffort',
        label: 'Pourquoi cette transformation vaut l’effort',
        kind: 'long',
        aide: 'Exprimer le sens de l’effort : ce que l’entreprise, les clients et les équipes gagneront vraiment.',
      },
      {
        key: 'de_quoi_serons_nous_fiers',
        label: 'De quoi serons-nous fiers si nous réussissons ?',
        kind: 'long',
        aide: '« Si nous réussissons… nous pourrons être fiers de… »',
      },
      {
        key: 'demandes_30_jours',
        label: 'Ce que je nous demande dans les 30 prochains jours (3 max)',
        kind: 'list',
        max: 3,
        aide: 'Formuler des demandes actionnables, observables dans le mois, avec un verbe clair.',
      },
      {
        key: 'prochaine_etape_date',
        label: 'Date du prochain séminaire (fin de priorisation BUILD vs RUN)',
        kind: 'text',
        aide: 'Ex : « mardi 23 juin 2026 »',
      },
      {
        key: 'prochaine_etape_detail',
        label: 'Prochaine grande étape de notre parcours',
        kind: 'long',
        aide: "À l’issue de ce séminaire, je nous demande de…",
      },
      {
        key: 'preuve_travail_codir',
        label: 'À quoi verrons-nous que nous avons correctement effectué notre travail de CODIR ?',
        kind: 'long',
        aide: 'Le moment qui suit ce discours compte autant que le discours lui-même…',
      },
      {
        key: 'engagement_final',
        label: 'Mon engagement final',
        kind: 'long',
        aide: 'Conclure par une phrase personnelle et engageante : ce que je prends sur moi, et ce que je demande au collectif.',
      },
    ],
    questionSeminaire:
      'Sur quoi voulons-nous nous engager ensemble, de façon visible, dans les prochaines semaines ?',
  },
] as const

/** Valeur vide pour un cartouche (un objet avec toutes les sous-clés vides). */
export function emptyCard(field: DiscoursField): Record<string, string> {
  const entry: Record<string, string> = {}
  for (const sub of field.subFields ?? []) entry[sub.key] = ''
  return entry
}

/** Payload vide conforme au modèle (toutes les clés, valeurs nulles / listes vides / cartouches min). */
export function emptyBlocsPayload(): Record<
  string,
  Record<string, string | string[] | Array<Record<string, string>> | null>
> {
  const payload: Record<
    string,
    Record<string, string | string[] | Array<Record<string, string>> | null>
  > = {}
  for (const bloc of PERFORMATIVE_BLOCS) {
    const fields: Record<string, string | string[] | Array<Record<string, string>> | null> = {}
    for (const f of bloc.fields) {
      if (f.kind === 'list') {
        fields[f.key] = []
      } else if (f.kind === 'cards') {
        const n = f.minCards ?? 1
        fields[f.key] = Array.from({ length: n }, () => emptyCard(f))
      } else {
        fields[f.key] = null
      }
    }
    payload[bloc.key] = fields
  }
  return payload
}
