import {
  getAcceptedInvitationAwaitingUserRow,
  getLatestPendingInvitationForEmail,
} from './api'
import { insertAuditEvent } from './api/audit'
import { supabase } from './supabase'
import type { User as SupabaseAuthUser } from '@supabase/supabase-js'

/** Délai minimum entre deux envois OTP (même email) — complète le rate limiting Supabase Auth. */
const OTP_COOLDOWN_MS = 45_000
const otpLastSentMs = new Map<string, number>()

function assertOtpCooldown(emailRaw: string): void {
  const key = emailRaw.trim().toLowerCase()
  const now = Date.now()
  const last = otpLastSentMs.get(key) ?? 0
  if (now - last < OTP_COOLDOWN_MS) {
    const waitSec = Math.ceil((OTP_COOLDOWN_MS - (now - last)) / 1000)
    throw new Error(`Merci de patienter ${waitSec} s avant un nouvel envoi.`)
  }
  otpLastSentMs.set(key, now)
}

// Connexion email + password
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw error
  return data
}

// Connexion Google OAuth
export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })
  if (error) throw error
}

// Magic link (mot de passe oublié)
export async function sendMagicLink(email: string) {
  assertOtpCooldown(email)
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  })
  if (error) throw error
}

/**
 * Magic link pour un invité : crée le compte Auth si besoin et envoie l’email (Supabase Auth).
 * Le rate limit côté projet (Auth → Rate limits) reste le garde-fou principal ; ici on évite les double-clics.
 */
export async function sendInvitationMagicLink(inviteeEmail: string) {
  assertOtpCooldown(inviteeEmail)
  const { error } = await supabase.auth.signInWithOtp({
    email: inviteeEmail.trim().toLowerCase(),
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
      shouldCreateUser: true,
    },
  })
  if (error) throw error
}

// Déconnexion
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// Récupérer la session courante
export async function getSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session
}

function readBrowserWorkspaceId(): string | null {
  if (typeof localStorage === 'undefined') return null
  const w = localStorage.getItem('workspaceId')?.trim()
  return w || null
}

function readBrowserMemberUserId(): string | null {
  if (typeof localStorage === 'undefined') return null
  const id = localStorage.getItem('lfdc-user-id')?.trim()
  return id || null
}

/**
 * Ligne `public.users` pour l’email de la session.
 * Plusieurs lignes peuvent exister (même email, espaces différents) : on évite de prendre
 * la plus « récente » si c’est un stub vide qui écraserait le profil à chaque reco Google.
 *
 * Priorité : (1) sélection explicite multi-espace (`lfdc-user-id` ≠ auth.uid) ;
 * (2) ligne dont `id` = `auth.uid()` — celle utilisée par la RLS sur `workspaces` ;
 * (3) filtre email + workspace courant ; (4) heuristique sur doublons d’email.
 */
export async function getCurrentUser(sessionUser?: SupabaseAuthUser | null) {
  const resolvedSessionUser = sessionUser ?? (await getSession())?.user ?? null
  if (!resolvedSessionUser?.email) return null

  const email = resolvedSessionUser.email.trim().toLowerCase()
  const authId = resolvedSessionUser.id

  const emailMatches = (r: { email?: string | null } | null) =>
    r?.email?.trim().toLowerCase() === email

  const { data: authRow, error: authErr } = await supabase
    .from('users')
    .select('*')
    .eq('id', authId)
    .maybeSingle()

  const storedUserId = readBrowserMemberUserId()
  if (storedUserId && storedUserId !== authId) {
    const { data: byId, error: errId } = await supabase
      .from('users')
      .select('*')
      .eq('id', storedUserId)
      .maybeSingle()
    if (!errId && byId && emailMatches(byId)) {
      return byId
    }
  }

  if (!authErr && authRow && emailMatches(authRow)) {
    return authRow
  }

  const ws = readBrowserWorkspaceId()
  if (ws) {
    const { data: byWs, error: errWs } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('workspace_id', ws)
      .maybeSingle()
    if (!errWs && byWs) return byWs
  }

  const { data: candidates, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .order('created_at', { ascending: false })
    .limit(25)

  if (error || !candidates?.length) return null

  const withAvatar = candidates.find((r) => Boolean(r.avatar_url?.trim()))
  if (withAvatar) return withAvatar

  const scoreProfile = (u: (typeof candidates)[number]) =>
    (u.prenom?.trim() ? 4 : 0)
    + (u.nom?.trim() ? 4 : 0)
    + (u.job_title?.trim() ? 2 : 0)
    + (u.direction_nom?.trim() ? 2 : 0)

  return [...candidates].sort((a, b) => scoreProfile(b) - scoreProfile(a))[0] ?? null
}

/**
 * Super-admin plateforme : même règle que `public.is_platform_superadmin()` (flag `users.is_platform_superadmin`).
 * À appeler avec une session Auth active (JWT présent).
 */
export async function isPlatformSuperadmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_platform_superadmin')
  if (error) return false
  return data === true
}

type MfaTotpEnrollResult = {
  factorId: string
  qrCode: string | null
  uri: string | null
}

