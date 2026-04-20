import { useCallback, useMemo, useRef, useState, type DragEvent } from 'react'
import type { Axe, Chantier, Jalon } from './lib/types'
import {
  assignJalonToColumn,
  buildTimelineColumns,
  sortJalonsForCell,
  type TimelineColumn,
} from './lib/roadmapTimelineColumns'

const AXES: Axe[] = ['PROCESSUS', 'ORGANISATION', 'OUTILS', 'KPI']

const AXE_META: Record<Axe, { short: string; title: string }> = {
  PROCESSUS: { short: 'P', title: '1. Processus métiers' },
  ORGANISATION: { short: 'O', title: '2. Organisation' },
  OUTILS: { short: 'I', title: '3. Outils IT' },
  KPI: { short: 'K', title: "4. KPI's" },
}

/** Modificateur CSS `mr-tgrid__axis-cell--*` (couleurs axe = tokens dans `MaturityRoadmap.css`). */
function mrAxisCellModifier(axe: Axe): string {
  return `mr-tgrid__axis-cell--${axe.toLowerCase()}`
}

/** Payload drag & drop chantier (HTML5 `dataTransfer`). */
const CHANTIER_DRAG_MIME = 'application/x-forge-chantier-v1'
/** Payload drag & drop jalon (même ligne / ajustement échéance). */
const JALON_DRAG_MIME = 'application/x-forge-jalon-v1'

const STATUT_LABEL: Record<string, string> = {
  a_venir: 'À venir',
  en_cours: 'En cours',
  realise: 'Réalisé',
  bloque: 'Bloqué',
}

/**
 * Un chantier avec `axe` renseigné n’apparaît que dans ce bloc (pas de copie sur les 4 axes).
 * Chantiers sans axe (données antérieures) : visibles uniquement dans les blocs où ils ont au moins un jalon ;
 * s’ils n’en ont aucun, une seule ligne sur Processus pour éviter les doublons vides.
 */
function chantierVisibleInAxisBlock(c: Chantier, blockAxe: Axe, jalons: Jalon[]): boolean {
  const typed = c.axe != null && String(c.axe).trim() !== ''
  if (typed) {
    return c.axe === blockAxe
  }
  if (jalons.length === 0) {
    return blockAxe === 'PROCESSUS'
  }
  return jalons.some((j) => j.axe === blockAxe)
}

type Props = {
  chantiers: Chantier[]
  jalonsByChantier: Record<string, Jalon[]>
  /** Colonnes temps (même référence que `monthYearFromTimelineColumnKey` côté parent si drag jalon). */
  timelineColumns?: TimelineColumn[]
  axeFilter: 'all' | Axe
  readOnly: boolean
  projectColorById: Record<string, string>
  projetNomById: Record<string, string>
  onOpenJalon: (jalon: Jalon, chantierId: string) => void
  onQuickAddInCell: (chantierId: string, column: TimelineColumn, axe: Axe) => void
  /** Case « réalisé » sur la pilule (hors lecture seule). */
  onToggleJalonRealise?: (jalon: Jalon, chantierId: string, realised: boolean) => void
  /**
   * Clic sur la cellule « Chantier » : nom + rattachement projet.
   * `chantierId === null` = créer une ligne dans le bloc `axeForCreate` (type Processus / … / KPI).
   */
  onChantierCellClick?: (chantierId: string | null, axeForCreate?: Axe) => void
  /** Déplacement de chantier entre axes Processus / Organisation / Outils (jamais vers KPI). */
  onChantierDrop?: (chantierId: string, newAxe: Axe) => Promise<void>
  /** Toast minimal (ex. blocage KPI, erreur API) — géré par le parent. */
  onRoadmapToast?: (message: string, variant: 'error' | 'info' | 'warning') => void
  /** Déplacement d’un jalon sur la même ligne (nouvelle colonne temps). */
  onJalonDrop?: (jalonId: string, targetColumnKey: string) => Promise<void>
}

