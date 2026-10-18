INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', FALSE, 1048576, ARRAY['image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Users can read their own avatar" ON storage.objects;
CREATE POLICY "Users can read their own avatar"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'avatars'
    AND owner_id = (SELECT auth.uid()::TEXT)
    AND name = (SELECT auth.uid()::TEXT) || '/avatar.webp'
  );

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND name = (SELECT auth.uid()::TEXT) || '/avatar.webp'
  );

DROP POLICY IF EXISTS "Users can replace their own avatar" ON storage.objects;
CREATE POLICY "Users can replace their own avatar"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND owner_id = (SELECT auth.uid()::TEXT)
    AND name = (SELECT auth.uid()::TEXT) || '/avatar.webp'
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND name = (SELECT auth.uid()::TEXT) || '/avatar.webp'
  );

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND owner_id = (SELECT auth.uid()::TEXT)
    AND name = (SELECT auth.uid()::TEXT) || '/avatar.webp'
  );
