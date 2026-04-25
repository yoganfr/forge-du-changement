/**
 * Scoring rule-based (§3.1.3–3.1.4, §3.3) — déterministe, sans appel LLM.
 * `source: 'rules'` — à distinguer d’une future analyse IA (Edge, `source: 'ai'`).
 */

import type { DiscoursBlocsPayload, DiscoursScoreSnapshot } from '../types'
import { countJargonOccurrences, findAbstractPhrases, flattenDiscoursText } from './jargon'

function clip(n: number, min = 0, max = 20): number {
  return Math.max(min, Math.min(max, Math.round(n)))
}

function getStr(p: DiscoursBlocsPayload, bloc: string, key: string): string {
  const v = p[bloc]?.[key]
  return typeof v === 'string' ? v : ''
}

function getList(p: DiscoursBlocsPayload, bloc: string, key: string): string[] {
  const v = p[bloc]?.[key]
  if (!Array.isArray(v) || v.length === 0) return []
  if (typeof (v as string[])[0] === 'string') return (v as string[]).map((s) => s.trim()).filter(Boolean)
  return []
}

function getCards(p: DiscoursBlocsPayload, bloc: string, key: string): Array<Record<string, string>> {
  const v = p[bloc]?.[key]
  if (!Array.isArray(v) || v.length === 0) return []
  return v.filter((item): item is Record<string, string> => Boolean(item) && typeof item === 'object' && !Array.isArray(item))
}

function hasText(value: string, min = 24): boolean {
  return value.trim().length >= min
}

function countCompleteCards(cards: Array<Record<string, string>>, keys: string[], min = 8): number {
  return cards.filter((card) => keys.every((key) => hasText(card[key] ?? '', min))).length
}

function blockText(p: DiscoursBlocsPayload, bloc: string): string {
  const fields = p[bloc] ?? {}
  const parts: string[] = []
  for (const value of Object.values(fields)) {
    if (typeof value === 'string') parts.push(value)
    else if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'string') parts.push(item)
        else if (item && typeof item === 'object') parts.push(...Object.values(item))
      }
    }
  }
  return parts.join(' ')
}

type LocalBlocFeedback = NonNullable<DiscoursScoreSnapshot['bloc_feedback']>[string]

function makeFeedback(
  synthese: string,
  forces: string[],
  vigilances: string[],
  recommandations: string[],
): LocalBlocFeedback {
  return {
    synthese,
    forces: forces.slice(0, 2),
    vigilances: vigilances.slice(0, 2),
    recommandations: recommandations.slice(0, 3),
  }
}

