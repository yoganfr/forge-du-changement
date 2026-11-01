import { describe, expect, it } from 'vitest'
import {
  assetPathFromStoredValue,
  deletableAssetPath,
  userAvatarFolder,
  workspaceLogoFolder,
} from './storage'

const WORKSPACE_ID = '11111111-1111-4111-8111-111111111111'
const USER_ID = '22222222-2222-4222-8222-222222222222'

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
    expect(assetPathFromStoredValue('https://lh3.googleusercontent.com/a/photo')).toBeNull()
  })
})

describe('dossiers par identifiant', () => {
  it('place le logo dans le dossier de l’entreprise', () => {
    expect(workspaceLogoFolder(WORKSPACE_ID)).toBe(`workspaces/${WORKSPACE_ID}/logos`)
  })

  it('place la photo dans le dossier de la personne', () => {
    expect(userAvatarFolder(USER_ID)).toBe(`users/${USER_ID}/avatars`)
  })

  it('refuse un identifiant qui n’est pas celui d’une fiche', () => {
    expect(() => workspaceLogoFolder('workspaces/logos')).toThrow(/invalide/)
    expect(() => userAvatarFolder('../avatars')).toThrow(/invalide/)
  })
})

describe('deletableAssetPath', () => {
  it('retrouve un fichier du dossier et ignore le reste', () => {
    expect(
      deletableAssetPath(
        `https://exemple.supabase.co/storage/v1/object/public/assets/workspaces/${WORKSPACE_ID}/logos/marque.png`,
      ),
    ).toBe(`workspaces/${WORKSPACE_ID}/logos/marque.png`)
    expect(deletableAssetPath('https://www.gravatar.com/avatar/abc')).toBeNull()
    expect(deletableAssetPath('data:image/png;base64,abc')).toBeNull()
    expect(deletableAssetPath('https://lh3.googleusercontent.com/a/photo')).toBeNull()
    expect(
      deletableAssetPath('https://exemple.supabase.co/storage/v1/object/public/assets/workspaces/../secrets.png'),
    ).toBeNull()
  })
})
