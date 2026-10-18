import { describe, expect, it } from 'vitest'
import { assetPathFromStoredValue } from './storage'

describe('assetPathFromStoredValue', () => {
  it('retrouve le chemin d’une ancienne adresse publique', () => {
    expect(
      assetPathFromStoredValue(
        'https://exemple.supabase.co/storage/v1/object/public/assets/users/avatars/ada.png',
      ),
    ).toBe('users/avatars/ada.png')
  })

  it('laisse passer un aperçu local et une photo externe', () => {
    expect(assetPathFromStoredValue('data:image/png;base64,abc')).toBeNull()
    expect(assetPathFromStoredValue('https://www.gravatar.com/avatar/abc')).toBeNull()
  })
})
