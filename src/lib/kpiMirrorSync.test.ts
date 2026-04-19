import { describe, expect, it } from 'vitest'
import { buildKpiMirrorNom } from './kpiMirrorSync'

describe('buildKpiMirrorNom', () => {
  it('compose intitulé miroir', () => {
    expect(buildKpiMirrorNom('Taux de décroché', '90%')).toBe('Taux de décroché (cible 90%)')
  })
})
