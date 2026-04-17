import {
  getAcceptedInvitationAwaitingUserRow,
  getLatestPendingInvitationForEmail,
} from './api'
import { supabase } from './supabase'

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
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  })
  if (error) throw error
}

/** Magic link pour un invité : crée le compte Auth si besoin et envoie l’email (Supabase Auth). */
export async function sendInvitationMagicLink(inviteeEmail: string) {
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

/** Accès app : super-admin, ligne `users`, invitation en attente, ou invitation acceptée sans profil `users` encore. */
export async function userCanAccessApp(userEmail: string | undefined | null): Promise<boolean> {
  if (!userEmail?.trim()) return false
  const e = userEmail.trim().toLowerCase()
  if (isSuperAdmin(e)) return true
  const appUser = await getCurrentUser()
  if (appUser) return true
  const pending = await getLatestPendingInvitationForEmail(e)
  if (pending?.status === 'en_attente') return true
  const accepted = await getAcceptedInvitationAwaitingUserRow(e)
  return accepted !== null
}

// Vérifier si super admin
/** Comptes plateforme : accès total côté app (à terme, préférer un flag en base plutôt qu’une liste d’emails). */
export function isSuperAdmin(email: string): boolean {
  const e = email.trim().toLowerCase()
  return e === 'yoganhedef@yahoo.fr' || e === 'yoganhedef@gmail.com'
}
