import { describe, expect, it } from 'vitest'
import { pickSessionUserId } from './sessionUser'
import { imageExtensionForUpload, validateImageFile } from './storageValidation'
import { payloadForUserInsert, payloadForUserUpdate } from './userPayload'

describe('payload utilisateur', () => {
  it('écrit le rôle explicite et ignore un rôle glissé dans le partial', () => {
    const payload = payloadForUserInsert(
      {
        email: 'a@b.c',
        role: 'admin',
        workspace_id: 'ws-1',
        is_platform_superadmin: true,
      },
      'contributeur',
    )
    expect(payload.role).toBe('contributeur')
    expect(payload.workspace_id).toBe('ws-1')
    expect(payload.is_platform_superadmin).toBeUndefined()
    expect(Object.prototype.hasOwnProperty.call(payload, 'is_platform_superadmin')).toBe(false)
  })

  it('retire rôle, espace et flag à l’update profil', () => {
    const payload = payloadForUserUpdate({
      prenom: 'Ada',
      role: 'admin',
      workspace_id: 'ws-2',
      is_platform_superadmin: true,
    })
    expect(payload.prenom).toBe('Ada')
    expect(payload.role).toBeUndefined()
    expect(payload.workspace_id).toBeUndefined()
    expect(Object.prototype.hasOwnProperty.call(payload, 'is_platform_superadmin')).toBe(false)
  })

  it('autorise workspace_id seulement pour le realignement explicite', () => {
    const payload = payloadForUserUpdate(
      { workspace_id: 'ws-2', role: 'admin', is_platform_superadmin: true },
      { allowWorkspaceId: true },
    )
    expect(payload.workspace_id).toBe('ws-2')
    expect(payload.role).toBeUndefined()
    expect(Object.prototype.hasOwnProperty.call(payload, 'is_platform_superadmin')).toBe(false)
  })
})

describe('pickSessionUserId', () => {
  const ada = { id: 'auth-ada', email: 'ada@forge.test', workspace_id: 'ws-a' }
  const adaOther = { id: 'other-ada', email: 'ada@forge.test', workspace_id: 'ws-b' }

  it('retourne l’unique ligne', () => {
    expect(
      pickSessionUserId({
        candidates: [ada],
        email: 'ada@forge.test',
        authUserId: 'quelqu-un-d-autre',
        storedUserId: null,
        storedWorkspaceId: null,
      }),
    ).toBe('auth-ada')
  })

  it('préfère auth.uid() quand plusieurs lignes partagent l’email', () => {
    expect(
      pickSessionUserId({
        candidates: [adaOther, ada],
        email: 'Ada@forge.test',
        authUserId: 'auth-ada',
        storedUserId: 'other-ada',
        storedWorkspaceId: 'ws-b',
      }),
    ).toBe('auth-ada')
  })

  it('ignore une ligne d’un autre email', () => {
    expect(
      pickSessionUserId({
        candidates: [{ id: 'x', email: 'autre@forge.test', workspace_id: 'ws-a' }],
        email: 'ada@forge.test',
        authUserId: 'x',
        storedUserId: null,
        storedWorkspaceId: null,
      }),
    ).toBeNull()
  })
})

describe('validateImageFile', () => {
  it('accepte un jpeg et force l’extension stockée', () => {
    const file = { name: 'photo.JPEG', type: 'image/jpeg', size: 1200 }
    expect(validateImageFile(file)).toBeNull()
    expect(imageExtensionForUpload(file)).toBe('jpg')
  })

  it('accepte un HEIC sans type MIME (photo téléphone)', () => {
    const file = { name: 'IMG.heic', type: '', size: 2_000_000 }
    expect(validateImageFile(file)).toBeNull()
    expect(imageExtensionForUpload(file)).toBe('heic')
  })

  it('refuse un svg même annoncé comme image', () => {
    expect(validateImageFile({ name: 'logo.svg', type: 'image/svg+xml', size: 100 })).toMatch(/pas accepté/)
  })

  it('stocke un jpeg annoncé en .html sous l’extension jpg', () => {
    const file = { name: 'piece.html', type: 'image/jpeg', size: 100 }
    expect(validateImageFile(file)).toBeNull()
    expect(imageExtensionForUpload(file)).toBe('jpg')
  })

  it('refuse un fichier au-dessus de 10 Mo', () => {
    expect(validateImageFile({ name: 'big.png', type: 'image/png', size: 10 * 1024 * 1024 + 1 })).toMatch(/10 Mo/)
  })
})
