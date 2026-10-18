-- APPLIQUÉE le 18 octobre 2026, 22 h 29 (Europe/Paris)
-- sur le projet Supabase forge-du-changement (kpgkxeilddeyfwiiqaha).
--
-- Le dossier des photos et logos n'est plus public.
-- Une personne non connectée ne peut plus voir, ajouter ni supprimer un fichier.
-- Une personne connectée à l'application le peut encore.
-- Les liens déjà enregistrés (photos de test) ne s'affichent plus tant que
-- les écrans ne demandent pas un lien temporaire.

UPDATE storage.buckets
SET public = false
WHERE id = 'assets';

DROP POLICY IF EXISTS "allow_public_uploads" ON storage.objects;
DROP POLICY IF EXISTS "assets public delete" ON storage.objects;
DROP POLICY IF EXISTS "assets public insert" ON storage.objects;
DROP POLICY IF EXISTS "assets public read" ON storage.objects;
DROP POLICY IF EXISTS "assets public update" ON storage.objects;

CREATE POLICY assets_authenticated_read
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'assets');

CREATE POLICY assets_authenticated_insert
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'assets');

CREATE POLICY assets_authenticated_update
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'assets')
WITH CHECK (bucket_id = 'assets');

CREATE POLICY assets_authenticated_delete
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'assets');
