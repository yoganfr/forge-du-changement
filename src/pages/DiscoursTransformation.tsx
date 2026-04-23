import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  getOrCreateDiscoursForWorkspace,
  getWorkspace,
  getWorkspaceUsers,
  updateVersionBlocs,
} from '../lib/api'
import { PERFORMATIVE_BLOCS, emptyBlocsPayload, emptyCard } from '../lib/discours/blocs'
import type { DiscoursBloc, DiscoursField, DiscoursSubField } from '../lib/discours/blocs'
import type {
  DiscoursBlocsPayload,
  DiscoursFieldValue,
  TransformationDiscourse,
  TransformationDiscourseVersion,
  User,
  Workspace,
} from '../lib/types'
import type { AppUserRole } from '../lib/appRole'

type SaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error'

/**
 * Peuvent éditer le discours : superadmin plateforme, consultant owner, admin
 * du workspace et le membre CODIR « dirigeant » désigné. Le pilote projet a
 * accès en lecture seule (il voit la vue décideur mais ne la modifie pas).
 */
const EDIT_ROLES: ReadonlyArray<AppUserRole> = ['consultant', 'admin']

export default function DiscoursTransformationPage({
  workspaceId,
  currentAppUserId,
  currentUserRole,
  platformSuperadmin,
}: {
  workspaceId: string | null
  currentAppUserId: string | null
  currentUserRole: AppUserRole
  platformSuperadmin: boolean
}) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [workspaceUsers, setWorkspaceUsers] = useState<User[]>([])
  const [, setDiscourse] = useState<TransformationDiscourse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState<TransformationDiscourseVersion | null>(null)
  const [blocs, setBlocs] = useState<DiscoursBlocsPayload>(() => emptyBlocsPayload())
  const [saveState, setSaveState] = useState<SaveState>('idle')

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedRef = useRef<string>('')

  const load = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    setError(null)
    try {
      const [ws, users, discResult] = await Promise.all([
        getWorkspace(workspaceId),
        getWorkspaceUsers(workspaceId).catch(() => [] as User[]),
        getOrCreateDiscoursForWorkspace(workspaceId),
      ])
      setWorkspace(ws)
      setWorkspaceUsers(users)
      setDiscourse(discResult.discourse)
      setVersion(discResult.currentVersion)
      const payload = mergeWithModel(discResult.currentVersion?.blocs ?? null)
      setBlocs(payload)
      lastSavedRef.current = JSON.stringify(payload)
      setSaveState('idle')
    } catch (e) {
      console.error('[DiscoursTransformation] load failed', e)
      setError("Impossible de charger le discours de transformation.")
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  const dirigeantUserId = workspace?.dirigeant_user_id ?? null
  const dirigeantUser = useMemo(
    () => workspaceUsers.find((u) => u.id === dirigeantUserId) ?? null,
    [workspaceUsers, dirigeantUserId],
  )
  const dirigeantDisplayName = dirigeantUser
    ? [dirigeantUser.prenom, dirigeantUser.nom].filter(Boolean).join(' ').trim() || dirigeantUser.email
    : null

  const canEdit =
    platformSuperadmin ||
    EDIT_ROLES.includes(currentUserRole) ||
    (currentAppUserId != null && dirigeantUserId != null && currentAppUserId === dirigeantUserId)

  useEffect(() => {
    void load()
  }, [load])

  const persist = useCallback(
    async (next: DiscoursBlocsPayload) => {
      if (!version) return
      if (!canEdit) return
      try {
        setSaveState('saving')
        const updated = await updateVersionBlocs(version.id, next)
        setVersion(updated)
        lastSavedRef.current = JSON.stringify(next)
        setSaveState('saved')
        setTimeout(() => {
          setSaveState((s) => (s === 'saved' ? 'idle' : s))
        }, 1800)
      } catch (e) {
        console.error('[DiscoursTransformation] save failed', e)
        setSaveState('error')
      }
    },
    [version, canEdit],
  )

  const scheduleSave = useCallback(
    (next: DiscoursBlocsPayload) => {
      if (!canEdit || !version) return
      setSaveState('dirty')
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        if (JSON.stringify(next) !== lastSavedRef.current) {
          void persist(next)
        }
      }, 800)
    },
    [canEdit, version, persist],
  )

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [])

  const handleFieldChange = useCallback(
    (blocKey: string, fieldKey: string, value: DiscoursFieldValue) => {
      setBlocs((prev) => {
        const nextBlocFields = { ...(prev[blocKey] ?? {}), [fieldKey]: value }
        const next = { ...prev, [blocKey]: nextBlocFields }
        scheduleSave(next)
        return next
      })
    },
    [scheduleSave],
  )

  const completion = useMemo(() => computeCompletion(blocs), [blocs])

  if (!workspaceId) {
    return (
      <section className="dashboard__module-panel">
        <div className="dashboard__module-panel-inner">
          <h2>Discours de transformation</h2>
          <p>Aucun espace entreprise sélectionné.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="dashboard__module-panel" aria-labelledby="discours-title">
      <div className="dashboard__module-panel-deco" aria-hidden />
      <span className="dashboard__module-panel-blob dashboard__module-panel-blob--green" aria-hidden />
      <span className="dashboard__module-panel-blob dashboard__module-panel-blob--caramel" aria-hidden />
      <div className="dashboard__module-panel-inner discours-grid">
        <header className="discours-intro">
          <div className="discours-intro__row">
            <div>
              <h2 id="discours-title" className="discours-intro__title">Discours de transformation</h2>
              <p className="discours-intro__subtitle">
                Cadrage narratif du CODIR. Huit blocs performatifs pour constituer le collectif,
                nommer la bascule, dire le futur désirable et sceller l’engagement.
              </p>
            </div>
            <SaveBadge state={saveState} readOnly={!canEdit} />
          </div>

          <div className="discours-status-strip">
            <span>
              <strong>Dirigeant du discours :</strong>{' '}
              {dirigeantDisplayName ?? (dirigeantUserId ? '(membre CODIR)' : 'non désigné')}
            </span>
            <span>
              <strong>Version en cours :</strong> {version?.version_label ?? '—'}
            </span>
            <span>
              <strong>Complétude :</strong>{' '}
              {completion.filled}/{completion.total} champs ({completion.percent}%)
            </span>
            {!canEdit && (
              <span className="discours-status-strip__warn">
                Lecture seule — édition réservée au dirigeant désigné, aux consultants et admins.
              </span>
            )}
          </div>

          {error && (
            <div role="alert" className="discours-error-banner">
              {error}
            </div>
          )}
        </header>

        <aside className="discours-manifest" aria-label="Intention du module">
          <p>
            Ce que vous allez écrire ici, ce n’est pas seulement un texte : c’est un
            <strong> acte performatif</strong> — ce que vous direz au séminaire fait le cadrage
            autant qu’il le décrit. Vous engagez le collectif par la parole, pas seulement par le contenu.
          </p>
          <p>
            Ce discours sera aussi la <strong>première brique de controverse</strong> avec le CODIR :
            le moment où l’intelligence du désaccord utile entre en jeu, où se clarifient
            non&nbsp;négociable, débat et co-construction.
          </p>
          <p>
            En travaillant bloc par bloc dans ce module, vous préparez une <strong>V1 solide</strong> ;
            une fois évoluée en <strong>V2</strong> (affinée après échanges), ce récit deviendra une
            fondation pour le sens de la transformation engagée — ce à quoi l’entreprise pourra se
            référer quand les projets et les roadmaps prendront le relais.
          </p>
          <p className="discours-manifest__outro">
            L’outil vous aide à structurer et à peaufiner ; l’incarnation reste la vôtre.
            Quand vous êtes prêt, commencez à rédiger.
          </p>
        </aside>

        {loading ? (
          <p>Chargement…</p>
        ) : (
          <div className="discours-grid">
            {PERFORMATIVE_BLOCS.map((bloc) => (
              <BlocEditor
                key={bloc.key}
                bloc={bloc}
                values={blocs[bloc.key] ?? {}}
                readOnly={!canEdit}
                onChange={(fieldKey, value) => handleFieldChange(bloc.key, fieldKey, value)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

// ───────────────────────── Badge sauvegarde ──────────────────────────────────
function SaveBadge({ state, readOnly }: { state: SaveState; readOnly: boolean }) {
  if (readOnly) return <span className="discours-save-badge">Lecture seule</span>
  const labels: Record<SaveState, { text: string; mod: string }> = {
    idle: { text: 'Enregistré', mod: '' },
    dirty: { text: 'Modifications non sauvegardées…', mod: 'discours-save-badge--dirty' },
    saving: { text: 'Enregistrement…', mod: 'discours-save-badge--saving' },
    saved: { text: 'Enregistré ✓', mod: 'discours-save-badge--saved' },
    error: { text: 'Échec de la sauvegarde', mod: 'discours-save-badge--error' },
  }
  const { text, mod } = labels[state]
  return <span className={`discours-save-badge ${mod}`.trim()}>{text}</span>
}

// ───────────────────────── Éditeur de bloc ───────────────────────────────────
function BlocEditor({
  bloc,
  values,
  readOnly,
  onChange,
}: {
  bloc: DiscoursBloc
  values: Record<string, DiscoursFieldValue>
  readOnly: boolean
  onChange: (fieldKey: string, value: DiscoursFieldValue) => void
}) {
  // Si un champ est de type `cards` ou `long` dominant, on préfère la colonne unique
  // pour favoriser la lecture narrative. Les champs `text` courts peuvent rester en 2 cols.
  const hasCards = bloc.fields.some((f) => f.kind === 'cards')
  const allLongOrList = bloc.fields.every((f) => f.kind !== 'text')
  const singleColumn = hasCards || allLongOrList

  return (
    <article className="discours-card" aria-labelledby={`bloc-${bloc.key}-title`}>
      <header className="discours-card__header">
        <div className="discours-card__title-row">
          <span className="discours-card__index">{bloc.order}</span>
          <h3 id={`bloc-${bloc.key}-title`} className="discours-card__title">{bloc.title}</h3>
          <span className="discours-card__subtitle">{bloc.subtitle}</span>
        </div>
        <p className="discours-card__meta">
          <strong>But :</strong> {bloc.but}
        </p>
        <p className="discours-card__meta">
          <strong>Effet performatif :</strong> {bloc.effetPerformatif} — {bloc.effetsRecherches.join(' · ')}
        </p>
      </header>

      <div className={`discours-fields ${singleColumn ? 'discours-fields--single' : ''}`.trim()}>
        {bloc.fields.map((field) => (
          <FieldEditor
            key={field.key}
            field={field}
            value={values[field.key] ?? (field.kind === 'list' ? [] : field.kind === 'cards' ? [] : '')}
            readOnly={readOnly}
            onChange={(v) => onChange(field.key, v)}
          />
        ))}
      </div>

      <footer className="discours-card__question">
        <strong>Question séminaire :</strong> {bloc.questionSeminaire}
      </footer>
    </article>
  )
}

// ───────────────────────── Champ individuel ──────────────────────────────────
function FieldEditor({
  field,
  value,
  readOnly,
  onChange,
}: {
  field: DiscoursField
  value: DiscoursFieldValue
  readOnly: boolean
  onChange: (v: DiscoursFieldValue) => void
}) {
  const labelId = `field-${field.key}`
  const aide = field.aide ? (
    <span className="discours-field__aide">{field.aide}</span>
  ) : null

  // ── Cartouches empilés (kind: 'cards') ────────────────────────────────────
  if (field.kind === 'cards') {
    const raw = Array.isArray(value) ? (value as Array<Record<string, string>>) : []
    const cards = raw.filter((c): c is Record<string, string> => typeof c === 'object' && c !== null)
    const minCards = field.minCards ?? 1
    const maxCards = field.maxCards ?? (field.subFields ? 5 : 1)

    const updateCard = (i: number, subKey: string, v: string) => {
      const next = cards.map((c, idx) => (idx === i ? { ...c, [subKey]: v } : c))
      onChange(next)
    }
    const removeCard = (i: number) => {
      if (i < minCards) return
      onChange(cards.filter((_, idx) => idx !== i))
    }
    const addCard = () => {
      if (cards.length >= maxCards) return
      onChange([...cards, emptyCard(field)])
    }

    return (
      <div className="discours-field">
        <label htmlFor={labelId} className="discours-field__label">
          {field.label}
          {field.optional && <span className="discours-field__optional">— optionnel</span>}
        </label>
        {aide}
        <div className="discours-subcards">
          {cards.map((card, i) => (
            <div key={i} className="discours-subcard">
              <div className="discours-subcard__header">
                <h4 className="discours-subcard__title">
                  {field.cardTitle ? field.cardTitle(i) : `Élément #${i + 1}`}
                </h4>
                {!readOnly && i >= minCards && (
                  <button
                    type="button"
                    className="discours-subcard__remove"
                    onClick={() => removeCard(i)}
                    aria-label={`Supprimer ${field.cardTitle ? field.cardTitle(i) : `l'élément #${i + 1}`}`}
                  >
                    ×
                  </button>
                )}
              </div>
              {(field.subFields ?? []).map((sub) => (
                <SubFieldEditor
                  key={sub.key}
                  sub={sub}
                  value={card[sub.key] ?? ''}
                  readOnly={readOnly}
                  onChange={(v) => updateCard(i, sub.key, v)}
                />
              ))}
            </div>
          ))}
          {!readOnly && cards.length < maxCards && (
            <div className="discours-subcards--add-row">
              <button type="button" className="discours-subcards__add" onClick={addCard}>
                {field.addLabel ?? '+ Ajouter un cartouche'}
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Liste de puces (kind: 'list') ─────────────────────────────────────────
  if (field.kind === 'list') {
    const items: string[] = Array.isArray(value) ? (value as string[]) : []
    const max = field.max ?? 10
    const rows = Math.max(items.length, 1)
    return (
      <div className="discours-field">
        <label htmlFor={labelId} className="discours-field__label">
          {field.label}
          {field.optional && <span className="discours-field__optional">— optionnel</span>}
        </label>
        {aide}
        <ul className="discours-list">
          {Array.from({ length: rows }).map((_, i) => {
            const v = items[i] ?? ''
            return (
              <li key={i} className="discours-list__item">
                <input
                  type="text"
                  value={v}
                  readOnly={readOnly}
                  placeholder={`Élément ${i + 1}`}
                  onChange={(e) => {
                    const next = [...items]
                    next[i] = e.target.value
                    while (next.length && !next[next.length - 1]) next.pop()
                    onChange(next)
                  }}
                />
                {!readOnly && items[i] != null && items[i] !== '' && (
                  <button
                    type="button"
                    className="discours-list__btn"
                    onClick={() => onChange(items.filter((_, j) => j !== i))}
                    aria-label="Supprimer cet élément"
                  >
                    ×
                  </button>
                )}
              </li>
            )
          })}
        </ul>
        {!readOnly && items.length < max && (
          <button
            type="button"
            className="discours-list__add"
            onClick={() => onChange([...items, ''])}
          >
            + Ajouter un élément
          </button>
        )}
      </div>
    )
  }

  // ── Champs simples (text / long) ──────────────────────────────────────────
  const text = typeof value === 'string' ? value : ''
  return (
    <div className="discours-field">
      <label htmlFor={labelId} className="discours-field__label">
        {field.label}
        {field.optional && <span className="discours-field__optional">— optionnel</span>}
      </label>
      {aide}
      {field.kind === 'long' ? (
        <AutoTextarea
          id={labelId}
          value={text}
          readOnly={readOnly}
          onChange={(v) => onChange(v ? v : null)}
        />
      ) : (
        <input
          id={labelId}
          type="text"
          value={text}
          readOnly={readOnly}
          onChange={(e) => onChange(e.target.value ? e.target.value : null)}
        />
      )}
    </div>
  )
}

// ─── Sous-champ d'un cartouche (text / long) avec AutoTextarea ───────────────
function SubFieldEditor({
  sub,
  value,
  readOnly,
  onChange,
}: {
  sub: DiscoursSubField
  value: string
  readOnly: boolean
  onChange: (v: string) => void
}) {
  const id = `sub-${sub.key}-${Math.random().toString(36).slice(2, 8)}`
  return (
    <div className="discours-field">
      <label htmlFor={id} className="discours-field__label">{sub.label}</label>
      {sub.aide && <span className="discours-field__aide">{sub.aide}</span>}
      {sub.kind === 'long' ? (
        <AutoTextarea id={id} value={value} readOnly={readOnly} onChange={onChange} />
      ) : (
        <input
          id={id}
          type="text"
          value={value}
          readOnly={readOnly}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  )
}

// ─── Textarea qui s'adapte à la hauteur du contenu ───────────────────────────
function AutoTextarea({
  id,
  value,
  readOnly,
  onChange,
}: {
  id?: string
  value: string
  readOnly?: boolean
  onChange: (v: string) => void
}) {
  const ref = useRef<HTMLTextAreaElement>(null)

  // Recalcule la hauteur à chaque changement de valeur et au premier rendu.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])

  // Sécurité : recalcule si la fenêtre est redimensionnée (retour à la ligne).
  useEffect(() => {
    const onResize = () => {
      const el = ref.current
      if (!el) return
      el.style.height = 'auto'
      el.style.height = `${el.scrollHeight}px`
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <textarea
      id={id}
      ref={ref}
      value={value}
      readOnly={readOnly}
      rows={1}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

// ───────────────────────── Helpers ───────────────────────────────────────────
function mergeWithModel(raw: unknown): DiscoursBlocsPayload {
  const base = emptyBlocsPayload()
  if (!raw || typeof raw !== 'object') return base
  const stored = raw as Record<string, Record<string, unknown>>
  for (const bloc of PERFORMATIVE_BLOCS) {
    const storedBloc = stored[bloc.key]
    if (!storedBloc || typeof storedBloc !== 'object') continue
    for (const field of bloc.fields) {
      const v = storedBloc[field.key]
      if (field.kind === 'list') {
        base[bloc.key][field.key] = Array.isArray(v)
          ? v.filter((x): x is string => typeof x === 'string')
          : []
      } else if (field.kind === 'cards') {
        const minCards = field.minCards ?? 1
        const maxCards = field.maxCards ?? 5
        const subKeys = (field.subFields ?? []).map((s) => s.key)
        const normalized: Array<Record<string, string>> = []
        if (Array.isArray(v)) {
          for (const c of v) {
            if (c && typeof c === 'object' && !Array.isArray(c)) {
              const entry: Record<string, string> = {}
              for (const k of subKeys) {
                const val = (c as Record<string, unknown>)[k]
                entry[k] = typeof val === 'string' ? val : ''
              }
              normalized.push(entry)
            }
          }
        }
        while (normalized.length < minCards) normalized.push(emptyCard(field))
        if (normalized.length > maxCards) normalized.length = maxCards
        base[bloc.key][field.key] = normalized
      } else if (typeof v === 'string') {
        base[bloc.key][field.key] = v
      } else if (v == null) {
        base[bloc.key][field.key] = null
      }
    }
  }
  return base
}

function computeCompletion(blocs: DiscoursBlocsPayload): { filled: number; total: number; percent: number } {
  let filled = 0
  let total = 0
  for (const bloc of PERFORMATIVE_BLOCS) {
    for (const field of bloc.fields) {
      if (field.optional) continue
      const v = blocs[bloc.key]?.[field.key]
      if (field.kind === 'cards') {
        const minCards = field.minCards ?? 1
        const subKeys = (field.subFields ?? []).map((s) => s.key)
        total += minCards * subKeys.length
        const cards = Array.isArray(v) ? (v as Array<Record<string, string>>) : []
        for (let i = 0; i < minCards; i += 1) {
          const card = cards[i] ?? {}
          for (const k of subKeys) {
            if (typeof card[k] === 'string' && card[k].trim().length > 0) filled += 1
          }
        }
      } else if (field.kind === 'list') {
        total += 1
        if (Array.isArray(v) && v.some((s) => typeof s === 'string' && s.trim().length > 0)) {
          filled += 1
        }
      } else {
        total += 1
        if (typeof v === 'string' && v.trim().length > 0) filled += 1
      }
    }
  }
  const percent = total === 0 ? 0 : Math.round((filled / total) * 100)
  return { filled, total, percent }
}
