import type { Jalon } from './types'

export type TimelineColumn =
  | { kind: 'quarter'; key: string; label: string; start: Date; end: Date }
  | { kind: 'year'; key: string; label: string; start: Date; end: Date }
  | { kind: 'later'; key: 'later'; label: string; start: Date; end: Date }

const MONTH_FR = ['Janv', 'Fév', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc']

function startOfQuarter(year: number, q: 1 | 2 | 3 | 4): Date {
  const m = (q - 1) * 3
  return new Date(year, m, 1, 0, 0, 0, 0)
}

function endOfQuarter(year: number, q: 1 | 2 | 3 | 4): Date {
  const lastMonth = q * 3 - 1
  return new Date(year, lastMonth + 1, 0, 23, 59, 59, 999)
}

/** Premier trimestre calendaire après celui qui contient `d` (ex. avril 2026 → T3 juillet). */
export function nextQuarterAfterDate(d: Date): { y: number; q: 1 | 2 | 3 | 4 } {
  const m = d.getMonth()
  const q = Math.floor(m / 3) + 1
  let nq = q + 1
  let y = d.getFullYear()
  if (nq > 4) {
    nq = 1
    y++
  }
  return { y, q: nq as 1 | 2 | 3 | 4 }
}

function addQuarters(start: { y: number; q: 1 | 2 | 3 | 4 }, delta: number): { y: number; q: 1 | 2 | 3 | 4 } {
  const idx = start.y * 4 + (start.q - 1) + delta
  const y = Math.floor(idx / 4)
  const q = (idx % 4) + 1
  return { y, q: q as 1 | 2 | 3 | 4 }
}

/** Libellé « arrivée » : mois de fin de trimestre uniquement (ex. Sept 2026). */
function quarterArrivalLabel(y: number, q: 1 | 2 | 3 | 4): string {
  const lastMonthIdx = q * 3 - 1
  return `${MONTH_FR[lastMonthIdx]} ${y}`
}

/** Mois / année cibles par défaut (fin de période) pour préremplir une création de jalon. */
export function defaultTargetMonthYearForColumn(col: TimelineColumn): { mois: number; annee: number } | null {
  if (col.kind === 'later') {
    const y = new Date().getFullYear() + 3
    return { mois: 12, annee: y }
  }
  const end = col.end
  return { mois: end.getMonth() + 1, annee: end.getFullYear() }
}

/**
 * Colonnes temps : 4 trimestres consécutifs à partir du trimestre suivant la date actuelle,
 * puis la fin de la première année civile après le 4e trimestre, puis une année complète,
 * puis « Plus tard ».
 *
 * Ex. (18 avr. 2026) : Sept 2026, Déc 2026, Mars 2027, Juin 2027, puis Déc 2027, Déc 2028, Plus tard.
 */
export function buildTimelineColumns(now: Date = new Date()): TimelineColumn[] {
  const cols: TimelineColumn[] = []
  const start = nextQuarterAfterDate(now)
  for (let k = 0; k < 4; k++) {
    const { y, q } = addQuarters(start, k)
    cols.push({
      kind: 'quarter',
      key: `q-${y}-${q}`,
      label: quarterArrivalLabel(y, q),
      start: startOfQuarter(y, q),
      end: endOfQuarter(y, q),
    })
  }

  const endLastQuarter = cols[3].end
  const dayAfter = new Date(endLastQuarter.getTime() + 1)
  const yFirst = dayAfter.getFullYear()
  const endFirstYearSlice = new Date(yFirst, 11, 31, 23, 59, 59, 999)

  cols.push({
    kind: 'year',
    key: `y-${yFirst}-s`,
    label: `Déc ${yFirst}`,
    start: dayAfter,
    end: endFirstYearSlice,
  })

  const ySecond = yFirst + 1
  cols.push({
    kind: 'year',
    key: `y-${ySecond}-full`,
    label: `Déc ${ySecond}`,
    start: new Date(ySecond, 0, 1, 0, 0, 0, 0),
    end: new Date(ySecond, 11, 31, 23, 59, 59, 999),
  })

  const lastEnd = cols[cols.length - 1].end
  cols.push({
    kind: 'later',
    key: 'later',
    label: 'Plus tard',
    start: new Date(lastEnd.getTime() + 1),
    end: new Date(2100, 11, 31, 23, 59, 59, 999),
  })

  return cols
}

export function jalonTargetDate(j: Jalon): Date | null {
  if (!j.annee_cible) return null
  const m = j.mois_cible && j.mois_cible >= 1 && j.mois_cible <= 12 ? j.mois_cible : 1
  return new Date(j.annee_cible, m - 1, 1, 12, 0, 0, 0)
}

function dateInRange(d: Date, start: Date, end: Date): boolean {
  const t = d.getTime()
  return t >= start.getTime() && t <= end.getTime()
}

export function assignJalonToColumn(j: Jalon, columns: TimelineColumn[]): string {
  const d = jalonTargetDate(j)
  if (!d) {
    return columns[0]?.key ?? 'later'
  }
  for (const col of columns) {
    if (dateInRange(d, col.start, col.end)) return col.key
  }
  return 'later'
}

export function sortJalonsForCell(list: Jalon[]): Jalon[] {
  return [...list].sort((a, b) => {
    const ta = jalonTargetDate(a)?.getTime() ?? 0
    const tb = jalonTargetDate(b)?.getTime() ?? 0
    if (ta !== tb) return ta - tb
    return (a.ordre_sequentiel ?? 0) - (b.ordre_sequentiel ?? 0)
  })
}
