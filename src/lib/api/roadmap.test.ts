import { describe, expect, it } from 'vitest'
import type { Jalon } from '../types'
import { normalizeAxeForDb, sortJalonsByAxeAndOrder } from './roadmap'

function jalon(partial: Partial<Jalon> & Pick<Jalon, 'id' | 'axe' | 'ordre_sequentiel'>): Jalon {
  return {
    chantier_id: 'c1',
    projet_id: 'p1',
    workspace_id: 'w1',
    direction_id: null,
    numero: '1.1',
    nom: 'x',
    description: null,
    mois_cible: null,
    annee_cible: null,
    statut: 'a_venir',
    responsable: null,
    decideur: null,
    kpi_description: null,
    kpi_valeur_cible: null,
    facette: null,
    jalon_dependance_id: null,
    note_contexte: null,
    created_at: '',
    updated_at: '',
    ...partial,
  }
}

describe('normalizeAxeForDb', () => {
  it('canonise OUTIL → OUTILS', () => {
    expect(normalizeAxeForDb('OUTIL')).toBe('OUTILS')
  })
  it('accepte les axes complets', () => {
    expect(normalizeAxeForDb('PROCESSUS')).toBe('PROCESSUS')
    expect(normalizeAxeForDb('KPI')).toBe('KPI')
  })
  it('rejette une valeur inconnue', () => {
    expect(() => normalizeAxeForDb('FOO')).toThrow(/Axe invalide/)
  })
})

describe('sortJalonsByAxeAndOrder', () => {
  it('trie par axe puis ordre_sequentiel', () => {
    const a = jalon({ id: '1', axe: 'KPI', ordre_sequentiel: 1 })
    const b = jalon({ id: '2', axe: 'PROCESSUS', ordre_sequentiel: 5 })
    const c = jalon({ id: '3', axe: 'PROCESSUS', ordre_sequentiel: 2 })
    const sorted = sortJalonsByAxeAndOrder([a, b, c])
    // AXE_ORDER: PROCESSUS, ORGANISATION, OUTILS, KPI — puis ordre_sequentiel.
    expect(sorted.map((x) => x.id)).toEqual(['3', '2', '1'])
  })
})
