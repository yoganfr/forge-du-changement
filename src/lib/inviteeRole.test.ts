import { describe, expect, it } from 'vitest'
import {
  INCOMPLETE_INVITATION_MESSAGE,
  classifyInviteeRole,
  classifyRereadInvitation,
  invitationRoleToStoredRole,
  pickInvitationForWorkspace,
  preferBootstrapInvitation,
  type InvitationCandidate,
} from './inviteeRole'

function row(partial: Partial<InvitationCandidate> & Pick<InvitationCandidate, 'id'>): InvitationCandidate {
  return {
    workspace_id: 'ws-a',
    role: 'pilote',
    status: 'acceptee',
    created_at: '2026-01-01T00:00:00',
    direction_id: null,
    trigram: null,
    ...partial,
  }
}

describe('invitationRoleToStoredRole', () => {
  it('refuse un rôle absent au lieu de le transformer en codir', () => {
    expect(invitationRoleToStoredRole(null)).toBeNull()
    expect(invitationRoleToStoredRole(undefined)).toBeNull()
    expect(invitationRoleToStoredRole('')).toBeNull()
    expect(invitationRoleToStoredRole('admin')).toBeNull()
  })

  it('conserve un rôle d’invitation réel', () => {
    expect(invitationRoleToStoredRole('contributeur')).toBe('contributeur')
    expect(invitationRoleToStoredRole('codir')).toBe('codir')
  })
})

describe('pickInvitationForWorkspace', () => {
  it('ignore une invitation acceptée d’un autre espace', () => {
    const other = row({ id: 'b', workspace_id: 'ws-b', role: 'codir', created_at: '2026-02-01T00:00:00' })
    const here = row({ id: 'a', role: 'pilote', created_at: '2026-01-01T00:00:00' })
    expect(pickInvitationForWorkspace([other, here], 'ws-a')?.id).toBe('a')
    expect(classifyInviteeRole(pickInvitationForWorkspace([other], 'ws-a'), 'ws-a').kind).toBe('absent')
  })

  it('retient la plus récente du même espace, puis l’id le plus grand', () => {
    const older = row({ id: 'a', role: 'contributeur', created_at: '2026-01-01T00:00:00' })
    const newer = row({ id: 'b', role: 'pilote', created_at: '2026-03-01T00:00:00' })
    const sameDateLow = row({ id: 'c', role: 'codir', created_at: '2026-03-01T00:00:00' })
    expect(pickInvitationForWorkspace([older, sameDateLow, newer], 'ws-a')?.id).toBe('c')
  })

  it('classe un rôle null comme invitation incomplète, sans créer de rôle de repli', () => {
    const incomplete = row({ id: 'a', role: null })
    const classified = classifyInviteeRole(incomplete, 'ws-a')
    expect(classified.kind).toBe('incomplete')
    expect(INCOMPLETE_INVITATION_MESSAGE).toMatch(/incomplète/)
  })
})

describe('preferBootstrapInvitation', () => {
  it('retient la plus récente, même si une invitation en attente est plus ancienne', () => {
    const accepted = row({ id: 'new', status: 'acceptee', created_at: '2026-04-01T00:00:00', role: 'codir' })
    const pending = row({ id: 'old', status: 'en_attente', created_at: '2026-01-01T00:00:00', role: 'pilote' })
    const chosen = preferBootstrapInvitation([accepted, pending])
    expect(chosen?.id).toBe('new')
    expect(pickInvitationForWorkspace([accepted, pending], 'ws-a')?.id).toBe(chosen?.id)
  })
})

describe('classifyRereadInvitation', () => {
  it('bloque si le statut n’est plus accepté au moment de créer la fiche', () => {
    const changed = row({ id: 'a', status: 'en_attente', role: 'pilote' })
    expect(classifyRereadInvitation(changed, 'ws-a', 'a').kind).toBe('status_changed')
    expect(classifyRereadInvitation(null, 'ws-a', 'a').kind).toBe('status_changed')
  })

  it('accepte la relecture acceptée avec exactement ce rôle', () => {
    const ok = row({ id: 'a', status: 'acceptee', role: 'contributeur' })
    const classified = classifyRereadInvitation(ok, 'ws-a', 'a')
    expect(classified).toEqual({ kind: 'ready', role: 'contributeur' })
  })
})