export default function RoadmapTimelineGrid({
  chantiers,
  jalonsByChantier,
  timelineColumns: timelineColumnsProp,
  axeFilter,
  readOnly,
  projectColorById,
  projetNomById,
  onOpenJalon,
  onQuickAddInCell,
  onToggleJalonRealise,
  onChantierCellClick,
  onChantierDrop,
  onRoadmapToast,
  onJalonDrop,
}: Props) {
  const [chantierDropHoverKey, setChantierDropHoverKey] = useState<string | null>(null)
  const [chantierDropHoverInvalid, setChantierDropHoverInvalid] = useState(false)
  const [jalonDropHoverKey, setJalonDropHoverKey] = useState<string | null>(null)
  const [jalonDropHoverInvalid, setJalonDropHoverInvalid] = useState(false)
  const jalonDragSourceRef = useRef<{
    jalonId: string
    chantierId: string
    axe: Axe
    columnKey: string
  } | null>(null)

  const clearChantierDropHover = useCallback(() => {
    setChantierDropHoverKey(null)
    setChantierDropHoverInvalid(false)
  }, [])

  const clearJalonDropHover = useCallback(() => {
    setJalonDropHoverKey(null)
    setJalonDropHoverInvalid(false)
  }, [])

  const handleChantierNameDragStart = useCallback(
    (e: DragEvent, ch: Chantier, blockAxe: Axe) => {
      if (readOnly || !onChantierDrop || blockAxe === 'KPI') return
      /* Pas de preventDefault ici : annulerait le démarrage du drag HTML5. */
      e.stopPropagation()
      const sourceAxe = ch.axe != null && String(ch.axe).trim() !== '' ? ch.axe : blockAxe
      const payload = JSON.stringify({ chantierId: ch.id, sourceAxe })
      e.dataTransfer.setData(CHANTIER_DRAG_MIME, payload)
      e.dataTransfer.effectAllowed = 'move'
      ;(e.currentTarget as HTMLElement).classList.add('mr-dragging')
    },
    [readOnly, onChantierDrop],
  )

  const handleChantierNameDragEnd = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    ;(e.currentTarget as HTMLElement).classList.remove('mr-dragging')
    clearChantierDropHover()
  }, [clearChantierDropHover])

  const handleChantierCellDragEnter = useCallback(
    (e: DragEvent, blockAxe: Axe, cellKey: string) => {
      if (readOnly || !onChantierDrop) return
      if (Array.from(e.dataTransfer.types).includes(JALON_DRAG_MIME)) {
        e.preventDefault()
        e.stopPropagation()
        clearJalonDropHover()
        return
      }
      if (!Array.from(e.dataTransfer.types).includes(CHANTIER_DRAG_MIME)) return
      e.preventDefault()
      e.stopPropagation()
      if (blockAxe === 'KPI') {
        e.dataTransfer.dropEffect = 'none'
        setChantierDropHoverKey(cellKey)
        setChantierDropHoverInvalid(true)
        return
      }
      e.dataTransfer.dropEffect = 'move'
      setChantierDropHoverKey(cellKey)
      setChantierDropHoverInvalid(false)
    },
    [readOnly, onChantierDrop, clearJalonDropHover],
  )

  const handleChantierCellDragOver = useCallback(
    (e: DragEvent, blockAxe: Axe, cellKey: string, _chantierId: string | 'add') => {
      if (readOnly || !onChantierDrop) return
      if (Array.from(e.dataTransfer.types).includes(JALON_DRAG_MIME)) {
        e.preventDefault()
        e.stopPropagation()
        clearJalonDropHover()
        return
      }
      if (!Array.from(e.dataTransfer.types).includes(CHANTIER_DRAG_MIME)) return
      e.preventDefault()
      e.stopPropagation()
      if (blockAxe === 'KPI') {
        e.dataTransfer.dropEffect = 'none'
        setChantierDropHoverKey(cellKey)
        setChantierDropHoverInvalid(true)
        return
      }
      e.dataTransfer.dropEffect = 'move'
      setChantierDropHoverKey(cellKey)
      setChantierDropHoverInvalid(false)
    },
    [readOnly, onChantierDrop, clearJalonDropHover],
  )

  const handleChantierCellDragLeave = useCallback(
    (e: DragEvent, cellKey: string) => {
      /* Pas de preventDefault : évite les effets de bord sur la chaîne drag/leave du navigateur. */
      e.stopPropagation()
      const next = e.relatedTarget as Node | null
      if (next && (e.currentTarget as HTMLElement).contains(next)) return
      if (chantierDropHoverKey === cellKey) clearChantierDropHover()
    },
    [chantierDropHoverKey, clearChantierDropHover],
  )

  const handleChantierCellDrop = useCallback(
    async (e: DragEvent, blockAxe: Axe) => {
      e.preventDefault()
      e.stopPropagation()
      clearChantierDropHover()
      if (readOnly || !onChantierDrop) return
      let raw: string
      try {
        raw = e.dataTransfer.getData(CHANTIER_DRAG_MIME)
      } catch {
        return
      }
      if (!raw) return
      let parsed: { chantierId: string; sourceAxe: Axe }
      try {
        parsed = JSON.parse(raw) as { chantierId: string; sourceAxe: Axe }
      } catch {
        return
      }
      if (blockAxe === 'KPI') {
        onRoadmapToast?.(
          'Un chantier ne peut pas être déplacé vers l’axe KPI (réservé aux jalons auto-créés).',
          'error',
        )
        return
      }
      await onChantierDrop(parsed.chantierId, blockAxe)
    },
    [readOnly, onChantierDrop, onRoadmapToast, clearChantierDropHover],
  )

  const handleJalonPillDragStart = useCallback(
    (e: DragEvent, j: Jalon, ch: Chantier, blockAxe: Axe, columnKey: string) => {
      if (readOnly || !onJalonDrop) return
      e.stopPropagation()
      jalonDragSourceRef.current = {
        jalonId: j.id,
        chantierId: ch.id,
        axe: blockAxe,
        columnKey,
      }
      e.dataTransfer.setData(
        JALON_DRAG_MIME,
        JSON.stringify({ jalonId: j.id, chantierId: ch.id, axe: blockAxe, columnKey }),
      )
      e.dataTransfer.effectAllowed = 'move'
      ;(e.currentTarget as HTMLElement).classList.add('mr-dragging')
    },
    [readOnly, onJalonDrop],
  )

  const handleJalonPillDragEnd = useCallback(
    (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      jalonDragSourceRef.current = null
      ;(e.currentTarget as HTMLElement).classList.remove('mr-dragging')
      clearJalonDropHover()
    },
    [clearJalonDropHover],
  )

  const handleTimeCellDragOver = useCallback(
    (
      e: DragEvent,
      ch: Chantier,
      blockAxe: Axe,
      columnKey: string,
      buckets: Map<string, Jalon[]>,
    ) => {
      if (readOnly || !onJalonDrop) return
      if (!Array.from(e.dataTransfer.types).includes(JALON_DRAG_MIME)) return
      e.preventDefault()
      e.stopPropagation()
      const src = jalonDragSourceRef.current
      if (!src) return
      const ck = `jalon-${blockAxe}-${ch.id}-${columnKey}`
      if (src.chantierId !== ch.id || src.axe !== blockAxe) {
        e.dataTransfer.dropEffect = 'none'
        clearJalonDropHover()
        return
      }
      const cellJalons = buckets.get(columnKey) ?? []
      const others = cellJalons.filter((x) => x.id !== src.jalonId)
      if (others.length > 0) {
        e.dataTransfer.dropEffect = 'none'
        setJalonDropHoverKey(ck)
        setJalonDropHoverInvalid(true)
        return
      }
      e.dataTransfer.dropEffect = 'move'
      setJalonDropHoverKey(ck)
      setJalonDropHoverInvalid(false)
    },
    [readOnly, onJalonDrop, clearJalonDropHover],
  )

  const handleTimeCellDragLeave = useCallback(
    (e: DragEvent, cellKey: string) => {
      e.stopPropagation()
      const next = e.relatedTarget as Node | null
      if (next && (e.currentTarget as HTMLElement).contains(next)) return
      if (jalonDropHoverKey === cellKey) clearJalonDropHover()
    },
    [jalonDropHoverKey, clearJalonDropHover],
  )

  const handleTimeCellDrop = useCallback(
    async (
      e: DragEvent,
      ch: Chantier,
      blockAxe: Axe,
      columnKey: string,
      buckets: Map<string, Jalon[]>,
    ) => {
      e.preventDefault()
      e.stopPropagation()
      clearJalonDropHover()
      if (readOnly || !onJalonDrop) return
      let raw: string
      try {
        raw = e.dataTransfer.getData(JALON_DRAG_MIME)
      } catch {
        return
      }
      if (!raw) return
      let parsed: { jalonId: string; chantierId: string; axe: Axe; columnKey: string }
      try {
        parsed = JSON.parse(raw) as { jalonId: string; chantierId: string; axe: Axe; columnKey: string }
      } catch {
        return
      }
      if (parsed.chantierId !== ch.id || parsed.axe !== blockAxe) return
      const cellJalons = buckets.get(columnKey) ?? []
      const others = cellJalons.filter((x) => x.id !== parsed.jalonId)
      if (others.length > 0) {
        onRoadmapToast?.(
          'Cette période contient déjà un jalon. Libérez la cellule ou choisissez une autre période.',
          'warning',
        )
        return
      }
      if (parsed.columnKey === columnKey) return
      await onJalonDrop(parsed.jalonId, columnKey)
    },
    [readOnly, onJalonDrop, onRoadmapToast, clearJalonDropHover],
  )

  const defaultTimelineColumns = useMemo(() => buildTimelineColumns(new Date()), [])
  const timeColumns = timelineColumnsProp ?? defaultTimelineColumns

  const headerCells: { key: string; label: string; sub: string; col: TimelineColumn }[] = timeColumns.map((c) => ({
    key: c.key,
    label: c.label,
    sub:
      c.kind === 'quarter'
        ? 'Échéance'
        : c.kind === 'year'
          ? 'Horizon annuel'
          : 'Projection',
    col: c,
  }))

  const axesToShow: Axe[] = axeFilter === 'all' ? AXES : [axeFilter]

  function bucketForChantierAxis(chId: string, blockAxe: Axe): Map<string, Jalon[]> {
    const raw = (jalonsByChantier[chId] ?? []).filter((j) => j.axe === blockAxe)
    const map = new Map<string, Jalon[]>()
    for (const j of raw) {
      const k = assignJalonToColumn(j, timeColumns)
      if (!map.has(k)) map.set(k, [])
      map.get(k)!.push(j)
    }
    for (const [, arr] of map) sortJalonsForCell(arr)
    return map
  }

  /** Couleur des pilules = projet transformant du chantier (voir `projectColorById[ch.projet_id]`). */
  const defaultPillColor = 'var(--theme-accent, #8e3b46)'

  return (
    <div className="mr-tgrid-wrap">
      <p className="mr-tgrid-intro">
        Chaque <strong>chantier</strong> n’apparaît que dans le <strong>bloc d’axe</strong> où vous le créez (pas de doublon
        sur les autres axes). Rattachement au projet transformant ; les <strong>jalons</strong> reprennent la couleur du
        projet. Un seul jalon par case temps — le <strong>+</strong> disparaît une fois le jalon créé. Faites défiler
        horizontalement si besoin ; les colonnes sont condensées pour limiter la largeur.
      </p>

      <div className="mr-tgrid-scroll" role="region" aria-label="Tableau roadmap par axe et temps">
        <table className="mr-tgrid mr-tgrid--matrix">
          <thead>
            <tr>
              <th scope="col" className="mr-tgrid__sticky mr-tgrid__sticky--axis mr-tgrid__axis-head">
                Axe
              </th>
              <th scope="col" className="mr-tgrid__sticky mr-tgrid__sticky--chantier mr-tgrid__chantier-head">
                Chantiers
              </th>
              {headerCells.map((h) => (
                <th key={h.key} scope="col" className="mr-tgrid__time-head">
                  <span className="mr-tgrid__time-label">{h.label}</span>
                  <span className="mr-tgrid__time-sub">{h.sub}</span>
                </th>
              ))}
            </tr>
          </thead>
          {axesToShow.map((axe, blockIndex) => {
            const blockChantiers = chantiers.filter((c) =>
              chantierVisibleInAxisBlock(c, axe, jalonsByChantier[c.id] ?? []),
            )
            const showEmptyReadonlyRow = readOnly && blockChantiers.length === 0
            const rowCount =
              showEmptyReadonlyRow ? 1 : blockChantiers.length + (readOnly ? 0 : 1)
            return (
            <tbody key={axe} className={`mr-tgrid__axis-block mr-tgrid__axis-block--${axe.toLowerCase()}`}>
              {Array.from({ length: rowCount }, (_, rowIdx) => {
                const isAddRow = !readOnly && rowIdx === blockChantiers.length
                const isReadonlyEmpty = showEmptyReadonlyRow && rowIdx === 0
                const ch = rowIdx < blockChantiers.length ? blockChantiers[rowIdx] : null
                const isFirst = rowIdx === 0
                const blockStartRow = blockIndex > 0 && rowIdx === 0

                if (isReadonlyEmpty) {
                  return (
                    <tr key={`${axe}-empty`} className={blockStartRow ? 'mr-tgrid__block-start-row' : undefined}>
                      {isFirst ? (
                        <td
                          rowSpan={rowCount}
                          className={`mr-tgrid__sticky mr-tgrid__sticky--axis mr-tgrid__axis-cell ${mrAxisCellModifier(axe)}`}
                        >
                          <span className="mr-tgrid__axis-cell-title">{AXE_META[axe].title}</span>
                        </td>
                      ) : null}
                      <th
                        scope="row"
                        className="mr-tgrid__sticky mr-tgrid__sticky--chantier mr-tgrid__chantier-cell mr-tgrid__chantier-cell--empty"
                      >
                        <span className="mr-tgrid__chantier-empty">—</span>
                      </th>
                      {headerCells.map((h) => (
                        <td key={h.key} className="mr-tgrid__cell mr-tgrid__cell--filler" aria-hidden />
                      ))}
                    </tr>
                  )
                }

                if (isAddRow) {
                  return (
                    <tr
                      key={`${axe}-add`}
                      className={`mr-tgrid__add-line-row${blockStartRow ? ' mr-tgrid__block-start-row' : ''}`}
                    >
                      {isFirst ? (
                        <td
                          rowSpan={rowCount}
                          className={`mr-tgrid__sticky mr-tgrid__sticky--axis mr-tgrid__axis-cell ${mrAxisCellModifier(axe)}`}
                        >
                          <span className="mr-tgrid__axis-cell-title">{AXE_META[axe].title}</span>
                        </td>
                      ) : null}
                      <th
                        scope="row"
                        className={[
                          'mr-tgrid__sticky mr-tgrid__sticky--chantier mr-tgrid__chantier-cell mr-tgrid__chantier-cell--add',
                          chantierDropHoverKey === `${axe}-chantier-add` && chantierDropHoverInvalid
                            ? 'mr-tgrid__chantier-cell--drop-invalid'
                            : '',
                          chantierDropHoverKey === `${axe}-chantier-add` && !chantierDropHoverInvalid && axe !== 'KPI'
                            ? 'mr-tgrid__chantier-cell--drop-valid'
                            : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        onDragEnter={
                          !readOnly && onChantierDrop
                            ? (e) => handleChantierCellDragEnter(e, axe, `${axe}-chantier-add`)
                            : undefined
                        }
                        onDragOver={
                          !readOnly && onChantierDrop
                            ? (e) => handleChantierCellDragOver(e, axe, `${axe}-chantier-add`, 'add')
                            : undefined
                        }
                        onDragLeave={
                          !readOnly && onChantierDrop
                            ? (e) => handleChantierCellDragLeave(e, `${axe}-chantier-add`)
                            : undefined
                        }
                        onDrop={!readOnly && onChantierDrop ? (e) => void handleChantierCellDrop(e, axe) : undefined}
                      >
                        <button
                          type="button"
                          className="mr-tgrid__chantier-add-placeholder"
                          onClick={() => onChantierCellClick?.(null, axe)}
                          disabled={!onChantierCellClick}
                          aria-label="Ajouter un chantier — nom et projet transformant"
                        >
                          Ajoutez un chantier
                        </button>
                      </th>
                      {headerCells.map((h) => (
                        <td key={h.key} className="mr-tgrid__cell mr-tgrid__cell--filler" aria-hidden />
                      ))}
                    </tr>
                  )
                }

                if (!ch) return null

                const buckets = bucketForChantierAxis(ch.id, axe)
                const projectColor = projectColorById[ch.projet_id] ?? defaultPillColor
                const projetLabel = projetNomById[ch.projet_id] ?? ''

                return (
                  <tr
                    key={`${axe}-${ch.id}`}
                    className={blockStartRow ? 'mr-tgrid__block-start-row' : undefined}
                  >
                    {isFirst ? (
                      <td
                        rowSpan={rowCount}
                        className={`mr-tgrid__sticky mr-tgrid__sticky--axis mr-tgrid__axis-cell ${mrAxisCellModifier(axe)}`}
                      >
                        <span className="mr-tgrid__axis-cell-title">{AXE_META[axe].title}</span>
                      </td>
                    ) : null}
                    <th
                      scope="row"
                      className={[
                        'mr-tgrid__sticky mr-tgrid__sticky--chantier mr-tgrid__chantier-cell',
                        chantierDropHoverKey === `${axe}-chantier-${ch.id}` && chantierDropHoverInvalid
                          ? 'mr-tgrid__chantier-cell--drop-invalid'
                          : '',
                        chantierDropHoverKey === `${axe}-chantier-${ch.id}` && !chantierDropHoverInvalid && axe !== 'KPI'
                          ? 'mr-tgrid__chantier-cell--drop-valid'
                          : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onDragEnter={
                        !readOnly && onChantierDrop
                          ? (e) => handleChantierCellDragEnter(e, axe, `${axe}-chantier-${ch.id}`)
                          : undefined
                      }
                      onDragOver={
                        !readOnly && onChantierDrop
                          ? (e) => handleChantierCellDragOver(e, axe, `${axe}-chantier-${ch.id}`, ch.id)
                          : undefined
                      }
                      onDragLeave={
                        !readOnly && onChantierDrop
                          ? (e) => handleChantierCellDragLeave(e, `${axe}-chantier-${ch.id}`)
                          : undefined
                      }
                      onDrop={!readOnly && onChantierDrop ? (e) => void handleChantierCellDrop(e, axe) : undefined}
                    >
                      {!readOnly && onChantierCellClick ? (
                        <button
                          type="button"
                          className="mr-tgrid__chantier-name-btn"
                          draggable={!!onChantierDrop && axe !== 'KPI'}
                          onDragStart={(e) => handleChantierNameDragStart(e, ch, axe)}
                          onDragEnd={handleChantierNameDragEnd}
                          onClick={() => onChantierCellClick(ch.id, undefined)}
                        >
                          <span className="mr-tgrid__chantier-name">{ch.nom}</span>
                          {projetLabel ? (
                            <span className="mr-tgrid__chantier-projet" title="Projet parent">
                              {projetLabel}
                            </span>
                          ) : null}
                        </button>
                      ) : (
                        <>
                          <span className="mr-tgrid__chantier-name">{ch.nom}</span>
                          {projetLabel ? (
                            <span className="mr-tgrid__chantier-projet" title="Projet parent">
                              {projetLabel}
                            </span>
                          ) : null}
                        </>
                      )}
                    </th>
                    {headerCells.map((h) => {
                      const cellJalons = buckets.get(h.key) ?? []
                      const cellEmpty = cellJalons.length === 0
                      const jalonCellKey = `jalon-${axe}-${ch.id}-${h.key}`
                      const jalonDropActive = jalonDropHoverKey === jalonCellKey
                      return (
                        <td
                          key={h.key}
                          className={[
                            'mr-tgrid__cell',
                            jalonDropActive && jalonDropHoverInvalid ? 'mr-tgrid__cell--drop-invalid' : '',
                            jalonDropActive && !jalonDropHoverInvalid ? 'mr-tgrid__cell--drop-valid' : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          onDragOver={
                            !readOnly && onJalonDrop
                              ? (e) => handleTimeCellDragOver(e, ch, axe, h.key, buckets)
                              : undefined
                          }
                          onDragLeave={
                            !readOnly && onJalonDrop
                              ? (e) => handleTimeCellDragLeave(e, jalonCellKey)
                              : undefined
                          }
                          onDrop={
                            !readOnly && onJalonDrop
                              ? (e) => void handleTimeCellDrop(e, ch, axe, h.key, buckets)
                              : undefined
                          }
                        >
                          <div className="mr-tgrid__cell-inner">
                            <div className="mr-tgrid__pills">
                              {cellJalons.map((j) => {
                                const realised = j.statut === 'realise'
                                return (
                                  <div
                                    key={j.id}
                                    className="mr-tgrid__pill mr-tgrid__pill--matrix"
                                    draggable={!readOnly && !!onJalonDrop}
                                    onDragStart={(e) => handleJalonPillDragStart(e, j, ch, axe, h.key)}
                                    onDragEnd={handleJalonPillDragEnd}
                                    style={{
                                      borderLeft: `4px solid ${projectColor}`,
                                      background: `color-mix(in srgb, ${projectColor} 22%, var(--theme-bg-card))`,
                                    }}
                                  >
                                    {!readOnly && onToggleJalonRealise ? (
                                      <label className="mr-tgrid__pill-check">
                                        <input
                                          type="checkbox"
                                          checked={realised}
                                          draggable={false}
                                          aria-label={`Réalisé — ${j.nom || 'Jalon'}`}
                                          onChange={(e) => {
                                            e.stopPropagation()
                                            onToggleJalonRealise(j, ch.id, e.target.checked)
                                          }}
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                      </label>
                                    ) : null}
                                    <button
                                      type="button"
                                      className="mr-tgrid__pill-main"
                                      draggable={false}
                                      onClick={() => onOpenJalon(j, ch.id)}
                                      title={
                                        j.numero
                                          ? `${j.nom || 'Jalon'} (${j.numero}) — ${STATUT_LABEL[j.statut] ?? j.statut}`
                                          : `${j.nom || 'Jalon'} — ${STATUT_LABEL[j.statut] ?? j.statut}`
                                      }
                                    >
                                      <span className="mr-tgrid__pill-name">{j.nom || 'Sans titre'}</span>
                                    </button>
                                  </div>
                                )
                              })}
                            </div>
                            {!readOnly && cellEmpty && (
                              <button
                                type="button"
                                className="mr-tgrid__cell-plus"
                                aria-label={`Ajouter un jalon — ${ch.nom} — ${AXE_META[axe].title} — ${h.label}`}
                                onClick={() => onQuickAddInCell(ch.id, h.col, axe)}
                              >
                                <span className="mr-tgrid__cell-plus-ring" aria-hidden>
                                  +
                                </span>
                              </button>
                            )}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
            )
          })}
        </table>
      </div>
    </div>
  )
}
