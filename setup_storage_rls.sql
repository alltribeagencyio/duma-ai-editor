-- Setup Storage Bucket and RLS Policies for Image Uploads
-- This fixes the "new row violates row-level security policy" error

-- First, ensure the bucket exists (if not already created)
-- You need to create this in Supabase Dashboard > Storage
-- Bucket name: 'job-images'
-- Public: false

-- Enable RLS on storage.objects (should already be enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read their own images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their own images" ON storage.objects;
DROP POLICY IF EXISTS "Service role can do anything" ON storage.objects;

-- Policy 1: Allow authenticated users to upload images to job-images bucket
CREATE POLICY "Authenticated users can upload images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'job-images'
);

-- Policy 2: Allow authenticated users to read images from job-images bucket
CREATE POLICY "Authenticated users can read their own images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'job-images'
);

-- Policy 3: Allow authenticated users to update their own images
CREATE POLICY "Authenticated users can update their own images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'job-images'
)
WITH CHECK (
  bucket_id = 'job-images'
);

-- Policy 4: Allow authenticated users to delete their own images
CREATE POLICY "Authenticated users can delete their own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'job-images'
);

-- Policy 5: Allow service role full access (for server-side operations)
CREATE POLICY "Service role can do anything"
ON storage.objects
TO service_role
USING (true)
WITH CHECK (true);

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage';
