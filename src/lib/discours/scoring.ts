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
  const pCards = blocs['nouveaux_principes']?.['principes']
  const principesOk =
    Array.isArray(pCards) &&
    pCards.length > 0 &&
    (pCards as Array<Record<string, string>>).some((c) => (c.intitule ?? '').trim().length > 1)
  if (principesOk) {
    cl += 1.5
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

  return {
    total,
    dimensions,
    niveau,
    forces: forces.slice(0, 6),
    vigilances: vigilances.slice(0, 6),
    recommandations: recommandations.slice(0, 5),
    source: 'rules',
    computed_at: new Date().toISOString(),
  }
}
