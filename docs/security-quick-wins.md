# Quick wins sécurité / exploitation

## 1. MFA (Supabase Dashboard)

1. [Supabase Dashboard](https://supabase.com/dashboard) → ton projet → **Authentication** → **Providers** (ou **Policies** selon version).
2. Activer **Multi-factor authentication** pour les comptes administrateurs du projet, ou imposer MFA sur les utilisateurs ciblés via les options Auth disponibles sur ton plan.
3. Protéger surtout les comptes **break-glass** (`is_platform_superadmin`) et les accès au dashboard Supabase (mot de passe fort + MFA du compte Supabase).

## 2. Rate limits Auth

**Authentication** → **Rate limits** (ou équivalent) : vérifier que les envois **OTP / magic link** sont bornés côté projet. Le code applique en plus un délai client (voir `src/lib/auth.ts`).

## 3. Couverture RLS

Exécuter dans le SQL Editor :

- `docs/supabase-verify-permissions-setup.sql` — contrôle ciblé post-migration.
- `docs/supabase-verify-rls-all-public-tables.sql` — tables `public` sans RLS ou sans policy.

Corriger toute table exposée à l’API **anon** sans RLS.

## 4. Audit applicatif

La table `audit_events` est alimentée depuis l’app pour les actions principales (`src/lib/api.ts` : invitations, marquage accepté, création utilisateur, mise à jour workspace). Étendre les `action` au fil des besoins métier.

## 5. Storage

Voir `docs/supabase-storage-assets-hardening.sql` si des fichiers sensibles rejoignent le même bucket que les logos publics.

## 6. Secrets

- Ne jamais committer `.env` (voir `.gitignore`).
- Ne jamais exposer `service_role` au front ; réservé aux scripts serveur / Edge Functions si besoin.
