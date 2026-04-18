export type GanttMonth = {
  key: string
  label: string
  year: number
  monthIndex: number
}

/** Fenêtre glissante 24 mois (alignée sur La Fabrique). */
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
