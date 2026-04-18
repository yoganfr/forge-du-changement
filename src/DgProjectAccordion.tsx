import { useMemo, useState } from 'react'
import type { Projet } from './lib/types'
import { generateGanttMonths } from './lib/ganttMonths'
import './dgGantt.css'

const GANTT_MONTHS = generateGanttMonths()

function buildYearSpans(months: typeof GANTT_MONTHS) {
  const spans: { year: number; count: number }[] = []
  for (const m of months) {
    const last = spans[spans.length - 1]
    if (last && last.year === m.year) last.count++
    else spans.push({ year: m.year, count: 1 })
  }
  return spans
}

const CRITERIA: Array<{
  label: string
  get: (p: Projet) => number
  desc: string
}> = [
  { label: 'Criticité', get: (p) => p.score_criticite, desc: 'Impact si non réalisé' },
  { label: 'Urgence', get: (p) => p.score_urgence, desc: 'Délai avant problème' },
  { label: 'Récurrence', get: (p) => p.score_recurrence, desc: 'Fréquence du problème' },
  { label: 'Temps', get: (p) => p.score_temps, desc: 'Durée de réalisation' },
  { label: 'ETP', get: (p) => p.score_etp, desc: 'Ressources humaines' },
  { label: 'Investissement', get: (p) => p.score_investissement, desc: 'Coût capital' },
]

function DgMiniGantt({ planning, color }: { planning: Record<string, boolean>; color: string }) {
  const markers = [{ idx: 0 }, { idx: 5 }, { idx: 11 }, { idx: 17 }, { idx: 23 }]
  return (
    <div className="dg-mini-gantt-wrap" aria-hidden>
      <div className="dg-mini-gantt__markers">
        {markers.map((marker) => {
          const refMonth = GANTT_MONTHS[marker.idx]
          const markerLabel = `${refMonth.label} ${String(refMonth.year).slice(-2)}`
          const left = `${(marker.idx / 23) * 100}%`
          const isLast = marker.idx === 23
          return (
            <span
              key={`m-${refMonth.key}`}
              className={`dg-mini-gantt__marker ${isLast ? 'dg-mini-gantt__marker--end' : ''}`}
              style={{ left }}
              title={`${refMonth.label} ${refMonth.year}`}
            >
              {markerLabel}
            </span>
          )
        })}
      </div>
      <div className="dg-mini-gantt">
        {GANTT_MONTHS.map((m) => {
          const on = planning[m.key] ?? false
          return (
            <span
              key={m.key}
              className="dg-mini-gantt__cell"
              style={on ? { background: color } : undefined}
              title={`${m.label} ${m.year}`}
            />
          )
        })}
      </div>
    </div>
  )
}

function DgGanttFullReadOnly({ planning, color }: { planning: Record<string, boolean>; color: string }) {
  const yearSpans = useMemo(() => buildYearSpans(GANTT_MONTHS), [])
  const keys = GANTT_MONTHS.map((x) => x.key)
  return (
    <div className="dg-gantt-full">
      <div className="dg-gantt-full__years">
        {yearSpans.map((s) => (
          <div
            key={s.year}
            className="dg-gantt-full__year-cell"
            style={{ gridColumn: `span ${s.count}` }}
          >
            {s.year}
          </div>
        ))}
      </div>
      <div className="dg-gantt-full__months">
        {GANTT_MONTHS.map((m) => (
          <span key={m.key} className="dg-gantt-full__month">
            {m.label}
          </span>
        ))}
      </div>
      <div className="dg-gantt-full__grid">
        {GANTT_MONTHS.map((m, i) => {
          const on = planning[m.key] ?? false
          const prevActive = i > 0 && (planning[keys[i - 1]] ?? false)
          const nextActive = i < 23 && (planning[keys[i + 1]] ?? false)
          const isStart = on && !prevActive
          const isEnd = on && !nextActive
          return (
            <div
              key={m.key}
              className="dg-gantt-full__cell"
              style={
                on
                  ? {
                      background: color,
                      borderTopLeftRadius: isStart ? 6 : 0,
                      borderBottomLeftRadius: isStart ? 6 : 0,
                      borderTopRightRadius: isEnd ? 6 : 0,
                      borderBottomRightRadius: isEnd ? 6 : 0,
                    }
                  : undefined
              }
              title={`${m.label} ${m.year}`}
            />
          )
        })}
      </div>
    </div>
  )
}

function scoreColor(score: number): string {
  if (score === 0) return 'var(--theme-text-muted)'
  if (score >= 75) return 'var(--score-critical)'
  if (score >= 50) return 'var(--score-caramel-4)'
  if (score >= 25) return 'var(--score-caramel-3)'
  return 'var(--score-caramel-2)'
}

type Props = {
  projet: Projet
  accentColor: string
  globalScore: number
  mode: 'pending' | 'validated'
  saving: boolean
  onValidate: () => void
  onRevoke: () => void
}

