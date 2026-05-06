import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent, type ReactNode } from 'react'
import type { Axe, Chantier, Jalon, RaciChantier } from './lib/types'
import type { CanonicalStakeholder, StakeholderKey } from './pciMatrixTypes'
import { roleBadge } from './pciMatrixTypes'
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

const SCROLL_NAV_BAND_LABELS = ['haut', 'centre', 'bas'] as const

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

/** API minimale pour intégrer la matrice PCI dans la grille roadmap (fournie par `usePciMatrix`). */
export type RoadmapPciColumnApi = {
  canonicalStakeholders: CanonicalStakeholder[]
  readOnly: boolean
  getRowFor: (chantierId: string, key: StakeholderKey) => RaciChantier | null
  openCell: (chantierId: string, key: StakeholderKey) => void
  openNewStakeholder: (chantierIdInitial: string | null) => void
  openEditStakeholder: (key: StakeholderKey) => void
  firstChantierId: string | null
}

type Props = {
  chantiers: Chantier[]
  jalonsByChantier: Record<string, Jalon[]>
  /** Colonnes temps (même référence que `monthYearFromTimelineColumnKey` côté parent si drag jalon). */
  timelineColumns?: TimelineColumn[]
  axeFilter: 'all' | Axe
  /** Si fourni, affiche « Axe affiché » sous l’aide et au-dessus du tableau (ex. édition CODIR). */
  onAxeFilterChange?: (value: 'all' | Axe) => void
  readOnly: boolean
  projectColorById: Record<string, string>
  projetNomById: Record<string, string>
  onOpenJalon: (jalon: Jalon, chantierId: string) => void
  onQuickAddInCell: (chantierId: string, column: TimelineColumn, axe: Axe) => void
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
  /** Colonnes PCI (Parties prenantes) — même lignes que les chantiers ; absent = colonne « trail » après les échéances. */
  pci?: RoadmapPciColumnApi | null
}

