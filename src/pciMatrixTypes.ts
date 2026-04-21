import type { RaciChantier, RaciChantierEntiteType } from './lib/types'

export type StakeholderKey = string

export type CanonicalStakeholder = {
  key: StakeholderKey
  entite_type: RaciChantierEntiteType
  entite_nom: string
  direction_id: string | null
  personne_nom: string | null
  user_id: string | null
}

export type PopoverState =
  | { kind: 'closed' }
  | {
      kind: 'cell'
      chantierId: string
      stakeholderKey: StakeholderKey
      existingRow: RaciChantier | null
    }
  | { kind: 'new-stakeholder'; chantierIdInitial: string | null }
  | { kind: 'stakeholder-edit'; stakeholderKey: StakeholderKey }

export function stakeholderKey(row: Pick<RaciChantier, 'entite_type' | 'entite_nom' | 'personne_nom'>): StakeholderKey {
  return [row.entite_type, row.entite_nom.trim().toLowerCase(), (row.personne_nom ?? '').trim().toLowerCase()].join('|')
}

export function buildCanonicalFromRow(row: RaciChantier): CanonicalStakeholder {
  return {
    key: stakeholderKey(row),
    entite_type: row.entite_type,
    entite_nom: row.entite_nom,
    direction_id: row.direction_id,
    personne_nom: row.personne_nom,
    user_id: row.user_id,
  }
}

export function sortCanonical(a: CanonicalStakeholder, b: CanonicalStakeholder): number {
  const nomCmp = a.entite_nom.localeCompare(b.entite_nom, 'fr', { sensitivity: 'base' })
  if (nomCmp !== 0) return nomCmp
  return (a.personne_nom ?? '').localeCompare(b.personne_nom ?? '', 'fr', { sensitivity: 'base' })
}

export function roleBadge(row: RaciChantier): { letter: 'P' | 'C' | 'I' | '·'; title: string } {
  if (row.is_pilote) return { letter: 'P', title: 'Pilote' }
  if (row.is_contributeur) return { letter: 'C', title: 'Contributeur' }
  if (row.is_informe) return { letter: 'I', title: 'Informé' }
  return { letter: '·', title: 'Aucun rôle' }
}
