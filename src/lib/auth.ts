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

// Récupérer l'utilisateur courant depuis la table users
export async function getCurrentUser() {
  const session = await getSession()
  if (!session?.user.email) return null

  const email = session.user.email.trim().toLowerCase()
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  if (error) return null
  return data
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
