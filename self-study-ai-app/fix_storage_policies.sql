-- Drop existing policies for uploaded-files bucket
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;

-- Drop existing policies for audio-files bucket
DROP POLICY IF EXISTS "Public Access Audio" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload audio" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own audio" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own audio" ON storage.objects;

-- Create new policies that allow public access for testing
-- For uploaded-files bucket
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'uploaded-files');
CREATE POLICY "Public Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'uploaded-files');
CREATE POLICY "Public Update" ON storage.objects FOR UPDATE USING (bucket_id = 'uploaded-files');
CREATE POLICY "Public Delete" ON storage.objects FOR DELETE USING (bucket_id = 'uploaded-files');

-- For audio-files bucket
CREATE POLICY "Public Access Audio" ON storage.objects FOR SELECT USING (bucket_id = 'audio-files');
CREATE POLICY "Public Upload Audio" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'audio-files');
CREATE POLICY "Public Update Audio" ON storage.objects FOR UPDATE USING (bucket_id = 'audio-files');
CREATE POLICY "Public Delete Audio" ON storage.objects FOR DELETE USING (bucket_id = 'audio-files'); 