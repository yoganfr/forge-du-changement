import {
  getAcceptedInvitationAwaitingUserRow,
  getLatestPendingInvitationForEmail,
} from './api'
import { supabase } from './supabase'

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
 */
export async function getCurrentUser() {
  const session = await getSession()
  if (!session?.user.email) return null

  const email = session.user.email.trim().toLowerCase()

  const storedUserId = readBrowserMemberUserId()
  if (storedUserId) {
    const { data: byId, error: errId } = await supabase
      .from('users')
      .select('*')
      .eq('id', storedUserId)
      .maybeSingle()
    if (!errId && byId && byId.email?.trim().toLowerCase() === email) {
      return byId
    }
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
