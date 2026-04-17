-- =============================================================================
-- La Forge — Durcissement optionnel du bucket Storage « assets »
--
-- Aujourd’hui l’app utilise getPublicUrl() : tout objet uploadé est lisible
-- si l’URL est connue. Pour des logos / avatars c’est souvent acceptable.
--
-- Pour aller plus loin (fichiers sensibles) :
--   1) Dashboard Supabase → Storage → bucket « assets » → rendre le bucket privé
--   2) Ajouter des policies Storage (exemples ci-dessous, à adapter aux chemins réels)
--   3) Côté app : stocker le chemin (path) en base et utiliser createSignedUrl() à l’affichage
--
-- Les policies Storage ne s’éditent pas toujours en SQL pur selon la version ;
-- le plus simple reste souvent l’onglet Policies du bucket dans le dashboard.
-- =============================================================================

-- Exemple (syntaxe indicative — vérifier la doc Supabase pour storage.objects) :
--
-- CREATE POLICY "assets_authenticated_read_own_prefix"
--   ON storage.objects FOR SELECT TO authenticated
--   USING (bucket_id = 'assets' AND (storage.foldername(name))[1] = 'users');
--
-- CREATE POLICY "assets_authenticated_upload"
--   ON storage.objects FOR INSERT TO authenticated
--   WITH CHECK (bucket_id = 'assets');

SELECT 1 AS readme_only_noop;
