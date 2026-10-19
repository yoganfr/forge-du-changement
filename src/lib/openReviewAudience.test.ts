import { describe, expect, it } from 'vitest'
import { buildReviewAudience, projetIdsFromSnapshotItems, type ReviewAudienceUser } from './openReviewAudience'

function user(partial: Partial<ReviewAudienceUser> & Pick<ReviewAudienceUser, 'id'>): ReviewAudienceUser {
  return {
    email: `${partial.id}@exemple.fr`,
    prenom: null,
    nom: null,
    role: 'contributeur',
    status: 'actif',
    direction_id: 'dir-finance',
    ...partial,
  }
}

const directions = [
  { id: 'dir-finance', nom: 'Finance' },
  { id: 'dir-rh', nom: 'Ressources humaines' },
]

describe('projetIdsFromSnapshotItems', () => {
  it('ne retient que les chantiers de la version figée', () => {
    expect(
      projetIdsFromSnapshotItems([
        { kind: 'chantier', payload: { projet_id: 'p-local' } },
        { kind: 'jalon', payload: { projet_id: 'p-jalon' } },
        { kind: 'chantier', payload: { nom: 'sans projet' } },
      ]),
    ).toEqual(['p-local'])
  })
})

describe('buildReviewAudience', () => {
  const projets = [
    { id: 'p-local', directions_contributrices: [] as string[] },
    { id: 'p-transverse', directions_contributrices: ['dir-rh'] },
  ]

  it('propose seulement les contributeurs actifs de la direction du membre du CODIR', () => {
    const audience = buildReviewAudience({
      items: [{ kind: 'chantier', payload: { projet_id: 'p-local' } }],
      projets,
      directions,
      memberDirectionId: 'dir-finance',
      users: [
        user({ id: 'a', prenom: 'Ada', nom: 'Martin' }),
        user({ id: 'b', prenom: 'Léa', nom: 'Bernard', direction_id: 'dir-rh' }),
        user({ id: 'c', role: 'codir', prenom: 'Paul', nom: 'CODIR' }),
        user({ id: 'd', role: 'pilote', prenom: 'Inès', nom: 'Pilote' }),
        user({ id: 'e', status: 'invite', prenom: 'Sam', nom: 'Invité' }),
        user({ id: 'f', status: 'inactif', prenom: 'Noa', nom: 'Inactif' }),
      ],
    })

    expect(audience.transverse).toBe(false)
    expect(audience.sameDirection.map((person) => person.label)).toEqual(['Ada Martin'])
    expect(audience.otherDirections).toEqual([])
  })

  it('ouvre les autres directions quand la version figée contient un projet transverse', () => {
    const audience = buildReviewAudience({
      items: [
        { kind: 'chantier', payload: { projet_id: 'p-local' } },
        { kind: 'chantier', payload: { projet_id: 'p-transverse' } },
      ],
      projets,
      directions,
      memberDirectionId: 'dir-finance',
      users: [
        user({ id: 'a', prenom: 'Ada', nom: 'Martin' }),
        user({ id: 'b', prenom: 'Léa', nom: 'Bernard', direction_id: 'dir-rh' }),
        user({ id: 'g', prenom: 'Camille', nom: 'Sans', direction_id: null }),
      ],
    })

    expect(audience.transverse).toBe(true)
    expect(audience.sameDirection.map((person) => person.id)).toEqual(['a'])
    expect(audience.otherDirections.map((person) => person.directionLabel)).toEqual([
      'Ressources humaines',
      'Sans direction',
    ])
  })

  it('laisse la direction du membre vide si sa fiche n’a pas de direction', () => {
    const audience = buildReviewAudience({
      items: [{ kind: 'chantier', payload: { projet_id: 'p-transverse' } }],
      projets,
      directions,
      memberDirectionId: null,
      users: [user({ id: 'a', prenom: 'Ada', nom: 'Martin' })],
    })

    expect(audience.sameDirection).toEqual([])
    expect(audience.otherDirections.map((person) => person.id)).toEqual(['a'])
  })
})
