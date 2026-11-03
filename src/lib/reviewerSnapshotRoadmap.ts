import type { RoadmapSnapshotItem } from './api/roadmapSnapshots'
import type { Chantier, Jalon, RaciChantier } from './types'

function partiesFromPayload(payload: Record<string, unknown>): RaciChantier[] {
  const raw = payload.parties_prenantes
  if (!Array.isArray(raw)) return []
  const parties: RaciChantier[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const row = item as Partial<RaciChantier>
    if (
      typeof row.id !== 'string' ||
      row.id.trim() === '' ||
      typeof row.chantier_id !== 'string' ||
      row.chantier_id.trim() === '' ||
      typeof row.entite_nom !== 'string' ||
      row.entite_nom.trim() === ''
    ) {
      continue
    }
    parties.push(row as RaciChantier)
  }
  return parties
}

/** Reconstruit chantiers + jalons depuis les items figés du snapshot (REF-7a). */
export function buildChantiersAndJalonsFromSnapshotItems(items: RoadmapSnapshotItem[]): {
  chantiers: Chantier[]
  jalonsByChantier: Record<string, Jalon[]>
  partiesByChantier: Record<string, RaciChantier[]>
} {
  const chantiers: Chantier[] = []
  const jalonsByChantier: Record<string, Jalon[]> = {}
  const partiesByChantier: Record<string, RaciChantier[]> = {}
  const seenChantier = new Set<string>()

  for (const it of items) {
    if (it.kind !== 'chantier') continue
    const payload = it.payload
    const { parties_prenantes: _parties, ...chantierFields } = payload
    const c = chantierFields as unknown as Chantier
    if (!c?.id) continue
    if (seenChantier.has(c.id)) continue
    seenChantier.add(c.id)
    chantiers.push(c)
    jalonsByChantier[c.id] = []
    partiesByChantier[c.id] = partiesFromPayload(payload)
  }

  for (const it of items) {
    if (it.kind !== 'jalon') continue
    const j = it.payload as unknown as Jalon
    const cid = j.chantier_id
    if (!cid) continue
    if (!jalonsByChantier[cid]) jalonsByChantier[cid] = []
    const list = jalonsByChantier[cid]
    if (!list.some((x) => x.id === j.id)) list.push(j)
  }

  return { chantiers, jalonsByChantier, partiesByChantier }
}
