import { describe, expect, it } from 'vitest'
import {
  assignJalonToColumn,
  buildTimelineColumns,
  defaultTargetMonthYearForColumn,
  jalonTargetDate,
} from './roadmapTimelineColumns'
import type { Jalon } from './types'

/** Date locale fixe (évite les écarts UTC vs trimestres calendaires). */
const fixedNow = new Date(2026, 3, 19, 12, 0, 0, 0)

describe('buildTimelineColumns', () => {
  it('retourne 4 trimestres + 2 années + plus tard', () => {
    const cols = buildTimelineColumns(fixedNow)
    expect(cols.length).toBe(7)
    expect(cols[0]?.kind).toBe('quarter')
    expect(cols[cols.length - 1]?.key).toBe('later')
  })
})

describe('defaultTargetMonthYearForColumn', () => {
  it('retourne fin de période pour un trimestre', () => {
    const cols = buildTimelineColumns(fixedNow)
    const q = cols.find((c) => c.kind === 'quarter')
    expect(q).toBeDefined()
    const my = defaultTargetMonthYearForColumn(q!)
    expect(my?.mois).toBeGreaterThanOrEqual(1)
    expect(my?.mois).toBeLessThanOrEqual(12)
    expect(my?.annee).toBeGreaterThanOrEqual(2026)
  })
})

describe('assignJalonToColumn', () => {
  it('place un jalon dans la colonne qui contient sa date cible', () => {
    const cols = buildTimelineColumns(fixedNow)
    const j = {
      mois_cible: 9,
      annee_cible: 2026,
    } as Pick<Jalon, 'mois_cible' | 'annee_cible'> as Jalon
    const key = assignJalonToColumn(j, cols)
    const col = cols.find((c) => c.key === key)
    expect(col).toBeDefined()
    const d = jalonTargetDate(j)
    expect(d).not.toBeNull()
    expect(d!.getTime()).toBeGreaterThanOrEqual(col!.start.getTime())
    expect(d!.getTime()).toBeLessThanOrEqual(col!.end.getTime())
  })

  it('sans année cible, retombe sur la première colonne ou later', () => {
    const cols = buildTimelineColumns(fixedNow)
    const j = { mois_cible: 6, annee_cible: null } as Jalon
    const key = assignJalonToColumn(j, cols)
    expect(cols.some((c) => c.key === key)).toBe(true)
  })
})
