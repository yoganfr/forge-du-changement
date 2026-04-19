import { describe, expect, it } from 'vitest'
import { findSimilarDirection, normalizeDirectionLabel } from './directionNameMatch'

describe('normalizeDirectionLabel', () => {
  it('retire accents et casse', () => {
    expect(normalizeDirectionLabel('  Direction  Métier  ')).toBe('direction metier')
  })
})

describe('findSimilarDirection', () => {
  const dirs = [
    { id: '1', nom: 'Direction Industrielle' },
    { id: '2', nom: 'Finance' },
  ]

  it('détecte égalité normalisée', () => {
    expect(findSimilarDirection('direction industrielle', dirs)?.id).toBe('1')
  })

  it('retourne null si rien de proche', () => {
    expect(findSimilarDirection('Totalement différent', dirs)).toBeNull()
  })
})
