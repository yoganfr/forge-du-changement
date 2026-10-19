export type ReviewAudienceUser = {
  id: string
  email: string
  prenom: string | null
  nom: string | null
  role: string
  status: string
  direction_id: string | null
}

export type ReviewAudienceProjet = {
  id: string
  directions_contributrices?: string[] | null
}

export type ReviewAudienceItem = {
  kind: string
  payload: Record<string, unknown> | null
}

export type ReviewAudienceDirection = {
  id: string
  nom: string
}

export type ReviewAudiencePerson = {
  id: string
  label: string
  directionLabel: string
}

export type ReviewAudience = {
  transverse: boolean
  sameDirection: ReviewAudiencePerson[]
  otherDirections: ReviewAudiencePerson[]
}

const SANS_DIRECTION = 'Sans direction'

export function projetIdsFromSnapshotItems(items: ReviewAudienceItem[]): string[] {
  const ids = new Set<string>()
  for (const item of items) {
    if (item.kind !== 'chantier' || !item.payload) continue
    const projetId = item.payload.projet_id
    if (typeof projetId === 'string' && projetId.trim()) ids.add(projetId)
  }
  return [...ids]
}

function personLabel(user: ReviewAudienceUser): string {
  const name = [user.prenom, user.nom].filter(Boolean).join(' ').trim()
  return name || user.email.trim()
}

function byLabel(a: ReviewAudiencePerson, b: ReviewAudiencePerson): number {
  return a.label.localeCompare(b.label, 'fr')
}

export function buildReviewAudience(params: {
  items: ReviewAudienceItem[]
  projets: ReviewAudienceProjet[]
  users: ReviewAudienceUser[]
  memberDirectionId: string | null
  directions: ReviewAudienceDirection[]
}): ReviewAudience {
  const projetIds = new Set(projetIdsFromSnapshotItems(params.items))
  const transverse = params.projets.some(
    (projet) =>
      projetIds.has(projet.id) && (projet.directions_contributrices?.length ?? 0) > 0,
  )

  const directionNames = new Map(params.directions.map((direction) => [direction.id, direction.nom]))
  const contributors = params.users.filter(
    (user) => user.role === 'contributeur' && user.status === 'actif',
  )

  const sameDirection: ReviewAudiencePerson[] = []
  const otherDirections: ReviewAudiencePerson[] = []

  for (const user of contributors) {
    const person: ReviewAudiencePerson = {
      id: user.id,
      label: personLabel(user),
      directionLabel: user.direction_id
        ? (directionNames.get(user.direction_id) ?? SANS_DIRECTION)
        : SANS_DIRECTION,
    }
    if (params.memberDirectionId && user.direction_id === params.memberDirectionId) {
      sameDirection.push(person)
    } else if (transverse) {
      otherDirections.push(person)
    }
  }

  sameDirection.sort(byLabel)
  otherDirections.sort((a, b) => {
    const byDirection = a.directionLabel.localeCompare(b.directionLabel, 'fr')
    return byDirection !== 0 ? byDirection : byLabel(a, b)
  })

  return { transverse, sameDirection, otherDirections }
}
