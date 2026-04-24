/**
 * Détection de jargon (§3.2) et d’abstraction (§3.2.B).
 * doc : docs/Référence Discours de transformation.md
 */

import type { DiscoursBlocsPayload } from '../types'

/** Liste §3.2.A — mots fréquents en transformation corporate (insensible à la casse). */
export const JARGON_WORDS = [
  'transformation',
  'excellence',
  'agilité',
  'synergie',
  'innovation',
  'performance',
  'robustesse',
  'leadership',
  'efficience',
  'alignement',
] as const

const ABSTRACT_CUES = new Set(
  (['transformation', 'excellence', 'innovation', 'performance', 'alignement', 'robustesse', 'agilité'] as const)
    .map((w) => w.normalize('NFD').replace(/\p{M}/gu, '')),
)

export function flattenDiscoursText(payload: DiscoursBlocsPayload): string {
  const parts: string[] = []
  const walk = (v: unknown): void => {
    if (v == null) return
    if (typeof v === 'string') {
      if (v.trim()) parts.push(v)
      return
    }
    if (Array.isArray(v)) {
      for (const item of v) walk(item)
      return
    }
    if (typeof v === 'object') {
      for (const s of Object.values(v)) walk(s)
    }
  }
  walk(payload)
  return parts.join('\n')
}

/**
 * Nombre d’occurrences de la liste de jargon (comptage de mots entiers, insensible casse, accents pliés).
 */
export function countJargonOccurrences(flat: string): number {
  if (!flat.trim()) return 0
  const norm = (s: string) =>
    s
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .toLowerCase()
  const text = ` ${norm(flat)} `

  let n = 0
  for (const w of JARGON_WORDS) {
    const token = ` ${norm(w)} `
    let start = 0
    while (true) {
      const i = text.indexOf(token, start)
      if (i === -1) break
      n += 1
      start = i + token.length
    }
  }
  return n
}

export type AbstractPhraseHit = { phrase: string; wordCount: number; reason: string }

/**
 * Découpage grossier en phrases, puis règles §3.2.B : >25 mots, ≥3 noms abstraits de la liste.
 */
export function findAbstractPhrases(flat: string, max = 6): readonly AbstractPhraseHit[] {
  const raw = flat.replace(/\r/g, ' ').trim()
  if (!raw) return []
  const chunks = raw.split(/(?<=[.!?…])\s+/)
  const hits: AbstractPhraseHit[] = []

  for (const ch of chunks) {
    const phrase = ch.replace(/\s+/g, ' ').trim()
    if (!phrase) continue
    const words = phrase.split(/\s+/).filter(Boolean)
    if (words.length < 4) continue

    const wNorm = (w: string) =>
      w
        .replace(/^[^\p{L}\p{N}]+/gu, '')
        .replace(/[^\p{L}\p{N}]+$/gu, '')
        .normalize('NFD')
        .replace(/\p{M}/gu, '')
        .toLowerCase()

    let abstractHits = 0
    for (const w of words) {
      const t = wNorm(w)
      if (ABSTRACT_CUES.has(t)) abstractHits += 1
    }

    if (words.length > 25 && abstractHits >= 3) {
      hits.push({
        phrase: phrase.length > 220 ? `${phrase.slice(0, 217)}…` : phrase,
        wordCount: words.length,
        reason: 'Phrase longue et plusieurs termes abstraits — préciser acteur, objet et conséquence observable.',
      })
    } else if (words.length > 25) {
      hits.push({
        phrase: phrase.length > 220 ? `${phrase.slice(0, 217)}…` : phrase,
        wordCount: words.length,
        reason: 'Phrase longue : découper ou préciser le sens concret demandé au collectif.',
      })
    }
    if (hits.length >= max) break
  }
  return hits
}
