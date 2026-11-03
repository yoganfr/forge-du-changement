import { describe, expect, it } from 'vitest'
import type { RoadmapSnapshotItem } from './api/roadmapSnapshots'
import { buildChantiersAndJalonsFromSnapshotItems } from './reviewerSnapshotRoadmap'

function item(partial: Pick<RoadmapSnapshotItem, 'kind' | 'source_id' | 'payload'>): RoadmapSnapshotItem {
  return {
    id: partial.source_id,
    snapshot_id: 'snap',
    created_at: '2026-11-03T00:00:00.000Z',
    ...partial,
  }
}

describe('buildChantiersAndJalonsFromSnapshotItems', () => {
  it('expose les parties prenantes copiées dans le chantier figé', () => {
    const built = buildChantiersAndJalonsFromSnapshotItems([
      item({
        kind: 'chantier',
        source_id: 'ch-1',
        payload: {
          id: 'ch-1',
          nom: 'Qualité',
          parties_prenantes: [
            { id: 'pci-1', chantier_id: 'ch-1', entite_nom: 'DRH' },
            { id: '', chantier_id: 'ch-1', entite_nom: 'Ignorée' },
          ],
        },
      }),
      item({
        kind: 'jalon',
        source_id: 'j-1',
        payload: { id: 'j-1', chantier_id: 'ch-1', nom: 'Formée' },
      }),
    ])

    expect(built.chantiers).toHaveLength(1)
    expect(built.chantiers[0]?.nom).toBe('Qualité')
    expect('parties_prenantes' in (built.chantiers[0] as object)).toBe(false)
    expect(built.partiesByChantier['ch-1']).toEqual([
      { id: 'pci-1', chantier_id: 'ch-1', entite_nom: 'DRH' },
    ])
    expect(built.jalonsByChantier['ch-1']).toHaveLength(1)
  })

  it('laisse les parties vides si la version figée n’en a pas', () => {
    const built = buildChantiersAndJalonsFromSnapshotItems([
      item({
        kind: 'chantier',
        source_id: 'ch-2',
        payload: { id: 'ch-2', nom: 'Ancien' },
      }),
    ])

    expect(built.partiesByChantier['ch-2']).toEqual([])
  })
})