export default function DgProjectAccordion({
  projet,
  accentColor,
  globalScore,
  mode,
  saving,
  onValidate,
  onRevoke,
}: Props) {
  const [open, setOpen] = useState(false)
  const planning: Record<string, boolean> = projet.planning ?? {}

  return (
    <div className="dg-proj">
      <div className="dg-proj__bandeau">
        <button
          type="button"
          className="dg-proj__acc-trigger"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          <span className="dg-proj__chevron" aria-hidden>
            {open ? '▼' : '▶'}
          </span>
          <span className={`dg-proj__badge type-badge type-badge--${projet.type.toLowerCase()}`}>{projet.type}</span>
          <span className="dg-proj__title">{projet.nom?.trim() || 'Sans titre'}</span>
          <span className="dg-proj__score-ring" style={{ color: scoreColor(globalScore) }}>
            <svg className="dg-proj__ring-svg" viewBox="0 0 40 40" aria-hidden>
              <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="3" />
              <circle
                cx="20"
                cy="20"
                r="16"
                fill="none"
                stroke={globalScore === 0 ? 'var(--theme-border)' : scoreColor(globalScore)}
                strokeWidth="3"
                strokeDasharray={globalScore === 0 ? '0 100' : `${(globalScore / 100) * 100.53} 100.53`}
                strokeLinecap="round"
                transform="rotate(-90 20 20)"
              />
            </svg>
            <span className="dg-proj__ring-val">{globalScore === 0 ? '—' : globalScore}</span>
          </span>
          <DgMiniGantt planning={planning} color={accentColor} />
        </button>
        <div className="dg-proj__bandeau-actions">
          {mode === 'pending' ? (
            <button
              type="button"
              className="dg__validate-btn"
              disabled={saving}
              onClick={(e) => {
                e.stopPropagation()
                onValidate()
              }}
            >
              {saving ? '…' : 'Valider pour la roadmap'}
            </button>
          ) : (
            <button
              type="button"
              className="dg__validate-btn dg__validate-btn--ghost"
              disabled={saving}
              onClick={(e) => {
                e.stopPropagation()
                onRevoke()
              }}
            >
              Retirer la validation
            </button>
          )}
        </div>
      </div>

      {open && (
        <div className="dg-proj__panel">
          <section className="dg-proj__section">
            <h5 className="dg-proj__section-title">Fiche projet</h5>
            <dl className="dg-proj__dl">
              <div>
                <dt>Thématique</dt>
                <dd>{projet.thematique || '—'}</dd>
              </div>
              <div>
                <dt>Problématique</dt>
                <dd>{projet.problematique || '—'}</dd>
              </div>
              <div className="dg-proj__dl-full">
                <dt>Description</dt>
                <dd>{projet.description || '—'}</dd>
              </div>
              {projet.gains_quantitatifs != null && (
                <div>
                  <dt>Gains quantitatifs (€)</dt>
                  <dd>{projet.gains_quantitatifs}</dd>
                </div>
              )}
              {projet.gains_qualitatifs ? (
                <div className="dg-proj__dl-full">
                  <dt>Gains qualitatifs</dt>
                  <dd>{projet.gains_qualitatifs}</dd>
                </div>
              ) : null}
            </dl>
          </section>

          <section className="dg-proj__section">
            <h5 className="dg-proj__section-title">Notation sur 6 axes (1–5)</h5>
            <div className="dg-proj__axes">
              {CRITERIA.map((c) => {
                const v = c.get(projet)
                return (
                  <div key={c.label} className="dg-proj__axe">
                    <div className="dg-proj__axe-head">
                      <span className="dg-proj__axe-label">{c.label}</span>
                      <span className="dg-proj__axe-val" style={{ color: scoreColor(v * 20) }}>
                        {v}/5
                      </span>
                    </div>
                    <p className="dg-proj__axe-desc">{c.desc}</p>
                    <div className="dg-proj__axe-bar" aria-hidden>
                      <span
                        className="dg-proj__axe-fill"
                        style={{ width: `${(v / 5) * 100}%`, background: accentColor }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="dg-proj__section">
            <h5 className="dg-proj__section-title">Pilotage</h5>
            <p className="dg-proj__pilote">
              <strong>Pilote pressenti</strong> — {projet.pilote?.trim() || '—'}
            </p>
            <div className="dg-proj__contrib">
              <strong>Directions contributrices</strong>
              {(projet.directions_contributrices ?? []).length === 0 ? (
                <span className="dg-proj__contrib-none"> Aucune</span>
              ) : (
                <ul className="dg-proj__contrib-list">
                  {(projet.directions_contributrices ?? []).map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="dg-proj__section">
            <h5 className="dg-proj__section-title">Planning consolidé (24 mois)</h5>
            <DgGanttFullReadOnly planning={planning} color={accentColor} />
          </section>
        </div>
      )}
    </div>
  )
}
