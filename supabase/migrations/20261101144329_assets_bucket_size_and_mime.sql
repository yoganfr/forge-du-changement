-- Tranche C du plan suite OWASP. Le dossier photos suit l'écran :
-- 10 Mo, et les mêmes types d'image. Les fichiers déjà là font au plus 3,7 Mo,
-- en JPEG ou PNG.
--
-- Retour arrière :
-- UPDATE storage.buckets
-- SET file_size_limit = NULL,
--     allowed_mime_types = NULL
-- WHERE id = 'assets';

UPDATE storage.buckets
SET
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/heic',
    'image/heif'
  ]::text[]
WHERE id = 'assets';
