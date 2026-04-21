#!/usr/bin/env node
/**
 * Génère un magic link Supabase via l'admin API (pas d'envoi d'email).
 * Utile pour contourner le rate limit du SMTP interne Supabase pendant les tests.
 *
 * Pré-requis :
 *   - Variables d'env SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY (Dashboard → Settings → API)
 *   - Ne JAMAIS commit la service_role key (.env est déjà dans .gitignore)
 *
 * Usage :
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/generate-magic-link.mjs <email> [redirectTo]
 *
 * Exemple (PowerShell) :
 *   $env:SUPABASE_URL="https://kpgkxeilddeyfwiiqaha.supabase.co"
 *   $env:SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOi..."
 *   node scripts/generate-magic-link.mjs snowie94@live.fr
 *
 * L'URL imprimée expire après ~1h. À coller telle quelle dans un navigateur privé.
 */

import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const email = process.argv[2]
const redirectTo = process.argv[3] ?? 'http://localhost:5173/auth/callback'

if (!url || !serviceKey || !email) {
  console.error(
    'Usage:\n' +
      '  SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/generate-magic-link.mjs <email> [redirectTo]\n',
  )
  process.exit(1)
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const { data, error } = await admin.auth.admin.generateLink({
  type: 'magiclink',
  email,
  options: { redirectTo },
})

if (error) {
  console.error('Erreur generateLink:', error.message)
  process.exit(1)
}

const actionLink = data?.properties?.action_link
if (!actionLink) {
  console.error('Pas d\'action_link dans la reponse:', JSON.stringify(data, null, 2))
  process.exit(1)
}

console.log('\n== Magic link genere pour', email, '==')
console.log('Redirect apres login:', redirectTo)
console.log('\nURL a coller dans un navigateur prive :\n')
console.log(actionLink)
console.log('\n(Expire apres ~1h. Un seul usage.)\n')