export async function listMfaFactors() {
  const mfaApi = (supabase.auth as unknown as { mfa?: { listFactors?: () => Promise<{ data?: unknown; error?: { message?: string } }> } }).mfa
  if (!mfaApi?.listFactors) {
    return { totp: [], all: [] as Array<{ id: string; status: string; factor_type: string }> }
  }
  const { data, error } = await mfaApi.listFactors()
  if (error) throw new Error(error.message || 'Impossible de lire les facteurs MFA')
  const parsed = (data ?? {}) as {
    all?: Array<{ id: string; status: string; factor_type: string }>
    totp?: Array<{ id: string; status: string; factor_type: string }>
  }
  return {
    totp: parsed.totp ?? [],
    all: parsed.all ?? [],
  }
}

export async function isMfaEnrollmentRequiredForSuperadmin(): Promise<boolean> {
  if (!(await isPlatformSuperadmin())) return false
  const factors = await listMfaFactors()
  const hasVerifiedTotp = factors.totp.some((factor) => factor.status === 'verified')
  return !hasVerifiedTotp
}

export async function enrollMfaTotp(): Promise<MfaTotpEnrollResult> {
  const mfaApi = (supabase.auth as unknown as {
    mfa?: {
      enroll?: (params: { factorType: 'totp' }) => Promise<{ data?: unknown; error?: { message?: string } }>
    }
  }).mfa
  if (!mfaApi?.enroll) throw new Error('MFA non disponible sur ce client Supabase')
  const { data, error } = await mfaApi.enroll({ factorType: 'totp' })
  if (error) throw new Error(error.message || 'Impossible d’activer le MFA')
  const payload = (data ?? {}) as {
    id?: string
    totp?: { qr_code?: string | null; uri?: string | null }
  }
  if (!payload.id) throw new Error('Réponse MFA invalide : identifiant de facteur manquant')
  return {
    factorId: payload.id,
    qrCode: payload.totp?.qr_code ?? null,
    uri: payload.totp?.uri ?? null,
  }
}

export async function verifyMfaTotp(factorId: string, code: string): Promise<void> {
  const mfaApi = (supabase.auth as unknown as {
    mfa?: {
      challenge?: (params: { factorId: string }) => Promise<{ data?: { id?: string }; error?: { message?: string } }>
      verify?: (params: { factorId: string; challengeId: string; code: string }) => Promise<{ error?: { message?: string } }>
      challengeAndVerify?: (params: { factorId: string; code: string }) => Promise<{ error?: { message?: string } }>
    }
  }).mfa
  if (!mfaApi) throw new Error('MFA non disponible sur ce client Supabase')

  const trimmedCode = code.trim()
  if (!/^\d{6}$/.test(trimmedCode)) {
    throw new Error('Le code MFA doit contenir 6 chiffres.')
  }

  if (mfaApi.challengeAndVerify) {
    const { error } = await mfaApi.challengeAndVerify({ factorId, code: trimmedCode })
    if (error) throw new Error(error.message || 'Échec de vérification MFA')
  } else {
    if (!mfaApi.challenge || !mfaApi.verify) throw new Error('API MFA incomplète sur ce client Supabase')
    const { data: challenge, error: challengeError } = await mfaApi.challenge({ factorId })
    if (challengeError || !challenge?.id) {
      throw new Error(challengeError?.message || 'Impossible de générer le challenge MFA')
    }
    const { error: verifyError } = await mfaApi.verify({
      factorId,
      challengeId: challenge.id,
      code: trimmedCode,
    })
    if (verifyError) throw new Error(verifyError.message || 'Échec de vérification MFA')
  }
}

export async function unenrollMfaFactor(factorId: string): Promise<void> {
  const mfaApi = (supabase.auth as unknown as {
    mfa?: { unenroll?: (params: { factorId: string }) => Promise<{ error?: { message?: string } }> }
  }).mfa
  if (!mfaApi?.unenroll) throw new Error('MFA non disponible sur ce client Supabase')
  const { error } = await mfaApi.unenroll({ factorId })
  if (error) throw new Error(error.message || 'Impossible de supprimer le facteur MFA')
}

export async function auditMfaEvent(
  action: 'mfa_enrolled' | 'mfa_verified' | 'mfa_unenrolled',
  metadata: Record<string, unknown> = {},
): Promise<void> {
  const appUser = await getCurrentUser()
  void insertAuditEvent({
    workspace_id: appUser?.workspace_id ?? null,
    action,
    payload: metadata,
  })
}

/** Accès app : super-admin, ligne `users`, invitation en attente, ou invitation acceptée sans profil `users` encore. */
export async function userCanAccessApp(userEmail: string | undefined | null): Promise<boolean> {
  if (!userEmail?.trim()) return false
  const e = userEmail.trim().toLowerCase()
  if (await isPlatformSuperadmin()) return true
  const appUser = await getCurrentUser()
  if (appUser) return true
  const pending = await getLatestPendingInvitationForEmail(e)
  if (pending?.status === 'en_attente') return true
  const accepted = await getAcceptedInvitationAwaitingUserRow(e)
  return accepted !== null
}
