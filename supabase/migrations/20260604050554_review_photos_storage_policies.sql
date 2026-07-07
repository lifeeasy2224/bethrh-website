/*
  # Storage policy for review-photos bucket

  Allow authenticated users to upload and read their own review photos.
*/

CREATE POLICY "Authenticated users can upload review photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'review-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view review photos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'review-photos');