function buildLocalBlocFeedback(blocs: DiscoursBlocsPayload): Record<string, LocalBlocFeedback> {
  const feedback: Record<string, LocalBlocFeedback> = {}

  const acquis = getList(blocs, 'nous_reconnaitre', 'acquis_majeurs')
  const succes = getStr(blocs, 'nous_reconnaitre', 'ce_qui_a_fait_reussite')
  const preserve = getStr(blocs, 'nous_reconnaitre', 'a_preserver')
  const lesson = getStr(blocs, 'nous_reconnaitre', 'enseignement_passe')
  const reconnaitreText = blockText(blocs, 'nous_reconnaitre')
  feedback.nous_reconnaitre = makeFeedback(
    acquis.length >= 3 && hasText(preserve)
      ? 'Le bloc commence à installer un ancrage collectif clair.'
      : 'Le bloc doit encore transformer les acquis en socle collectif.',
    [
      ...(acquis.length >= 3 ? ['Les acquis donnent une base de reconnaissance partagée.'] : []),
      ...(/\bnous\b/i.test(reconnaitreText) ? ['Le sujet collectif est déjà présent dans l’écriture.'] : []),
    ],
    [
      ...(acquis.length < 3 ? ['Les acquis sont trop peu nombreux pour créer un « nous » robuste.'] : []),
      ...(!hasText(preserve) ? ['Ce qui doit absolument être préservé reste à expliciter.'] : []),
    ],
    [
      ...(acquis.length < 3 ? ['Nommer trois acquis distincts, chacun observable par le collectif.'] : []),
      ...(!hasText(succes) ? ['Relier les acquis aux choix ou comportements qui ont produit la réussite.'] : []),
      ...(!hasText(lesson) ? ['Finir par un enseignement du passé qui servira de boussole.'] : []),
    ],
  )

  const basculeCards = getCards(blocs, 'nommer_la_bascule', 'changements_bascule')
  const basculeComplete = countCompleteCards(basculeCards, ['fait_observe', 'impact_codir', 'risque_si_pas_reaction'])
  const limites = getStr(blocs, 'nommer_la_bascule', 'limites_modele_actuel')
  const statuQuo = getStr(blocs, 'nommer_la_bascule', 'risque_statu_quo')
  const maintenant = getStr(blocs, 'nommer_la_bascule', 'pourquoi_maintenant')
  feedback.nommer_la_bascule = makeFeedback(
    basculeComplete >= 3 && hasText(maintenant)
      ? 'La nécessité du mouvement devient lisible.'
      : 'Le bloc doit encore faire sentir pourquoi l’immobilisme devient risqué.',
    [
      ...(basculeComplete >= 3 ? ['Les changements sont structurés en fait, impact et risque.'] : []),
      ...(hasText(maintenant) ? ['Le moment d’agir commence à être justifié.'] : []),
    ],
    [
      ...(basculeComplete < 3 ? ['Chaque changement doit relier le contexte à un impact CODIR puis à un risque.'] : []),
      ...(!hasText(statuQuo) ? ['Le risque principal du statu quo reste trop implicite.'] : []),
    ],
    [
      ...(basculeComplete < 3 ? ['Compléter les trois cartouches de bascule avec un fait vérifiable et une conséquence.'] : []),
      ...(!hasText(limites) ? ['Nommer ce qui fonctionnait hier mais ralentit ou fragilise aujourd’hui.'] : []),
      ...(!hasText(maintenant) ? ['Ajouter la raison précise pour laquelle il faut agir maintenant.'] : []),
    ],
  )

  const ambition = getStr(blocs, 'futur_desirable', 'ambition_une_phrase')
  const dans3Ans = getStr(blocs, 'futur_desirable', 'dans_3_ans')
  const clients = getStr(blocs, 'futur_desirable', 'mieux_pour_clients')
  const equipes = getStr(blocs, 'futur_desirable', 'mieux_pour_equipes')
  const entreprise = getStr(blocs, 'futur_desirable', 'mieux_pour_entreprise')
  const preuves = getList(blocs, 'futur_desirable', 'preuves_reussite')
  feedback.futur_desirable = makeFeedback(
    hasText(ambition, 12) && preuves.length >= 3
      ? 'Le futur visé commence à devenir désirable et vérifiable.'
      : 'Le futur doit encore passer d’une intention à une promesse concrète.',
    [
      ...(hasText(ambition, 12) ? ['L’ambition donne un début de cap.'] : []),
      ...(preuves.length >= 3 ? ['Les preuves de réussite rendent le futur vérifiable.'] : []),
    ],
    [
      ...(!hasText(equipes) ? ['Le bénéfice pour les équipes mérite d’être rendu plus sensible.'] : []),
      ...(!hasText(entreprise) ? ['L’effet attendu pour l’entreprise reste à relier au cap.'] : []),
    ],
    [
      ...(!hasText(dans3Ans) ? ['Décrire ce qui aura changé à trois ans si la transformation réussit.'] : []),
      ...(!hasText(clients) ? ['Rendre visible ce que clients, usagers ou patients percevront mieux.'] : []),
      ...(preuves.length < 3 ? ['Ajouter trois preuves concrètes qui permettront de reconnaître la réussite.'] : []),
    ],
  )

  const principes = getCards(blocs, 'nouveaux_principes', 'principes')
  const principesComplets = countCompleteCards(principes, ['intitule', 'veut_dire', 'change', 'exige'])
  const logique = getStr(blocs, 'nouveaux_principes', 'ce_qui_change_decider_cooperer_piloter')
  feedback.nouveaux_principes = makeFeedback(
    principesComplets >= 3
      ? 'Les principes peuvent commencer à jouer leur rôle de règles du jeu.'
      : 'Les principes doivent encore devenir des règles d’action.',
    [
      ...(principesComplets >= 3 ? ['Au moins trois principes sont renseignés de bout en bout.'] : []),
      ...(hasText(logique) ? ['Le changement de logique managériale est amorcé.'] : []),
    ],
    [
      ...(principes.length > 0 && principesComplets < 3 ? ['Certains principes restent incomplets ou trop déclaratifs.'] : []),
      ...(!hasText(logique) ? ['Le changement dans la façon de décider, coopérer et piloter reste à expliciter.'] : []),
    ],
    [
      ...(principesComplets < 3 ? ['Compléter trois principes avec ce que cela veut dire, change et exige du CODIR.'] : []),
      ...(!hasText(logique) ? ['Ajouter une phrase sur ce que le CODIR décidera ou pilotera autrement.'] : []),
    ],
  )

  const priorites = getList(blocs, 'concentrer_efforts', 'directions_strategiques')
  const simplifications = getList(blocs, 'concentrer_efforts', 'simplifications')
  feedback.concentrer_efforts = makeFeedback(
    priorites.length > 0 && priorites.length <= 3 && simplifications.length > 0 && simplifications.length <= 3
      ? 'Le bloc commence à transformer le cap en arbitrages exécutables.'
      : 'Le bloc doit encore réduire le cap à quelques choix tenables.',
    [
      ...(priorites.length > 0 && priorites.length <= 3 ? ['Les priorités restent dans une zone lisible.'] : []),
      ...(simplifications.length > 0 ? ['Les simplifications commencent à traiter la faisabilité.'] : []),
    ],
    [
      ...(priorites.length > 3 ? ['Trop de priorités diluent la discipline collective.'] : []),
      ...(simplifications.length === 0 ? ['Sans simplification, la trajectoire risque de rester incantatoire.'] : []),
    ],
    [
      ...(priorites.length === 0 ? ['Nommer une à trois priorités qui impliquent de vrais renoncements.'] : []),
      ...(priorites.length > 3 ? ['Regrouper ou supprimer les priorités qui ne concentrent pas l’énergie.'] : []),
      ...(simplifications.length === 0 ? ['Ajouter ce qu’il faut retirer, clarifier ou alléger pour exécuter.'] : []),
    ],
  )

  const risquesContexte = getStr(blocs, 'reconnaitre_epreuves', 'risques_contexte_marche')
  const risquesBusiness = getStr(blocs, 'reconnaitre_epreuves', 'risques_metiers_business')
  const risquesManageriaux = getStr(blocs, 'reconnaitre_epreuves', 'risques_manageriaux')
  const risquesHumains = getStr(blocs, 'reconnaitre_epreuves', 'risques_humains_emotionnels')
  const dirigeants = getStr(blocs, 'reconnaitre_epreuves', 'ce_que_dirigeants_doivent_changer')
  const doutes = getStr(blocs, 'reconnaitre_epreuves', 'doutes_legitimes')
  const risquesRenseignes = [risquesContexte, risquesBusiness, risquesManageriaux, risquesHumains, dirigeants, doutes].filter((v) => hasText(v)).length
  feedback.reconnaitre_epreuves = makeFeedback(
    risquesRenseignes >= 4 && hasText(dirigeants)
      ? 'La lucidité commence à être assumée sans nier la difficulté.'
      : 'Le bloc doit encore rendre les difficultés dicibles et crédibles.',
    [
      ...(risquesRenseignes >= 4 ? ['Plusieurs registres de risques sont déjà ouverts.'] : []),
      ...(hasText(doutes) ? ['La place du doute est explicitement reconnue.'] : []),
    ],
    [
      ...(!hasText(risquesHumains) ? ['Les risques humains ou émotionnels méritent d’être nommés.'] : []),
      ...(!hasText(dirigeants) ? ['La part de changement attendue des dirigeants reste trop faible.'] : []),
    ],
    [
      ...(risquesRenseignes < 4 ? ['Couvrir au moins quatre registres : contexte, métier, management, humain, dirigeants, doutes.'] : []),
      ...(!hasText(dirigeants) ? ['Ajouter ce que les dirigeants devront changer eux-mêmes.'] : []),
      ...(!hasText(doutes) ? ['Nommer un doute légitime pour autoriser la parole vraie.'] : []),
    ],
  )

  const engagement = getStr(blocs, 'distribuer_roles', 'engagement_personnel_dirigeant')
  const codir = getStr(blocs, 'distribuer_roles', 'attente_codir')
  const managers = getStr(blocs, 'distribuer_roles', 'attente_managers')
  const equipesAttente = getStr(blocs, 'distribuer_roles', 'equipes_peuvent_attendre')
  const nonNegociable = getStr(blocs, 'distribuer_roles', 'non_negociable')
  const discutable = getStr(blocs, 'distribuer_roles', 'discutable')
  const coConstruire = getStr(blocs, 'distribuer_roles', 'a_co_construire')
  feedback.distribuer_roles = makeFeedback(
    hasText(engagement) && hasText(codir) && hasText(nonNegociable) && hasText(discutable)
      ? 'Le contrat collectif commence à devenir praticable.'
      : 'Le bloc doit encore clarifier qui porte quoi dans la transformation.',
    [
      ...(hasText(engagement) ? ['L’engagement personnel du dirigeant est présent.'] : []),
      ...(hasText(nonNegociable) && hasText(discutable) ? ['La frontière entre non négociable et discutable est posée.'] : []),
    ],
    [
      ...(!hasText(equipesAttente) ? ['Ce que les équipes peuvent attendre de la gouvernance reste à préciser.'] : []),
      ...(!hasText(coConstruire) ? ['L’espace de co-construction reste encore faible.'] : []),
    ],
    [
      ...(!hasText(codir) ? ['Formuler le contrat attendu du CODIR.'] : []),
      ...(!hasText(managers) ? ['Rendre explicite la contribution attendue des managers.'] : []),
      ...(!hasText(nonNegociable) || !hasText(discutable) ? ['Distinguer clairement ce qui est imposé, discuté et co-construit.'] : []),
    ],
  )

  const effort = getStr(blocs, 'sceller_engagement', 'pourquoi_vaut_leffort')
  const fierte = getStr(blocs, 'sceller_engagement', 'de_quoi_serons_nous_fiers')
  const demandes = getList(blocs, 'sceller_engagement', 'demandes_30_jours')
  const date = getStr(blocs, 'sceller_engagement', 'prochaine_etape_date')
  const etape = getStr(blocs, 'sceller_engagement', 'prochaine_etape_detail')
  const preuveCodir = getStr(blocs, 'sceller_engagement', 'preuve_travail_codir')
  const final = getStr(blocs, 'sceller_engagement', 'engagement_final')
  feedback.sceller_engagement = makeFeedback(
    hasText(effort) && demandes.length > 0 && hasText(date, 4) && hasText(final)
      ? 'La conclusion commence à créer une mise en action.'
      : 'La conclusion doit encore devenir un passage à l’acte.',
    [
      ...(demandes.length > 0 && demandes.length <= 3 ? ['Les demandes à 30 jours restent actionnables.'] : []),
      ...(hasText(date, 4) ? ['Une prochaine échéance est présente.'] : []),
    ],
    [
      ...(demandes.length > 3 ? ['Trop de demandes à 30 jours risquent de disperser l’énergie.'] : []),
      ...(!hasText(final) ? ['L’engagement final doit encore porter une voix personnelle.'] : []),
    ],
    [
      ...(!hasText(effort) ? ['Dire pourquoi l’effort demandé vaut réellement la peine.'] : []),
      ...(demandes.length === 0 ? ['Ajouter une à trois demandes concrètes pour les 30 prochains jours.'] : []),
      ...(!hasText(fierte) ? ['Ajouter ce dont le collectif pourra être fier si la transformation réussit.'] : []),
      ...(!hasText(etape) || !hasText(preuveCodir) || !hasText(final) ? ['Relier prochaine étape, preuve de travail CODIR et phrase finale engageante.'] : []),
    ],
  )

  return feedback
}

