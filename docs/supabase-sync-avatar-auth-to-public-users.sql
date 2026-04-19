-- ═══════════════════════════════════════════════════════════════════════════
-- La Forge — Synchronisation photo profil : auth.users → public.users
--
-- Contexte : certains comptes « email + Google lié » ont un raw_user_meta_data
-- sans clé picture / avatar_url (rien à copier). Le SQL ne peut pas appeler l’API
-- Google pour inventer une URL : il ne fait que PROPAGER ce qui existe déjà
-- dans auth vers public.users.avatar_url.
--
-- À exécuter dans Supabase → SQL Editor (rôle avec droits sur auth + public).
--
-- Après déploiement :
--   1) Déclencher une reconnexion Google / corriger les scopes provider si besoin,
--      pour que Supabase enrichisse raw_user_meta_data.
--   2) Lancer le bloc « Backfill » ci-dessous.
--   3) Le trigger maintient public.users à jour lors des prochains changements meta.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Fonction : extraire une URL portrait depuis raw_user_meta_data ─────────
CREATE OR REPLACE FUNCTION public.extract_avatar_url_from_auth_meta(meta jsonb)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(
    NULLIF(trim(meta->>'picture'), ''),
    NULLIF(trim(meta->>'avatar_url'), ''),
    NULLIF(trim(meta->>'image_url'), '')
  );
$$;

COMMENT ON FUNCTION public.extract_avatar_url_from_auth_meta(jsonb) IS
  'Retourne la première URL portrait connue (Google / OIDC) dans raw_user_meta_data.';

-- ── 2. Trigger : quand Auth met à jour les métadonnées, remplir public.users ──
CREATE OR REPLACE FUNCTION public.handle_auth_user_meta_sync_avatar_url()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  avatar text;
BEGIN
  avatar := public.extract_avatar_url_from_auth_meta(NEW.raw_user_meta_data);
  IF avatar IS NULL THEN
    RETURN NEW;
  END IF;

  -- Ne pas écraser une photo déjà enregistrée côté métier (upload Mon profil).
  UPDATE public.users pu
  SET avatar_url = avatar
  WHERE lower(btrim(pu.email::text)) = lower(btrim(NEW.email::text))
    AND (pu.avatar_url IS NULL OR btrim(pu.avatar_url::text) = '');

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_auth_user_meta_sync_avatar_url() IS
  'Après mise à jour des métadonnées Auth, copie picture/avatar_url vers public.users si avatar_url vide.';

DROP TRIGGER IF EXISTS trg_auth_users_sync_avatar_to_public ON auth.users;

CREATE TRIGGER trg_auth_users_sync_avatar_to_public
  AFTER INSERT OR UPDATE OF raw_user_meta_data ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_auth_user_meta_sync_avatar_url();

-- ── 3. Backfill ponctuel (lancer une fois après migration) ──────────────────
-- Recopie toutes les URLs déjà présentes dans auth vers public.users.
UPDATE public.users pu
SET avatar_url = public.extract_avatar_url_from_auth_meta(au.raw_user_meta_data)
FROM auth.users au
WHERE lower(btrim(pu.email::text)) = lower(btrim(au.email::text))
  AND (pu.avatar_url IS NULL OR btrim(pu.avatar_url::text) = '')
  AND public.extract_avatar_url_from_auth_meta(au.raw_user_meta_data) IS NOT NULL;

-- ── 4. (Optionnel) Vérification rapide ───────────────────────────────────────
-- SELECT
--   au.email,
--   public.extract_avatar_url_from_auth_meta(au.raw_user_meta_data) AS url_auth,
--   pu.avatar_url AS url_public
-- FROM auth.users au
-- LEFT JOIN public.users pu ON lower(btrim(pu.email)) = lower(btrim(au.email))
-- WHERE au.email = 'votre@email.com';

-- ═══════════════════════════════════════════════════════════════════════════
-- Si extract_avatar_url_from_auth_meta renvoie NULL pour tout le monde :
--   • Vérifier Authentication → Providers → Google (scopes / compte de test).
--   • Faire se déconnecter puis « Se connecter avec Google » (flux principal).
--   • Ou uploader une photo dans l’app (Mon profil) → remplit public.users sans Auth.
--
-- Mise à jour manuelle d’UNE URL (ex. URL fournie par l’admin après export Google) :
--   UPDATE public.users
--   SET avatar_url = 'https://...'
--   WHERE lower(email) = lower('votre@email.com');
-- ═══════════════════════════════════════════════════════════════════════════
