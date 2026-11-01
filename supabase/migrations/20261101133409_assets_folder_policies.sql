-- REF-103 temps 2b. Appliquée le 1 novembre 2026, 13 h 34 (Europe/Paris)
-- sur le projet Supabase forge-du-changement (kpgkxeilddeyfwiiqaha).
--
-- Un logo se lit par les personnes de l'entreprise, le consultant du dossier
-- et le super-admin. Il s'écrit et se supprime par qui gère l'entreprise.
-- Une photo se lit par la personne et par qui voit une entreprise où elle
-- est membre. Elle s'écrit et se supprime seulement dans son propre dossier.
-- Les fichiers anciens, non cités par une fiche, restent sur le disque
-- et ne sont plus lisibles.
--
-- Retour arrière des règles, si le comportement doit revenir à « toute
-- personne connectée voit tout le dossier ». Cela ne replace pas un fichier
-- déjà déplacé : un logo perdu se remet depuis la fiche entreprise.
--
-- DROP POLICY IF EXISTS assets_logo_select ON storage.objects;
-- DROP POLICY IF EXISTS assets_logo_insert ON storage.objects;
-- DROP POLICY IF EXISTS assets_logo_update ON storage.objects;
-- DROP POLICY IF EXISTS assets_logo_delete ON storage.objects;
-- DROP POLICY IF EXISTS assets_avatar_select ON storage.objects;
-- DROP POLICY IF EXISTS assets_avatar_insert ON storage.objects;
-- DROP POLICY IF EXISTS assets_avatar_update ON storage.objects;
-- DROP POLICY IF EXISTS assets_avatar_delete ON storage.objects;
-- DROP FUNCTION IF EXISTS public.storage_workspace_logo_id(text);
-- DROP FUNCTION IF EXISTS public.storage_user_avatar_id(text);
--
-- CREATE POLICY assets_authenticated_read
-- ON storage.objects FOR SELECT TO authenticated
-- USING (bucket_id = 'assets');
-- CREATE POLICY assets_authenticated_insert
-- ON storage.objects FOR INSERT TO authenticated
-- WITH CHECK (bucket_id = 'assets');
-- CREATE POLICY assets_authenticated_update
-- ON storage.objects FOR UPDATE TO authenticated
-- USING (bucket_id = 'assets') WITH CHECK (bucket_id = 'assets');
-- CREATE POLICY assets_authenticated_delete
-- ON storage.objects FOR DELETE TO authenticated
-- USING (bucket_id = 'assets');

CREATE OR REPLACE FUNCTION public.storage_workspace_logo_id(object_name text)
RETURNS uuid
LANGUAGE sql
STABLE
SET search_path TO public, storage
AS $$
  SELECT CASE
    WHEN (storage.foldername(object_name))[1] = 'workspaces'
     AND (storage.foldername(object_name))[3] = 'logos'
     AND (storage.foldername(object_name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    THEN ((storage.foldername(object_name))[2])::uuid
    ELSE NULL
  END
$$;

CREATE OR REPLACE FUNCTION public.storage_user_avatar_id(object_name text)
RETURNS uuid
LANGUAGE sql
STABLE
SET search_path TO public, storage
AS $$
  SELECT CASE
    WHEN (storage.foldername(object_name))[1] = 'users'
     AND (storage.foldername(object_name))[3] = 'avatars'
     AND (storage.foldername(object_name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    THEN ((storage.foldername(object_name))[2])::uuid
    ELSE NULL
  END
$$;

REVOKE ALL ON FUNCTION public.storage_workspace_logo_id(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.storage_user_avatar_id(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.storage_workspace_logo_id(text) FROM anon;
REVOKE ALL ON FUNCTION public.storage_user_avatar_id(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.storage_workspace_logo_id(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.storage_user_avatar_id(text) TO authenticated;

DROP POLICY IF EXISTS assets_authenticated_read ON storage.objects;
DROP POLICY IF EXISTS assets_authenticated_insert ON storage.objects;
DROP POLICY IF EXISTS assets_authenticated_update ON storage.objects;
DROP POLICY IF EXISTS assets_authenticated_delete ON storage.objects;

CREATE POLICY assets_logo_select
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'assets'
  AND public.storage_workspace_logo_id(name) IS NOT NULL
  AND public.can_access_workspace(public.storage_workspace_logo_id(name))
);

CREATE POLICY assets_logo_insert
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'assets'
  AND public.storage_workspace_logo_id(name) IS NOT NULL
  AND public.can_manage_workspace(public.storage_workspace_logo_id(name))
);

CREATE POLICY assets_logo_update
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'assets'
  AND public.storage_workspace_logo_id(name) IS NOT NULL
  AND public.can_manage_workspace(public.storage_workspace_logo_id(name))
)
WITH CHECK (
  bucket_id = 'assets'
  AND public.storage_workspace_logo_id(name) IS NOT NULL
  AND public.can_manage_workspace(public.storage_workspace_logo_id(name))
);

CREATE POLICY assets_logo_delete
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'assets'
  AND public.storage_workspace_logo_id(name) IS NOT NULL
  AND public.can_manage_workspace(public.storage_workspace_logo_id(name))
);

CREATE POLICY assets_avatar_select
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'assets'
  AND public.storage_user_avatar_id(name) IS NOT NULL
  AND (
    public.storage_user_avatar_id(name) = public.current_app_user_id()
    OR EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = public.storage_user_avatar_id(name)
        AND public.can_access_workspace(u.workspace_id)
    )
  )
);

CREATE POLICY assets_avatar_insert
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'assets'
  AND public.storage_user_avatar_id(name) IS NOT NULL
  AND public.storage_user_avatar_id(name) = public.current_app_user_id()
);

CREATE POLICY assets_avatar_update
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'assets'
  AND public.storage_user_avatar_id(name) IS NOT NULL
  AND public.storage_user_avatar_id(name) = public.current_app_user_id()
)
WITH CHECK (
  bucket_id = 'assets'
  AND public.storage_user_avatar_id(name) IS NOT NULL
  AND public.storage_user_avatar_id(name) = public.current_app_user_id()
);

CREATE POLICY assets_avatar_delete
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'assets'
  AND public.storage_user_avatar_id(name) IS NOT NULL
  AND public.storage_user_avatar_id(name) = public.current_app_user_id()
);
