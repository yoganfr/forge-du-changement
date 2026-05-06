import type { RoadmapSnapshotItem } from './api/roadmapSnapshots'
import type { Chantier, Jalon } from './types'

/** Reconstruit chantiers + jalons depuis les items figés du snapshot (REF-7a). */
export function buildChantiersAndJalonsFromSnapshotItems(items: RoadmapSnapshotItem[]): {
  chantiers: Chantier[]
  jalonsByChantier: Record<string, Jalon[]>
} {
  const chantiers: Chantier[] = []
  const jalonsByChantier: Record<string, Jalon[]> = {}
  const seenChantier = new Set<string>()

  for (const it of items) {
    if (it.kind !== 'chantier') continue
    const c = it.payload as unknown as Chantier
    if (!c?.id) continue
    if (seenChantier.has(c.id)) continue
    seenChantier.add(c.id)
    chantiers.push(c)
    jalonsByChantier[c.id] = []
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

  return { chantiers, jalonsByChantier }
}
