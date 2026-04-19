import type { GanttMonth } from './lib/ganttMonths'

type Props = {
  months: GanttMonth[]
  planning: Record<string, boolean>
  markerClassName: string
  markerStartClassName: string
  markerEndClassName: string
}

function formatMonthYearShort(m: GanttMonth): string {
  return `${m.label} ${String(m.year).slice(-2)}`
}

function resolvePlanningRange(months: GanttMonth[], planning: Record<string, boolean>): { start: number; end: number } {
  const activeIndexes = months
    .map((m, idx) => ((planning[m.key] ?? false) ? idx : -1))
    .filter((idx) => idx >= 0)

  if (activeIndexes.length === 0) {
    return { start: 0, end: Math.max(0, months.length - 1) }
  }

  return { start: activeIndexes[0]!, end: activeIndexes[activeIndexes.length - 1]! }
}

export default function GanttRangeMarkers({
  months,
  planning,
  markerClassName,
  markerStartClassName,
  markerEndClassName,
}: Props) {
  if (months.length === 0) return null

  const { start, end } = resolvePlanningRange(months, planning)
  const startMonth = months[start]!
  const endMonth = months[end]!
  const denom = Math.max(1, months.length - 1)

  return (
    <>
      <span
        className={`${markerClassName} ${markerStartClassName}`}
        style={{ left: `${(start / denom) * 100}%` }}
        title={`Début prévu: ${startMonth.label} ${startMonth.year}`}
      >
        {formatMonthYearShort(startMonth)}
      </span>
      <span
        className={`${markerClassName} ${markerEndClassName}`}
        style={{ left: `${(end / denom) * 100}%` }}
        title={`Fin prévue: ${endMonth.label} ${endMonth.year}`}
      >
        {formatMonthYearShort(endMonth)}
      </span>
    </>
  )
}