export default function RoadmapTimelineGrid({
  chantiers,
  jalonsByChantier,
  timelineColumns: timelineColumnsProp,
  axeFilter,
  onAxeFilterChange,
  readOnly,
  projectColorById,
  projetNomById,
  onOpenJalon,
  onQuickAddInCell,
  onChantierCellClick,
  onChantierDrop,
  onRoadmapToast,
  onJalonDrop,
  pci,
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
  const scrollRef = useRef<HTMLDivElement>(null)
  const [scrollFadeRight, setScrollFadeRight] = useState(false)
  const [scrollOverflow, setScrollOverflow] = useState(false)
  const [scrollCanLeft, setScrollCanLeft] = useState(false)
  const [scrollCanRight, setScrollCanRight] = useState(false)
  /** Zone visible (viewport) dans le tableau : repères répartis sur cette hauteur, pas sur toute la hauteur du DOM. */
  const [scrollNavStrip, setScrollNavStrip] = useState<{ top: number; height: number }>({
    top: 0,
    height: 0,
  })

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
        ? 'Trimestriel'
        : c.kind === 'year'
          ? 'Horizon annuel'
          : 'Projection',
    col: c,
  }))

  const pciColSpan =
    pci != null && (pci.canonicalStakeholders.length > 0 || !pci.readOnly)
      ? pci.canonicalStakeholders.length + (pci.readOnly ? 0 : 1)
      : 0
  const pciEnabled = pciColSpan > 0

  const syncHorizontalScrollUi = useCallback(() => {
    const el = scrollRef.current
    if (!el) {
      setScrollFadeRight(false)
      setScrollOverflow(false)
      setScrollCanLeft(false)
      setScrollCanRight(false)
      setScrollNavStrip({ top: 0, height: 0 })
      return
    }
    const r = el.getBoundingClientRect()
    const vh = window.innerHeight
    const intersectH = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0))
    const stripTop = Math.max(0, -r.top)
    const scrollbarPad = 16
    setScrollNavStrip({
      top: stripTop,
      height: Math.max(0, intersectH - scrollbarPad),
    })

    const { scrollLeft, scrollWidth, clientWidth } = el
    const maxScroll = Math.max(0, scrollWidth - clientWidth)
    if (maxScroll <= 2) {
      setScrollFadeRight(false)
      setScrollOverflow(false)
      setScrollCanLeft(false)
      setScrollCanRight(false)
      return
    }
    setScrollOverflow(true)
    setScrollFadeRight(scrollLeft < maxScroll - 2)
    setScrollCanLeft(scrollLeft > 2)
    setScrollCanRight(scrollLeft < maxScroll - 2)
  }, [])

  const scrollTableBy = useCallback((direction: -1 | 1) => {
    const el = scrollRef.current
    if (!el) return
    const delta = Math.min(240, Math.round(el.clientWidth * 0.45)) * direction
    el.scrollBy({ left: delta, behavior: 'smooth' })
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const run = () => syncHorizontalScrollUi()
    const ro = new ResizeObserver(run)
    ro.observe(el)
    window.addEventListener('resize', run)
    window.addEventListener('scroll', run, true)
    const id = requestAnimationFrame(run)
    return () => {
      cancelAnimationFrame(id)
      ro.disconnect()
      window.removeEventListener('resize', run)
      window.removeEventListener('scroll', run, true)
    }
  }, [syncHorizontalScrollUi, headerCells.length, pciColSpan, axeFilter])

  /** `data` = ligne chantier ; `row-filler` = ligne « Ajoutez un chantier » (PCI inerte, pas de +) ; `grid-filler` = ligne vide lecture seule. */
  function renderPciRow(
    mode: 'data' | 'row-filler' | 'grid-filler',
    chantierId: string | null,
  ): ReactNode {
    if (!pciEnabled || !pci) return null
    const pciRo = pci.readOnly
    const out: ReactNode[] = []
    for (const s of pci.canonicalStakeholders) {
      if (mode !== 'data') {
        out.push(
          <td key={s.key} className="mr-tgrid__cell mr-tgrid__pci-cell mr-tgrid__pci-cell--filler" aria-hidden />,
        )
        continue
      }
      if (!chantierId) continue
      const row = pci.getRowFor(chantierId, s.key)
      const badge = row ? roleBadge(row) : null
      const roles: string[] = []
      if (row?.is_pilote) roles.push('P')
      if (row?.is_contributeur) roles.push('C')
      if (row?.is_informe) roles.push('I')
      const cellTitle =
        row?.motivation ?? (badge ? badge.title : 'Cliquer pour impliquer cette partie prenante')
      out.push(
        <td
          key={s.key}
          className={[
            'mr-tgrid__cell mr-tgrid__pci-cell',
            row ? 'mr-tgrid__pci-cell--filled' : 'mr-tgrid__pci-cell--empty',
            pciRo ? 'mr-tgrid__pci-cell--readonly' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <div className="mr-tgrid__pci-cell-inner">
            {roles.length > 0 ? (
              pciRo ? (
                <span className="rcm-cell-roles" title={cellTitle}>
                  {roles.map((r) => (
                    <span key={r} className={`rcm-role rcm-role--${r.toLowerCase()}`}>
                      {r}
                    </span>
                  ))}
                </span>
              ) : (
                <button
                  type="button"
                  className="mr-tgrid__pci-cell-edit"
                  onClick={() => pci.openCell(chantierId, s.key)}
                  title={cellTitle}
                  aria-label="Modifier le rôle de cette partie prenante sur ce chantier"
                >
                  <span className="rcm-cell-roles">
                    {roles.map((r) => (
                      <span key={r} className={`rcm-role rcm-role--${r.toLowerCase()}`}>
                        {r}
                      </span>
                    ))}
                  </span>
                </button>
              )
            ) : pciRo ? (
              <span className="rcm-cell-empty-dot" aria-hidden>
                ·
              </span>
            ) : (
              <button
                type="button"
                className="mr-tgrid__pci-plus"
                onClick={() => pci.openCell(chantierId, s.key)}
                title={cellTitle}
                aria-label="Impliquer cette partie prenante sur ce chantier"
              >
                <span className="mr-tgrid__pci-plus-ring" aria-hidden>
                  +
                </span>
              </button>
            )}
          </div>
        </td>,
      )
    }
    if (!pciRo) {
      if (mode === 'grid-filler') {
        out.push(<td key="pci-add" className="mr-tgrid__cell mr-tgrid__pci-cell mr-tgrid__pci-cell--filler" aria-hidden />)
      } else if (mode === 'row-filler') {
        out.push(
          <td key="pci-add" className="mr-tgrid__cell mr-tgrid__pci-cell mr-tgrid__pci-cell--filler" aria-hidden />,
        )
      } else {
        out.push(
          <td key="pci-add" className="mr-tgrid__cell mr-tgrid__pci-cell mr-tgrid__pci-cell--add">
            <div className="mr-tgrid__pci-cell-inner">
              <button
                type="button"
                className="mr-tgrid__pci-plus"
                onClick={() => pci.openNewStakeholder(chantierId)}
                aria-label="Ajouter une partie prenante sur cette ligne"
              >
                <span className="mr-tgrid__pci-plus-ring" aria-hidden>
                  +
                </span>
              </button>
            </div>
          </td>,
        )
      }
    }
    return <>{out}</>
  }

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
      <ul className="mr-help-list mr-tgrid-intro">
        <li>
          Chaque <strong>chantier</strong> n’apparaît que dans le <strong>bloc d’axe</strong> où vous le créez (pas de
          doublon sur les autres axes).
        </li>
        <li>
          Rattachement au projet transformant ; les <strong>jalons</strong> reprennent la couleur du projet.
        </li>
        <li>
          Un seul jalon par case temps — le <strong>+</strong> disparaît une fois le jalon créé.
        </li>
        <li>
          Les colonnes <strong>échéances</strong> et <strong>parties prenantes</strong> peuvent dépasser la largeur de
          l’écran : utilisez le <strong>défilement horizontal</strong> du tableau (barre en bas ou flèches sur les côtés)
          pour les parcourir.
        </li>
      </ul>

      {onAxeFilterChange ? (
        <label className="mr-toolbar__field mr-tgrid-axis-filter" htmlFor="mr-axe-filter">
          <span className="mr-toolbar__label">Axe affiché</span>
          <select
            id="mr-axe-filter"
            value={axeFilter}
            onChange={(e) => onAxeFilterChange(e.target.value as 'all' | Axe)}
          >
            <option value="all">Les quatre axes</option>
            {AXES.map((a) => (
              <option key={a} value={a}>
                {AXE_META[a].title}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <div
        className={[
          'mr-tgrid-scroll-outer',
          scrollFadeRight ? 'mr-tgrid-scroll-outer--fade-right' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {scrollOverflow && scrollCanLeft && scrollNavStrip.height > 0 ? (
          <div
            className="mr-tgrid-scroll-nav-col mr-tgrid-scroll-nav-col--left"
            style={{ top: scrollNavStrip.top, height: scrollNavStrip.height }}
          >
            {SCROLL_NAV_BAND_LABELS.map((band) => (
              <div key={`L-${band}`} className="mr-tgrid-scroll-nav__band">
                <button
                  type="button"
                  className="mr-tgrid-scroll-nav__btn"
                  onClick={() => scrollTableBy(-1)}
                  aria-label={`Faire défiler le tableau vers la gauche (repère ${band})`}
                >
                  <span className="mr-tgrid-scroll-nav__chev" aria-hidden>
                    ‹
                  </span>
                </button>
              </div>
            ))}
          </div>
        ) : null}
        {scrollOverflow && scrollCanRight && scrollNavStrip.height > 0 ? (
          <div
            className="mr-tgrid-scroll-nav-col mr-tgrid-scroll-nav-col--right"
            style={{ top: scrollNavStrip.top, height: scrollNavStrip.height }}
          >
            {SCROLL_NAV_BAND_LABELS.map((band) => (
              <div key={`R-${band}`} className="mr-tgrid-scroll-nav__band">
                <button
                  type="button"
                  className="mr-tgrid-scroll-nav__btn"
                  onClick={() => scrollTableBy(1)}
                  aria-label={`Faire défiler le tableau vers la droite (repère ${band})`}
                >
                  <span className="mr-tgrid-scroll-nav__chev" aria-hidden>
                    ›
                  </span>
                </button>
              </div>
            ))}
          </div>
        ) : null}
        <div
          ref={scrollRef}
          className="mr-tgrid-scroll"
          role="region"
          aria-label="Tableau roadmap par axe et temps"
          onScroll={syncHorizontalScrollUi}
        >
        <table className="mr-tgrid mr-tgrid--matrix">
          <thead>
            <tr className="mr-tgrid__head-row mr-tgrid__head-row--primary">
              <th
                scope="col"
                rowSpan={2}
                className="mr-tgrid__sticky mr-tgrid__sticky--axis mr-tgrid__axis-head"
              >
                <span className="mr-tgrid__head-label mr-tgrid__head-label--axis">Axe</span>
              </th>
              <th
                scope="col"
                rowSpan={2}
                className="mr-tgrid__sticky mr-tgrid__sticky--chantier mr-tgrid__chantier-head"
              >
                <span className="mr-tgrid__head-label mr-tgrid__head-label--chantier">Chantiers</span>
              </th>
              <th
                scope="colgroup"
                colSpan={headerCells.length}
                className="mr-tgrid__ech-group-head"
              >
                <span className="mr-tgrid__ech-group-head-label">Échéances</span>
              </th>
              {pciEnabled ? (
                <th scope="colgroup" colSpan={pciColSpan} className="mr-tgrid__pci-group-head">
                  <span className="mr-tgrid__ech-group-head-label">Parties prenantes</span>
                </th>
              ) : (
                <th
                  scope="col"
                  rowSpan={2}
                  className="mr-tgrid__trail-head"
                  aria-label="Prolongement du tableau après la dernière échéance"
                />
              )}
            </tr>
            <tr className="mr-tgrid__head-row mr-tgrid__head-row--secondary">
              {headerCells.map((h) => (
                <th key={h.key} scope="col" className="mr-tgrid__time-head">
                  <span className="mr-tgrid__time-label">{h.label}</span>
                  <span className="mr-tgrid__time-sub">{h.sub}</span>
                </th>
              ))}
              {pciEnabled && pci
                ? pci.canonicalStakeholders.map((s) => (
                    <th
                      key={s.key}
                      scope="col"
                      className={[
                        'mr-tgrid__pci-head',
                        'rcm-col-stakeholder',
                        pci.readOnly ? '' : 'rcm-col-stakeholder--editable',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      title={pci.readOnly ? s.personne_nom ?? undefined : 'Cliquer pour modifier cette partie prenante'}
                      onClick={pci.readOnly ? undefined : () => pci.openEditStakeholder(s.key)}
                      role={pci.readOnly ? undefined : 'button'}
                      tabIndex={pci.readOnly ? -1 : 0}
                      onKeyDown={
                        pci.readOnly
                          ? undefined
                          : (e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                pci.openEditStakeholder(s.key)
                              }
                            }
                      }
                    >
                      <span className="rcm-stakeholder-nom">{s.entite_nom}</span>
                      {s.personne_nom ? (
                        <span className="rcm-stakeholder-personne">{s.personne_nom}</span>
                      ) : null}
                    </th>
                  ))
                : null}
              {pciEnabled && pci && !pci.readOnly ? (
                <th scope="col" className="mr-tgrid__pci-head mr-tgrid__pci-head--add rcm-col-add">
                  <div className="mr-tgrid__pci-cell-inner">
                    <button
                      type="button"
                      className="rcm-add-btn"
                      onClick={() => pci.openNewStakeholder(pci.firstChantierId)}
                      disabled={chantiers.length === 0}
                      title="Ajouter une partie prenante"
                    >
                      + Ajouter
                    </button>
                  </div>
                </th>
              ) : null}
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
                          <span className="mr-tgrid__axis-cell-inner">
                            <span className="mr-tgrid__axis-cell-title">{AXE_META[axe].title}</span>
                          </span>
                        </td>
                      ) : null}
                      <th
                        scope="row"
                        className="mr-tgrid__sticky mr-tgrid__sticky--chantier mr-tgrid__chantier-cell mr-tgrid__chantier-cell--empty"
                      >
                        <div className="mr-tgrid__chantier-stack">
                          <span className="mr-tgrid__chantier-empty">—</span>
                        </div>
                      </th>
                      {headerCells.map((h) => (
                        <td key={h.key} className="mr-tgrid__cell mr-tgrid__cell--filler" aria-hidden />
                      ))}
                      {pciEnabled ? (
                        renderPciRow('grid-filler', null)
                      ) : (
                        <td className="mr-tgrid__cell mr-tgrid__trail-cell mr-tgrid__cell--filler" aria-hidden />
                      )}
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
                          <span className="mr-tgrid__axis-cell-inner">
                            <span className="mr-tgrid__axis-cell-title">{AXE_META[axe].title}</span>
                          </span>
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
                        <div className="mr-tgrid__chantier-stack">
                          <button
                            type="button"
                            className="mr-tgrid__chantier-add-placeholder"
                            onClick={() => onChantierCellClick?.(null, axe)}
                            disabled={!onChantierCellClick}
                            aria-label="Ajouter un chantier — nom et projet transformant"
                          >
                            Ajoutez un chantier
                          </button>
                        </div>
                      </th>
                      {headerCells.map((h) => (
                        <td key={h.key} className="mr-tgrid__cell mr-tgrid__cell--filler" aria-hidden />
                      ))}
                      {pciEnabled ? (
                        renderPciRow('row-filler', null)
                      ) : (
                        <td className="mr-tgrid__cell mr-tgrid__trail-cell mr-tgrid__cell--filler" aria-hidden />
                      )}
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
                        <span className="mr-tgrid__axis-cell-inner">
                          <span className="mr-tgrid__axis-cell-title">{AXE_META[axe].title}</span>
                        </span>
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
                      <div className="mr-tgrid__chantier-stack">
                        {onChantierCellClick ? (
                          <button
                            type="button"
                            className="mr-tgrid__chantier-name-btn"
                            draggable={!readOnly && !!onChantierDrop && axe !== 'KPI'}
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
                      </div>
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
                              {cellJalons.map((j) => (
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
                                  {/* Timeline grid pills intentionally render text only (no checkbox). */}
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
                              ))}
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
                    {pciEnabled ? (
                      renderPciRow('data', ch.id)
                    ) : (
                      <td className="mr-tgrid__cell mr-tgrid__trail-cell mr-tgrid__cell--filler" aria-hidden />
                    )}
                  </tr>
                )
              })}
            </tbody>
            )
          })}
        </table>
        </div>
      </div>
    </div>
  )
}