const DIMENSION_LABELS: Record<keyof DiscoursScoreSnapshot['dimensions'], string> = {
  clarte_strategique: 'clarté stratégique',
  force_narrative: 'force narrative',
  credibilite_manageriale: 'crédibilité managériale',
  pouvoir_mobilisateur: 'pouvoir mobilisateur',
  performativite_collective: 'performativité collective',
}

function buildLocalSynthese(
  total: number,
  niveau: 1 | 2 | 3,
  dimensions: DiscoursScoreSnapshot['dimensions'],
): string {
  const weakest = (Object.entries(dimensions) as Array<[keyof DiscoursScoreSnapshot['dimensions'], number]>)
    .sort((a, b) => a[1] - b[1])[0]
  const weakestLabel = DIMENSION_LABELS[weakest[0]]
  if (niveau === 1) {
    return `Le discours est encore en construction (${total}/100) : la priorité locale est de renforcer la ${weakestLabel}.`
  }
  if (niveau === 2) {
    return `Le discours est solide mais peut gagner en puissance (${total}/100) : le prochain levier est la ${weakestLabel}.`
  }
  return `Le discours est déjà mobilisateur (${total}/100) : préserver la sobriété et vérifier la ${weakestLabel}.`
}

/**
 * Produit le snapshot de score (5 × /20, total /100, niveau 1–3) à partir des seules règles §3.1.4.
 */
