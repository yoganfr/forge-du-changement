export type GanttMonth = {
  key: string
  label: string
  year: number
  monthIndex: number
}

/** Regroupement par année civile sur une fenêtre de mois (ex. 24 mois glissants). */
export type GanttYearSpan = {
  year: number
  count: number
  /** Index de la première colonne dans la liste `months`. */
  startIndex: number
}

export function buildGanttYearSpans(months: GanttMonth[]): GanttYearSpan[] {
  const spans: GanttYearSpan[] = []
  for (let i = 0; i < months.length; i++) {
    const m = months[i]!
    const last = spans[spans.length - 1]
    if (last && last.year === m.year) last.count++
    else spans.push({ year: m.year, count: 1, startIndex: i })
  }
  return spans
}

/**
 * Marqueurs centrés sur chaque bloc d’année : « 2026 (9 mois) », etc.
 * Pour mini-frises (bandeau projet, Vue DG) — pas les repères M6/M12.
 */
export function ganttYearTimelineMarkers(months: GanttMonth[]): Array<{
  key: string
  label: string
  title: string
  leftPct: number
  alignEnd: boolean
}> {
  const spans = buildGanttYearSpans(months)
  const n = months.length
  if (n === 0 || spans.length === 0) return []
  const denom = Math.max(1, n - 1)
  return spans.map((s, j) => {
    const mid = s.startIndex + (s.count - 1) / 2
    const leftPct = (mid / denom) * 100
    const isLast = j === spans.length - 1
    return {
      key: `y-${s.year}-${s.startIndex}`,
      label: `${s.year} (${s.count} mois)`,
      title: `${s.year} — ${s.count} mois dans la fenêtre affichée`,
      leftPct,
      alignEnd: isLast,
    }
  })
}

/** Fenêtre glissante 24 mois (alignée sur la sélection Projets transformants). */
export function generateGanttMonths(): GanttMonth[] {
  const today = new Date()
  const months: GanttMonth[] = []
  for (let i = 0; i < 24; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() + i, 1)
    months.push({
      key: `${d.getMonth()}-${d.getFullYear()}`,
      label: d.toLocaleString('fr-FR', { month: 'short' }).replace('.', '').slice(0, 3),
      year: d.getFullYear(),
      monthIndex: d.getMonth(),
    })
  }
  return months
}
