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

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', session.user.email)
    .single()

  if (error) return null
  return data
}

// Vérifier si super admin
export function isSuperAdmin(email: string): boolean {
  return email === 'yoganhedef@yahoo.fr'
}