export function computeRuleBasedDiscoursScore(blocs: DiscoursBlocsPayload): DiscoursScoreSnapshot {
  const flat = flattenDiscoursText(blocs)
  const jargonN = countJargonOccurrences(flat)
  const abstractPhrases = findAbstractPhrases(flat, 4)

  const listPriorites = getList(blocs, 'concentrer_efforts', 'directions_strategiques')
  const listSimp = getList(blocs, 'concentrer_efforts', 'simplifications')
  const list30 = getList(blocs, 'sceller_engagement', 'demandes_30_jours')
  const listPreuves = getList(blocs, 'futur_desirable', 'preuves_reussite')
  const listAcquis = getList(blocs, 'nous_reconnaitre', 'acquis_majeurs')

  const longObstacleFields = [
    'risques_contexte_marche',
    'risques_metiers_business',
    'risques_manageriaux',
    'risques_humains_emotionnels',
    'ce_que_dirigeants_doivent_changer',
    'doutes_legitimes',
  ] as const
  let obstaclesLongs = 0
  for (const k of longObstacleFields) {
    if (getStr(blocs, 'reconnaitre_epreuves', k).trim().length > 20) obstaclesLongs += 1
  }

  const engagement = getStr(blocs, 'distribuer_roles', 'engagement_personnel_dirigeant')
  const nonN = getStr(blocs, 'distribuer_roles', 'non_negociable')
  const discu = getStr(blocs, 'distribuer_roles', 'discutable')
  const mieuxEq = getStr(blocs, 'futur_desirable', 'mieux_pour_equipes')
  const visionPhrase = getStr(blocs, 'futur_desirable', 'ambition_une_phrase') + ' ' + getStr(blocs, 'futur_desirable', 'dans_3_ans')
  const dateProchaine = getStr(blocs, 'sceller_engagement', 'prochaine_etape_date')
  const attenteCodir = getStr(blocs, 'distribuer_roles', 'attente_codir')

  const nQuestion = (flat.match(/\?/g) ?? []).length
  const nNous = (flat.match(/\bnous\b/gi) ?? []).length
  const hasCodirMention = /(codir|comité de direction)/i.test(flat)
  const hasUrgenceMaintenant = getStr(blocs, 'nommer_la_bascule', 'pourquoi_maintenant').trim().length > 30
  const cardsBascule = blocs['nommer_la_bascule']?.['changements_bascule']
  const cardsChangements =
    Array.isArray(cardsBascule) && cardsBascule.length && typeof (cardsBascule[0] as object) === 'object'
      ? (cardsBascule as Array<Record<string, string>>)
      : []
  const basculeRempli =
    cardsChangements.length > 0 &&
    cardsChangements.every((c) => ['fait_observe', 'impact_codir', 'risque_si_pas_reaction'].every((k) => (c[k] ?? '').trim().length > 8))

  /** Bonus §3.1.4 */
  const bEngagePerso = engagement.trim().length > 30
  const bEmotion = /(peur|tension|émotion|doute|crainte|inquiétude|sensible|fragile)/i.test(flat)
  const bNonNeg = nonN.trim().length > 15 && discu.trim().length > 15
  const bJalons = listPreuves.length >= 3 && listPreuves.every((x) => x.length > 5)
  const bBenefEquipes = mieuxEq.trim().length > 20
  const bQuestion = nQuestion >= 1
  const bNousActeur = nNous >= 6
  const totalListItems = listPriorites.length + listSimp.length + list30.length
  const mTooManyList = totalListItems > 5
  const mTooObstacles = obstaclesLongs > 5
  const mJargonFlood = jargonN > 15
  const mJargonLourd = jargonN > 8
  const mVisionAction =
    !/(devenir|voul|ser|chang|agir|constru|développ|accél|transform|invest|prioris|simplif|offrir|créer|passer|élever|tendre|viser|visons)/i.test(
      visionPhrase.trim(),
    ) && visionPhrase.trim().length > 5
  const mEcheance =
    dateProchaine.trim().length < 4 && !/(20[2-3]\d|janv|févr|mars|avr|mai|juin|juil|août|sept|oct|nov|déc|lundi|mardi|mercredi|jeudi|vendredi)/i.test(
      flat,
    )
  const mCodir = !hasCodirMention
  const mDescendant = (flat.match(/\bvous (devez|aurez|devrez|êtes|avez)\b/gi) ?? []).length > 3 && nNous < 3
  const pCards = getCards(blocs, 'nouveaux_principes', 'principes')
  const principesOk = pCards.some((c) => (c.intitule ?? '').trim().length > 1)
  const principesComplets = countCompleteCards(pCards, ['intitule', 'veut_dire', 'change', 'exige']) >= 3
  const reconnaissanceOk =
    listAcquis.length >= 3 &&
    hasText(getStr(blocs, 'nous_reconnaitre', 'a_preserver')) &&
    hasText(getStr(blocs, 'nous_reconnaitre', 'enseignement_passe'))
  const futurOk =
    hasText(getStr(blocs, 'futur_desirable', 'ambition_une_phrase'), 12) &&
    hasText(getStr(blocs, 'futur_desirable', 'dans_3_ans')) &&
    hasText(getStr(blocs, 'futur_desirable', 'mieux_pour_clients')) &&
    bBenefEquipes &&
    listPreuves.length >= 3
  const effortsOk = listPriorites.length > 0 && listPriorites.length <= 3 && listSimp.length > 0 && listSimp.length <= 3
  const epreuvesOk = obstaclesLongs >= 4 && hasText(getStr(blocs, 'reconnaitre_epreuves', 'ce_que_dirigeants_doivent_changer'))
  const rolesOk =
    bEngagePerso &&
    attenteCodir.trim().length > 25 &&
    bNonNeg &&
    hasText(getStr(blocs, 'distribuer_roles', 'a_co_construire'))
  const conclusionOk =
    hasText(getStr(blocs, 'sceller_engagement', 'pourquoi_vaut_leffort')) &&
    list30.length > 0 &&
    list30.length <= 3 &&
    hasText(dateProchaine, 4) &&
    hasText(getStr(blocs, 'sceller_engagement', 'engagement_final'))

  // Points de base par dimension
  let cl = 8
  let fn = 8
  let cr = 8
  let mo = 8
  let pe = 8

  if (listAcquis.length >= 1) {
    cl += 1.5
    fn += 1.5
  }
  if (basculeRempli) cl += 2
  if (hasUrgenceMaintenant) cl += 1
  if (principesOk) {
    cl += 1.5
  }
  if (principesComplets) {
    cl += 1.5
    pe += 1
  }
  if (reconnaissanceOk) {
    fn += 1
    cr += 0.5
  }
  if (futurOk) {
    fn += 1.5
    mo += 1.5
  }
  if (effortsOk) {
    cl += 1.5
    pe += 0.5
  }
  if (epreuvesOk) cr += 1.5
  if (rolesOk) {
    cr += 2
    pe += 1.5
  }
  if (conclusionOk) {
    mo += 1.5
    pe += 1.5
  }
  if (nNous >= 4) {
    fn += 2
    pe += 1.5
  }
  if (bEngagePerso) {
    cr += 3
    pe += 1
  }
  if (bEmotion) cr += 1.5
  if (bNonNeg) {
    cl += 1
    cr += 2.5
  }
  if (bJalons) {
    cl += 1
    mo += 2.5
  }
  if (bBenefEquipes) mo += 2
  if (bQuestion) {
    cl += 1.5
    pe += 2.5
  }
  if (bNousActeur) pe += 1.5
  if (attenteCodir.trim().length > 25) {
    cr += 1.5
    pe += 1
  }
  if (mJargonFlood) {
    cl -= 3
    fn -= 2
  } else if (mJargonLourd) {
    cl -= 1.5
  }
  if (mTooManyList) cl -= 2
  if (mTooObstacles) cl -= 1.5
  if (mVisionAction) {
    cl -= 2.5
    fn -= 1
  }
  if (mEcheance) {
    cl -= 2.5
    pe -= 2.5
  }
  if (mCodir) {
    cr -= 2.5
    pe -= 1.5
  }
  if (mDescendant) {
    pe -= 2.5
    mo -= 1.5
  }
  if (abstractPhrases.length > 0) {
    cl -= 1.5
    fn -= 0.5
  }

  // Variation légère liée à la complétude globale
  const filledRatio = Math.min(1, flat.length / 6000)
  cl += filledRatio
  fn += filledRatio
  cr += filledRatio
  mo += filledRatio
  pe += filledRatio

  const dimensions = {
    clarte_strategique: clip(cl),
    force_narrative: clip(fn),
    credibilite_manageriale: clip(cr),
    pouvoir_mobilisateur: clip(mo),
    performativite_collective: clip(pe),
  }
  const total = Math.min(
    100,
    dimensions.clarte_strategique +
      dimensions.force_narrative +
      dimensions.credibilite_manageriale +
      dimensions.pouvoir_mobilisateur +
      dimensions.performativite_collective,
  )

  let niveau: 1 | 2 | 3 = 1
  if (total >= 70) niveau = 3
  else if (total >= 45) niveau = 2

  const forces: string[] = []
  if (bEngagePerso) forces.push("Engagement personnel explicite du dirigeant")
  if (bEmotion) forces.push("Reconnaissance d’une part d’incertitude ou de tension (émotions / risques nommés)")
  if (bNonNeg) forces.push("Distinction explicite entre non négociable, zone de débat et co-construction")
  if (bJalons) forces.push("Preuves de réussite ou jalons concrets listés (trajectoire)")
  if (bBenefEquipes) forces.push("Bénéfice pour les équipes mis en récit")
  if (bQuestion) forces.push("Questions ouvertes pour le séminaire (parole utile à venir)")
  if (bNousActeur) forces.push("« Nous » mobilisateur comme sujet collectif d’action")

  const vigilances: string[] = []
  if (jargonN > 5) vigilances.push(`Jargon de la liste d’alerte (≈${jargonN} occurrences) — ancrer dans des faits, exemples, décisions.`)
  if (mTooManyList) vigilances.push("Beaucoup d’intentions listées (priorités / simplifications / demandes) : risque de dilution des priorités.")
  if (mTooObstacles) vigilances.push("Beaucoup de freins identifiés en parallèle : clarifier l’essentiel vs le secondaire.")
  if (mJargonFlood) vigilances.push("Densité élevée de mots de la liste §3.2.A — vérifier la lisibilité pour le CODIR.")
  if (mVisionAction) vigilances.push("La vision (phrase d’ambition) gagnerait à inclure un verbe d’action / un cap mesurable.")
  if (mEcheance) vigilances.push("Peu d’ancrage temporel (date, horizon, prochaine étape) — le collectif a besoin d’un rythme.")
  if (mCodir) vigilances.push("Le rôle explicite du CODIR (contrat collectif) pourrait être renforcé dans le texte.")
  if (mDescendant) vigilances.push("Risque de ton trop descendant (« vous devez… ») — renforcer l’implication partagée (« nous… »).")
  if (abstractPhrases.length > 0)
    vigilances.push("Certaines phrases sont longues ou abstraites — préciser acteurs, ressources et conséquence observable.")

  const recommandations: string[] = []
  const weaks: Array<{ key: keyof typeof dimensions; label: string; tip: string }> = [
    { key: 'clarte_strategique', label: 'Clarté stratégique', tip: "Reserrer l’enjeu, la vision en une trajectoire lisible, limiter le jargon et les listes infinies." },
    { key: 'force_narrative', label: 'Force narrative', tip: "Enchaîner passé – bascule – cap – rôles – engagement comme récit, pas comme inventaire de thèmes." },
    { key: 'credibilite_manageriale', label: 'Crédibilité managériale', tip: "Assumer doutes, limites, rôle du CODIR et engagements personnels concrets de direction." },
    { key: 'pouvoir_mobilisateur', label: 'Pouvoir mobilisateur', tip: "Renforcer bénéfices, reconnaissance, preuves et ce que chacun peut attendre de la gouvernance." },
    { key: 'performativite_collective', label: 'Performativité collective', tip: "Terminer sur prochaine étape, demandes 30 jours, ouverture à la controverse structurante." },
  ]
  for (const w of weaks.sort((a, b) => dimensions[a.key] - dimensions[b.key]).slice(0, 2)) {
    if (dimensions[w.key] < 14) recommandations.push(`Prioriser ${w.label} : ${w.tip}`)
  }
  if (recommandations.length < 2 && total < 75) {
    recommandations.push("Relire chaque bloc avec la question : « qu’est-ce que le CODIR décide ou observe concrètement à la fin ? »")
  }
  if (recommandations.length < 1) {
    recommandations.push("Conserver un ton stable pour les arbitrages : éviter d’augmenter sans cesse le nombre d’exigences dans les listes.")
  }

  const blocFeedback = buildLocalBlocFeedback(blocs)
  for (const feedback of Object.values(blocFeedback)) {
    for (const item of feedback.recommandations ?? []) {
      if (recommandations.length >= 5) break
      if (!recommandations.includes(item)) recommandations.push(item)
    }
    if (recommandations.length >= 5) break
  }

  return {
    total,
    dimensions,
    niveau,
    forces: forces.slice(0, 6),
    vigilances: vigilances.slice(0, 6),
    recommandations: recommandations.slice(0, 5),
    synthese: buildLocalSynthese(total, niveau, dimensions),
    bloc_feedback: blocFeedback,
    source: 'rules',
    computed_at: new Date().toISOString(),
    blocs_fingerprint: JSON.stringify(blocs),
  }
}
